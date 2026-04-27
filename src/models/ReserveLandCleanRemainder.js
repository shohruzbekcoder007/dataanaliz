const mongoose = require("mongoose");

const reserveLandCleanRemainderSchema = new mongoose.Schema(
  {
    parcel_id: { type: Number, index: true },
    old_id: { type: String },
    cadastral_number: { type: String, index: true },
    viloyat_code: { type: String, index: true },
    tuman_code: { type: String, index: true },
    viloyat_name: { type: String },
    tuman_name: { type: String },
    mahalla_name: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    sp_unit_type: { type: String },
    ba_unit_type: { type: String },
    property_kind: { type: String },
    original_gis_area_ha: { type: Number, default: 0 },
    clean_geom: { type: String },
    clean_geom_g: {
      type: { type: String, enum: ['Point', 'Polygon', 'MultiPolygon', 'LineString'] },
      coordinates: { type: mongoose.Schema.Types.Mixed },
    },
    clean_area_ha: { type: Number, default: 0 },
    auctioned_area_ha: { type: Number, default: 0 },
    auctioned_percentage: { type: Number, default: 0 },
    calculated_at: { type: Date },
  },
  {
    collection: "reserve_land_clean_remainder",
    timestamps: false,
  }
);

reserveLandCleanRemainderSchema.index({ clean_geom_g: '2dsphere' });

module.exports = mongoose.model("reserve_land_clean_remainder", reserveLandCleanRemainderSchema);
