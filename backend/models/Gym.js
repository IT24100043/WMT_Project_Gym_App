const mogoose = require('mongoose');

const gymSchema = new mogoose.Schema({
    GymName: {
        type: String,
        required: true,
        unique: true,
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
    },
    OwnerName: {
        type: String,
        required: true,
    },
    OwnerNIC: {
        type: String,
        required: true,
        unique: true,
    },
    Address: {
        type: String,
        required: true,
    },
    ownerContactNumber: {
        type: String,
        required: true,
        unique: true,
    },
    gymType: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    logoUrl: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },

}, { timestamps: true });

module.exports = mogoose.model('Gym', gymSchema);