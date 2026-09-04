const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const Part = require('../models/Part');
const { authenticate, requireDispatcher } = require('../middleware/auth');
const { addTimelineEntry, getJobTimeline } = require('../utils/timelineHelper');

const router = express.Router();

/**
 * Helper function to check for scheduling conflicts
 */
async function checkSchedulingConflict(technicianId, scheduledDate, startTime, estimatedDuration, excludeJobId = null) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const newStart = new Date(scheduledDate);
  newStart.setHours(hours, minutes, 0, 0);
  const newEnd = new Date(newStart.getTime() + estimatedDuration * 60 * 60 * 1000);

  const query = {
    assignedTechnicians: technicianId,
    scheduledDate: new Date(scheduledDate),
    _id: { $ne: excludeJobId }
  };

  const jobs = await Job.find(query);

  for (const job of jobs) {
    const [jobHours, jobMinutes] = job.startTime.split(':').map(Number);
    const jobStart = new Date(job.scheduledDate);
    jobStart.setHours(jobHours, jobMinutes, 0, 0);
    const jobEnd = new Date(jobStart.getTime() + job.estimatedDuration * 60 * 60 * 1000);

    // Check for overlap
    if (newStart < jobEnd && newEnd > jobStart) {
      return {
        hasConflict: true,
        conflictingJob: job._id,
        message: `Conflict with job ${job._id}`
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Create a new job (dispatcher only)
 */
router.post('/', authenticate, requireDispatcher, [
  body('customerName').trim().notEmpty(),
  body('siteAddress').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('priority').isIn(['low', 'medium', 'high', 'emergency']),
  body('scheduledDate').isISO8601(),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('estimatedDuration').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customerName,
      siteAddress,
      description,
      priority,
      scheduledDate,
      startTime,
      estimatedDuration
    } = req.body;

    const job = new Job({
      customerName,
      siteAddress,
      description,
      priority,
      scheduledDate: new Date(scheduledDate),
      startTime,
      estimatedDuration
    });

    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'created',
      `Job created for ${customerName} at ${siteAddress}`,
      req.user._id
    );

    res.status(201).json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Server error creating job' });
  }
});

/**
 * Get all jobs with filtering, sorting, and pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const {
      search,
      status,
      technician,
      date,
      sortBy = 'scheduledDate',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = {};

    // Role-based access control
    if (req.user.role === 'technician') {
      query.assignedTechnicians = req.user._id;
    }

    // Search filter
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { siteAddress: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Technician filter (dispatcher only)
    if (technician && req.user.role === 'dispatcher') {
      query.assignedTechnicians = technician;
    }

    // Date filter
    if (date) {
      query.scheduledDate = {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    // Exclude archived jobs by default
    if (!req.query.includeArchived) {
      query.isArchived = false;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('assignedTechnicians', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query)
    ]);

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalJobs: total,
        jobsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Server error fetching jobs' });
  }
});

/**
 * Get a specific job with timeline and parts
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('assignedTechnicians', 'name email');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Role-based access control
    if (req.user.role === 'technician' && !job.assignedTechnicians.some(t => t._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'Access denied to this job' });
    }

    // Get timeline and parts
    const [timeline, parts] = await Promise.all([
      getJobTimeline(job._id),
      Part.find({ job: job._id }).populate('recordedBy', 'name email')
    ]);

    res.json({
      job,
      timeline,
      parts
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Server error fetching job' });
  }
});

/**
 * Update job details (dispatcher only)
 */
router.put('/:id', authenticate, requireDispatcher, [
  body('customerName').optional().trim().notEmpty(),
  body('siteAddress').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'emergency']),
  body('scheduledDate').optional().isISO8601(),
  body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('estimatedDuration').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update fields
    const allowedFields = ['customerName', 'siteAddress', 'description', 'priority', 'scheduledDate', 'startTime', 'estimatedDuration'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'note_added',
      `Job details updated by ${req.user.name}`,
      req.user._id
    );

    res.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Server error updating job' });
  }
});

/**
 * Archive a job (dispatcher only)
 */
router.post('/:id/archive', authenticate, requireDispatcher, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job.isArchived = true;
    job.archivedAt = new Date();
    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'archived',
      `Job archived by ${req.user.name}`,
      req.user._id
    );

    res.json({ job });
  } catch (error) {
    console.error('Archive job error:', error);
    res.status(500).json({ error: 'Server error archiving job' });
  }
});

/**
 * Restore an archived job (dispatcher only)
 */
router.post('/:id/restore', authenticate, requireDispatcher, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job.isArchived = false;
    job.archivedAt = null;
    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'restored',
      `Job restored by ${req.user.name}`,
      req.user._id
    );

    res.json({ job });
  } catch (error) {
    console.error('Restore job error:', error);
    res.status(500).json({ error: 'Server error restoring job' });
  }
});

module.exports = router;