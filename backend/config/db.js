require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("Success: MongoDB Connected! ✅"))
        .catch(err => console.error("Error: Could not connect to MongoDB", err));
};

module.exports = connectDB;