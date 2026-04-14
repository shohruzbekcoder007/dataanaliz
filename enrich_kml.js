/**
 * Ishga tushirish: node enrich_kml.js
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const connectDB  = require('./src/config/db');
const { enrichAllKml } = require('./src/services/enrichKmlService');

async function main() {
  await connectDB();
  await enrichAllKml();
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
