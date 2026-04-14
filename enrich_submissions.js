/**
 * submissions collectionidagi har bir hujjatni kobo_records bilan bog'laydi:
 *   submissions.mfyStir        <-> kobo_records.mahalla_tin
 *   submissions.contourCount   <-> kobo_records.order
 *   submissions.kobo_time_number <-> kobo_records.kobo_time_number
 * Mosini topsa land_fund_category_code yozadi, topilmasa null qoladi.
 *
 * Ishga tushirish: node enrich_submissions.js
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const connectDB  = require('./src/config/db');
const KoboRecord = require('./src/models/KoboRecord');
const Submission = require('./src/models/Submission');

const BATCH_SIZE = 500;

async function buildKoboIndex() {
  console.log('KoboRecord indeksi qurilmoqda...');
  const koboMap = new Map();
  const cursor = KoboRecord.find(
    {},
    { mahalla_tin: 1, order: 1, kobo_time_number: 1, land_fund_category_code: 1 }
  ).lean().cursor();

  let count = 0;
  for await (const doc of cursor) {
    if (!doc.mahalla_tin || doc.order == null || doc.kobo_time_number == null) continue;
    const key = `${doc.mahalla_tin}:${doc.order}:${doc.kobo_time_number}`;
    if (!koboMap.has(key) || doc.land_fund_category_code) {
      koboMap.set(key, doc.land_fund_category_code || null);
    }
    count++;
  }
  console.log(`Indeks tayyor: ${count.toLocaleString()} yozuv`);
  return koboMap;
}

async function enrichSubmissions(koboMap) {
  const total = await Submission.countDocuments();
  console.log(`\n[submissions] Jami: ${total.toLocaleString()} hujjat`);

  let processed = 0, matched = 0, notFound = 0, skipped = 0;
  const bulkOps = [];

  const cursor = Submission.find({}, { mfyStir: 1, contourCount: 1, kobo_time_number: 1 }).lean().cursor();

  const flush = async () => {
    if (!bulkOps.length) return;
    await Submission.bulkWrite(bulkOps, { ordered: false });
    bulkOps.length = 0;
  };

  for await (const doc of cursor) {
    processed++;

    if (!doc.mfyStir || doc.contourCount == null || doc.kobo_time_number == null) {
      skipped++;
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { land_fund_category_code: null } },
        },
      });
    } else {
      const orderNum = parseInt(doc.contourCount, 10);
      const key = `${doc.mfyStir}:${orderNum}:${doc.kobo_time_number}`;
      const code = koboMap.get(key);

      if (code === undefined) {
        notFound++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { land_fund_category_code: null } },
          },
        });
      } else {
        matched++;
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: { land_fund_category_code: code } },
          },
        });
      }
    }

    if (bulkOps.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(
        `\r  ${processed.toLocaleString()}/${total.toLocaleString()} (mos: ${matched}, topilmadi: ${notFound})`
      );
    }
  }

  await flush();
  console.log(
    `\r  Tugadi: ${processed.toLocaleString()} | mos: ${matched} | topilmadi: ${notFound} | mfyStir/contourCount yo'q: ${skipped}`
  );
}

async function main() {
  await connectDB();
  const koboMap = await buildKoboIndex();
  await enrichSubmissions(koboMap);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
