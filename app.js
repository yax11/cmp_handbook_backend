const express = require('express');
const mongoose = require('mongoose');
const createResponse = require('./utils/response');
const User = require('./users');
const Admin = require('./admin');
const Complaints = require('./complaints');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Replace with your MongoDB connection string
// const mongoURI = 'mongodb://127.0.0.1:27017/cmp_handbook';
const mongoURI = 'mongodb+srv://yax:BKf5UXdA3gSpuMRv@cluster0.z7g94.mongodb.net/';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    // cb(null, `handbook-${Date.now()}.pdf`);
    cb(null, `file.pdf`);
  }
});

// Initialize multer upload
const upload = multer({ storage: storage });

app.post('/uploadHandbook', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json(createResponse(false, 'No file uploaded'));
  }

  try {
    // Uncomment and use if you want to save file details in MongoDB
    // const handbook = new Handbook({
    //   handbook_location: req.file.path,
    //   last_updated: new Date()
    // });
    // await handbook.save();

    console.log("File uploaded and saved to database");
    res.status(200).json(createResponse(true, 'File uploaded successfully', { filePath: req.file.path }));
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json(createResponse(false, 'An error occurred while uploading the file', null, error.toString()));
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { phone, reg } = req.body;

  console.log('LOGIN ATTEMPTED');

  // Validate input
  if (!phone || !reg) {
    console.log("Phone number and registration number are required");
    return res.status(400).json(createResponse(false, 'Phone number and registration number are required'));
  }

  try {
    if (reg === 'admin') {
      console.log('ADMIN LOGIN ATTEMPTED');
      // Check in Admin schema if reg is 'admin'
      const admin = await Admin.findOne({ adminID: phone });

      if (admin) {
        console.log('Admin login successful');
        return res.status(200).json(createResponse(true, 'Admin login successful', admin));
      } else {
        console.log('Admin login Failed');
        return res.status(404).json(createResponse(false, 'Invalid admin ID or phone number'));
      }
    } else {
      // Check in User schema if reg is not 'admin'
      const user = await User.findOne({ phone, reg });

      if (user) {
        console.log('User login successful');
        return res.status(200).json(createResponse(true, 'Login successful', user));
      } else {
        return res.status(404).json(createResponse(false, 'Invalid phone number or registration number'));
      }
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json(createResponse(false, 'An error occurred during login', null, error.toString()));
  }
});

app.post('/add-student', async (req, res) => {
  const { full_name, phone, reg } = req.body;

  if (!full_name || !phone || !reg) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newUser = new User({ full_name, phone, reg });
    await newUser.save();
    res.status(201).json({ message: 'Student added successfully', user: newUser });
  } catch (error) {
    console.error('Error adding student:', error.message);
    res.status(500).json({ error: 'Internal server error' });
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

app.get('/complaints', async (req, res) => {
  try {
    const complaints = await Complaints.find().sort({ created_at: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error.message);
    res.status(500).json({ error: 'Internal server error' });
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
