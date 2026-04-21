const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mongoose 7+ removed useNewUrlParser & useUnifiedTopology options
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
