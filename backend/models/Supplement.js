const mongoose = require('mongoose');

const supplementSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplement', supplementSchema);