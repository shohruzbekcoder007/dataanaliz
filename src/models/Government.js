const mongoose = require('mongoose');

const governmentSchema = new mongoose.Schema(
    {
        soato4: { type: String, default: null, index: true },
        soato7: { type: String, default: null, index: true },
        tuman_nomi:   { type: String, default: null },
        xokimiyat_nomi: { type: String, default: null },
        inn: { type: String, default: null, index: true },
    },
    {
        timestamps: true,
        collection: 'governments',
    }
);


module.exports = mongoose.model('Government', governmentSchema);