const mongoose = require('mongoose');

const fiveShapesSchema = new mongoose.Schema(
  {
    soato4:       { type: String, default: null, index: true },
    soato7:       { type: String, default: null, index: true },
    tumanlar_nomi: { type: String, default: null },
    mfy_inn:      { type: String, default: null, index: true },
    tota_area:    { type: Number, default: null },
    crop_area:    { type: Number, default: null },
  },
  {
    timestamps: true,
    collection: 'five_shapes',
  }
);

module.exports = mongoose.model('five_shapes', fiveShapesSchema, 'five_shapes');
