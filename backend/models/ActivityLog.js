const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      // Examples: 'JOB_CREATED', 'JOB_UPDATED', 'JOB_DELETED', 'STATUS_CHANGED',
      //           'PROFILE_UPDATED', 'LOGIN', 'LOGOUT'
    },
    description: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // Extra context (jobId, old/new status, etc.)
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete logs older than 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
