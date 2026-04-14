/**
 * kml_submission_links collectionini quradi:
 *
 * Manbalar:
 *   kobo_records     → mahalla_tin, order, kobo_time_number
 *   submissions      → submissionId  (mfyStir=mahalla_tin, contourCount=order, kobo_time_number=kobo_time_number)
 *   kml_ekin_fields  → viloyat_soato, tuman_soato  (mahalla_tin orqali)
 *   kml_ekin_field_twos → zahira (topilmasa)
 *
 * Unique kalit: mahalla_tin + order + kobo_time_number
 */

const KoboRecord        = require('../models/KoboRecord');
const Submission        = require('../models/Submission');
const KmlEkinField      = require('../models/KmlEkinField');
const KmlEkinFieldTwo   = require('../models/KmlEkinFieldTwo');
const KmlSubmissionLink = require('../models/KmlSubmissionLink');

const BATCH_SIZE = 500;

// submissions dan map: "mfyStir:contourCount:kobo_time_number" -> submissionId
async function buildSubmissionIndex() {
  console.log('Submission indeksi qurilmoqda...');
  const map = new Map();
  const cursor = Submission.find(
    { mfyStir: { $nin: [null, '', '0'] } },
    { mfyStir: 1, contourCount: 1, kobo_time_number: 1, submissionId: 1 }
  ).lean().cursor();

  let count = 0;
  for await (const doc of cursor) {
    if (doc.contourCount == null || doc.kobo_time_number == null) continue;
    const key = `${doc.mfyStir}:${doc.contourCount}:${doc.kobo_time_number}`;
    if (!map.has(key)) map.set(key, doc.submissionId || null);
    count++;
  }
  console.log(`  Submission indeks: ${count.toLocaleString()} yozuv`);
  return map;
}

// kml_ekin_fields + kml_ekin_field_twos dan map: mahalla_tin -> { viloyat_soato, tuman_soato }
async function buildSoatoIndex() {
  console.log('Soato indeksi qurilmoqda...');
  const map = new Map();

  // Avval kml_ekin_fields
  const c1 = KmlEkinField.find(
    { mahalla_tin: { $nin: [null, ''] }, viloyat_soato: { $nin: [null, ''] } },
    { mahalla_tin: 1, viloyat_soato: 1, tuman_soato: 1 }
  ).lean().cursor();

  for await (const doc of c1) {
    if (!map.has(doc.mahalla_tin)) {
      map.set(doc.mahalla_tin, {
        viloyat_soato: doc.viloyat_soato || null,
        tuman_soato:   doc.tuman_soato   || null,
      });
    }
  }

  // Topilmaganlarni kml_ekin_field_twos dan to'ldirish
  const c2 = KmlEkinFieldTwo.find(
    { mahalla_tin: { $nin: [null, ''] }, viloyat_soato: { $nin: [null, ''] } },
    { mahalla_tin: 1, viloyat_soato: 1, tuman_soato: 1 }
  ).lean().cursor();

  for await (const doc of c2) {
    if (!map.has(doc.mahalla_tin)) {
      map.set(doc.mahalla_tin, {
        viloyat_soato: doc.viloyat_soato || null,
        tuman_soato:   doc.tuman_soato   || null,
      });
    }
  }

  console.log(`  Soato indeks: ${map.size.toLocaleString()} unique mahalla_tin`);
  return map;
}

async function buildLinkTable({ clearFirst = true } = {}) {
  if (clearFirst) {
    await KmlSubmissionLink.deleteMany({});
    console.log('kml_submission_links tozalandi');
  }

  const [submissionMap, soatoMap] = await Promise.all([
    buildSubmissionIndex(),
    buildSoatoIndex(),
  ]);

  console.log('\nkobo_records dan link table qurilmoqda...');
  const total = await KoboRecord.countDocuments();
  console.log(`  kobo_records jami: ${total.toLocaleString()}`);

  let processed = 0, inserted = 0, noSub = 0, noSoato = 0;
  const bulkOps = [];

  const cursor = KoboRecord.find(
    { mahalla_tin: { $nin: [null, ''] }, order: { $ne: null }, kobo_time_number: { $ne: null } },
    { mahalla_tin: 1, order: 1, kobo_time_number: 1 }
  ).lean().cursor();

  const flush = async () => {
    if (!bulkOps.length) return;
    await KmlSubmissionLink.bulkWrite(bulkOps, { ordered: false });
    bulkOps.length = 0;
  };

  for await (const doc of cursor) {
    processed++;

    const subKey   = `${doc.mahalla_tin}:${doc.order}:${doc.kobo_time_number}`;
    const soato    = soatoMap.get(doc.mahalla_tin);
    const subId    = submissionMap.get(subKey);

    if (subId === undefined) noSub++;
    if (!soato) noSoato++;

    bulkOps.push({
      updateOne: {
        filter: {
          mahalla_tin:      doc.mahalla_tin,
          order:            doc.order,
          kobo_time_number: doc.kobo_time_number,
        },
        update: {
          $setOnInsert: {
            viloyat_soato:    soato?.viloyat_soato || null,
            tuman_soato:      soato?.tuman_soato   || null,
            mahalla_tin:      doc.mahalla_tin,
            submission_id:    subId ?? null,
            kobo_time_number: doc.kobo_time_number,
            order:            doc.order,
          },
        },
        upsert: true,
      },
    });

    inserted++;

    if (bulkOps.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r  ${processed.toLocaleString()}/${total.toLocaleString()}`);
    }
  }

  await flush();
  console.log(`\r  Tugadi: ${processed.toLocaleString()} kobo_record qayta ishlandi`);
  console.log(`  Yozildi: ${inserted.toLocaleString()} | submission topilmadi: ${noSub} | soato topilmadi: ${noSoato}`);

  const finalCount = await KmlSubmissionLink.countDocuments();
  console.log(`  kml_submission_links da jami: ${finalCount.toLocaleString()} unique yozuv`);

  return { processed, inserted, noSub, noSoato, finalCount };
}

module.exports = { buildLinkTable };
