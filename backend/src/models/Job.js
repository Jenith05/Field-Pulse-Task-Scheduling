const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  siteAddress: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['unassigned', 'assigned', 'en_route', 'on_site', 'completed'],
    default: 'unassigned'
  },
  assignedTechnicians: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  completionNote: {
    type: String,
    trim: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate end time based on start time and duration
jobSchema.virtual('endTime').get(function() {
  const [hours, minutes] = this.startTime.split(':').map(Number);
  const startDate = new Date(this.scheduledDate);
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(startDate.getTime() + this.estimatedDuration * 60 * 60 * 1000);
  return endDate;
});

// Check if job is running late
jobSchema.virtual('isRunningLate').get(function() {
  if (this.status === 'completed') return false;
  const now = new Date();
  return now > this.endTime;
});

// Update timestamp on save
jobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Job', jobSchema);