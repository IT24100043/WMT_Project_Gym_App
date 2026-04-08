const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Gym Routes
app.use('/api/gyms', require('./routes/GymRoutes'));

// Gym Information Routes
app.use('/api/gyminfo', require('./routes/GymInfoRoutes'));

// User Routes
app.use('/api/users', require('./routes/UserRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));