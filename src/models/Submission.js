const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
        submissionId: {
            type: Number,
            index: true,
        },
        legalStatus: {
            type: String, // 1. 2026 йилнинг 15 январ ҳолатига ҳуқуқий мақоми
            required: true,
        },
        soato: {
            type: Number,
            required: true,
        },

        soatoDistrict: {
            type: Number,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [lng, lat]
            },
        },
        region: {
            type: String, // Вилоят
        },
        district: {
            type: String, // Туман
        },
        mahalla: {
            type: String, // МФЙ номи
        },
        fioName: {
            type: String,
        },
        stir: {
            type: String,
            index: true,
        },
        mfyStir: {
            type: String,
            index: true,
        },
        land: {
            totalArea: { type: Number, default: 0 },       // 211
            agricultureUsed: { type: Number, default: 0 }, // 213
            arable: { type: Number, default: 0 },
            annualCrops: { type: Number, default: 0 },
            greenhouse: { type: Number, default: 0 },
            fallow: { type: Number, default: 0 },
            perennialCrops: { type: Number, default: 0 },
            naturalPasture: { type: Number, default: 0 },
            farmPurpose: { type: Number, default: 0 },
            forest: { type: Number, default: 0 },
            aquaculture: { type: Number, default: 0 },
            other: { type: Number, default: 0 },
        },
        contourCount: {
            type: Number,
            default: 0,
        },
        koboCount: {
            type: String,
        },
        land_fund_category_code: {
            type: String,
            default: null,
        },
        livestock: {
            cattleTotal: { type: Number, default: 0 }, // 900
            cows: { type: Number, default: 0 }, // 905
            sheep: { type: Number, default: 0 }, // 907
            goats: { type: Number, default: 0 }, // 912
            horses: { type: Number, default: 0 }, // 916
            camels: { type: Number, default: 0 }, // 920
            pigs: { type: Number, default: 0 }, // 921
            furAnimals: { type: Number, default: 0 }, // 923
            rabbits: { type: Number, default: 0 }, // 924
            poultry: { type: Number, default: 0 }, // 927
        },
        submissionTime: {
            type: Date,
            required: true,
        },
        kobo_time_number: {
            type: Number,
            default: 1,
        }
    },
    {
        timestamps: true,
    }
);

submissionSchema.index({ location: '2dsphere' });
submissionSchema.index({ submission_id: 1 });
submissionSchema.index({ stir: 1 });
submissionSchema.index({ mfy_stir: 1 });
submissionSchema.index({ soato: 1 });

module.exports = mongoose.model('submission', submissionSchema, 'submissions');
