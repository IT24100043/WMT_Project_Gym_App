const mogoose = require('mongoose');

const coachpostSchema = new mogoose.Schema({
    coachId: {
        type: mogoose.Schema.Types.ObjectId,
        ref: 'Coach',
        required: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    experience: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        required: true,
    },
    fee: {
        type: Number,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },

}, { timestamps: true });

module.exports = mogoose.model('Coachpost', coachpostSchema);