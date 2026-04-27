const AgriLandTin = require('../models/AgriLandTin');
const HokimyatAgriLandMat = require('../models/HokimyatAgriLandMat');
const KattaTashkilotlarReport = require('../models/KattaTashkilotlarReport');
const TinSoatoPairs = require('../models/TinSoatoPairs');

// Qo'ng'irot tumani — to'liq tahlil
exports.qungirotAnalysis = async (req, res) => {
  const TUMAN = '1735215';
  const TUMAN_NUM = 1735215;
  const VILOYAT = '1735';
  const db = require('mongoose').connection.db;

  const aglCol = db.collection('agri_land_full');
  const sixCol = db.collection('six_shapes');
  const defCol = db.collection('defined_arable_lands');
  const tspCol = db.collection('tin_soato_pairs');
  const hamCol = db.collection('hokimyat_agri_land_mat');
  const fiveCol = db.collection('five_shapes');
  const ijaraCol = db.collection('ijara');
  const reserveCol = db.collection('reserve_land_clean_remainder');

  const aglMatch = { tuman_code: TUMAN };
  const sixMatch = { soato: TUMAN_NUM };
  const defMatch = { tuman_soato: TUMAN };
  const tspMatch = { soato: TUMAN };

  const num = (x) => ({ $convert: { input: x, to: 'double', onError: 0, onNull: 0 } });

  const [
    aglOverall, aglByCategory, aglByType, aglByProperty, aglByTenancy,
    aglByMahalla, aglTopTins, aglIsActive, aglRemoved, aglComparison,
    sixOverall, sixByCategory, sixByType, sixTopOrgs, sixByProperty,
    defOverall, defByFieldCat, defByGroundSrc, defByMahalla,
    tspOverall, tspTopTins,
    hamCount, fiveCount, ijaraCount, reserveCount,
    aglFiveShapeStats,
    reserveOverall, reserveByProperty, reserveByBaUnit, reserveByMahalla, reserveByAuction, reserveTop,
  ] = await Promise.all([
    // 1. agri_land_full overall
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        total_area: { $sum: num('$gis_area_ha') },
        unique_tins: { $addToSet: '$tin' },
        unique_cadastrals: { $addToSet: '$cadastral_number' },
        unique_mahallas: { $addToSet: '$mahalla_name' },
      }},
      { $project: {
        count: 1, total_area: 1,
        tin_count: { $size: '$unique_tins' },
        cadastral_count: { $size: '$unique_cadastrals' },
        mahalla_count: { $size: '$unique_mahallas' },
      }},
    ]).toArray(),

    // 2. By land_fund_category
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: { code: '$land_fund_category', desc: '$land_fund_category_description' },
                  count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 3. By land_fund_type
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: { code: '$land_fund_type', desc: '$land_fund_type_description' },
                  count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
      { $limit: 30 },
    ]).toArray(),

    // 4. By property_kind
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$property_kind', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 5. By tenancy_type_code
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$tenancy_type_code', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 6. By mahalla
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$mahalla_name', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') },
                  tins: { $addToSet: '$tin' } }},
      { $project: { count: 1, area: 1, tin_count: { $size: '$tins' } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 7. Top TINs by area
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$tin', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') },
                  owner: { $first: '$owner_full_name' } }},
      { $sort: { area: -1 } },
      { $limit: 20 },
    ]).toArray(),

    // 8. is_active distribution
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$is_active', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
    ]).toArray(),

    // 9. removed_by_qx
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$removed_by_qx', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
    ]).toArray(),

    // 10. compare_cadastral_and_report_shape stats
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: { _id: '$compare_cadastral_and_report_shape', count: { $sum: 1 },
                  diff_sum: { $sum: num('$compare_cadastral_and_report_shape_diff') } }},
    ]).toArray(),

    // 11. six_shapes overall
    sixCol.aggregate([
      { $match: sixMatch },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        organizations: { $addToSet: '$organization_inn' },
        total_land_area: { $sum: num('$total_land_area') },
        agricultural_land_total: { $sum: num('$agricultural_land_total') },
        arable_land: { $sum: num('$arable_land') },
        sown_area: { $sum: num('$sown_area') },
        greenhouse_land_area: { $sum: num('$greenhouse_land_area') },
        subleased_land_area: { $sum: num('$subleased_land_area') },
        leased_out_land_area: { $sum: num('$leased_out_land_area') },
      }},
      { $project: {
        count: 1, total_land_area: 1, agricultural_land_total: 1, arable_land: 1,
        sown_area: 1, greenhouse_land_area: 1, subleased_land_area: 1, leased_out_land_area: 1,
        org_count: { $size: '$organizations' },
      }},
    ]).toArray(),

    // 12. six by category
    sixCol.aggregate([
      { $match: sixMatch },
      { $group: { _id: { code: '$land_fund_category', desc: '$land_fund_category_description' },
                  count: { $sum: 1 }, area: { $sum: num('$total_land_area') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 13. six by type
    sixCol.aggregate([
      { $match: sixMatch },
      { $group: { _id: { code: '$land_fund_type', desc: '$land_fund_type_description' },
                  count: { $sum: 1 }, area: { $sum: num('$total_land_area') } }},
      { $sort: { area: -1 } },
      { $limit: 30 },
    ]).toArray(),

    // 14. Top organizations by area
    sixCol.aggregate([
      { $match: sixMatch },
      { $group: { _id: '$organization_inn',
                  name: { $first: '$organization_name' },
                  count: { $sum: 1 },
                  total_land_area: { $sum: num('$total_land_area') },
                  agricultural: { $sum: num('$agricultural_land_total') },
                  arable: { $sum: num('$arable_land') },
                  sown: { $sum: num('$sown_area') } }},
      { $sort: { total_land_area: -1 } },
      { $limit: 20 },
    ]).toArray(),

    // 15. six by property_kind / status
    sixCol.aggregate([
      { $match: sixMatch },
      { $group: { _id: '$status_name', count: { $sum: 1 }, area: { $sum: num('$total_land_area') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 16. defined_arable_lands overall
    defCol.aggregate([
      { $match: defMatch },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        total_area: { $sum: num('$area_size') },
        unique_tins: { $addToSet: '$tin_or_jshshr' },
        unique_mahallas: { $addToSet: '$mahalla_tin' },
        fell_count: { $sum: { $cond: ['$fell_on_top_of_each_other', 1, 0] } },
      }},
      { $project: {
        count: 1, total_area: 1, fell_count: 1,
        tin_count: { $size: '$unique_tins' },
        mahalla_count: { $size: '$unique_mahallas' },
      }},
    ]).toArray(),

    // 17. defined by field_category (1,2,3)
    defCol.aggregate([
      { $match: defMatch },
      { $group: { _id: '$field_category', count: { $sum: 1 }, area: { $sum: num('$area_size') } }},
      { $sort: { _id: 1 } },
    ]).toArray(),

    // 18. defined by ground_source (1-9)
    defCol.aggregate([
      { $match: defMatch },
      { $group: { _id: '$ground_source', count: { $sum: 1 }, area: { $sum: num('$area_size') } }},
      { $sort: { _id: 1 } },
    ]).toArray(),

    // 19. defined by mahalla
    defCol.aggregate([
      { $match: defMatch },
      { $group: { _id: '$mahalla_tin', count: { $sum: 1 }, area: { $sum: num('$area_size') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    // 20. tin_soato_pairs overall
    tspCol.aggregate([
      { $match: tspMatch },
      { $group: { _id: null, count: { $sum: 1 },
                  total_land_area: { $sum: num('$total_land_area') },
                  gis_area_ha_total: { $sum: num('$gis_area_ha_total') },
                  arable_area_size_total: { $sum: num('$arable_area_size_total') },
                  bergan_total: { $sum: num('$bergan_total') },
                  olgan_total: { $sum: num('$olgan_total') } }},
    ]).toArray(),

    // 21. top tins from tin_soato_pairs
    tspCol.aggregate([
      { $match: tspMatch },
      { $sort: { total_land_area: -1 } },
      { $limit: 15 },
    ]).toArray(),

    // 22. hokimyat counts
    hamCol.countDocuments({ soato7: TUMAN }),
    fiveCol.countDocuments({ tuman_code: TUMAN }).catch(() => 0),
    ijaraCol.countDocuments({ tuman_code: TUMAN }).catch(() => ijaraCol.countDocuments({ soato: TUMAN }).catch(() => 0)),
    reserveCol.countDocuments({ tuman_code: TUMAN }).catch(() => 0),

    // 23. five_shape stats from agri_land_full
    aglCol.aggregate([
      { $match: aglMatch },
      { $group: {
        _id: null,
        crop_area: { $sum: num('$five_shape_crop_area') },
        planted_area: { $sum: num('$five_shape_planted_area') },
        total_land_area: { $sum: num('$five_shape_total_land_area') },
        submitted: { $sum: { $cond: ['$submitted_five_shape', 1, 0] } },
      }},
    ]).toArray(),

    // 24. reserve_land_clean_remainder overall
    reserveCol.aggregate([
      { $match: { tuman_code: TUMAN } },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        original_area: { $sum: num('$original_gis_area_ha') },
        clean_area: { $sum: num('$clean_area_ha') },
        auctioned_area: { $sum: num('$auctioned_area_ha') },
        active_count: { $sum: { $cond: ['$is_active', 1, 0] } },
        unique_cadastrals: { $addToSet: '$cadastral_number' },
        unique_mahallas: { $addToSet: '$mahalla_name' },
      }},
      { $project: { count:1, original_area:1, clean_area:1, auctioned_area:1, active_count:1,
                    cadastral_count: { $size: '$unique_cadastrals' },
                    mahalla_count: { $size: '$unique_mahallas' } }},
    ]).toArray(),

    // 25. reserve by property_kind
    reserveCol.aggregate([
      { $match: { tuman_code: TUMAN } },
      { $group: { _id: '$property_kind', count: { $sum: 1 },
                  original_area: { $sum: num('$original_gis_area_ha') },
                  clean_area: { $sum: num('$clean_area_ha') },
                  auctioned_area: { $sum: num('$auctioned_area_ha') } }},
      { $sort: { clean_area: -1 } },
    ]).toArray(),

    // 26. reserve by ba_unit_type
    reserveCol.aggregate([
      { $match: { tuman_code: TUMAN } },
      { $group: { _id: '$ba_unit_type', count: { $sum: 1 },
                  clean_area: { $sum: num('$clean_area_ha') } }},
      { $sort: { clean_area: -1 } },
    ]).toArray(),

    // 27. reserve by mahalla
    reserveCol.aggregate([
      { $match: { tuman_code: TUMAN } },
      { $group: { _id: '$mahalla_name', count: { $sum: 1 },
                  original_area: { $sum: num('$original_gis_area_ha') },
                  clean_area: { $sum: num('$clean_area_ha') },
                  auctioned_area: { $sum: num('$auctioned_area_ha') } }},
      { $sort: { clean_area: -1 } },
    ]).toArray(),

    // 28. reserve auction breakdown
    reserveCol.aggregate([
      { $match: { tuman_code: TUMAN } },
      { $bucket: {
        groupBy: { $convert: { input: '$auctioned_percentage', to: 'double', onError: 0, onNull: 0 } },
        boundaries: [0, 0.0001, 25, 50, 75, 99.9999, 100.0001],
        default: 'other',
        output: { count: { $sum: 1 }, area: { $sum: num('$clean_area_ha') } },
      }},
    ]).toArray(),

    // 29. top 30 reserve parcels
    reserveCol.find({ tuman_code: TUMAN })
      .project({ cadastral_number:1, parcel_id:1, mahalla_name:1, property_kind:1, ba_unit_type:1,
                 original_gis_area_ha:1, clean_area_ha:1, auctioned_area_ha:1, auctioned_percentage:1, is_active:1 })
      .sort({ clean_area_ha: -1 }).limit(30).toArray(),
  ]);

  res.json({
    tuman: { soato: TUMAN, viloyat: VILOYAT, name: "Qo'ng'irot tumani" },
    counts: {
      hokimyat_mat: hamCount,
      five_shapes: fiveCount,
      ijara: ijaraCount,
      reserve: reserveCount,
    },
    reserve_land: {
      overall: reserveOverall[0] || {},
      by_property: reserveByProperty,
      by_ba_unit: reserveByBaUnit,
      by_mahalla: reserveByMahalla,
      by_auction: reserveByAuction,
      top: reserveTop,
    },
    agri_land_full: {
      overall: aglOverall[0] || {},
      by_category: aglByCategory,
      by_type: aglByType,
      by_property: aglByProperty,
      by_tenancy: aglByTenancy,
      by_mahalla: aglByMahalla,
      top_tins: aglTopTins,
      is_active: aglIsActive,
      removed_by_qx: aglRemoved,
      cadastral_comparison: aglComparison,
      five_shape_stats: aglFiveShapeStats[0] || {},
    },
    six_shapes: {
      overall: sixOverall[0] || {},
      by_category: sixByCategory,
      by_type: sixByType,
      top_organizations: sixTopOrgs,
      by_status: sixByProperty,
    },
    defined_arable_lands: {
      overall: defOverall[0] || {},
      by_field_category: defByFieldCat,
      by_ground_source: defByGroundSrc,
      by_mahalla: defByMahalla,
    },
    tin_soato_pairs: {
      overall: tspOverall[0] || {},
      top_tins: tspTopTins,
    },
  });
};

// Qo'ng'irot kadastrlar ro'yxati (filterli/filtersiz) — TIN 201039878 birinchi
exports.qungirotCadastrals = async (req, res) => {
  const TUMAN = '1735215';
  const HOKIMYAT_TIN = '201039878';
  const filtered = req.query.filtered === '1' || req.query.filtered === 'true';
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip  = (page - 1) * limit;

  const db = require('mongoose').connection.db;
  const col = db.collection('agri_land_full');
  const num = (x) => ({ $convert: { input: x, to: 'double', onError: 0, onNull: 0 } });

  const baseMatch = {
    tuman_code: TUMAN,
    is_active: true,
    property_kind: { $nin: ['prop_kind_reserve'], $not: /^prop_kind_land_lease/ },
  };

  const filterMatch = filtered ? {
    tuman_code: TUMAN,
    is_active: true,
    removed_by_qx: false,
    $expr: { $ne: [{ $strLenCP: { $ifNull: [{ $toString: '$tin' }, ''] } }, 14] },
    $or: [
      { land_fund_category: { $nin: ['006002', '006007', '006005', '006008', null, ''] } },
      { land_fund_category: '006008', tin: { $ne: null } },
    ],
    land_fund_type: { $nin: [
      '006001007020','006003006000','006003002002','006003001006','006003001005',
      '006003003000','006003001003','006003001002','006003002001','006003001004',
      '006003002005','006003004000','006003002003','006003001001','006003002004',
    ]},
    property_kind: { $nin: ['prop_kind_reserve'], $not: /^prop_kind_land_lease/ },
  } : baseMatch;

  // Hokimyat TIN birinchi — sort key
  const sortPipeline = [
    { $match: filterMatch },
    { $addFields: {
        _sortKey: { $cond: [{ $or: [
          { $eq: ['$tin', HOKIMYAT_TIN] },
          { $eq: ['$tin', Number(HOKIMYAT_TIN)] },
        ]}, 0, 1] }
    }},
    { $sort: { _sortKey: 1, gis_area_ha: -1 } },
  ];

  const [total, items, totals, hokimyatCount] = await Promise.all([
    col.countDocuments(filterMatch),
    col.aggregate([
      ...sortPipeline,
      { $skip: skip }, { $limit: limit },
      { $project: {
          cadastral_number: 1, tin: 1, owner_full_name: 1,
          land_fund_category: 1, land_fund_category_description: 1,
          land_fund_type: 1, land_fund_type_description: 1,
          property_kind: 1, tenancy_type_code: 1,
          gis_area_ha: 1, mahalla_name: 1,
          is_active: 1, removed_by_qx: 1,
      }},
    ]).toArray(),
    col.aggregate([
      { $match: filterMatch },
      { $group: {
          _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') },
          tins: { $addToSet: '$tin' },
          cadastrals: { $addToSet: '$cadastral_number' },
      }},
      { $project: { count:1, area:1,
                    tin_count: { $size: '$tins' },
                    cadastral_count: { $size: '$cadastrals' } }},
    ]).toArray(),
    col.countDocuments({ ...filterMatch, $or: [{ tin: HOKIMYAT_TIN }, { tin: Number(HOKIMYAT_TIN) }] }),
  ]);

  res.json({
    filtered, page, limit, total,
    pages: Math.ceil(total / limit) || 1,
    totals: totals[0] || { count: 0, area: 0, tin_count: 0, cadastral_count: 0 },
    hokimyat_count: hokimyatCount,
    items,
  });
};

// Qo'ng'irot kadastrlar — filterli vs filtersiz solishtirish
exports.qungirotCadastralsCompare = async (req, res) => {
  const TUMAN = '1735215';
  const HOKIMYAT_TIN = '201039878';
  const db = require('mongoose').connection.db;
  const col = db.collection('agri_land_full');
  const num = (x) => ({ $convert: { input: x, to: 'double', onError: 0, onNull: 0 } });

  const baseMatch = {
    tuman_code: TUMAN,
    is_active: true,
    property_kind: { $nin: ['prop_kind_reserve'], $not: /^prop_kind_land_lease/ },
  };
  const filterMatch = {
    tuman_code: TUMAN,
    is_active: true,
    removed_by_qx: false,
    $expr: { $ne: [{ $strLenCP: { $ifNull: [{ $toString: '$tin' }, ''] } }, 14] },
    $or: [
      { land_fund_category: { $nin: ['006002', '006007', '006005', '006008', null, ''] } },
      { land_fund_category: '006008', tin: { $ne: null } },
    ],
    land_fund_type: { $nin: [
      '006001007020','006003006000','006003002002','006003001006','006003001005',
      '006003003000','006003001003','006003001002','006003002001','006003001004',
      '006003002005','006003004000','006003002003','006003001001','006003002004',
    ]},
    property_kind: { $nin: ['prop_kind_reserve'], $not: /^prop_kind_land_lease/ },
  };

  const stats = (match) => col.aggregate([
    { $match: match },
    { $group: {
        _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') },
        tins: { $addToSet: '$tin' },
        cadastrals: { $addToSet: '$cadastral_number' },
        hokimyat_count: { $sum: { $cond: [{ $or: [
          { $eq: ['$tin', HOKIMYAT_TIN] },
          { $eq: ['$tin', Number(HOKIMYAT_TIN)] },
        ]}, 1, 0] } },
        hokimyat_area: { $sum: { $cond: [{ $or: [
          { $eq: ['$tin', HOKIMYAT_TIN] },
          { $eq: ['$tin', Number(HOKIMYAT_TIN)] },
        ]}, num('$gis_area_ha'), 0] } },
    }},
    { $project: { count:1, area:1, hokimyat_count:1, hokimyat_area:1,
                  tin_count: { $size: '$tins' }, cadastral_count: { $size: '$cadastrals' } }},
  ]).toArray();

  const reasonsAgg = col.aggregate([
    { $match: baseMatch },
    { $facet: {
        not_active: [
          { $match: { is_active: { $ne: true } } },
          { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
        removed: [
          { $match: { removed_by_qx: true } },
          { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
        tin14: [
          { $match: { $expr: { $eq: [{ $strLenCP: { $ifNull: [{ $toString: '$tin' }, ''] } }, 14] } } },
          { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
        excluded_categories: [
          { $match: { land_fund_category: { $in: ['006002', '006007', '006005'] } } },
          { $group: { _id: '$land_fund_category', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
        cat_006008_no_tin: [
          { $match: { land_fund_category: '006008', tin: null } },
          { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
        excluded_types: [
          { $match: { land_fund_type: { $in: [
            '006001007020','006003006000','006003002002','006003001006','006003001005',
            '006003003000','006003001003','006003001002','006003002001','006003001004',
            '006003002005','006003004000','006003002003','006003001001','006003002004',
          ]}}},
          { $group: { _id: '$land_fund_type', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
          { $sort: { count: -1 } },
        ],
        prop_reserve: [
          { $match: { property_kind: 'prop_kind_reserve' } },
          { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
        prop_lease: [
          { $match: { property_kind: { $regex: '^prop_kind_land_lease' } } },
          { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
        ],
    }},
  ]).toArray();

  const [base, filt, reasons] = await Promise.all([stats(baseMatch), stats(filterMatch), reasonsAgg]);

  res.json({
    base: base[0] || {},
    filtered: filt[0] || {},
    reasons: reasons[0] || {},
  });
};

// TIN bo'yicha chuqur tahlil
exports.tinDeepAnalysis = async (req, res) => {
  const tin = String(req.params.tin || '').trim();
  if (!tin) return res.status(400).json({ error: 'tin is required' });

  const db = require('mongoose').connection.db;
  const aglCol = db.collection('agri_land_full');
  const sixCol = db.collection('six_shapes');
  const defCol = db.collection('defined_arable_lands');
  const tspCol = db.collection('tin_soato_pairs');
  const ijaraCol = db.collection('ijara');
  const num = (x) => ({ $convert: { input: x, to: 'double', onError: 0, onNull: 0 } });

  const tinNum = Number(tin);
  const tinAny = isNaN(tinNum) ? [tin] : [tin, tinNum];

  const [
    aglOverall, aglByCat, aglByType, aglByProp, aglByTen, aglByTuman, aglByMahalla, aglRecords,
    sixOverall, sixByCat, sixByType, sixByStatus, sixRecords,
    defOverall, defByFieldCat, defByGroundSrc, defRecords,
    tspBySoato, tspOverall,
    ijaraGiven, ijaraTaken,
  ] = await Promise.all([
    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: {
          _id: null,
          count: { $sum: 1 },
          area: { $sum: num('$gis_area_ha') },
          owners: { $addToSet: '$owner_full_name' },
          mahallas: { $addToSet: '$mahalla_name' },
          tumans: { $addToSet: { code: '$tuman_code', name: '$tuman_name' } },
          viloyats: { $addToSet: { code: '$viloyat_code', name: '$viloyat_name' } },
          cadastrals: { $addToSet: '$cadastral_number' },
          active_count: { $sum: { $cond: ['$is_active', 1, 0] } },
          removed_count: { $sum: { $cond: ['$removed_by_qx', 1, 0] } },
          tin_total_gis: { $first: '$tin_total_gis_area_ha' },
      }},
      { $project: {
          count: 1, area: 1, owners: 1, tin_total_gis: 1,
          mahalla_count: { $size: '$mahallas' },
          tuman_count: { $size: '$tumans' },
          viloyat_count: { $size: '$viloyats' },
          cadastral_count: { $size: '$cadastrals' },
          active_count: 1, removed_count: 1,
          tumans: 1, viloyats: 1,
      }},
    ]).toArray(),

    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: { _id: { code: '$land_fund_category', desc: '$land_fund_category_description' },
                  count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: { _id: { code: '$land_fund_type', desc: '$land_fund_type_description' },
                  count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: { _id: '$property_kind', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: { _id: '$tenancy_type_code', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: { _id: { code: '$tuman_code', name: '$tuman_name' },
                  count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    aglCol.aggregate([
      { $match: { tin: { $in: tinAny } } },
      { $group: { _id: '$mahalla_name', count: { $sum: 1 }, area: { $sum: num('$gis_area_ha') },
                  tuman: { $first: '$tuman_name' } }},
      { $sort: { area: -1 } },
      { $limit: 50 },
    ]).toArray(),

    aglCol.find({ tin: { $in: tinAny } })
      .project({ cadastral_number: 1, land_fund_category: 1, land_fund_type: 1, gis_area_ha: 1,
                 property_kind: 1, tenancy_type_code: 1, tuman_name: 1, mahalla_name: 1,
                 is_active: 1, removed_by_qx: 1 })
      .sort({ gis_area_ha: -1 }).limit(50).toArray(),

    sixCol.aggregate([
      { $match: { organization_inn: { $in: tinAny } } },
      { $group: {
          _id: null,
          count: { $sum: 1 },
          name: { $first: '$organization_name' },
          total_land_area: { $sum: num('$total_land_area') },
          agricultural: { $sum: num('$agricultural_land_total') },
          arable: { $sum: num('$arable_land') },
          sown: { $sum: num('$sown_area') },
          greenhouse: { $sum: num('$greenhouse_land_area') },
          subleased: { $sum: num('$subleased_land_area') },
          leased_out: { $sum: num('$leased_out_land_area') },
          soatos: { $addToSet: '$soato' },
      }},
      { $project: { count:1, name:1, total_land_area:1, agricultural:1, arable:1, sown:1,
                    greenhouse:1, subleased:1, leased_out:1,
                    soato_count: { $size: '$soatos' }, soatos: 1 }},
    ]).toArray(),

    sixCol.aggregate([
      { $match: { organization_inn: { $in: tinAny } } },
      { $group: { _id: { code: '$land_fund_category', desc: '$land_fund_category_description' },
                  count: { $sum: 1 }, area: { $sum: num('$total_land_area') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    sixCol.aggregate([
      { $match: { organization_inn: { $in: tinAny } } },
      { $group: { _id: { code: '$land_fund_type', desc: '$land_fund_type_description' },
                  count: { $sum: 1 }, area: { $sum: num('$total_land_area') } }},
      { $sort: { area: -1 } },
    ]).toArray(),

    sixCol.aggregate([
      { $match: { organization_inn: { $in: tinAny } } },
      { $group: { _id: '$status_name', count: { $sum: 1 }, area: { $sum: num('$total_land_area') } }},
    ]).toArray(),

    sixCol.find({ organization_inn: { $in: tinAny } })
      .project({ soato: 1, total_land_area: 1, agricultural_land_total: 1, arable_land: 1,
                 sown_area: 1, land_fund_type: 1, land_fund_type_description: 1, status_name: 1 })
      .sort({ total_land_area: -1 }).limit(50).toArray(),

    defCol.aggregate([
      { $match: { tin_or_jshshr: { $in: tinAny.map(String) } } },
      { $group: {
          _id: null,
          count: { $sum: 1 },
          area: { $sum: num('$area_size') },
          mahallas: { $addToSet: '$mahalla_tin' },
          tumans: { $addToSet: '$tuman_soato' },
          fell_count: { $sum: { $cond: ['$fell_on_top_of_each_other', 1, 0] } },
      }},
      { $project: { count:1, area:1, fell_count:1,
                    mahalla_count: { $size: '$mahallas' },
                    tuman_count: { $size: '$tumans' } }},
    ]).toArray(),

    defCol.aggregate([
      { $match: { tin_or_jshshr: { $in: tinAny.map(String) } } },
      { $group: { _id: '$field_category', count: { $sum: 1 }, area: { $sum: num('$area_size') } }},
      { $sort: { _id: 1 } },
    ]).toArray(),

    defCol.aggregate([
      { $match: { tin_or_jshshr: { $in: tinAny.map(String) } } },
      { $group: { _id: '$ground_source', count: { $sum: 1 }, area: { $sum: num('$area_size') } }},
      { $sort: { _id: 1 } },
    ]).toArray(),

    defCol.find({ tin_or_jshshr: { $in: tinAny.map(String) } })
      .project({ tuman_soato: 1, mahalla_tin: 1, area_size: 1, field_category: 1, ground_source: 1,
                 fell_on_top_of_each_other: 1, description: 1 })
      .sort({ area_size: -1 }).limit(50).toArray(),

    tspCol.find({ tin: { $in: tinAny.map(String) } })
      .sort({ total_land_area: -1 }).toArray(),

    tspCol.aggregate([
      { $match: { tin: { $in: tinAny.map(String) } } },
      { $group: {
          _id: null, count: { $sum: 1 },
          total_land_area: { $sum: num('$total_land_area') },
          gis_area_ha_total: { $sum: num('$gis_area_ha_total') },
          arable_area_size_total: { $sum: num('$arable_area_size_total') },
          bergan_total: { $sum: num('$bergan_total') },
          olgan_total: { $sum: num('$olgan_total') },
          soatos: { $addToSet: '$soato' },
      }},
      { $project: { count:1, total_land_area:1, gis_area_ha_total:1, arable_area_size_total:1,
                    bergan_total:1, olgan_total:1, soato_count: { $size: '$soatos' } }},
    ]).toArray(),

    ijaraCol.aggregate([
      { $match: { $or: [{ bergan_inn: { $in: tinAny } }, { bergan_tin: { $in: tinAny } }] } },
      { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$area') } }},
    ]).toArray().catch(() => []),

    ijaraCol.aggregate([
      { $match: { $or: [{ olgan_inn: { $in: tinAny } }, { olgan_tin: { $in: tinAny } }] } },
      { $group: { _id: null, count: { $sum: 1 }, area: { $sum: num('$area') } }},
    ]).toArray().catch(() => []),
  ]);

  res.json({
    tin,
    agri_land_full: {
      overall: aglOverall[0] || {},
      by_category: aglByCat,
      by_type: aglByType,
      by_property: aglByProp,
      by_tenancy: aglByTen,
      by_tuman: aglByTuman,
      by_mahalla: aglByMahalla,
      records: aglRecords,
    },
    six_shapes: {
      overall: sixOverall[0] || {},
      by_category: sixByCat,
      by_type: sixByType,
      by_status: sixByStatus,
      records: sixRecords,
    },
    defined_arable_lands: {
      overall: defOverall[0] || {},
      by_field_category: defByFieldCat,
      by_ground_source: defByGroundSrc,
      records: defRecords,
    },
    tin_soato_pairs: {
      overall: tspOverall[0] || {},
      records: tspBySoato,
    },
    ijara: {
      given: ijaraGiven[0] || { count: 0, area: 0 },
      taken: ijaraTaken[0] || { count: 0, area: 0 },
    },
  });
};

// Tin-Soato pairs — pagination + soato/tin filter (native driver)
exports.tinSoatoPairsList = async (req, res) => {
  const { tin, soato, all } = req.query;
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const skip  = (page - 1) * limit;

  const col = require('mongoose').connection.db.collection('tin_soato_pairs');

  const filter = all ? {} : {
    $or: [
      { total_land_area: { $gt: 0 } },
      { gis_area_ha_total: { $gt: 0 } },
      { arable_area_size_total: { $gt: 0 } },
    ],
  };
  if (tin)   filter.tin   = { $regex: String(tin).trim(), $options: 'i' };
  if (soato) filter.soato = { $regex: '^' + String(soato).trim() };

  const [total, items, totals] = await Promise.all([
    col.countDocuments(filter),
    col.find(filter)
      .project({ tin: 1, soato: 1, total_land_area: 1, gis_area_ha_total: 1, arable_area_size_total: 1, bergan_total: 1, olgan_total: 1 })
      .sort({ total_land_area: -1 })
      .skip(skip).limit(limit)
      .toArray(),
    col.aggregate([
      { $match: filter },
      { $project: {
          land: { $convert: { input: '$total_land_area', to: 'double', onError: 0, onNull: 0 } },
          gis:  { $convert: { input: '$gis_area_ha_total', to: 'double', onError: 0, onNull: 0 } },
          arab: { $convert: { input: '$arable_area_size_total', to: 'double', onError: 0, onNull: 0 } },
          bergan: { $convert: { input: '$bergan_total', to: 'double', onError: 0, onNull: 0 } },
          olgan:  { $convert: { input: '$olgan_total', to: 'double', onError: 0, onNull: 0 } },
      }},
      { $project: {
          land: 1, gis: 1, arab: 1, bergan: 1, olgan: 1,
          diff: { $add: [{ $subtract: [{ $add: ['$gis', '$arab'] }, '$land'] }, { $multiply: ['$bergan', -1] }, '$olgan'] },
      }},
      { $group: {
          _id: null,
          total_land_area: { $sum: '$land' },
          gis_area_ha_total: { $sum: '$gis' },
          arable_area_size_total: { $sum: '$arab' },
          bergan_total: { $sum: '$bergan' },
          olgan_total: { $sum: '$olgan' },
          pos_diff: { $sum: { $cond: [{ $gte: ['$diff', 0] }, '$diff', 0] } },
          neg_diff: { $sum: { $cond: [{ $lt:  ['$diff', 0] }, '$diff', 0] } },
      }},
    ]).toArray(),
  ]);

  const t = totals[0] || { total_land_area: 0, gis_area_ha_total: 0, arable_area_size_total: 0, pos_diff: 0, neg_diff: 0 };

  res.json({
    total, page, limit,
    pages: Math.ceil(total / limit) || 1,
    totals: {
      total_land_area: t.total_land_area,
      gis_area_ha_total: t.gis_area_ha_total,
      arable_area_size_total: t.arable_area_size_total,
      bergan_total: t.bergan_total || 0,
      olgan_total: t.olgan_total || 0,
      pos_diff: t.pos_diff || 0,
      neg_diff: t.neg_diff || 0,
    },
    items,
  });
};

// Katta tashkilotlar report — barcha ma'lumotlar
exports.kattaTashkilotlarList = async (req, res) => {
  const items = await KattaTashkilotlarReport.find({})
    .select('tin defined_arable_area_size_list_sum defined_area_size_list_sum gis_area_ha_list2_sum gis_area_ha_list_sum six_total_land_area_sum')
    .lean();
  res.json({ total: items.length, items });
};
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

