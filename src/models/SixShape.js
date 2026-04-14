import mongoose from "mongoose";

const sixShapeSchema = new mongoose.Schema({
    organization_inn: {
        type: Number,
        default: null
    },
    okpo: {
        type: Number,
        default: null,
    },
    organization_name: {
        type: String,
        default: "",
    },
    old_soato: {
        type: String,
        default: null
    },
    soato: {
        type: Number,
        default: null
    },
    total_land_area: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        enum: [0,1,2,3,4,5]
    },
    section: {
        type: Number,
        default: null
    },
    agricultural_land_total: {
        type: Number,
        default: 0
    },
    arable_land: {
        type: Number,
        default: 0
    },
    greenhouse_land_area: {
        type: Number,
        default: null
    },
    mahalla_inn: {
        type: Number,
        default: null
    },
    land_fund_category: {
        type: String,
        default: null
    },
    land_fund_category_description: {
        type: String,
        default: null
    },
    land_fund_type: {
        type: String,
        default: null
    },
    land_fund_type_description: {
        type: String,
        default: null
    },
    status_name: {
        type: String,
        default: ""
    },
    sown_area: {
        type: Number,
        default: 0,
    }
});

sixShapeSchema.index({ soato: 1 });
sixShapeSchema.index({ mahalla_inn: 1 });
sixShapeSchema.index({ status: 1 });
sixShapeSchema.index({ organization_inn: 1 });

// =ЕСЛИ(F3="Қабул қилинган";1;
// ЕСЛИ(F3="Қайтарилган";2;
// ЕСЛИ(F3="Юборилган";3;
// ЕСЛИ(F3="Қоралама";0;
// ЕСЛИ(F3="Кўриб чиқиш жараёнида";4;))))
//

const SixShape = mongoose.model('six_shape', sixShapeSchema)

export default SixShape;

// Қабул қилинган -> 1 
// Қайтарилган -> 2
// Юборилган -> 3
// Қоралама -> 0
// Кўриб чиқиш жараёнида -> 4


