const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kml_land_category';
  await mongoose.connect(uri);
  console.log('MongoDB connected:', uri);
};

module.exports = connectDB;
