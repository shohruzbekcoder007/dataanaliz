/**
 * KoboRecord da land_fund_category_code -> land_fund_category maydonini to'ldiradi.
 * Ishga tushirish: node enrich_kobo_land_category.js
 */

const KoboRecord = require('../models/KoboRecord');

// land_fund_category_code -> land_fund_category mapping
const CODE_TO_CATEGORY = {
  // 006001
  '006001006000': '006001', '006001001000': '006001', '006001007000': '006001',
  '006001010000': '006001', '006001003000': '006001', '006001008000': '006001',
  '006001002000': '006001', '006001007020': '006001', '006001005000': '006001',
  '006001004000': '006001', '006001007010': '006001', '006001009000': '006001',
  // 006002
  '006002001001': '006002', '006002002003': '006002', '006002001003': '006002',
  '006002001002': '006002', '006002002002': '006002', '006002002001': '006002',
  // 006003
  '006003006000': '006003', '006003002002': '006003', '006003005000': '006003',
  '006003001006': '006003', '006003001005': '006003', '006003003000': '006003',
  '006003001003': '006003', '006003001002': '006003', '006003002001': '006003',
  '006003001004': '006003', '006003002005': '006003', '006003004000': '006003',
  '006003002003': '006003', '006003001001': '006003', '006003002004': '006003',
  // 006004
  '006004002000': '006004', '006004003000': '006004', '006004001007': '006004',
  '006004001006': '006004', '006004001001': '006004', '006004001004': '006004',
  '006004001003': '006004', '006004001005': '006004', '006004001002': '006004',
  // 006005
  '006005003000': '006005', '006005004000': '006005',
  '006005001000': '006005', '006005002000': '006005',
  // 006006
  '006006001000': '006006', '006006002000': '006006',
  // 006007
  '006007003000': '006007', '006007002000': '006007', '006007004000': '006007',
  '006007001000': '006007', '006007005000': '006007', '006007006000': '006007',
  // 006008
  '006008000000': '006008',
};

const BATCH_SIZE = 500;

async function enrichKoboLandCategory() {
  const total = await KoboRecord.countDocuments();
  console.log(`KoboRecord jami: ${total.toLocaleString()} hujjat`);

  let processed = 0;
  let updated   = 0;
  let nullSet   = 0;
  let unknown   = 0;

  const cursor = KoboRecord.find({}, { land_fund_category_code: 1 }).lean().cursor();
  const bulkOps = [];

  const flush = async () => {
    if (!bulkOps.length) return;
    await KoboRecord.bulkWrite(bulkOps, { ordered: false });
    bulkOps.length = 0;
  };

  for await (const doc of cursor) {
    processed++;

    let category;
    if (!doc.land_fund_category_code) {
      category = null;
      nullSet++;
    } else {
      category = CODE_TO_CATEGORY[doc.land_fund_category_code] || null;
      if (category) updated++;
      else {
        unknown++;
        process.stdout.write(`\n  [!] Noma'lum kod: ${doc.land_fund_category_code}`);
      }
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { land_fund_category: category } },
      },
    });

    if (bulkOps.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r  ${processed.toLocaleString()}/${total.toLocaleString()}`);
    }
  }

  await flush();
  console.log(`\r  Tugadi: ${processed.toLocaleString()} | mos: ${updated} | null: ${nullSet} | noma'lum kod: ${unknown}`);

  return { total, updated, nullSet, unknown };
}

module.exports = { enrichKoboLandCategory };
