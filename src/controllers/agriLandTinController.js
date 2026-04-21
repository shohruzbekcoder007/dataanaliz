const AgriLandTin = require('../models/AgriLandTin');
const HokimyatAgriLandMat = require('../models/HokimyatAgriLandMat');
const XLSX        = require('xlsx');

// Hokimyat agri land mat — barcha ma'lumotlar
exports.hokimyatMatList = async (req, res) => {
  const items = await HokimyatAgriLandMat.find({})
    .select('soato7 soato4 tuman_nomi xokimiyat_nomi inn defined_arable_area_size total_gis_area_ha total_land_area reserve_land_clean_remainder_area six_shape_info areas')
    .lean();

  const enriched = items.map(it => ({
    soato7: it.soato7,
    soato4: it.soato4,
    tuman_nomi: it.tuman_nomi,
    xokimiyat_nomi: it.xokimiyat_nomi,
    inn: it.inn,
    defined_arable_area_size: it.defined_arable_area_size || 0,
    total_gis_area_ha: it.total_gis_area_ha || 0,
    total_land_area: it.total_land_area || 0,
    reserve_land_clean_remainder_area: it.reserve_land_clean_remainder_area || 0,
    six_shape_count: Array.isArray(it.six_shape_info) ? it.six_shape_info.length : 0,
    areas_count: Array.isArray(it.areas) ? it.areas.length : 0,
  }));

  res.json({ total: enriched.length, items: enriched });
};

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

// Geo filter yordamida TINlar ro'yxatini oladi
async function getTinsByGeo({ viloyat_code, tuman_code } = {}) {
  if (!viloyat_code && !tuman_code) return null;
  const col = require('mongoose').connection.db.collection('agri_land_full');
  const match = { tin: { $nin: [null, ''] } };
  if (viloyat_code) match.viloyat_code = viloyat_code;
  if (tuman_code)   match.tuman_code   = tuman_code;
  return col.distinct('tin', match);
}

// Cross matrix — umumiy helper
async function buildCrossMatrix(field, geoFilter = {}) {
  const tinFilter = await getTinsByGeo(geoFilter);
  const preMatch  = tinFilter ? { $match: { tin: { $in: tinFilter } } } : { $match: {} };

  const data = await AgriLandTin.aggregate([
    preMatch,
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
  const { viloyat, tuman } = req.query;
  const result = await buildCrossMatrix('land_fund_category', { viloyat_code: viloyat, tuman_code: tuman });
  res.json(result);
};

// Cross matrix — land_fund_type × land_fund_type
exports.crossMatrixType = async (req, res) => {
  const { viloyat, tuman } = req.query;
  const result = await buildCrossMatrix('land_fund_type', { viloyat_code: viloyat, tuman_code: tuman });
  res.json(result);
};

// Viloyatlar ro'yxati
exports.getViloyats = async (req, res) => {
  const col = require('mongoose').connection.db.collection('agri_land_full');
  const data = await col.aggregate([
    { $match: { viloyat_code: { $nin: [null, ''] } } },
    { $group: { _id: '$viloyat_code', name: { $first: '$viloyat_name' } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  res.json(data);
};

// Tumanlar ro'yxati — ixtiyoriy viloyat filteri bilan
exports.getTumans = async (req, res) => {
  const { viloyat } = req.query;
  const col = require('mongoose').connection.db.collection('agri_land_full');
  const match = { tuman_code: { $nin: [null, ''] } };
  if (viloyat) match.viloyat_code = viloyat;
  const data = await col.aggregate([
    { $match: match },
    { $group: { _id: '$tuman_code', name: { $first: '$tuman_name' } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  res.json(data);
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

// Yacheyka bosilganda — ikkala qiymatga ega TINlar ro'yxati + maydon summasi
// GET /tin-list?field=land_fund_category&a=006001&b=006003
exports.tinList = async (req, res) => {
  const { field = 'land_fund_category', a, b, viloyat, tuman } = req.query;
  if (!a || !b) return res.status(400).json({ message: 'a va b parametrlari kerak' });

  const matchField = `category.${field}`;

  // TINlar ro'yxati (agri_land_tins dan)
  let tinQuery = a === b
    ? { [matchField]: a }
    : { [matchField]: { $all: [a, b] } };

  // Geo filter bo'lsa — agri_land_full dan mos TINlarni olamiz
  if (viloyat || tuman) {
    const geoTins = await getTinsByGeo({ viloyat_code: viloyat, tuman_code: tuman });
    tinQuery = { ...tinQuery, tin: { $in: geoTins } };
  }

  const tinDocs = await AgriLandTin.find(tinQuery, { tin: 1 }).lean();
  const tins = tinDocs.map(d => d.tin).filter(Boolean);

  // agri_land_full dan: tin + field bo'yicha area va cadastral_number soni
  const col = require('mongoose').connection.db.collection('agri_land_full');

  const values = a === b ? [a] : [a, b];
  const geoMatch = {};
  if (viloyat) geoMatch.viloyat_code = viloyat;
  if (tuman)   geoMatch.tuman_code   = tuman;

  const areaAgg = await col.aggregate([
    {
      $match: {
        tin: { $in: tins },
        [field]: { $in: values },
        ...geoMatch,
      },
    },
    {
      $group: {
        _id:               `$${field}`,
        area_sum:          {
          $sum: {
            $convert: { input: '$gis_area_ha', to: 'double', onError: 0, onNull: 0 },
          },
        },
        cadastral_count:   { $sum: 1 },
        cadastral_numbers: { $addToSet: '$cadastral_number' },
      },
    },
    { $sort: { _id: 1 } },
  ]).toArray();

  const areas = {};
  areaAgg.forEach(r => {
    areas[r._id] = {
      area:             +r.area_sum.toFixed(4),
      cadastral_count:  r.cadastral_count,
      unique_cadastral: r.cadastral_numbers.filter(Boolean).length,
    };
  });

  // Har bir TIN uchun alohida area (tin × field_value bo'yicha)
  const tinAreaAgg = await col.aggregate([
    {
      $match: {
        tin:    { $in: tins },
        [field]: { $in: values },
      },
    },
    {
      $group: {
        _id: { tin: '$tin', val: `$${field}` },
        area_sum: {
          $sum: {
            $convert: { input: '$gis_area_ha', to: 'double', onError: 0, onNull: 0 },
          },
        },
        cadastral_count: { $sum: 1 },
      },
    },
    { $sort: { '_id.tin': 1, '_id.val': 1 } },
  ], { allowDiskUse: true }).toArray();

  // { "200011130": { "006008000000": { area, count }, ... }, ... }
  const tinAreas = {};
  tinAreaAgg.forEach(r => {
    if (!tinAreas[r._id.tin]) tinAreas[r._id.tin] = {};
    tinAreas[r._id.tin][r._id.val] = {
      area:  +r.area_sum.toFixed(4),
      count: r.cadastral_count,
    };
  });

  // SixShape dan har bir TIN uchun yig'indi (organization_inn = TIN raqami)
  const sixCol = require('mongoose').connection.db.collection('six_shapes');
  const tinNums = tins.map(t => parseInt(t, 10)).filter(n => !isNaN(n));

  const sixAgg = await sixCol.aggregate([
    { $match: { organization_inn: { $in: tinNums } } },
    {
      $group: {
        _id:                     '$organization_inn',
        total_land_area:         { $sum: { $ifNull: ['$total_land_area', 0] } },
        agricultural_land_total: { $sum: { $ifNull: ['$agricultural_land_total', 0] } },
        arable_land:             { $sum: { $ifNull: ['$arable_land', 0] } },
        sown_area:               { $sum: { $ifNull: ['$sown_area', 0] } },
        greenhouse_land_area:    { $sum: { $ifNull: ['$greenhouse_land_area', 0] } },
        record_count:            { $sum: 1 },
      },
    },
  ], { allowDiskUse: true }).toArray();

  const sixMap = {};
  sixAgg.forEach(r => {
    sixMap[String(r._id)] = {
      total_land_area:         +r.total_land_area.toFixed(4),
      agricultural_land_total: +r.agricultural_land_total.toFixed(4),
      arable_land:             +r.arable_land.toFixed(4),
      sown_area:               +r.sown_area.toFixed(4),
      greenhouse_land_area:    +r.greenhouse_land_area.toFixed(4),
      record_count:            r.record_count,
    };
  });

  res.json({ a, b, field, count: tins.length, tins, areas, tinAreas, sixMap });
};

// Export — land_fund_category
exports.exportCrossMatrix = async (req, res) => {
  const { viloyat, tuman } = req.query;
  const result = await buildCrossMatrix('land_fund_category', { viloyat_code: viloyat, tuman_code: tuman });
  const buf    = matrixToXlsx(result, 'Category');
  res.setHeader('Content-Disposition', 'attachment; filename="land_fund_category_matrix.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};

// Export — land_fund_type
exports.exportCrossMatrixType = async (req, res) => {
  const { viloyat, tuman } = req.query;
  const result = await buildCrossMatrix('land_fund_type', { viloyat_code: viloyat, tuman_code: tuman });
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

// SixShape ro'yxati — viloyat/tuman filter va pagination bilan
// GET /six-shapes?viloyat=1703&tuman=1703202&page=1&limit=20
exports.sixShapesList = async (req, res) => {
  const { viloyat, tuman } = req.query;
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip  = (page - 1) * limit;

  const sixCol = require('mongoose').connection.db.collection('six_shapes');

  // SixShape filter — soato dan viloyat/tuman bo'yicha
  const match = {};
  if (tuman) {
    match.soato = Number(tuman);
  } else if (viloyat) {
    const v = Number(viloyat);
    match.soato = { $gte: v * 1000, $lt: (v + 1) * 1000 };
  }

  const [total, items, allSixTins] = await Promise.all([
    sixCol.countDocuments(match),
    sixCol.find(match)
      .project({
        organization_inn:        1,
        organization_name:       1,
        soato:                   1,
        old_soato:               1,
        total_land_area:         1,
        agricultural_land_total: 1,
        arable_land:             1,
        sown_area:               1,
        greenhouse_land_area:    1,
        land_fund_category:      1,
        land_fund_type:          1,
        status_name:             1,
      })
      .sort({ organization_inn: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    sixCol.distinct('organization_inn', match),
  ]);

  // Joriy sahifadagi TINlar bo'yicha AgriLandFull dan kontur soni land_fund_type bo'yicha
  const tins = items.map(i => String(i.organization_inn)).filter(Boolean);

  const aglCol = require('mongoose').connection.db.collection('agri_land_full');
  const geoMatch = {};
  if (viloyat) geoMatch.viloyat_code = String(viloyat);
  if (tuman)   geoMatch.tuman_code   = String(tuman);

  // Butun filterga mos SixShape TINlari ichidan — AgriLandFull da kadastri topilganlar
  const allSixTinsStr = allSixTins.filter(Boolean).map(String);
  const matchedTinsArr = await aglCol.distinct('tin', {
    tin: { $in: allSixTinsStr },
    ...geoMatch,
  });
  const matchedSet = new Set(matchedTinsArr);
  // Topilgan va topilmagan sixShape yozuvlari soni
  const foundCount = await sixCol.countDocuments({
    ...match,
    organization_inn: { $in: matchedTinsArr.map(t => Number(t)).filter(n => !isNaN(n)) },
  });
  const notFoundCount = total - foundCount;

  const contours = await aglCol.aggregate([
    { $match: { tin: { $in: tins }, ...geoMatch } },
    {
      $group: {
        _id:         { tin: '$tin', type: '$land_fund_type' },
        count:       { $sum: 1 },
        description: { $first: '$land_fund_type_description' },
        area_sum: {
          $sum: { $convert: { input: '$gis_area_ha', to: 'double', onError: 0, onNull: 0 } },
        },
      },
    },
    { $sort: { '_id.tin': 1, '_id.type': 1 } },
  ], { allowDiskUse: true }).toArray();

  // Map: tin -> [ { type, description, count, area } ]
  const contourMap = {};
  contours.forEach(c => {
    const tin = c._id.tin;
    if (!contourMap[tin]) contourMap[tin] = [];
    contourMap[tin].push({
      type:        c._id.type || '—',
      description: c.description || '',
      count:       c.count,
      area:        +c.area_sum.toFixed(4),
    });
  });

  // Har bir item ga contoursByType qo'shamiz
  const enriched = items.map(it => ({
    ...it,
    contoursByType: contourMap[String(it.organization_inn)] || [],
  }));

  res.json({
    total, page, limit,
    pages: Math.ceil(total / limit),
    found_count: foundCount,
    not_found_count: notFoundCount,
    items: enriched,
  });
};

