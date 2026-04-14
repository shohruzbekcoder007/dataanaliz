#!/usr/bin/env node
/**
 * Ishga tushirish:
 *   node import.js              -- ikkala faylni import qiladi
 *   node import.js --clear      -- avval collectionni tozalab, keyin import qiladi
 *   node import.js kobo_1_uzcosmos  -- faqat bitta faylni import qiladi
 */

require('dotenv').config();
const connectDB = require('./src/config/db');
const { importAllXlsx, importXlsx } = require('./src/services/xlsxImportService');

async function main() {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear');
  const targetFile = args.find((a) => !a.startsWith('--'));

  await connectDB();

  if (targetFile) {
    const result = await importXlsx(targetFile, { clearFirst });
    console.log('Natija:', result);
  } else {
    const results = await importAllXlsx({ clearFirst });
    console.log('Barcha natijalar:', results);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Import xatosi:', err);
  process.exit(1);
});
