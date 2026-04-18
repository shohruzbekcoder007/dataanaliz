const XLSX = require('xlsx');
const path = require('path');
const KoboRecord = require('../models/KoboRecord');

const FILES = [
  // {
  //   filePath: path.join(__dirname, '../../kobo_1_uzcosmos.xlsx'),
  //   sheetName: 'merged',
  //   sourceName: 'kobo_1_uzcosmos',
  // },
  // {
  //   filePath: path.join(__dirname, '../../kobo_2.xlsx'),
  //   sheetName: 'Kobo_2',
  //   sourceName: 'kobo_2',
  // },
  // {
  //   filePath: path.join(__dirname, '../../Kobo_3.xlsx'),
  //   sheetName: 'kobo_3',
  //   sourceName: 'kobo_3',
  // },
  {
    filePath: path.join(__dirname, '../../kobo_4.xlsx'),
    sheetName: 'kobo_agri_parcels',
    sourceName: 'kobo_4',
  },
];

const BATCH_SIZE = 500;

/**
 * xlsx faylni o'qib, row larni normallashtiradi
 */
function readXlsx(filePath, sheetName, sourceName) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    throw new Error(`Sheet "${sheetName}" topilmadi: ${filePath}`);
  }

  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

  return rows.map((row) => ({
    order: row.order != null ? Number(row.order) : null,
    mahalla_tin: row.mahalla_tin ? String(row.mahalla_tin) : null,
    mahalla_name: row.mahalla_name || null,
    mahalla_uz: row.mahalla_uz || null,
    viloyat_code: row.viloyat_code != null ? Number(row.viloyat_code) : null,
    tuman_code:   row.tuman_code   != null ? Number(row.tuman_code)   : null,
    tuman_name:   row.tuman_name   || null,
    area_ha: row.area_ha != null ? Number(row.area_ha) : null,
    crop_year: row.crop_year ? String(row.crop_year) : null,
    crop_type: row.crop_type || null,
    center_x: row.center_x != null ? Number(row.center_x) : null,
    center_y: row.center_y != null ? Number(row.center_y) : null,
    land_fund_category_code: row.land_fund_category_code
      ? String(row.land_fund_category_code)
      : null,
    // kobo_4 da kobo_version, boshqalarda kobo_time_number
    kobo_time_number: row.kobo_time_number != null
      ? Number(row.kobo_time_number)
      : (row.kobo_version != null ? Number(row.kobo_version) : null),
    source_file: sourceName,
  }));
}

/**
 * Massivni batch larga bo'lib MongoDB ga yozadi
 */
async function insertInBatches(records, sourceName) {
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await KoboRecord.insertMany(batch, { ordered: false });
    inserted += batch.length;
    console.log(`  [${sourceName}] ${inserted}/${records.length} yozildi`);
  }

  return inserted;
}

/**
 * Barcha xlsx fayllarni import qiladi.
 * @param {object} options
 * @param {boolean} options.clearFirst - import oldidan collectionni tozalash
 */
async function importAllXlsx({ clearFirst = false } = {}) {
  const stats = [];

  if (clearFirst) {
    await KoboRecord.deleteMany({});
    console.log('Collection tozalandi');
  }

  for (const { filePath, sheetName, sourceName } of FILES) {
    console.log(`\nO'qilmoqda: ${sourceName} (${filePath})`);

    let records;
    try {
      records = readXlsx(filePath, sheetName, sourceName);
      console.log(`  Jami satrlar: ${records.length}`);
    } catch (err) {
      console.error(`  XATO [${sourceName}]:`, err.message);
      stats.push({ sourceName, error: err.message });
      continue;
    }

    const withCategory = records.filter((r) => r.land_fund_category_code);
    const withoutCategory = records.length - withCategory.length;
    console.log(
      `  land_fund_category_code bor: ${withCategory.length}, yo'q: ${withoutCategory}`
    );

    try {
      const inserted = await insertInBatches(records, sourceName);
      stats.push({ sourceName, total: records.length, inserted });
    } catch (err) {
      console.error(`  INSERT XATO [${sourceName}]:`, err.message);
      stats.push({ sourceName, error: err.message });
    }
  }

  console.log('\n=== Import natijasi ===');
  stats.forEach((s) => console.log(JSON.stringify(s)));

  return stats;
}

/**
 * Faqat bitta faylni import qilish
 */
async function importXlsx(sourceName, { clearFirst = false } = {}) {
  const fileConfig = FILES.find((f) => f.sourceName === sourceName);
  if (!fileConfig) {
    throw new Error(`Noma'lum fayl: ${sourceName}. Mavjudlar: ${FILES.map((f) => f.sourceName)}`);
  }

  if (clearFirst) {
    await KoboRecord.deleteMany({ source_file: sourceName });
    console.log(`${sourceName} yozuvlari o'chirildi`);
  }

  const records = readXlsx(fileConfig.filePath, fileConfig.sheetName, sourceName);
  console.log(`${sourceName}: ${records.length} satr o'qildi`);

  const inserted = await insertInBatches(records, sourceName);
  return { sourceName, total: records.length, inserted };
}

module.exports = { importAllXlsx, importXlsx };
