const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleType: {
        type: String,
        enum: ['car', 'bike'],
        required: true
    },
    company: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    serviceDate: {
        type: Date,
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    serviceCost: {
        type: Number,
        required: true
    },
    imagePath: {
        type: String, // Path to the uploaded image
        required: false,
    },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
