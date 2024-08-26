const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminID: { type: String},
  });
  
  const Admin = mongoose.model('Admin', adminSchema);
  
  module.exports = Admin;
  