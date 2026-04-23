const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db.js');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

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

// Health Check Endpoint (for test/demo verification)
const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: DB_STATES[mongoose.connection.readyState] || 'unknown',
    });
});

// Gym Routes
app.use('/api/gyms', require('./routes/GymRoutes'));

// Gym Information Routes
app.use('/api/gyminfo', require('./routes/GymInfoRoutes'));

// User Routes
app.use('/api/users', require('./routes/UserRoutes'));

// Coach Routes
app.use('/api/coaches', require('./routes/CoachRoutes'));

// Admin Routes
app.use('/api/admins', require('./routes/AdminRoutes'));

// Workout Routes
app.use('/api/workouts', require('./routes/WorkoutRoutes'));

// Session Logging Routes
app.use('/api/sessions', require('./routes/SessionRoutes'));

// AI Recommendation Routes
app.use('/api/ai', require('./routes/AiRoutes'));

// Progress Aggregation Routes
app.use('/api/progress', require('./routes/ProgressRoutes'));

// Smart Coaching Engine Routes
app.use('/api/coaching', require('./routes/CoachingRoutes'));

app.use('/api/intake', require('./routes/intakeRoutes'));
//feedback routes
app.use('/api/feedback', require('./routes/FeedbackRoutes'));

// Error Handling Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));