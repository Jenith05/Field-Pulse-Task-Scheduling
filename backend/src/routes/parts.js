const express = require('express');
const { body, validationResult } = require('express-validator');
const Part = require('../models/Part');
const Job = require('../models/Job');
const { authenticate } = require('../middleware/auth');
const { addTimelineEntry } = require('../utils/timelineHelper');

const router = express.Router();

/**
 * Add part to job
 */
router.post('/', authenticate, [
  body('jobId').notEmpty(),
  body('partName').trim().notEmpty(),
  body('quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId, partName, quantity } = req.body;

    // Check if job exists and user has access
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Role-based access control
    if (req.user.role === 'technician') {
      if (!job.assignedTechnicians.includes(req.user._id)) {
        return res.status(403).json({ error: 'You are not assigned to this job' });
      }
    }

    // Check if job is already completed
    if (job.status === 'completed') {
      return res.status(400).json({ error: 'Cannot add parts to a completed job' });
    }

    // Create part
    const part = new Part({
      job: jobId,
      partName,
      quantity,
      recordedBy: req.user._id
    });

    await part.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'part_added',
      `Part added: ${quantity}x ${partName} by ${req.user.name}`,
      req.user._id,
      { partId: part._id, partName, quantity }
    );

    const savedPart = await Part.findById(part._id).populate('recordedBy', 'name email');
    res.status(201).json({ part: savedPart });
  } catch (error) {
    console.error('Add part error:', error);
    res.status(500).json({ error: 'Server error adding part' });
  }
});

/**
 * Get parts for a specific job
 */
router.get('/job/:jobId', authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists and user has access
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Role-based access control
    if (req.user.role === 'technician') {
      if (!job.assignedTechnicians.includes(req.user._id)) {
        return res.status(403).json({ error: 'You are not assigned to this job' });
      }
    }

    const parts = await Part.find({ job: jobId })
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ parts });
  } catch (error) {
    console.error('Get parts error:', error);
    res.status(500).json({ error: 'Server error fetching parts' });
  }
});

module.exports = router;