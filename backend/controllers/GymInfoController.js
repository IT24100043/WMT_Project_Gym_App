const GymInfo = require('../models/GymInfo');
const Gym = require('../models/Gym');

// --- Add Gym Information --- //

exports.createGymInfo = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { gymInfotmation, gymFasilities, openHours, closeHours, gymContactNumber, city, packages, gymImg } = req.body;

        // Check if the Gym ID is registered 
        const GymID = await Gym.findById(gymId);
        if (!GymID) {
            return res.status(400).json({ message: 'Invalid Gym ID' });
        }

        const GymId = await GymInfo.findOne({ gymId });
        if (GymId) {
                return res.status(400).json({ message: 'Gym already create Information' });
        };

        gymInfo = new GymInfo({ gymId, gymInfotmation, gymFasilities, openHours, closeHours, city, gymContactNumber,packages, gymImg });
        await gymInfo.save();

        res.status(201).json({ message: 'Gym information added successfully', gymInfo });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Gym Information --- //

exports.updateGymInformation = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { gymInfotmation } = req.body;

        // Update gym information in database
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $set: { gymInfotmation: gymInfotmation } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym information updated successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Add Gym Fasilities --- //

exports.addGymFasilities = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { fasility } = req.body;

        // Add fasility to gym info 
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $push: { gymFasilities: { fasility } } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym fasility added successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete Gym Fasilities --- //

exports.deleteGymFasilities = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { fasilityId } = req.body;

        // Remove fasility from gym info
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $pull: { gymFasilities: { _id: fasilityId } } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym fasility deleted successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Open Hours --- //

exports.updateOpenHours = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { openHours } = req.body;

        // Update open hours in database
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $set: { openHours: openHours } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym information updated successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Close Hours --- //

exports.updateCloseHours = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { closeHours } = req.body;

        // Update close hours in database
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $set: { closeHours: closeHours } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym information updated successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update Gym Contact Number --- //

exports.updateGymContactNumber = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { newContactNumber } = req.body;

        // Update contact number in database
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $set: { gymContactNumber: newContactNumber } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym information updated successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Update City --- //

exports.updateCity = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { city } = req.body;

        // Update city in database
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $set: { city: city } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym information updated successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Add Gym Packages --- //

exports.addGymPackage = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { packageName, packagePrice, packageDuration, features } = req.body;

        // Add packages to gym info 
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $push: { packages: { packageName: packageName, packagePrice: packagePrice, packageDuration: packageDuration, features: features } } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym package added successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete Gym Packages --- //

exports.deleteGymPackages = async (req, res) => {
    try {
        const { infoId } = req.params;
        const { packageId } = req.body;

        // Remove package from gym info
        const gymInfo = await GymInfo.findByIdAndUpdate(
            infoId,
            { $pull: { packages: { _id: packageId } } },
            { new: true }
        );

        if (!gymInfo) {
            return res.status(400).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym package deleted successfully', gymInfo });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- Delete Gym Information --- //

exports.deleteGymInfo = async (req, res) => {
    try {
        const { infoId } = req.params;

        // Delete gym information from database
        const gymInfo = await GymInfo.findByIdAndDelete(infoId);

        if (!gymInfo) {
            return res.status(404).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ message: 'Gym information deleted successfully'});

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }

};


// --- Get Gym Information Details --- //

exports.getGymInformationDetails = async (req, res) => {
    try {
        const { infoId } = req.params;
        const gymInfo = await GymInfo.findById(infoId);

        if (!gymInfo) {
            return res.status(404).json({ message: 'Gym information not found' });
        }

        res.status(200).json({ gymInfo });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }   
};


// --- Get All Gym Information --- //

exports.getAllGymInformation = async (req, res) => {
    try {
        const gymInfos = await GymInfo.find().populate('gymId', 'GymName Address'); // Populate gymId with gym name and address

        if (!gymInfos || gymInfos.length === 0) {
            return res.status(404).json({ message: 'No gym information found' });
        }

        res.status(200).json({ gymInfos });
        
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};