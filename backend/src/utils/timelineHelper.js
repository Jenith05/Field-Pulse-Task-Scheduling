const Timeline = require('../models/Timeline');

/**
 * Add a timeline entry for a job
 * @param {ObjectId} jobId - The job ID
 * @param {String} eventType - The type of event
 * @param {String} description - Description of the event
 * @param {ObjectId} performedBy - User who performed the action
 * @param {Object} metadata - Additional metadata (optional)
 */
async function addTimelineEntry(jobId, eventType, description, performedBy, metadata = {}) {
  try {
    const timelineEntry = new Timeline({
      job: jobId,
      eventType,
      description,
      performedBy,
      metadata
    });
    
    await timelineEntry.save();
    return timelineEntry;
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    throw error;
  }
}

/**
 * Get timeline for a specific job
 * @param {ObjectId} jobId - The job ID
 */
async function getJobTimeline(jobId) {
  try {
    const timeline = await Timeline.find({ job: jobId })
      .populate('performedBy', 'name email role')
      .sort({ createdAt: 1 });
    
    return timeline;
  } catch (error) {
    console.error('Error getting job timeline:', error);
    throw error;
  }
}

module.exports = {
  addTimelineEntry,
  getJobTimeline
};