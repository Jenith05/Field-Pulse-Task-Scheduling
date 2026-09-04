const express = require('express');
const Job = require('../models/Job');
const User = require('../models/User');
const { authenticate, requireDispatcher } = require('../middleware/auth');

const router = express.Router();

/**
 * Get dashboard statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base query based on user role
    let baseQuery = {};
    if (req.user.role === 'technician') {
      baseQuery.assignedTechnicians = req.user._id;
    }

    // Jobs scheduled today
    const scheduledToday = await Job.countDocuments({
      ...baseQuery,
      scheduledDate: {
        $gte: today,
        $lt: tomorrow
      },
      isArchived: false
    });

    // Jobs completed today
    const completedToday = await Job.countDocuments({
      ...baseQuery,
      status: 'completed',
      updatedAt: {
        $gte: today,
        $lt: tomorrow
      },
      isArchived: false
    });

    // Running late jobs
    const now = new Date();
    const allJobs = await Job.find({
      ...baseQuery,
      status: { $ne: 'completed' },
      isArchived: false
    });

    const runningLate = allJobs.filter(job => {
      const [hours, minutes] = job.startTime.split(':').map(Number);
      const scheduledStart = new Date(job.scheduledDate);
      scheduledStart.setHours(hours, minutes, 0, 0);
      const scheduledEnd = new Date(scheduledStart.getTime() + job.estimatedDuration * 60 * 60 * 1000);
      return now > scheduledEnd;
    }).length;

    // Unassigned jobs (dispatcher only)
    let unassigned = 0;
    if (req.user.role === 'dispatcher') {
      unassigned = await Job.countDocuments({
        status: 'unassigned',
        isArchived: false
      });
    }

    // Jobs by status
    const jobsByStatus = await Job.aggregate([
      { $match: { ...baseQuery, isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Jobs by technician (dispatcher only)
    let jobsByTechnician = [];
    if (req.user.role === 'dispatcher') {
      jobsByTechnician = await Job.aggregate([
        { $match: { isArchived: false } },
        { $unwind: '$assignedTechnicians' },
        { $group: { _id: '$assignedTechnicians', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'technician' } },
        { $unwind: '$technician' },
        { $project: { _id: 1, count: 1, technicianName: '$technician.name' } }
      ]);
    }

    // Jobs completed per day over last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const completedPerDay = await Job.aggregate([
      {
        $match: {
          ...baseQuery,
          status: 'completed',
          updatedAt: { $gte: fourteenDaysAgo },
          isArchived: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
            day: { $dayOfMonth: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      scheduledToday,
      completedToday,
      runningLate,
      unassigned,
      jobsByStatus,
      jobsByTechnician,
      completedPerDay
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error fetching dashboard statistics' });
  }
});

/**
 * Export dispatch sheet as CSV (dispatcher only)
 */
router.get('/export/:date', authenticate, requireDispatcher, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const jobs = await Job.find({
      scheduledDate: {
        $gte: targetDate,
        $lt: nextDay
      },
      isArchived: false
    }).populate('assignedTechnicians', 'name email')
      .sort({ startTime: 1 });

    // Generate CSV
    let csv = 'Customer,Address,Description,Priority,Date,Start Time,Duration,Status,Technicians\n';

    jobs.forEach(job => {
      const technicians = job.assignedTechnicians.map(t => t.name).join(', ') || 'Unassigned';
      const row = [
        `"${job.customerName}"`,
        `"${job.siteAddress}"`,
        `"${job.description}"`,
        job.priority,
        job.scheduledDate.toISOString().split('T')[0],
        job.startTime,
        `${job.estimatedDuration}h`,
        job.status,
        `"${technicians}"`
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="dispatch-sheet-${date}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error exporting CSV' });
  }
});

module.exports = router;