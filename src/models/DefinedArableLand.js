const mongoose = require("mongoose");

const definedArableLandSchema = new mongoose.Schema(
  {
    geometry: { type: String, required: true },
    mahalla_tin: { type: String, required: true },
    viloyat_soato: { type: String, required: true },
    tuman_soato: { type: String, required: true },
    modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    created_at: { type: Date, default: Date.now },
    description: {
        type: String,
        default: null,
        validate: {
            validator: function (v) {
                if (this.ground_source === 8) return v != null && v.trim() !== '';
                return true;
            },
            message: 'ground_source 8 bo\'lsa description majburiy',
        },
    },
    field_category: { type: Number, required: true, enum: [1, 2, 3] },
    ground_source: { type: Number, required: true, enum: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    area_size: {
        type: Number,
        required: true
    },
    fell_on_top_of_each_other: {
        type: Boolean,
        default: false
    },
    land_full_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agri_land_full',
        default: null,
        validate: {
            validator: function (v) {
                if (this.fell_on_top_of_each_other) return v != null;
                return true;
            },
            message: 'fell_on_top_of_each_other true bo\'lsa land_full_id majburiy',
        },
    },
    legal_entity: {
        type: Boolean,
        required: true,
        description: 'true = yuridik shaxs (TIN), false = jismoniy shaxs (JSHSHR)'
    },
    tin_or_jshshr: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          if (!v) return false;
          return this.legal_entity ? v.length === 9 : v.length === 14;
        },
        message: 'legal_entity true bo\'lsa tin_or_jshshr 9 xonali, false bo\'lsa 14 xonali bo\'lishi kerak',
      },
    },
    tenant: {
      type: String,
      default: null,
      validate: {
        validator: function (v) {
          if (this.ground_source === 4) {
            if (v == null || v.trim() === '') return false;
            return v.length === 9 || v.length === 14;
          }
          if (v != null && v !== '') return v.length === 9 || v.length === 14;
          return true;
        },
        message: 'ground_source 4 bo\'lsa tenant majburiy va 9 yoki 14 xonali bo\'lishi kerak',
      },
    },
    updated_at: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

definedArableLandSchema.pre("findOneAndUpdate", function () {
  this.set({ updated_at: new Date() });
});

definedArableLandSchema.index({ mahalla_tin: 1 });
definedArableLandSchema.index({ viloyat_soato: 1 });
definedArableLandSchema.index({ tuman_soato: 1 });
definedArableLandSchema.index({ created_at: 1 });
definedArableLandSchema.index({ updated_at: 1 });


const DefinedArableLand = mongoose.model("defined_arable_land", definedArableLandSchema);

module.exports = DefinedArableLand;

// field_category
// 1. bir yillik ekinlar
// 2. ko'p yillik ekinlar
// 3. issiqxona ekinlari

// ground_source
// 1. ijaraga olingan yaylov yerlari
// 2. ijaraga olingan o'rmon va suv yerlari
// 3. hokimlik zaxirasidan ijaraga olingan yerlari
// 4. boshqa tashkilotlardan ikkilamchi ijaraga olingan yerlari
// 5. daryo va kanal sohillari, yo'l bo'ylari, elektir va gaz liniyalari himoya zonalaridan foydalaniladigan yerlari
// 6. ijtimoiy soha obyektlaridagi ekin yerlari
// 7. rasmiylashtirilmagan holda foydalanilayotgan yerlar (zaxvat)
// 8. yangi o'zlashttirilgan yerlar
// 9. boshqa yerlar (yuqoridagilardan tashqari)
