const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  eventType: {
    type: String,
    enum: [
      'created',
      'status_change',
      'technician_assigned',
      'technician_unassigned',
      'completed',
      'part_added',
      'note_added',
      'archived',
      'restored'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

// Ensure timeline entries are immutable - cannot be updated or deleted
timelineSchema.pre('save', function(next) {
  if (this.isNew) {
    return next();
  }
  const error = new Error('Timeline entries cannot be modified');
  return next(error);
});

timelineSchema.pre('deleteOne', { document: true }, function(next) {
  const error = new Error('Timeline entries cannot be deleted');
  return next(error);
});

module.exports = mongoose.model('Timeline', timelineSchema);