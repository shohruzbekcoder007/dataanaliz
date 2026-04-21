const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/agriLandTinController');

// Umumiy statistika
router.get('/stats',            ctrl.getStats);

// land_fund_category bo'yicha taqsimot
router.get('/by-category',      ctrl.byCategory);

// land_fund_type bo'yicha taqsimot
router.get('/by-type',          ctrl.byType);

// property_kind bo'yicha taqsimot
router.get('/by-property-kind', ctrl.byPropertyKind);

// tenancy_type_code bo'yicha taqsimot
router.get('/by-tenancy',       ctrl.byTenancy);

// category soni bo'yicha taqsimot (nechtada 1 ta, 2 ta, 3 ta...)
router.get('/by-category-count', ctrl.byCategoryCount);

// TIN ro'yxati — yacheyka uchun
router.get('/tin-list',                  ctrl.tinList);

// Cross matrix
router.get('/cross-matrix',              ctrl.crossMatrix);
router.get('/cross-matrix-type',         ctrl.crossMatrixType);
router.get('/cross-matrix/export',       ctrl.exportCrossMatrix);
router.get('/cross-matrix-type/export',  ctrl.exportCrossMatrixType);

// property_kind va tenancy — category filter bilan
router.get('/by-property-kind-cat', ctrl.byPropertyKindCat);
router.get('/by-tenancy-cat',       ctrl.byTenancyCat);

// Geo — viloyat va tuman ro'yxatlari
router.get('/geo/viloyats',         ctrl.getViloyats);
router.get('/geo/tumans',           ctrl.getTumans);

// 6-shakl ro'yxati pagination bilan
router.get('/six-shapes',           ctrl.sixShapesList);

// Hokimyat agri land mat — barcha ma'lumotlar (pagination yo'q)
router.get('/hokimyat-mat',         ctrl.hokimyatMatList);

// Katta tashkilotlar report — barcha ma'lumotlar (pagination yo'q)
router.get('/katta-tashkilotlar',   ctrl.kattaTashkilotlarList);

// Tin-Soato pairs — barcha ma'lumotlar (pagination yo'q)
router.get('/tin-soato-pairs',      ctrl.tinSoatoPairsList);

// Qidiruv — tin bo'yicha
router.get('/tin/:tin',             ctrl.getByTin);

module.exports = router;
