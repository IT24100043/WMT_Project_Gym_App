const mogoose = require('mongoose');

const userSchema = new mogoose.Schema({
    name: {
        type: String,
        required: true, 
    }, 
    age: {
        type: Number,
        required: true,
    },  
    userNICcardNumber: {
        type: String,
        required: true,
        unique: true,
    },  
    userContactNumber: {
        type: String,
        required: true,
    },
    userEmail: {
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
        required: true,
    },
    role: { 
        type: String,
        required: true,
    },

}, { timestamps: true });

module.exports = mogoose.model('User', userSchema);