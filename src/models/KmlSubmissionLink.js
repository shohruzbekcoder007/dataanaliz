const mongoose = require('mongoose');

const kmlSubmissionLinkSchema = new mongoose.Schema(
  {
    viloyat_soato:   { type: String, default: null },
    tuman_soato:     { type: String, default: null },
    mahalla_tin:     { type: String, default: null },
    submission_id:   { type: Number, default: null },
    kobo_time_number: { type: Number, default: null },
    order:           { type: Number, default: null },
  },
  {
    timestamps: true,
    collection: 'kml_submission_links',
  }
);

kmlSubmissionLinkSchema.index({ mahalla_tin: 1, order: 1, kobo_time_number: 1 }, { unique: true });
kmlSubmissionLinkSchema.index({ viloyat_soato: 1, tuman_soato: 1 });
kmlSubmissionLinkSchema.index({ submission_id: 1 });

module.exports = mongoose.model('kml_submission_link', kmlSubmissionLinkSchema, 'kml_submission_links');
