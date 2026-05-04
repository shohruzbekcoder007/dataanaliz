// Andijon_MTM.xlsx (cadastral_number, tin) — agri_land_full.tin ni yangilash
// Foydalanish:
//   node update_tin_from_xlsx.js              — DRY RUN (faqat hisobot)
//   node update_tin_from_xlsx.js --apply      — haqiqatan yangilash

require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');

const FILE = path.join(__dirname, 'Andijon_MTM.xlsx');
const APPLY = process.argv.includes('--apply');
const BATCH = 500;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection('agri_land_full');

  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}] Reading ${FILE}`);
  const wb = XLSX.readFile(FILE);
  const sh = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sh, { defval: null });
  console.log(`Rows in xlsx: ${rows.length}`);

  // Map: cadastral_number → newTin (xlsx)
  const xlsxMap = new Map();
  let missingCol = 0;
  for (const row of rows) {
    const cad = row.cadastral_number != null ? String(row.cadastral_number).trim() : '';
    const newTin = row.tin != null ? String(row.tin).trim() : '';
    if (!cad || !newTin) { missingCol++; continue; }
    xlsxMap.set(cad, newTin);
  }
  console.log(`Unique cadastrals to check: ${xlsxMap.size}`);

  // Batched fetch
  const cads = Array.from(xlsxMap.keys());
  const cadStats = new Map(); // cad → { count, docs }
  for (let i = 0; i < cads.length; i += BATCH) {
    const chunk = cads.slice(i, i + BATCH);
    const docs = await col.find({ cadastral_number: { $in: chunk } })
      .project({ _id: 1, cadastral_number: 1, tin: 1 })
      .toArray();
    for (const d of docs) {
      if (!cadStats.has(d.cadastral_number)) cadStats.set(d.cadastral_number, []);
      cadStats.get(d.cadastral_number).push(d);
    }
    process.stdout.write(`\rFetched: ${Math.min(i + BATCH, cads.length)}/${cads.length}`);
  }
  console.log();

  let notFound = 0, alreadyMatch = 0, willUpdate = 0, multiMatch = 0, updated = 0;
  const samples = { notFound: [], willUpdate: [], multiMatch: [] };
  const ops = [];

  for (const [cad, newTin] of xlsxMap) {
    const docs = cadStats.get(cad);
    if (!docs || !docs.length) {
      notFound++;
      if (samples.notFound.length < 5) samples.notFound.push(cad);
      continue;
    }
    if (docs.length > 1) {
      multiMatch++;
      if (samples.multiMatch.length < 5) samples.multiMatch.push({ cad, count: docs.length });
    }
    for (const doc of docs) {
      if (String(doc.tin) === newTin) { alreadyMatch++; continue; }
      willUpdate++;
      if (samples.willUpdate.length < 5)
        samples.willUpdate.push({ cad, old_tin: doc.tin, new_tin: newTin });
      if (APPLY) ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { tin: newTin } } } });
    }
  }

  if (APPLY && ops.length) {
    console.log(`Applying ${ops.length} updates...`);
    for (let i = 0; i < ops.length; i += BATCH) {
      const r = await col.bulkWrite(ops.slice(i, i + BATCH), { ordered: false });
      updated += r.modifiedCount || 0;
      process.stdout.write(`\rApplied: ${Math.min(i + BATCH, ops.length)}/${ops.length}`);
    }
    console.log();
  }

  console.log('\n=== Hisobot ===');
  console.log(`Xlsx satrlar (xato yoki bo'sh): ${missingCol}`);
  console.log(`Cadastr topilmadi:              ${notFound}`);
  console.log(`Bir nechta hujjat (multi):      ${multiMatch}`);
  console.log(`Tin allaqachon mos:             ${alreadyMatch}`);
  console.log(`Yangilanishi kerak:             ${willUpdate}`);
  if (APPLY) console.log(`Haqiqatan yangilangan:          ${updated}`);

  if (samples.notFound.length) console.log('\nTopilmagan namunalar:', samples.notFound);
  if (samples.multiMatch.length) console.log('Multi-match namunalar:', samples.multiMatch);
  if (samples.willUpdate.length) console.log('Yangilash namunalari:', samples.willUpdate);

  if (!APPLY) console.log('\n>>> Ozgartirish uchun --apply flag bilan ishga tushiring');

  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
