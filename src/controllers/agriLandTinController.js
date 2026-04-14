const AgriLandTin = require('../models/AgriLandTin');

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

// Cross matrix — land_fund_category × land_fund_category, qiymat = ikkalasida ham qatnashgan TIN soni
exports.crossMatrix = async (req, res) => {
  const data = await AgriLandTin.aggregate([
    // Har TIN uchun unique categorylar
    { $project: { cats: { $setUnion: ['$category.land_fund_category'] } } },
    { $match: { cats: { $ne: [] } } },
    // catA va catB — ikki marta unwind (cross join)
    { $project: { catA: '$cats', catB: '$cats' } },
    { $unwind: '$catA' },
    { $unwind: '$catB' },
    { $match: { catA: { $nin: [null, ''] }, catB: { $nin: [null, ''] } } },
    { $group: { _id: { catA: '$catA', catB: '$catB' }, count: { $sum: 1 } } },
    { $sort: { '_id.catA': 1, '_id.catB': 1 } },
  ], { allowDiskUse: true });

  // Barcha categorylarni yig'amiz
  const catSet = new Set();
  data.forEach(d => { catSet.add(d._id.catA); catSet.add(d._id.catB); });
  const categories = [...catSet].sort();

  // Map: catA|catB -> count
  const map = {};
  data.forEach(d => { map[`${d._id.catA}|${d._id.catB}`] = d.count; });

  res.json({ categories, map });
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
