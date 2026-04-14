/**
 * Model schema va MongoDB collection orasidagi muvofiqlikni tekshiradi.
 * Ishga tushirish: node check_models.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

const KmlEkinField    = require('./src/models/KmlEkinField');
const KmlEkinFieldTwo = require('./src/models/KmlEkinFieldTwo');
const KoboRecord      = require('./src/models/KoboRecord');

const MODELS = [
  { name: 'KmlEkinField',    model: KmlEkinField,    collection: 'kml_ekin_fields'     },
  { name: 'KmlEkinFieldTwo', model: KmlEkinFieldTwo, collection: 'kml_ekin_field_twos' },
  { name: 'KoboRecord',      model: KoboRecord,      collection: 'kobo_records'        },
];

// Schema dan kutilgan maydonlarni olish
function getSchemaFields(schema, prefix = '') {
  const fields = {};
  schema.eachPath((pathName, schemaType) => {
    if (pathName === '__v') return;
    const fullPath = prefix ? `${prefix}.${pathName}` : pathName;
    fields[fullPath] = schemaType.instance || schemaType.constructor.name;
  });
  return fields;
}

// Collection da aslida qanday maydonlar bor (sample orqali)
async function getSampleFields(model, sampleSize = 5) {
  const docs = await model.find({}).limit(sampleSize).lean();
  if (!docs.length) return null;

  const allKeys = new Set();
  docs.forEach(doc => Object.keys(doc).forEach(k => allKeys.add(k)));
  return [...allKeys];
}

// Model da belgilangan indexlar
function getSchemaIndexes(schema) {
  return schema.indexes().map(([fields, opts]) => ({
    fields,
    unique: opts.unique || false,
    sparse: opts.sparse || false,
  }));
}

// MongoDB dagi haqiqiy indexlar
async function getActualIndexes(model) {
  try {
    const indexes = await model.collection.indexes();
    return indexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique || false,
    }));
  } catch {
    return [];
  }
}

async function checkModel({ name, model, collection }) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`MODEL: ${name}  →  collection: "${collection}"`);
  console.log('─'.repeat(60));

  const db = mongoose.connection.db;

  // 1. Collection mavjudligini tekshir
  const collections = await db.listCollections({ name: collection }).toArray();
  const exists = collections.length > 0;
  console.log(`Collection mavjud: ${exists ? '✓ HA' : '✗ YO\'Q (hali ma\'lumot yo\'q)'}`);

  if (!exists) {
    console.log('  → Collection hali yaratilmagan (birinchi insertda yaratiladi)');
    return;
  }

  // 2. Hujjat soni
  const count = await model.countDocuments();
  console.log(`Hujjatlar soni: ${count.toLocaleString()}`);

  if (count === 0) {
    console.log('  → Collection bo\'sh');
    return;
  }

  // 3. Schema maydonlari vs haqiqiy maydonlar
  const schemaFields = getSchemaFields(model.schema);
  const sampleFields = await getSampleFields(model);

  const schemaKeys = new Set(Object.keys(schemaFields).filter(k => !k.includes('.')));
  const sampleKeys = new Set((sampleFields || []).filter(k => k !== '_id' && k !== '__v'));

  const missingInSchema = [...sampleKeys].filter(k => !schemaKeys.has(k));
  const missingInDB     = [...schemaKeys].filter(k => !sampleKeys.has(k) && k !== 'geom');

  if (missingInSchema.length) {
    console.log(`\n⚠ DB da bor lekin schemada yo'q: ${missingInSchema.join(', ')}`);
  } else {
    console.log('\n✓ DB maydonlari schemaga mos');
  }

  if (missingInDB.length) {
    console.log(`⚠ Schemada bor lekin DB da yo'q (null bo'lishi mumkin): ${missingInDB.join(', ')}`);
  }

  // 4. Null bo'lmagan maydonlarni tekshir (tip mosligini)
  console.log('\nMaydon tipi tekshiruvi (birinchi hujjat):');
  const sample = await model.findOne().lean();
  for (const [field, expectedType] of Object.entries(schemaFields)) {
    if (field.includes('.') || field === '__v') continue;
    const val = sample[field];
    if (val == null) continue;

    const actualType = Array.isArray(val) ? 'Array' : typeof val;
    const typeMap = { String: 'string', Number: 'number', Boolean: 'boolean', Date: 'object' };
    const expected = typeMap[expectedType] || expectedType.toLowerCase();

    if (expected && actualType !== expected && expectedType !== 'Date') {
      console.log(`  ✗ ${field}: schema=${expectedType}, DB=${actualType} (qiymat: ${JSON.stringify(val)})`);
    } else {
      console.log(`  ✓ ${field}: ${expectedType} = ${JSON.stringify(val)}`);
    }
  }

  // 5. Index tekshiruvi
  const schemaIndexes = getSchemaIndexes(model.schema);
  const actualIndexes  = await getActualIndexes(model);

  console.log(`\nSchema indexlari (${schemaIndexes.length} ta):`);
  schemaIndexes.forEach(idx => console.log(`  ${JSON.stringify(idx.fields)}`));

  console.log(`\nMongoDB haqiqiy indexlari (${actualIndexes.length} ta):`);
  actualIndexes.forEach(idx => console.log(`  [${idx.name}] ${JSON.stringify(idx.key)}`));

  // Schema da bor lekin DB da yo'q indexlar
  const actualKeyStrings = actualIndexes.map(i => JSON.stringify(i.key));
  const missingIndexes = schemaIndexes.filter(si => {
    const siKey = JSON.stringify(si.fields);
    return !actualKeyStrings.some(ak => ak === siKey);
  });

  if (missingIndexes.length) {
    console.log(`\n⚠ DB da yaratilmagan indexlar (mongoose sync kerak):`);
    missingIndexes.forEach(idx => console.log(`  ${JSON.stringify(idx.fields)}`));
    console.log('  → model.syncIndexes() ni ishga tushiring');
  } else {
    console.log('\n✓ Barcha indexlar mos');
  }
}

async function main() {
  await connectDB();

  for (const modelConfig of MODELS) {
    await checkModel(modelConfig);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('Tekshiruv tugadi');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('XATO:', err.message);
  process.exit(1);
});
