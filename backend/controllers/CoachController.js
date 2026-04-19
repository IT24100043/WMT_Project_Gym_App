const Coach = require('../models/Coach');
const bcrypt = require('bcryptjs');

// --- Register a new user --- //

exports.registerCoach = async (req, res) => {
    try {
        const { coachName, coachAge, coachNICcardNumber, coachId, coachContactNumber, coachEmail, password, dpUrl, role } = req.body;
        
        // Check if Coach NIC is already registered
        let coachNIC = await Coach.findOne({ coachNICcardNumber });
        if (coachNIC) {
            return res.status(400).json({ message: 'Coach NIC already registered' });
        };

        // Check if Coach Contact Number is already registered
        let coachContactNo = await Coach.findOne({ coachContactNumber });
        if (coachContactNo) {
            return res.status(400).json({ message: 'Coach Contact Number already registered' });
        }

        // Check if the email is already registered
        let coachemail = await Coach.findOne({ coachEmail });
        if (coachemail) {
            return res.status(400).json({ message: 'Email already registered' });
        };

        // Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new coach
        const newCoach = new Coach({ coachName, coachAge, coachNICcardNumber, coachId, coachContactNumber, coachEmail, password: hashedPassword, dpUrl, role });
        await newCoach.save();
        
        res.status(201).json({ message: 'Coach registered successfully', newCoach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }   
};


// --- Login a Registered Coach --- //

exports.loginCoach = async (req, res) => {
    try {
        const { coachEmail, password } = req.body;

        // Find the coach by email
        const coach = await Coach.findOne({ coachEmail });
        if (!coach) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, coach.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get Coach Role --- //

exports.getCoachRole = async (req, res) => {
    try {
        const { coachEmail } = req.body;

        // Find the coach by email
        const coach = await Coach.findOne({ coachEmail });
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ role: coach.role });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Contact Number of a Coach --- //

exports.updateContactNumber = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { newContactNumber } = req.body;

        // Check and update the contact number
        const coach = await Coach.findByIdAndUpdate(
            coachId, 
            { $set: { coachContactNumber: newContactNumber } }, 
            { new: true });

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', coach });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update password of a Coach --- //

exports.updatePassword = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { oldPassword, newPassword } = req.body;

        // Check if coach in database
        const coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(400).json({ message: 'Coach not found' });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, coach.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update the coach's password
        coach.password = hashedNewPassword;
        await coach.save();

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete a Coach --- //

exports.deleteCoach = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { password } = req.body;

        // Check if coach in database
        const coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(400).json({ message: 'Coach not found' });
        }

        // Check if the provided password is correct
        const isMatch = await bcrypt.compare(password, coach.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        // Delete the coach
        await Coach.findByIdAndDelete(coachId);
        res.status(200).json({ message: 'Coach deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get Coach Details --- //

exports.getCoachDetails = async (req, res) => {
    try {
        const { coachId } = req.params;
        const coach = await Coach.findById(coachId).select('-password'); // Exclude password from the response

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ coach });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Coach Profile (dpUrl) --- //

exports.updateProfile = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { dpUrl } = req.body;

        // Update the coach's profile picture
        const coach = await Coach.findByIdAndUpdate(
            coachId, 
            { $set: { dpUrl: dpUrl } }, 
            { new: true }).select('-password');

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ message: 'Profile picture updated successfully', coach });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};