const DailyLog = require('../models/DailyLog');

// 1. Get daily logs (Read)
exports.getDailyStatus = async (req, res) => {
    try {
        const { userId, date } = req.params; // Get the parameters from the URL
        
        let log = await DailyLog.findOne({ userId, date });
        
        if (!log) {
            // Create a new record for the day (Daily Reset Logic)  
            log = new DailyLog({ userId, date });
            await log.save();
        }
        
        // Total sum eka calculate kireema
        const totalWater = log.waterEntries.reduce((acc, curr) => acc + curr.amount, 0);
        const totalCalories = log.foodEntries.reduce((acc, curr) => acc + curr.calories, 0);

        // Frontend ekata notification pennanna me values udaw wenawa
        res.status(200).json({
            ...log._doc,
            totalWater,
            totalCalories,
            waterRemaining: Math.max(0, log.waterGoal - totalWater),
            caloriesRemaining: log.calorieGoal - totalCalories,
            isCalorieOver: totalCalories > log.calorieGoal, // Limit eka pannada?
            isWaterGoalMet: totalWater >= log.waterGoal     // Target eka complete da?
        });
    } catch (error) {
        res.status(500).json({ message: error.message }); 
    }
};

// Goal Update (Initial/Custom Goal setup)
exports.updateGoals = async (req, res) => {
    try {
        const { userId, date, waterGoal, calorieGoal } = req.body;
        const log = await DailyLog.findOneAndUpdate(
            { userId, date },
            { $set: { waterGoal, calorieGoal } },
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Add water entry (Create entry in array)
exports.addWater = async (req, res) => {
    try {
        const { userId, date, amount } = req.body;
        // push to each day's array using findOneAndUpdate
        const log = await DailyLog.findOneAndUpdate(
            { userId, date },
            { $push: { waterEntries: { amount } } }, 
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addFood = async (req, res) => {
    try {
        const { userId, date, foodName, calories } = req.body;
        const log = await DailyLog.findOneAndUpdate(
            { userId, date },
            { $push: { foodEntries: { foodName, calories } } },
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateWaterEntry = async (req, res) => {
    try {
        const { userId, date, entryId, amount } = req.body;
        const log = await DailyLog.findOneAndUpdate(
            { userId, date, "waterEntries._id": entryId },
            { $set: { "waterEntries.$.amount": amount } },
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateFoodEntry = async (req, res) => {
    try {
        const { userId, date, entryId, foodName, calories } = req.body;
        const log = await DailyLog.findOneAndUpdate(
            { userId, date, "foodEntries._id": entryId },
            { $set: { "foodEntries.$.foodName": foodName, "foodEntries.$.calories": calories } },
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteWaterEntry = async (req, res) => {
    try {
        const { userId, date, entryId } = req.body;
        const log = await DailyLog.findOneAndUpdate(
            { userId, date },
            { $pull: { waterEntries: { _id: entryId } } },
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Delete food entry (Delete from array)
exports.deleteFoodEntry = async (req, res) => {
    try {
        const { userId, date, entryId } = req.body; //  remove from entryID
        const log = await DailyLog.findOneAndUpdate(
            { userId, date },
            { $pull: { foodEntries: { _id: entryId } } }, // remove from array using entryId
            { new: true }
        );
        res.status(200).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};