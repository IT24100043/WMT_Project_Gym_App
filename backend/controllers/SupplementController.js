const Supplement = require('../models/Supplement');

// Get all supplements
exports.getAllSupplements = async (req, res) => {
    try {
        const supplements = await Supplement.find();
        res.status(200).json(supplements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add new supplement
exports.addSupplement = async (req, res) => {
    try {
        const { name, type, price, description, stock, isAvailable } = req.body; 
        const newSupplement = new Supplement({ name, type, price, description, stock, });
        await newSupplement.save();
        res.status(201).json(newSupplement);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update Price
exports.updatePrice = async (req, res) => {
    try {
        const { price } = req.body;
        const updatedSupplement = await Supplement.findByIdAndUpdate(req.params.id, { price: price }, { new: true });
        res.status(200).json(updatedSupplement);
    } catch (err) {
        res.status(400).json({ error: "Price update failed: " + err.message });
    }
};

// Update Stock Quantity
exports.updateStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const updatedSupplement = await Supplement.findByIdAndUpdate(req.params.id, { stock: stock }, { new: true });
        res.status(200).json(updatedSupplement);
    } catch (err) {
        res.status(400).json({ error: "Stock update failed: " + err.message });
    }
};

// Update Availability
exports.updateAvailability = async (req, res) => {
    try {
        const isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;      
        const updatedSupplement = await Supplement.findByIdAndUpdate(req.params.id, { isAvailable: isAvailable }, { new: true });
        res.status(200).json(updatedSupplement);
    } catch (err) {
        res.status(400).json({ error: "Availability update failed: " + err.message });
    }
};

// Delete supplement
exports.deleteSupplement = async (req, res) => {
    try {
        await Supplement.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};