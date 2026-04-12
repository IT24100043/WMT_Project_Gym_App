const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db.js');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure uploads directory exists for future AI image uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
connectDB();

// Gym Routes
app.use('/api/gyms', require('./routes/GymRoutes'));

// Gym Information Routes
app.use('/api/gyminfo', require('./routes/GymInfoRoutes'));

// User Routes
app.use('/api/users', require('./routes/UserRoutes'));

// Workout Routes
app.use('/api/workouts', require('./routes/WorkoutRoutes'));

// AI Recommendation Routes
app.use('/api/ai', require('./routes/AiRoutes'));

// Error Handling Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));