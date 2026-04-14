import mongoose from 'mongoose';

const agriLandFullSchema = new mongoose.Schema({
    id:                           { type: Number, required: true, unique: true },
    old_id:                       { type: Number, default: null },
    cadastral_number:             { type: String, default: null, index: true },
    cadastral_number_old:         { type: String, default: null },
    sp_unit_type:                 { type: String, default: null },
    ba_unit_type:                 { type: String, default: null },
    property_kind:                { type: String, default: null },
    viloyat_code:                 { type: String, default: null, index: true },
    tuman_code:                   { type: String, default: null, index: true },
    land_fund_category:           { type: String, default: null },
    land_fund_category_description: { type: String, default: null },
    land_fund_type:               { type: String, default: null },
    land_fund_type_description:   { type: String, default: null },
    viloyat_name:                 { type: String, default: null },
    mahalla_name:                 { type: String, default: null },
    tuman_name:                   { type: String, default: null },
    is_active:                    { type: Boolean, default: true },
    geom:                         { type: String, default: null },
    geom_g:                       { type: Object, default: null },
    geom_g_s:                     { type: [Object], default: null },
    geom_g_s_number:              { type: Number, default: null },
    gis_area_ha:                  { type: String, default: null },
    tin:                          { type: String, default: null },
    tenancy_type_code:            { type: String, default: null },
    owner_full_name:              { type: String, default: null },
    compare_cadastral_and_report_shape: { type: String, default: null, index: true, enum: ['+1', '-1', '0', null] },
    compare_cadastral_and_report_shape_diff: { type: Number, default: null },
    compare_submission:           { type: String, default: null, index: true, enum: ['+1', '-1', '0', null] },
    compare_submission_diff:      { type: Number, default: null },
    removed_by_qx:                { type: Boolean, default: null, index: true },
    tin_total_gis_area_ha:       { type: Number, default: 0 },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

agriLandFullSchema.index({ geom_g: '2dsphere' });

const AgriLandFull = mongoose.model(
    'agri_land_full',
    agriLandFullSchema,
    'agri_land_full'
);

export default AgriLandFull;


