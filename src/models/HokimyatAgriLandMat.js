const mongoose = require("mongoose");

const sixShapeInfoSchema = new mongoose.Schema(
  {
    total_land_area: { type: Number, default: 0 },
  },
  { _id: false, strict: false }
);

const areaSchema = new mongoose.Schema(
  {
    gis_area_ha: { type: String, default: null },
    land_fund_type: { type: String, default: null },
  },
  { _id: false, strict: false }
);

const hokimyatAgriLandMatSchema = new mongoose.Schema(
  {
    soato7: { type: String, index: true },
    soato4: { type: String, index: true },
    tuman_nomi: { type: String, default: null },
    xokimiyat_nomi: { type: String, default: null },
    inn: { type: String, index: true },
    six_shape_info: { type: [sixShapeInfoSchema], default: [] },
    areas: { type: [areaSchema], default: [] },
    defined_arable_area_size: { type: Number, default: 0 },
    total_gis_area_ha: { type: Number, default: 0 },
    total_land_area: { type: Number, default: 0 },
    reserve_land_clean_remainder_area: { type: Number, default: 0 },
  },
  {
    collection: "hokimyat_agri_land_mat",
    timestamps: false,
  }
);

module.exports = mongoose.model("hokimyat_agri_land_mat", hokimyatAgriLandMatSchema);
