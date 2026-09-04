const express = require('express');
const { body, validationResult } = require('express-validator');
const Job = require('../models/Job');
const { authenticate, requireDispatcher } = require('../middleware/auth');
const { addTimelineEntry } = require('../utils/timelineHelper');

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
 * Assign technician to job (dispatcher only)
 */
router.post('/:jobId/technicians/:technicianId', authenticate, requireDispatcher, async (req, res) => {
  try {
    const { jobId, technicianId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if technician is already assigned
    if (job.assignedTechnicians.includes(technicianId)) {
      return res.status(400).json({ error: 'Technician already assigned to this job' });
    }

    // Check for scheduling conflicts
    const conflictCheck = await checkSchedulingConflict(
      technicianId,
      job.scheduledDate,
      job.startTime,
      job.estimatedDuration,
      jobId
    );

    if (conflictCheck.hasConflict) {
      return res.status(400).json({
        error: 'Scheduling conflict',
        details: conflictCheck.message
      });
    }

    // Assign technician
    job.assignedTechnicians.push(technicianId);
    
    // Update status if unassigned
    if (job.status === 'unassigned') {
      job.status = 'assigned';
    }

    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'technician_assigned',
      `Technician ${technicianId} assigned to job`,
      req.user._id,
      { technicianId }
    );

    const updatedJob = await Job.findById(jobId).populate('assignedTechnicians', 'name email');
    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({ error: 'Server error assigning technician' });
  }
});

/**
 * Remove technician from job (dispatcher only)
 */
router.delete('/:jobId/technicians/:technicianId', authenticate, requireDispatcher, async (req, res) => {
  try {
    const { jobId, technicianId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if technician is assigned
    if (!job.assignedTechnicians.includes(technicianId)) {
      return res.status(400).json({ error: 'Technician not assigned to this job' });
    }

    // Remove technician
    job.assignedTechnicians = job.assignedTechnicians.filter(
      id => id.toString() !== technicianId
    );

    // Update status if no technicians left
    if (job.assignedTechnicians.length === 0 && job.status === 'assigned') {
      job.status = 'unassigned';
    }

    await job.save();

    // Add timeline entry
    await addTimelineEntry(
      job._id,
      'technician_unassigned',
      `Technician ${technicianId} removed from job`,
      req.user._id,
      { technicianId }
    );

    const updatedJob = await Job.findById(jobId).populate('assignedTechnicians', 'name email');
    res.json({ job: updatedJob });
  } catch (error) {
    console.error('Remove technician error:', error);
    res.status(500).json({ error: 'Server error removing technician' });
  }
});

/**
 * Bulk assign technicians to jobs (dispatcher only)
 */
router.post('/bulk-assign', authenticate, requireDispatcher, [
  body('jobIds').isArray({ min: 1 }),
  body('technicianId').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobIds, technicianId } = req.body;

    const results = {
      successful: [],
      failed: []
    };

    for (const jobId of jobIds) {
      try {
        const job = await Job.findById(jobId);
        if (!job) {
          results.failed.push({
            jobId,
            error: 'Job not found'
          });
          continue;
        }

        // Check if already assigned
        if (job.assignedTechnicians.includes(technicianId)) {
          results.failed.push({
            jobId,
            error: 'Technician already assigned'
          });
          continue;
        }

        // Check for scheduling conflicts
        const conflictCheck = await checkSchedulingConflict(
          technicianId,
          job.scheduledDate,
          job.startTime,
          job.estimatedDuration,
          jobId
        );

        if (conflictCheck.hasConflict) {
          results.failed.push({
            jobId,
            error: 'Scheduling conflict',
            details: conflictCheck.message
          });
          continue;
        }

        // Assign technician
        job.assignedTechnicians.push(technicianId);
        
        // Update status if unassigned
        if (job.status === 'unassigned') {
          job.status = 'assigned';
        }

        await job.save();

        // Add timeline entry
        await addTimelineEntry(
          job._id,
          'technician_assigned',
          `Technician ${technicianId} assigned to job (bulk assignment)`,
          req.user._id,
          { technicianId, bulkAssignment: true }
        );

        results.successful.push({
          jobId,
          message: 'Successfully assigned'
        });
      } catch (error) {
        results.failed.push({
          jobId,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk assignment completed',
      results
    });
  } catch (error) {
    console.error('Bulk assign error:', error);
    res.status(500).json({ error: 'Server error during bulk assignment' });
  }
});

module.exports = router;