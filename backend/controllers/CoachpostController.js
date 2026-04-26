const Coachpost = require('../models/Coachpost');
const Coach = require('../models/Coach');

// --- Create a new Coach Post --- //

exports.createCoachPost = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { fullname, description, experience, duration, fee, contactNumber } = req.body;
        
        // Validate required fields
        if (!fullname || !description || !experience || !duration || !fee || !contactNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate contact number - must be exactly 10 digits
        const cleanedNumber = contactNumber.toString().replace(/\D/g, '');
        if (cleanedNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must contain exactly 10 digits' });
        }
        
        // Check if the coach exists
        const coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        const existingCoachPost = await Coachpost.findOne({ coachId });
        if (existingCoachPost) {
            return res.status(400).json({ message: 'Coach post already exists for this coach' });
        };

        const newCoachPost = new Coachpost({ coachId, fullname, description, experience, duration, fee, contactNumber });
        await newCoachPost.save();

        res.status(201).json({ message: 'Coach post created successfully', coachPost: newCoachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- update description of a Coach Post --- //

exports.updateCoachPostDescription = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { description } = req.body;

        const coachPost = await Coachpost.findById(coachPostId);
        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        coachPost.description = description;
        await coachPost.save();

        res.status(200).json({ message: 'Coach post description updated successfully', coachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- update experience of a Coach Post --- //

exports.updateCoachPostExperience = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { experience } = req.body;

        const coachPost = await Coachpost.findById(coachPostId);
        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        coachPost.experience = experience;
        await coachPost.save();

        res.status(200).json({ message: 'Coach post experience updated successfully', coachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- update duration of a Coach Post --- //

exports.updateCoachPostDuration = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { duration } = req.body;

        const coachPost = await Coachpost.findById(coachPostId);
        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        coachPost.duration = duration;
        await coachPost.save();

        res.status(200).json({ message: 'Coach post duration updated successfully', coachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- update fee of a Coach Post --- //

exports.updateCoachPostFee = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { fee } = req.body;

        const coachPost = await Coachpost.findById(coachPostId);
        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        coachPost.fee = fee;
        await coachPost.save();

        res.status(200).json({ message: 'Coach post fee updated successfully', coachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- update contact number of a Coach Post --- //

exports.updateCoachPostContactNumber = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { contactNumber } = req.body;

        const coachPost = await Coachpost.findById(coachPostId);
        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        coachPost.contactNumber = contactNumber;
        await coachPost.save();

        res.status(200).json({ message: 'Coach post contact number updated successfully', coachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- delete a Coach Post --- //

exports.deleteCoachPost = async (req, res) => {
    try {
        const { coachPostId } = req.params;

        const coachPost = await Coachpost.findByIdAndDelete(coachPostId);
        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        res.status(200).json({ message: 'Coach post deleted successfully', coachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- get a Coach Post by ID --- //    

exports.getCoachPostById = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const coachPost = await Coachpost.findById(coachPostId);

        if (!coachPost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        res.status(200).json({ coachPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- get all Coach Posts --- //

exports.getAllCoachPosts = async (req, res) => {
    try {
        const coachPosts = await Coachpost.find().populate('coachId');
        
        res.status(200).json({ coachPosts });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};