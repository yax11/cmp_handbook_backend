const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
  user_id: {
    type: String, 
    ref: 'User',
  },
  complaint_text: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolution_comments: {
    type: String,
    trim: true,
  },
});

ComplaintSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Complaint = mongoose.model('Complaint', ComplaintSchema);

module.exports = Complaint;

