const mongoose = require("mongoose");

const tinSoatoPairsSchema = new mongoose.Schema(
  {
    tin: { type: String, index: true },
    soato: { type: String, index: true },
    total_land_area: { type: Number, default: 0 },
    gis_area_ha_total: { type: Number, default: 0 },
    arable_area_size_total: { type: Number, default: 0 },
    bergan_total: { type: Number, default: 0 },
    olgan_total: { type: Number, default: 0 },
  },
  {
    collection: "tin_soato_pairs",
    timestamps: false,
  }
);

tinSoatoPairsSchema.index({ tin: 1, soato: 1 });

module.exports = mongoose.model("tin_soato_pairs", tinSoatoPairsSchema);
