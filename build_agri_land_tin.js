/**
 * Ishga tushirish: node build_agri_land_tin.js
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('./src/config/db');
const { buildAgriLandTin } = require('./src/services/buildAgriLandTinService');

async function main() {
  await connectDB();
  await buildAgriLandTin({ clearFirst: true });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
