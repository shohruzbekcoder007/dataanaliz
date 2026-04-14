const XLSX = require('xlsx');
const path = require('path');
const FiveShapes = require('../models/FiveShapes');

const FILE_PATH  = path.join(__dirname, '../../shakil5.xlsx');
const SHEET_NAME = 'Лист1';
const BATCH_SIZE = 200;

function readXlsx() {
  const wb = XLSX.readFile(FILE_PATH);
  const ws = wb.Sheets[SHEET_NAME];

  if (!ws) throw new Error(`Sheet "${SHEET_NAME}" topilmadi: ${FILE_PATH}`);

  const rows = XLSX.utils.sheet_to_json(ws, { defval: null });

  return rows.map(row => ({
    soato4:        row.soato4        ? String(row.soato4)        : null,
    soato7:        row.soato7        ? String(row.soato7)        : null,
    tumanlar_nomi: row.tumanlar_nomi ? String(row.tumanlar_nomi) : null,
    mfy_inn:       row.mfy_inn       ? String(row.mfy_inn)       : null,
    tota_area:     row.tota_area     != null ? Number(row.tota_area)  : null,
    crop_area:     row.crop_area     != null ? Number(row.crop_area)  : null,
  }));
}

async function importFiveShapes({ clearFirst = false } = {}) {
  if (clearFirst) {
    await FiveShapes.deleteMany({});
    console.log('five_shapes collection tozalandi');
  }

  const records = readXlsx();
  console.log(`Jami satrlar: ${records.length}`);

  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await FiveShapes.insertMany(batch, { ordered: false });
    inserted += batch.length;
    console.log(`  ${inserted}/${records.length} yozildi`);
  }

  console.log(`\nTugadi: ${inserted} yozuv five_shapes ga yozildi`);
  return { total: records.length, inserted };
}

module.exports = { importFiveShapes };
