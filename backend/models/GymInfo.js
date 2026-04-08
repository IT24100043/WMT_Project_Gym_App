const mogoose = require('mongoose');

const gymInfoSchema = new mogoose.Schema({
    gymId: {
        type: mogoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true,
        unique: true,
    },
    gymInfotmation: {
        type: String,
        required: true,
    },
    gymFasilities: [
        {
            fasility: {
                type: String,
                required: true,
            }
        }
    ],
    openHours: {
        type: String,
        required: true,
    },
    closeHours: {
        type: String,
        required: true,
    },
    gymContactNumber: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    packages: [
        {
            packageName: {
                type: String,
                required: true, 
            },
            packagePrice: {
                type: Number,
                required: true,
            },
            packageDuration: {
                type: String,
                required: true,
            },
            features: {
                type: [String],
                required: true,
            }
        }
    ],
    gymImg: {
        type: String,
        required: true,
    }

}, { timestamps: true });

module.exports = mogoose.model('GymInfo', gymInfoSchema);