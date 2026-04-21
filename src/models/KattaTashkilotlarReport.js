const mongoose = require("mongoose");

const kattaTashkilotlarReportSchema = new mongoose.Schema(
  {
    tin: { type: String, index: true },
    defined_arable_area_size_list_sum: { type: Number, default: 0 },
    defined_area_size_list_sum: { type: Number, default: 0 },
    gis_area_ha_list2_sum: { type: Number, default: 0 },
    gis_area_ha_list_sum: { type: Number, default: 0 },
    six_total_land_area_sum: { type: Number, default: 0 },
  },
  {
    collection: "katta_tashkilotlar_report",
    timestamps: false,
  }
);

module.exports = mongoose.model("katta_tashkilotlar_report", kattaTashkilotlarReportSchema);
