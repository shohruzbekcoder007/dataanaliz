/**
 * Ishga tushirish: node build_link_table.js
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('./src/config/db');
const { buildLinkTable } = require('./src/services/buildLinkTableService');

async function main() {
  await connectDB();
  await buildLinkTable({ clearFirst: true });
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
