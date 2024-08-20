const express = require('express');
const mongoose = require('mongoose');
const createResponse = require('./utils/response');
const User = require('./users');
const Complaints = require('./complaints');

const app = express();
app.use(express.json());

// Replace with your MongoDB connection string
// const mongoURI = 'mongodb://127.0.0.1:27017/cmp_handbook';
const mongoURI = 'mongodb+srv://yax:BKf5UXdA3gSpuMRv@cluster0.z7g94.mongodb.net/';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Login route
app.post('/login', async (req, res) => {
  const { phone, reg } = req.body;

  console.log('LOGIN ATTEMPTED');

  // Validate input
  if (!phone || !reg) {
    return res.status(400).json(createResponse(false, 'Phone number and registration number are required'));
  }

  try {
    // Check for the user in the database
    const user = await User.findOne({ phone, reg });

    if (user) {
      console.log("Login successful");
      return res.status(200).json(createResponse(true, 'Login successful', user));
    } else {
      return res.status(404).json(createResponse(false, 'Invalid phone number or registration number'));
    }

  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json(createResponse(false, 'An error occurred during login', null, error.toString()));
  }
});


app.post('/sendComplaint', async (req, res) => {
  const { complaintText, userId } = req.body;

  // Validate input
  if (!complaintText || !userId) {
    return res.status(400).json(createResponse(false, 'Complaint text and user ID are required'));
  }

  try {
    // Create a new complaint instance
    const complaint = new Complaints({
      user_id: userId,
      complaint_text: complaintText
    });

    // Save the complaint to the database
    await complaint.save();
    console.log("Complaint saved to database");
    return res.status(201).json(createResponse(true, 'Complaint submitted successfully', complaint));
  } catch (error) {
    console.error('Error during complaint submission:', error);
    return res.status(500).json(createResponse(false, 'An error occurred while submitting the complaint', null, error.toString()));
  }
});


const handbookSchema = new mongoose.Schema({
  handbook_location: String,
  last_updated: Date
});

// Model definition
const Handbook = mongoose.model('document', handbookSchema);

// Endpoint to get the handbook document information
app.get('/handbook/info', async (req, res) => {
  try {
      const handbook = await Handbook.findOne().sort({ last_updated: -1 });
      if (!handbook) {
          return res.status(404).json({ message: "Handbook not found" });
      }
      console.log("Handbook Info found");
      res.json({
          handbook_location: handbook.handbook_location,
          last_updated: handbook.last_updated
      });
  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
});


const fs = require('fs');
const path = require('path');


app.get('/handbook/download', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'uploads', 'file.pdf');
    console.log(filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Handbook not found" });
    }

    console.log("Download sent");
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error downloading the file:", err);
        res.status(500).json({ message: "Error downloading the file" });
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});




// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

