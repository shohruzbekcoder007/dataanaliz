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

// Cross matrix
router.get('/cross-matrix',         ctrl.crossMatrix);

// property_kind va tenancy — category filter bilan
router.get('/by-property-kind-cat', ctrl.byPropertyKindCat);
router.get('/by-tenancy-cat',       ctrl.byTenancyCat);

// Qidiruv — tin bo'yicha
router.get('/tin/:tin',             ctrl.getByTin);

module.exports = router;
