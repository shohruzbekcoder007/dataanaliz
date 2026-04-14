/**
 * AgriLandFull dan tin bo'yicha guruhlaydi va agri_land_tins ga yozadi.
 * Bir xil tin → category array ga element qo'shiladi.
 */

const mongoose    = require('mongoose');
const AgriLandTin = require('../models/AgriLandTin');

const BATCH_SIZE = 500;

async function buildAgriLandTin({ clearFirst = true } = {}) {
  if (clearFirst) {
    await AgriLandTin.deleteMany({});
    console.log('agri_land_tins tozalandi');
  }

  // AgriLandFull CommonJS require orqali ishlamaydi (ESM import),
  // shuning uchun to'g'ridan-to'g'ri native MongoDB driver ishlatamiz
  const db = mongoose.connection.db;
  const collection = db.collection('agri_land_full');

  const MATCH_FILTER = {
    tin:                { $nin: [null, ''] },
    is_active:          true,
    removed_by_qx:      false,
    $expr:              { $ne: [{ $strLenCP: { $ifNull: [{ $toString: '$tin' }, ''] } }, 14] },
    land_fund_category: { $nin: ['006002', '006007', '006005', '006008', null, ''] },
    land_fund_type:     {
      $nin: [
        '006001007020', '006003006000', '006003002002', '006003001006',
        '006003001005', '006003003000', '006003001003', '006003001002',
        '006003002001', '006003001004', '006003002005', '006003004000',
        '006003002003', '006003001001', '006003002004',
      ],
    },
    property_kind:      { $nin: ['prop_kind_reserve'], $not: /^prop_kind_land_lease/ },
  };

  const total = await collection.countDocuments(MATCH_FILTER);
  console.log(`agri_land_full (filtr bilan): ${total.toLocaleString()}`);

  // tin bo'yicha group qilamiz — aggregation bilan
  console.log('Aggregation boshlandi...');

  const cursor = collection.aggregate([
    {
      $match: MATCH_FILTER,
    },
    {
      $group: {
        _id: '$tin',
        category: {
          $push: {
            cadastral_number:               { $ifNull: ['$cadastral_number', ''] },
            land_fund_category:             { $ifNull: ['$land_fund_category', ''] },
            land_fund_category_description: { $ifNull: ['$land_fund_category_description', ''] },
            land_fund_type:                 { $ifNull: ['$land_fund_type', ''] },
            land_fund_type_description:     { $ifNull: ['$land_fund_type_description', ''] },
            property_kind:                  { $ifNull: ['$property_kind', ''] },
            tenancy_type_code:              { $ifNull: ['$tenancy_type_code', ''] },
          },
        },
      },
    },
  ], { allowDiskUse: true });

  let processed = 0;
  const bulkOps = [];

  const flush = async () => {
    if (!bulkOps.length) return;
    await AgriLandTin.bulkWrite(bulkOps, { ordered: false });
    bulkOps.length = 0;
  };

  for await (const doc of cursor) {
    processed++;

    bulkOps.push({
      insertOne: {
        document: {
          tin:      doc._id,
          category: doc.category,
        },
      },
    });

    if (bulkOps.length >= BATCH_SIZE) {
      await flush();
      process.stdout.write(`\r  ${processed.toLocaleString()} tin qayta ishlandi`);
    }
  }

  await flush();
  console.log(`\r  Tugadi: ${processed.toLocaleString()} unique tin`);

  const finalCount = await AgriLandTin.countDocuments();
  console.log(`  agri_land_tins da jami: ${finalCount.toLocaleString()} yozuv`);

  return { processed, finalCount };
}

module.exports = { buildAgriLandTin };
