const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const Vehicle = require('./models/Vehicle');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');


const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://karthi:Karthikarakkal@cluster0.xi3nlpm.mongodb.net/cardb?retryWrites=true&w=majority&appName=Cluster0", { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Admin Schema and Model
const adminSchema = new mongoose.Schema({
    admin_name: { type: String, required: true },
    admin_password: { type: String, required: true }
});

const adminModel = mongoose.model('Admin', adminSchema);



// Admin Sign-Up Endpoint
app.post("/adminSignUp", async (req, res) => {
    try {
        let input = req.body;
        let hashedPassword = await bcrypt.hash(input.admin_password, 10);
        input.admin_password = hashedPassword;
        let admin = new adminModel(input);
        await admin.save();
        res.json({ "Status": "Saved" });
    } catch (error) {
        res.status(500).json({ "Error": error.message });
    }
});

// Admin Sign-In Endpoint
app.post("/adminSignIn", async (req, res) => {
    try {
        let input = req.body;

        if (!input.admin_name || !input.admin_password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        let response = await adminModel.findOne({ admin_name: input.admin_name });
        if (!response) {
            return res.status(404).json({ message: "User Not Found" });
        }

        let isMatch = await bcrypt.compare(input.admin_password, response.admin_password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = jwt.sign({ id: response._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ status: "login success", token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads'); // Define upload path
        cb(null, uploadPath); // Set destination to the uploads folder
    },
    filename: (req, file, cb) => {
        // Create a unique filename
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// API endpoint to add a vehicle
app.post('/addVehicle', upload.single('image'), async (req, res) => {
    const vehicleData = req.body;

    // Validate data
    if (!vehicleData.company || !vehicleData.name || !vehicleData.color || !vehicleData.number || !vehicleData.serviceDate || !vehicleData.serviceType || vehicleData.serviceCost === undefined) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Save image path to the vehicle data
    if (req.file) {
        vehicleData.imagePath = req.file.path; // Store the image path in the database
    }

    try {
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        res.status(201).json({ message: "Vehicle added successfully!", vehicle });
    } catch (error) {
        console.error("Error saving vehicle:", error);
        res.status(500).json({ message: "There was an error saving the vehicle." });
    }
});

app.get('/getVehicles', async (req, res) => {
    try {
      const vehicles = await Vehicle.find();
      res.json(vehicles);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });


 app.get('/searchVehicle/:number', async (req, res) => {
    const { number } = req.params;

    try {
        const vehicle = await Vehicle.findOne({ number: number });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/getVehicle', async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: 'Failed to retrieve vehicle' });
    }
  });
  
  // Update an existing vehicle by ID
  app.put('/updateVehicle', async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

        // Verify user ownership
        if (vehicle.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to edit this vehicle' });
        }

        // Update vehicle if authorized
        const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedVehicle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// Start the server
app.listen(8080, () => {
    console.log("Server initiated on port 8080");
});