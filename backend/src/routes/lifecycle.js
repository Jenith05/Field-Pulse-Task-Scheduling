const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Part = require('../models/Part');
const { authenticate, requireDispatcher, requireTechnician } = require('../middleware/auth');
const { addTimelineEntry } = require('../utils/timelineHelper');

const router = express.Router();

/**
 * Valid status transitions
 */
const validTransitions = {
  unassigned: ['assigned'],
  assigned: ['en_route'],
  en_route: ['on_site'],
  on_site: ['completed'],
  completed: [] // Cannot transition from completed
};

/**
 * Get running late jobs
 */
router.get('/alerts/running-late', authenticate, async (req, res) => {
  try {
    const now = new Date();
    
    // Find jobs that are not completed and have passed their scheduled window
    const jobs = await Job.find({
      status: { $ne: 'completed' },
      isArchived: false
    }).populate('assignedTechnicians', 'name email');

    const runningLateJobs = jobs.filter(job => {
      const [hours, minutes] = job.startTime.split(':').map(Number);
      const scheduledStart = new Date(job.scheduledDate);
      scheduledStart.setHours(hours, minutes, 0, 0);
      const scheduledEnd = new Date(scheduledStart.getTime() + job.estimatedDuration * 60 * 60 * 1000);
      
      return now > scheduledEnd;
    });

    res.json({
      runningLateJobs,
      count: runningLateJobs.length
    });
  } catch (error) {
    console.error('Get running late jobs error:', error);
    res.status(500).json({ error: 'Server error fetching running late jobs' });
  }
});

/**
 * Update job status (lifecycle transitions)
 */
router.put('/:id/status', authenticate, [
  body('status').isIn(['unassigned', 'assigned', 'en_route', 'on_site', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Role-based access control
    if (req.user.role === 'technician') {
      // Technicians can only advance jobs they're assigned to
      if (!job.assignedTechnicians.includes(req.user._id)) {
        return res.status(403).json({ error: 'You are not assigned to this job' });
      }

      // Technicians can only move forward in the lifecycle
      const currentStatusIndex = Object.keys(validTransitions).indexOf(job.status);
      const newStatusIndex = Object.keys(validTransitions).indexOf(status);
      
      if (newStatusIndex <= currentStatusIndex) {
        return res.status(400).json({ error: 'Technicians can only advance job status forward' });
      }
    }

    // Check if transition is valid
    const allowedTransitions = validTransitions[job.status];
    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${job.status} to ${status}`,
        allowedTransitions
      });
    }

    // Special validation for completion
    if (status === 'completed') {
      if (!req.body.completionNote || req.body.completionNote.trim() === '') {
        return res.status(400).json({ error: 'Completion note is required' });
      }

      // Check if at least one part has been used
      const partsUsed = await Part.countDocuments({ job: job._id });
      if (partsUsed === 0) {
        return res.status(400).json({ error: 'At least one part must be recorded before completion' });
      }

      job.completionNote = req.body.completionNote;
    }

    // Update status
    const oldStatus = job.status;
    job.status = status;
    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'status_change',
      `Status changed from ${oldStatus} to ${status} by ${req.user.name}`,
      req.user._id,
      { oldStatus, newStatus: status }
    );

    // If completed, add completion timeline entry
    if (status === 'completed') {
      await addTimelineEntry(
        job._id,
        'completed',
        `Job completed with note: ${req.body.completionNote}`,
        req.user._id,
        { completionNote: req.body.completionNote }
      );
    }

    const updatedJob = await Job.findById(job._id).populate('assignedTechnicians', 'name email');
    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error updating job status' });
  }
});

module.exports = router;