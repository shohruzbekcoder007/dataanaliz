/**
 * shakl5.xlsx ni five_shapes collectionga import qiladi.
 * Ishga tushirish: node import_five_shapes.js
 * Tozalab qayta yozish: node import_five_shapes.js --clear
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('./src/config/db');
const { importFiveShapes } = require('./src/services/fiveShapesImportService');

const clearFirst = process.argv.includes('--clear');

async function main() {
  await connectDB();
  await importFiveShapes({ clearFirst });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
