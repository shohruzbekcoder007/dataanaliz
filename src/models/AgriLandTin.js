const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    cadastral_number:             { type: String, default: '' },
    land_fund_category:           { type: String, default: '' },
    land_fund_category_description: { type: String, default: '' },
    land_fund_type:               { type: String, default: '' },
    land_fund_type_description:   { type: String, default: '' },
    property_kind:                { type: String, default: '' },
    tenancy_type_code:            { type: String, default: '' },
  },
  { _id: false }
);

const agriLandTinSchema = new mongoose.Schema(
  {
    tin:      { type: String, default: '', unique: true, index: true },
    category: { type: [categorySchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'agri_land_tins',
  }
);

module.exports = mongoose.model('agri_land_tin', agriLandTinSchema, 'agri_land_tins');
