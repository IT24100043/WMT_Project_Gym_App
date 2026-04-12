const Gym = require('../models/Gym');
const GymInfo = require('../models/GymInfo')
const bcrypt = require('bcryptjs');


// --- Register a new gym --- // 

exports.registerGym = async (req, res) => {
    try {
        const { GymName, registrationNumber, OwnerName, OwnerNIC, Address, ownerContactNumber, gymType, email, password, logoUrl, role } = req.body;
        
        // Check if Gym Name is already registered
        let gymName = await Gym.findOne({ GymName });
        if (gymName) {
            return res.status(400).json({ message: 'Gym Name already registered' });
        };

        // Check if Registration Number is already registered
        let gymRegistrationNo = await Gym.findOne({ registrationNumber });
        if (gymRegistrationNo) {
            return res.status(400).json({ message: 'Registration Number already registered' });
        };

        // Check if Owner NIC is already registered
        let gymOwnerNIC = await Gym.findOne({ OwnerNIC });
        if (gymOwnerNIC) {
            return res.status(400).json({ message: 'Owner NIC already registered' });
        };

        // Check if Owner Contact Number is already registered
        let gymContactNo = await Gym.findOne({ ownerContactNumber });
        if (gymContactNo) {
            return res.status(400).json({ message: 'Owner Contact Number already registered' });
        };

        // Check if the email is already registered
        let gymEmail = await Gym.findOne({ email });
        if (gymEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        };

        // Password hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        gym = new Gym({ GymName, registrationNumber, OwnerName, OwnerNIC, Address, ownerContactNumber, gymType, email, password:hashedPassword, logoUrl, role });
        await gym.save();

        res.status(201).json({ message: 'Gym registered successfully', gym });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Login a Registered Gym --- //

exports.loginGym = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the email is registered 
        const gym = await Gym.findOne({ email });
        if (!gym) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        } 

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, gym.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Email or Password' });
        }

        res.status(200).json({
            message: 'Login successful', 
            gym: gym
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Get role of Gym --- //

exports.getGymRole = async (req, res) => {
    try {
        const { email } = req.body;

        // check by email and get the role of the gym
        const gym = await Gym.findOne({ email });
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ role: gym.role });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }   
};
    

// --- Update contact number of a Gym Owner --- //

exports.updateOwnerGymContactNumber = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { newContactNumber } = req.body;

        // chekc and update the contact number
        const updateGym = await Gym.findByIdAndUpdate(
            gymId, 
            { $set: { ownerContactNumber: newContactNumber } }, 
            { new: true }
        );

        if (!updateGym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ message: 'Gym contact number updated successfully', gym: updateGym });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update password of a Gym --- //

exports.updateGymPassword = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { oldPassword, newPassword } = req.body;

        // Check if gym in database
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found' });
        } 

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, gym.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);
        
        // Update the password in the database
        gym.password = hashedNewPassword;
        await gym.save();

        res.status(200).json({ message: 'Gym password updated successfully' });
    
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }   
};


// --- Delete a Gym --- //

exports.deleteGym = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { password } = req.body;

        // Check if gym in database
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found' });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, gym.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        // Delete the gym information associated with the gym <--
        const gymInfo = await GymInfo.findOne({ gymId: gymId });
        if (gymInfo) {
            await GymInfo.findByIdAndDelete(gymInfo._id);
        }

        // Delete the gym from the database
        await Gym.findByIdAndDelete(gymId);

        res.status(200).json({ message: 'Gym deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- get Gym Details --- //

exports.getGymDetails = async (req, res) => {
    try {
        const { gymId } = req.params;
        const gym = await Gym.findById(gymId).select('-password'); // Exclude password from the response

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ gym });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Gym Profile --- //

exports.updateGymProfile = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { GymName, OwnerName, Address, gymType, logoUrl } = req.body;

        // Check if gym exists
        const gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Check if new GymName is already taken by another gym
        if (GymName && GymName !== gym.GymName) {
            const existingGym = await Gym.findOne({ GymName });
            if (existingGym) {
                return res.status(400).json({ message: 'Gym Name already registered' });
            }
        }

        // Update only provided fields
        const updateData = {};
        if (GymName) updateData.GymName = GymName;
        if (OwnerName) updateData.OwnerName = OwnerName;
        if (Address) updateData.Address = Address;
        if (gymType) updateData.gymType = gymType;
        if (logoUrl) updateData.logoUrl = logoUrl;

        const updatedGym = await Gym.findByIdAndUpdate(
            gymId,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.status(200).json({ message: 'Gym profile updated successfully', gym: updatedGym });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};