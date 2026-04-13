const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { generatePlan, generateRoutine } = require('../controllers/AiController');

// Define storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ai-image-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error("Only images (jpeg, jpg, png) are allowed!"));
    }
};

// Initialize multer upload middleware
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// AI Routes
// POST /api/ai/generate-plan
// Wrapped route to catch multer file type errors gracefully
router.post('/generate-plan', (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            res.status(400); // Bad Request
            return next(err); // Hands the error straight to our centralized error middleware
        }
        next(); // Proceed to controller
    });
}, generatePlan);

// Phase 6 GPT-5.1 Routine Engine Map
router.post('/generate-routine', generateRoutine);

module.exports = router;
