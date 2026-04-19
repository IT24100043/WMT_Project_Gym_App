const mogoose = require('mongoose');

const adminSchema = new mogoose.Schema({
    adminName: {
        type: String,
        required: true, 
    },
    adminAge: {
        type: Number,
        required: true,
    }, 
    adminNICcardNumber: {
        type: String,
        required: true,
        unique: true,
    },
    adminContactNumber: {
        type: String,
        required: true,
    },
    adminEmail: {
        type: String,  
        required: true,
        unique: true, 
    }, 
    password: {
        type: String,   
        required: true,
    },
    dpUrl: {
        type: String,
        required: false,
    },
    role: { 
        type: String,
        required: true,
    },

}, { timestamps: true });

module.exports = mogoose.model('Admin', adminSchema);