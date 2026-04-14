const mongoose = require('mongoose');

const kmlEkinFieldTwoSchema = new mongoose.Schema(
  {
    feature_id:    { type: String, default: null },
    order:         { type: Number, default: null },
    tuman_name:    { type: String, default: null },
    mahalla_name:  { type: String, default: null },
    mahalla_tin:   { type: String, default: null },
    viloyat_soato: { type: String, default: null },
    tuman_soato:   { type: String, default: null },
    area_ha:       { type: Number, default: null },
    area_m2:       { type: Number, default: null },
    center_y:                { type: Number, default: null },
    center_x:                { type: Number, default: null },
    land_fund_category_code: { type: String, default: null },
    kobo_time_number:        { type: Number, default: null },
    geom: {
      type:        { type: String, default: 'Polygon' },
      coordinates: { type: [[[Number]]], default: undefined },
    },
  },
  {
    timestamps: true,
    collection: 'kml_ekin_field_twos',
  }
);

kmlEkinFieldTwoSchema.index({ geom: '2dsphere' });
kmlEkinFieldTwoSchema.index({ feature_id: 1 });
kmlEkinFieldTwoSchema.index({ mahalla_tin: 1 });
kmlEkinFieldTwoSchema.index({ viloyat_soato: 1, tuman_soato: 1 });

module.exports = mongoose.model('kml_ekin_field_two', kmlEkinFieldTwoSchema, 'kml_ekin_field_twos');
