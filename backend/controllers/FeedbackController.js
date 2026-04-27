const Feedback = require('../models/Feedback');
const User = require('../models/User');
const mongoose = require('mongoose');

const memoryFeedbacks = [];

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

function sortFeedbacks(list) {
    return [...list].sort((a, b) => {
        if (b.rating !== a.rating) {
            return b.rating - a.rating;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
}

function buildMemoryItem({ userId, rating, comment }) {
    return {
        _id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
    };
}

// 1. CREATE: Add a new gym review
// @route   POST /api/feedback/add
exports.addGymFeedback = async (req, res) => {
    try {
        const { userId, rating, comment } = req.body;

        // Validation: Ensure stars are between 1 and 5
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5 stars." });
        }

        if (!userId || !comment) {
            return res.status(400).json({ message: 'userId and comment are required.' });
        }

        if (!isDbConnected()) {
            const memoryItem = buildMemoryItem({ userId, rating, comment });
            memoryFeedbacks.push(memoryItem);
            return res.status(201).json({
                message: 'Gym review submitted successfully! (memory mode)',
                data: memoryItem,
            });
        }

        const newFeedback = new Feedback({
            userId,
            rating,
            comment
        });

        await newFeedback.save();
        res.status(201).json({ 
            message: "Gym review submitted successfully!", 
            data: newFeedback 
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// 2. READ: Get all reviews (Sorted: Highest Rating First, then Newest)
// @route   GET /api/feedback/all
exports.getAllFeedback = async (req, res) => {
    try {
        if (!isDbConnected()) {
            return res.status(200).json(sortFeedbacks(memoryFeedbacks));
        }

        // -1 means Descending (5 stars first, then 4, etc.)
        const feedbacks = await Feedback.find().sort({ rating: -1, createdAt: -1 });
        
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
};

// 3. UPDATE: Edit a review (User can only edit their own)
// @route   PUT /api/feedback/update/:id
exports.updateFeedback = async (req, res) => {
    try {
        const { userId, rating, comment } = req.body;
        const feedbackId = req.params.id;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5 stars.' });
        }

        if (!isDbConnected()) {
            const index = memoryFeedbacks.findIndex(item => item._id === feedbackId);

            if (index === -1) {
                return res.status(404).json({ message: 'Review not found' });
            }

            if (memoryFeedbacks[index].userId !== userId) {
                return res.status(403).json({ message: 'You can only edit your own reviews' });
            }

            memoryFeedbacks[index] = {
                ...memoryFeedbacks[index],
                rating,
                comment,
            };

            return res.status(200).json({ message: 'Review updated! (memory mode)', data: memoryFeedbacks[index] });
        }

        const feedback = await Feedback.findById(feedbackId);

        if (!feedback) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Security Check: Is the person editing the original owner?
        if (feedback.userId !== userId) {
            return res.status(403).json({ message: "You can only edit your own reviews" });
        }

        const updatedFeedback = await Feedback.findByIdAndUpdate(
            feedbackId,
            { rating, comment },
            { new: true }
        );

        res.status(200).json({ message: "Review updated!", data: updatedFeedback });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. DELETE: Admin can delete any, User can only delete their own
// @route   DELETE /api/feedback/delete/:id
exports.deleteFeedback = async (req, res) => {
    try {
        const { userId } = req.body;
        const feedbackId = req.params.id;

        if (!isDbConnected()) {
            const index = memoryFeedbacks.findIndex(item => item._id === feedbackId);

            if (index === -1) {
                return res.status(404).json({ message: 'Review not found' });
            }

            if (memoryFeedbacks[index].userId === userId) {
                memoryFeedbacks.splice(index, 1);
                return res.status(200).json({ message: 'Review deleted successfully (memory mode)' });
            }

            return res.status(403).json({ message: 'Unauthorized to delete this review' });
        }

        const feedback = await Feedback.findById(feedbackId);

        if (!feedback) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check if user is the owner
        const isOwner = feedback.userId === userId;
        
        // Check if user is an admin
        let isAdmin = false;
        if (!isOwner) {
            const user = await User.findById(userId);
            isAdmin = user && user.role === 'admin';
        }

        // Permission Logic: Admin OR Owner
        if (isOwner || isAdmin) {
            await Feedback.findByIdAndDelete(feedbackId);
            return res.status(200).json({ message: "Review deleted successfully" });
        } else {
            return res.status(403).json({ message: "Unauthorized to delete this review" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. LIKE: User can like a review
// @route   POST /api/feedback/like/:id
exports.likeFeedback = async (req, res) => {
    try {
        const { userId } = req.body;
        const feedbackId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }

        if (!isDbConnected()) {
            const feedback = memoryFeedbacks.find(item => item._id === feedbackId);
            if (!feedback) {
                return res.status(404).json({ message: 'Review not found' });
            }

            if (!feedback.likes) feedback.likes = [];
            if (!feedback.dislikes) feedback.dislikes = [];

            // Remove from dislikes if present
            feedback.dislikes = feedback.dislikes.filter(id => id !== userId);

            // Add to likes if not already there
            if (!feedback.likes.includes(userId)) {
                feedback.likes.push(userId);
            }

            return res.status(200).json({ 
                message: 'Review liked (memory mode)', 
                data: feedback 
            });
        }

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Remove from dislikes if present
        feedback.dislikes = feedback.dislikes.filter(id => id !== userId);

        // Add to likes if not already there
        if (!feedback.likes.includes(userId)) {
            feedback.likes.push(userId);
        }

        await feedback.save();
        res.status(200).json({ 
            message: 'Review liked', 
            data: feedback 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. UNLIKE: User can unlike a review
// @route   POST /api/feedback/unlike/:id
exports.unlikeFeedback = async (req, res) => {
    try {
        const { userId } = req.body;
        const feedbackId = req.params.id;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }

        if (!isDbConnected()) {
            const feedback = memoryFeedbacks.find(item => item._id === feedbackId);
            if (!feedback) {
                return res.status(404).json({ message: 'Review not found' });
            }

            if (!feedback.likes) feedback.likes = [];
            if (!feedback.dislikes) feedback.dislikes = [];

            // Remove from likes if present
            feedback.likes = feedback.likes.filter(id => id !== userId);

            // Add to dislikes if not already there
            if (!feedback.dislikes.includes(userId)) {
                feedback.dislikes.push(userId);
            }

            return res.status(200).json({ 
                message: 'Review unliked (memory mode)', 
                data: feedback 
            });
        }

        const feedback = await Feedback.findById(feedbackId);
        if (!feedback) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Remove from likes if present
        feedback.likes = feedback.likes.filter(id => id !== userId);

        // Add to dislikes if not already there
        if (!feedback.dislikes.includes(userId)) {
            feedback.dislikes.push(userId);
        }

        await feedback.save();
        res.status(200).json({ 
            message: 'Review unliked', 
            data: feedback 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};