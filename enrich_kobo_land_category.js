require('dotenv').config();
const mongoose  = require('mongoose');
const connectDB = require('./src/config/db');
const { enrichKoboLandCategory } = require('./src/services/enrichKoboLandCategory');

async function main() {
  await connectDB();
  await enrichKoboLandCategory();
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
