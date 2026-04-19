const mogoose = require('mongoose');

const coachSchema = new mogoose.Schema({
    coachName: {
        type: String,
        required: true, 
    }, 
    coachAge: {
        type: Number,
        required: true,
    },  
    coachNICcardNumber: {
        type: String,
        required: true,
        unique: true,
    },
    coachId: {
        type: String,
        required: true,
        unique: true,
    },
    coachContactNumber: {
        type: String,
        required: true,
    },
    coachEmail: {
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

module.exports = mogoose.model('Coach', coachSchema);