const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const User = require('../models/User');
const GymInfo = require('../models/GymInfo');
const bcrypt = require('bcryptjs');

// --- Register a new user --- //

exports.registerAdmin = async (req, res) => {
    try {
        const { adminName, adminAge, adminNICcardNumber, adminContactNumber, adminEmail, password, dpUrl, role } = req.body;
        
        // Check if Admin NIC is already registered
        let adminNIC = await Admin.findOne({ adminNICcardNumber });
        if (adminNIC) {
            return res.status(400).json({ message: 'Admin NIC already registered' });
        };

        // Check if Admin Contact Number is already registered
        let adminContactNo = await Admin.findOne({ adminContactNumber });
        if (adminContactNo) {
            return res.status(400).json({ message: 'Admin Contact Number already registered' });
        }

        // Check if the email is already registered
        let adminemail = await Admin.findOne({ adminEmail });
        if (adminemail) {
            return res.status(400).json({ message: 'Email already registered' });
        };

        // Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new admin
        const newAdmin = new Admin({ adminName, adminAge, adminNICcardNumber, adminContactNumber, adminEmail, password: hashedPassword, dpUrl, role });
        await newAdmin.save();
        
        res.status(201).json({ message: 'Admin registered successfully', newAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }   
};


// --- Login a Registered Admin --- //

exports.loginAdmin = async (req, res) => {
    try {
        const { adminEmail, password } = req.body;

        // Find the admin by email
        const admin = await Admin.findOne({ adminEmail });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get Admin Role --- //

exports.getAdminRole = async (req, res) => {
    try {
        const { adminEmail } = req.body;

        // Find the admin by email
        const admin = await Admin.findOne({ adminEmail });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ role: admin.role });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Contact Number of a Admin --- //

exports.updateContactNumber = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { newContactNumber } = req.body;

        // Check and update the contact number
        const admin = await Admin.findByIdAndUpdate(
            adminId, 
            { $set: { adminContactNumber: newContactNumber } }, 
            { new: true });

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', admin });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update password of a Admin --- //

exports.updatePassword = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { oldPassword, newPassword } = req.body;

        // Check if admin in database
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(400).json({ message: 'Admin not found' });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update the admin's password
        admin.password = hashedNewPassword;
        await admin.save();

        res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete a Admin --- //

exports.deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { password } = req.body;

        // Check if admin in database
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(400).json({ message: 'Admin not found' });
        }

        // Check if the provided password is correct
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        // Delete the admin
        await Admin.findByIdAndDelete(adminId);
        res.status(200).json({ message: 'Admin deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get Admin Details --- //

exports.getAdminDetails = async (req, res) => {
    try {
        const { adminId } = req.params;
        const admin = await Admin.findById(adminId).select('-password'); // Exclude password from the response

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ admin });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Admin Profile (dpUrl) --- //

exports.updateProfile = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { dpUrl } = req.body;

        // Update the admin's profile picture
        const admin = await Admin.findByIdAndUpdate(
            adminId, 
            { $set: { dpUrl: dpUrl } }, 
            { new: true }).select('-password');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ message: 'Profile picture updated successfully', admin });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get all users Details --- //

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords from the response
        
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        
        res.status(200).json({ users });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete user by ID --- //

exports.delete_User = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user in database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get all Gym Details --- //

exports.getAllGyms = async (req, res) => {
    try {
        const gyms = await Gym.find().select('-password'); // Exclude passwords from the response
        
        if (!gyms || gyms.length === 0) {
            return res.status(404).json({ message: 'No gyms found' });
        }

        res.status(200).json({ gyms });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete Gym by ID --- //

exports.delete_Gym = async (req, res) => {
    try {
        const { gymId } = req.params;

        // Check if gym in database
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found' });
        }

        // Delete the gym information associated with the gym <--
        const gymInfo = await GymInfo.findOne({ gymId: gymId });
        if (gymInfo) {
            await GymInfo.findByIdAndDelete(gymInfo._id);
        }

        // Delete the gym
        await Gym.findByIdAndDelete(gymId);

        res.status(200).json({ message: 'Gym deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get all Coach Details --- //

exports.getAllCoaches = async (req, res) => {
    try {
        const coaches = await Coach.find().select('-password'); // Exclude passwords from the response 
        if (!coaches || coaches.length === 0) {
            return res.status(404).json({ message: 'No coaches found' });
        }

        res.status(200).json({ coaches });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete Coach by ID --- //

exports.delete_Coach = async (req, res) => {
    try {
        const { coachId } = req.params;

        // Check if coach in database
        const coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(400).json({ message: 'Coach not found' });
        }

        // Delete the coach
        await Coach.findByIdAndDelete(coachId);

        res.status(200).json({ message: 'Coach deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get all Admin Details --- //

exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-password'); // Exclude passwords from the response 
        if (!admins || admins.length === 0) {
            return res.status(404).json({ message: 'No admins found' });
        }

        res.status(200).json({ admins });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete Admin by ID --- //

exports.delete_Admin = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Check if admin in database
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(400).json({ message: 'Admin not found' });
        }

        // Delete the admin
        await Admin.findByIdAndDelete(adminId);

        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};