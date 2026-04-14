/**
 * kml_ekin_fields va kml_ekin_field_twos collectionlaridagi har bir hujjatga
 * KoboRecord dan mahalla_tin + order bo'yicha mos yozuvni topib,
 * land_fund_category_code va kobo_time_number maydonlarini yozadi.
 */

const KmlEkinField    = require('../models/KmlEkinField');
const KmlEkinFieldTwo = require('../models/KmlEkinFieldTwo');
const KoboRecord      = require('../models/KoboRecord');

const BATCH_SIZE = 500;

/**
 * KoboRecord dan mahalla_tin + order bo'yicha qidirish uchun
 * in-memory map yaratadi (bir marta o'qiladi).
 * key: "mahalla_tin:order"
 */
async function buildKoboIndex() {
  console.log('KoboRecord indeksi qurilmoqda...');

  const koboMap = new Map();
  const cursor = KoboRecord.find(
    {},
    { mahalla_tin: 1, order: 1, land_fund_category_code: 1, kobo_time_number: 1 }
  ).lean().cursor();

  let count = 0;
  for await (const doc of cursor) {
    if (!doc.mahalla_tin || doc.order == null) continue;
    const key = `${doc.mahalla_tin}:${doc.order}`;
    // Bir xil key uchun land_fund_category_code bor bo'lganini ustunlik bering
    if (!koboMap.has(key) || doc.land_fund_category_code) {
      koboMap.set(key, {
        land_fund_category_code: doc.land_fund_category_code || null,
        kobo_time_number:        doc.kobo_time_number        || null,
      });
    }
    count++;
  }

  console.log(`KoboRecord indeksi tayyor: ${count.toLocaleString()} yozuv`);
  return koboMap;
}

/**
 * Bitta collection uchun enrich jarayoni.
 * @param {mongoose.Model} Model
 * @param {Map} koboMap
 * @param {string} label
 */
async function enrichCollection(Model, koboMap, label) {
  const total = await Model.countDocuments();
  console.log(`\n[${label}] Jami: ${total.toLocaleString()} hujjat`);

  let processed = 0;
  let matched   = 0;
  let notFound  = 0;
  let skipped   = 0; // mahalla_tin yoki order yo'q

  const cursor = Model.find({}, { mahalla_tin: 1, order: 1 }).lean().cursor();
  const bulkOps = [];

  const flush = async () => {
    if (!bulkOps.length) return;
    await Model.bulkWrite(bulkOps, { ordered: false });
    bulkOps.length = 0;
  };

  for await (const doc of cursor) {
    processed++;

    if (!doc.mahalla_tin || doc.order == null) {
      skipped++;
      continue;
    }

    const key = `${doc.mahalla_tin}:${doc.order}`;
    const kobo = koboMap.get(key);

    if (!kobo) {
      notFound++;
    } else {
      matched++;
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              land_fund_category_code: kobo.land_fund_category_code,
              kobo_time_number:        kobo.kobo_time_number,
            },
          },
        },
      });
    }

    if (bulkOps.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r  ${processed.toLocaleString()}/${total.toLocaleString()} (mos: ${matched}, topilmadi: ${notFound})`);
    }
  }

  await flush();
  console.log(`\r  Tugadi: ${processed.toLocaleString()} | mos: ${matched} | topilmadi: ${notFound} | mahalla_tin/order yo'q: ${skipped}`);

  return { total, matched, notFound, skipped };
}

/**
 * Asosiy funksiya — ikkala collectionni enrich qiladi.
 */
async function enrichAllKml() {
  const koboMap = await buildKoboIndex();

  const results = {};

  results.kml_ekin_fields = await enrichCollection(
    KmlEkinField,
    koboMap,
    'kml_ekin_fields'
  );

  results.kml_ekin_field_twos = await enrichCollection(
    KmlEkinFieldTwo,
    koboMap,
    'kml_ekin_field_twos'
  );

  console.log('\n=== Natija ===');
  for (const [col, stat] of Object.entries(results)) {
    console.log(`${col}: jami=${stat.total}, mos=${stat.matched}, topilmadi=${stat.notFound}`);
  }

  return results;
}

module.exports = { enrichAllKml };
