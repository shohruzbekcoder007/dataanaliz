const mongoose = require('mongoose');

const kmlEkinFieldSchema = new mongoose.Schema(
  {
    feature_id:    { type: String, default: null },
    order:         { type: Number, default: null },
    viloyat:       { type: String, default: null },
    tuman:         { type: String, default: null },
    mahalla_tin:   { type: String, default: null },
    mahalla_uz:    { type: String, default: null },
    viloyat_soato: { type: String, default: null },
    tuman_soato:   { type: String, default: null },
    area_ha:       { type: Number, default: null },
    area_m2:       { type: Number, default: null },
    crop_year:     { type: Number, default: null },
    crop_type:     { type: String, default: null },
    center_y:      { type: Number, default: null },
    center_x:      { type: Number, default: null },
    land_fund_category_code: { type: String, default: null },
    kobo_time_number:        { type: Number, default: null },
    _source_file:            { type: String, default: null },
    _source_folder:          { type: String, default: null },
    geom: {
      type:        { type: String, default: 'Polygon' },
      coordinates: { type: [[[Number]]], default: undefined },
    },
  },
  {
    timestamps: true,
    collection: 'kml_ekin_fields',
  }
);

kmlEkinFieldSchema.index({ geom: '2dsphere' });
kmlEkinFieldSchema.index({ feature_id: 1 });
kmlEkinFieldSchema.index({ mahalla_tin: 1 });
kmlEkinFieldSchema.index({ viloyat_soato: 1, tuman_soato: 1 });
kmlEkinFieldSchema.index({ crop_year: 1, crop_type: 1 });

module.exports = mongoose.model('kml_ekin_field', kmlEkinFieldSchema, 'kml_ekin_fields');
