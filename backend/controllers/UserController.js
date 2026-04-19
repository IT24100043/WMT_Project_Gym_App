const User = require('../models/User');
const bcrypt = require('bcryptjs');


// --- Register a new user --- //

exports.registerUser = async (req, res) => {
    try {
        const { name, age, userNICcardNumber, userContactNumber, password, userEmail,  dpUrl, role } = req.body;
        
        // Check if User NIC is already registered
        let userNIC = await User.findOne({ userNICcardNumber });
        if (userNIC) {
            return res.status(400).json({ message: 'User NIC already registered' });
        };

        // Check if User Contact Number is already registered
        let userContactNo = await User.findOne({ userContactNumber });
        if (userContactNo) {
            return res.status(400).json({ message: 'User Contact Number already registered' });
        }

        // Check if the email is already registered
        let useremail = await User.findOne({ userEmail });
        if (useremail) {
            return res.status(400).json({ message: 'Email already registered' });
        };

        // Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({ name, age, userNICcardNumber, userContactNumber, password: hashedPassword, userEmail, dpUrl, role });
        await newUser.save();
        
        res.status(201).json({ message: 'User registered successfully', newUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }   
};


// --- Login a Registered User --- //

exports.loginUser = async (req, res) => {
    try {
        const { userEmail, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ userEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get User Role --- //

exports.getUserRole = async (req, res) => {
    try {
        const { userEmail } = req.body;

        // Find the user by email
        const user = await User.findOne({ userEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ role: user.role });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Contact Number of a User --- //

exports.updateContactNumber = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newContactNumber } = req.body;

        // Check and update the contact number
        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: { userContactNumber: newContactNumber } }, 
            { new: true });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', user });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update password of a User --- //

exports.updatePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { oldPassword, newPassword } = req.body;

        // Check if user in database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete a User --- //

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;

        // Check if user in database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if the provided password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get User Details --- //

exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Execute Streak Evaluation Lazily
        const { evaluateUserStreak } = require('../utils/streakEvaluator');
        await evaluateUserStreak(userId);

        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update User Profile (dpUrl) --- //

exports.updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { dpUrl } = req.body;

        // Update the user's profile picture
        const user = await User.findByIdAndUpdate(
            userId, 
            { $set: { dpUrl: dpUrl } }, 
            { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Profile picture updated successfully', user });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
