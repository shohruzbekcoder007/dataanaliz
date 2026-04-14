const AgriLandTin = require('../models/AgriLandTin');
const XLSX        = require('xlsx');

// Umumiy statistika
exports.getStats = async (req, res) => {
  const [totalTins, sample] = await Promise.all([
    AgriLandTin.countDocuments(),
    AgriLandTin.aggregate([
      {
        $group: {
          _id: null,
          total_categories: { $sum: { $size: '$category' } },
          avg_categories:   { $avg: { $size: '$category' } },
          max_categories:   { $max: { $size: '$category' } },
        },
      },
    ]),
  ]);

  res.json({
    total_tins:       totalTins,
    total_categories: sample[0]?.total_categories || 0,
    avg_categories:   +(sample[0]?.avg_categories || 0).toFixed(2),
    max_categories:   sample[0]?.max_categories || 0,
  });
};

// land_fund_category bo'yicha taqsimot
exports.byCategory = async (req, res) => {
  const data = await AgriLandTin.aggregate([
    { $unwind: '$category' },
    {
      $group: {
        _id:   '$category.land_fund_category',
        count: { $sum: 1 },
        description: { $first: '$category.land_fund_category_description' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
};

// land_fund_type bo'yicha taqsimot
exports.byType = async (req, res) => {
  const { category } = req.query; // ?category=006001 kabi filter
  const match = category
    ? { $match: { 'category.land_fund_category': category } }
    : { $match: {} };

  const data = await AgriLandTin.aggregate([
    match,
    { $unwind: '$category' },
    ...(category ? [{ $match: { 'category.land_fund_category': category } }] : []),
    {
      $group: {
        _id:         '$category.land_fund_type',
        count:       { $sum: 1 },
        description: { $first: '$category.land_fund_type_description' },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
};

// property_kind bo'yicha taqsimot
exports.byPropertyKind = async (req, res) => {
  const data = await AgriLandTin.aggregate([
    { $unwind: '$category' },
    {
      $group: {
        _id:   '$category.property_kind',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
};

// tenancy_type_code bo'yicha taqsimot
exports.byTenancy = async (req, res) => {
  const data = await AgriLandTin.aggregate([
    { $unwind: '$category' },
    {
      $group: {
        _id:   '$category.tenancy_type_code',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
};

// category elementlari soni bo'yicha taqsimot
exports.byCategoryCount = async (req, res) => {
  const data = await AgriLandTin.aggregate([
    {
      $group: {
        _id:   { $size: '$category' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        category_count: '$_id',
        tin_count:      '$count',
        _id:            0,
      },
    },
  ]);
  res.json(data);
};

// Cross matrix — umumiy helper
async function buildCrossMatrix(field) {
  const data = await AgriLandTin.aggregate([
    { $project: { cats: { $setUnion: [`$category.${field}`] } } },
    { $match: { cats: { $ne: [] } } },
    { $project: { catA: '$cats', catB: '$cats' } },
    { $unwind: '$catA' },
    { $unwind: '$catB' },
    { $match: { catA: { $nin: [null, ''] }, catB: { $nin: [null, ''] } } },
    { $group: { _id: { catA: '$catA', catB: '$catB' }, count: { $sum: 1 } } },
    { $sort: { '_id.catA': 1, '_id.catB': 1 } },
  ], { allowDiskUse: true });

  const catSet = new Set();
  data.forEach(d => { catSet.add(d._id.catA); catSet.add(d._id.catB); });
  const categories = [...catSet].sort();
  const map = {};
  data.forEach(d => { map[`${d._id.catA}|${d._id.catB}`] = d.count; });
  return { categories, map };
}

// Cross matrix — land_fund_category × land_fund_category
exports.crossMatrix = async (req, res) => {
  const result = await buildCrossMatrix('land_fund_category');
  res.json(result);
};

// Cross matrix — land_fund_type × land_fund_type
exports.crossMatrixType = async (req, res) => {
  const result = await buildCrossMatrix('land_fund_type');
  res.json(result);
};

// XLSX export helper
function matrixToXlsx({ categories, map }, sheetName) {
  const wb = XLSX.utils.book_new();

  // aoa (array of arrays) quramiz
  const aoa = [['', ...categories]];
  categories.forEach(catA => {
    const row = [catA, ...categories.map(catB => map[`${catA}|${catB}`] || 0)];
    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Ustun kengligi
  ws['!cols'] = [{ wch: 18 }, ...categories.map(() => ({ wch: 14 }))];

  // Header va diagonal cellarga style
  const n = categories.length;
  for (let r = 0; r <= n; r++) {
    for (let c = 0; c <= n; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      const isHeader = r === 0 || c === 0;
      const isDiag   = r > 0 && c > 0 && categories[r - 1] === categories[c - 1];
      ws[addr].s = {
        font:      isHeader ? { bold: true, color: { rgb: 'FFFFFF' } } : isDiag ? { bold: true, color: { rgb: '4F6EF7' } } : {},
        fill:      isHeader ? { patternType: 'solid', fgColor: { rgb: '1A1A2E' } } : isDiag ? { patternType: 'solid', fgColor: { rgb: 'EEF0FF' } } : {},
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top:    { style: 'thin', color: { rgb: 'E0E4F0' } },
          bottom: { style: 'thin', color: { rgb: 'E0E4F0' } },
          left:   { style: 'thin', color: { rgb: 'E0E4F0' } },
          right:  { style: 'thin', color: { rgb: 'E0E4F0' } },
        },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

// Yacheyka bosilganda — ikkala qiymatga ega TINlar ro'yxati
// GET /tin-list?field=land_fund_category&a=006001&b=006003
exports.tinList = async (req, res) => {
  const { field = 'land_fund_category', a, b } = req.query;
  if (!a || !b) return res.status(400).json({ message: 'a va b parametrlari kerak' });

  const matchField = `category.${field}`;
  const data = await AgriLandTin.find(
    { [matchField]: a, ...(a !== b ? { [matchField]: { $all: [a, b] } } : { [matchField]: a }) },
    { tin: 1 }
  ).lean();

  // a === b (diagonal) — faqat a ga ega TINlar
  // a !== b — ikkalasiga ham ega TINlar
  let tins;
  if (a === b) {
    tins = (await AgriLandTin.find(
      { [matchField]: a },
      { tin: 1 }
    ).lean()).map(d => d.tin);
  } else {
    tins = (await AgriLandTin.find(
      { [matchField]: { $all: [a, b] } },
      { tin: 1 }
    ).lean()).map(d => d.tin);
  }

  res.json({ a, b, field, count: tins.length, tins });
};

// Export — land_fund_category
exports.exportCrossMatrix = async (req, res) => {
  const result = await buildCrossMatrix('land_fund_category');
  const buf    = matrixToXlsx(result, 'Category');
  res.setHeader('Content-Disposition', 'attachment; filename="land_fund_category_matrix.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// Export — land_fund_type
exports.exportCrossMatrixType = async (req, res) => {
  const result = await buildCrossMatrix('land_fund_type');
  const buf    = matrixToXlsx(result, 'Type');
  res.setHeader('Content-Disposition', 'attachment; filename="land_fund_type_matrix.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// property_kind — category filter bilan
exports.byPropertyKindCat = async (req, res) => {
  const { category } = req.query;
  const match = category ? { 'category.land_fund_category': category } : {};
  const data = await AgriLandTin.aggregate([
    { $match: match },
    { $unwind: '$category' },
    ...(category ? [{ $match: { 'category.land_fund_category': category } }] : []),
    { $group: { _id: '$category.property_kind', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
};

// tenancy_type_code — category filter bilan
exports.byTenancyCat = async (req, res) => {
  const { category } = req.query;
  const match = category ? { 'category.land_fund_category': category } : {};
  const data = await AgriLandTin.aggregate([
    { $match: match },
    { $unwind: '$category' },
    ...(category ? [{ $match: { 'category.land_fund_category': category } }] : []),
    { $group: { _id: '$category.tenancy_type_code', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
};

// tin bo'yicha qidiruv
exports.getByTin = async (req, res) => {
  const doc = await AgriLandTin.findOne({ tin: req.params.tin }).lean();
  if (!doc) return res.status(404).json({ message: 'Topilmadi' });
  res.json(doc);
};
