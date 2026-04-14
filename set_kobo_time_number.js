/**
 * submissions.koboCount ("1-kobo", "3-kobo" ...) ning birinchi raqamini
 * kobo_time_number ga yozadi.
 *
 * Ishga tushirish: node set_kobo_time_number.js
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const connectDB  = require('./src/config/db');
const Submission = require('./src/models/Submission');

const BATCH_SIZE = 500;

async function main() {
  await connectDB();

  const total = await Submission.countDocuments({ koboCount: { $nin: [null, ''] } });
  console.log(`koboCount bor hujjatlar: ${total.toLocaleString()}`);

  let processed = 0, updated = 0, skipped = 0;
  const bulkOps = [];

  const cursor = Submission.find(
    { koboCount: { $nin: [null, ''] } },
    { koboCount: 1 }
  ).lean().cursor();

  const flush = async () => {
    if (!bulkOps.length) return;
    await Submission.bulkWrite(bulkOps, { ordered: false });
    bulkOps.length = 0;
  };

  for await (const doc of cursor) {
    processed++;
    const num = parseInt(doc.koboCount, 10); // "1-kobo" -> 1

    if (isNaN(num)) {
      skipped++;
    } else {
      updated++;
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { kobo_time_number: num } },
        },
      });
    }

    if (bulkOps.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r  ${processed.toLocaleString()}/${total.toLocaleString()} (yozildi: ${updated})`);
    }
  }

  await flush();
  console.log(`\r  Tugadi: ${processed.toLocaleString()} | yozildi: ${updated} | o'tkazildi: ${skipped}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
