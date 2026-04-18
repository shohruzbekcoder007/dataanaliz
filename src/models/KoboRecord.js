const mongoose = require('mongoose');

const koboRecordSchema = new mongoose.Schema(
  {
    order:                   { type: Number, default: null },
    mahalla_tin:             { type: String, default: null },
    mahalla_name:            { type: String, default: null },   // kobo_2 field
    mahalla_uz:              { type: String, default: null },   // kobo_1 field
    viloyat_code:            { type: Number, default: null },   // kobo_4 field
    tuman_code:              { type: Number, default: null },   // kobo_4 field
    tuman_name:              { type: String, default: null },   // kobo_4 field
    area_ha:                 { type: Number, default: null },
    crop_year:               { type: String, default: null },
    crop_type:               { type: String, default: null },
    center_y:                { type: Number, default: null },
    center_x:                { type: Number, default: null },
    land_fund_category_code: { type: String, default: null },
    land_fund_category:      { type: String, default: null },
    kobo_time_number:        { type: Number, default: null },
    source_file:             { type: String, default: null },
  },
  {
    timestamps: true,
    collection: 'kobo_records',
  }
);

// Compound index — mahalla_tin + kobo_time_number birgalikda
koboRecordSchema.index({ mahalla_tin: 1, kobo_time_number: 1 });

// Alohida indexlar — tez qidirish uchun
koboRecordSchema.index({ mahalla_tin: 1 });
koboRecordSchema.index({ land_fund_category_code: 1 });
koboRecordSchema.index({ crop_year: 1 });

module.exports = mongoose.model('KoboRecord', koboRecordSchema, 'kobo_records');
