/**
 * MongoDB indexlarini schema bilan sinxronlaydi.
 * Ishga tushirish: node sync_indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

const KmlEkinField    = require('./src/models/KmlEkinField');
const KmlEkinFieldTwo = require('./src/models/KmlEkinFieldTwo');
const KoboRecord      = require('./src/models/KoboRecord');

const MODELS = [
  { name: 'KmlEkinField',    model: KmlEkinField    },
  { name: 'KmlEkinFieldTwo', model: KmlEkinFieldTwo },
  { name: 'KoboRecord',      model: KoboRecord      },
];

async function main() {
  await connectDB();

  for (const { name, model } of MODELS) {
    process.stdout.write(`${name} indexlari sinxronlanmoqda... `);
    try {
      await model.syncIndexes();
      console.log('✓');
    } catch (err) {
      console.log(`✗ XATO: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('Tayyor.');
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
