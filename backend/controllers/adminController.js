const {
  addActivity,
  createJob,
  deleteJob,
  deleteUserCascade,
  getAdminStats,
  getJobById,
  getUserById,
  getUserDetail,
  listAllJobs,
  listJobsForUser,
  listSystemActivity,
  listUsers,
  updateJob,
  updateUserStatus,
} = require('../utils/devStore');

const getAdminStatsHandler = async (req, res, next) => {
  try {
    res.json(getAdminStats());
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const result = listUsers({ page, limit, search, status });

    res.json({
      users: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserByIdHandler = async (req, res, next) => {
  try {
    const result = getUserDetail(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateUserStatusHandler = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "active" or "suspended".' });
    }

    const user = getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user._id === req.user._id) {
      return res.status(400).json({ message: 'You cannot suspend your own account.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot suspend admin accounts.' });
    }

    const updatedUser = updateUserStatus(req.params.id, status);
    addActivity({
      user: req.user._id,
      action: 'ADMIN_USER_STATUS_CHANGED',
      description: `Admin changed user ${user.email} status to ${status}`,
      meta: { targetUserId: user._id, newStatus: status },
    });

    res.json({
      message: `User ${status === 'suspended' ? 'suspended' : 'activated'} successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUserHandler = async (req, res, next) => {
  try {
    const user = getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user._id === req.user._id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin accounts.' });
    }

    deleteUserCascade(req.params.id);
    addActivity({
      user: req.user._id,
      action: 'ADMIN_USER_DELETED',
      description: `Admin deleted user ${user.email}`,
      meta: { deletedUserId: user._id, deletedUserEmail: user.email },
    });

    res.json({ message: 'User and all their data deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const getUserJobs = async (req, res, next) => {
  try {
    const user = getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const result = listJobsForUser(req.params.id, { page, limit, status, search, sortBy, sortOrder });

    res.json({
      jobs: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createJobForUser = async (req, res, next) => {
  try {
    const user = getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const payload = {
      ...req.body,
      user: req.params.id,
      statusHistory: [{ status: req.body.status || 'Applied', changedAt: req.body.dateApplied || new Date().toISOString(), note: req.body.statusNote || '' }],
    };

    const job = createJob(payload);
    addActivity({
      user: req.user._id,
      action: 'ADMIN_JOB_CREATED',
      description: `Admin created ${job.jobTitle} at ${job.company} for ${user.email}`,
      meta: { targetUserId: user._id, jobId: job._id },
    });

    res.status(201).json({ message: 'Application created for user!', job });
  } catch (error) {
    next(error);
  }
};

const updateJobForUser = async (req, res, next) => {
  try {
    const user = getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingJob = getJobById(req.params.jobId, req.params.userId);
    if (!existingJob) {
      return res.status(404).json({ message: 'Job application not found.' });
    }

    const updates = { ...req.body };
    if (updates.status && updates.status !== existingJob.status) {
      updates.statusHistory = [
        ...(existingJob.statusHistory || []),
        { status: updates.status, changedAt: new Date().toISOString(), note: updates.statusNote || '' },
      ];
    }

    const job = updateJob(req.params.jobId, req.params.userId, updates);
    addActivity({
      user: req.user._id,
      action: 'ADMIN_JOB_UPDATED',
      description: `Admin updated ${job.jobTitle} at ${job.company} for ${user.email}`,
      meta: { targetUserId: user._id, jobId: job._id },
    });

    res.json({ message: 'Application updated!', job });
  } catch (error) {
    next(error);
  }
};

const deleteJobForUser = async (req, res, next) => {
  try {
    const user = getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const job = deleteJob(req.params.jobId, req.params.userId);
    if (!job) {
      return res.status(404).json({ message: 'Job application not found.' });
    }

    addActivity({
      user: req.user._id,
      action: 'ADMIN_JOB_DELETED',
      description: `Admin deleted ${job.jobTitle} at ${job.company} for ${user.email}`,
      meta: { targetUserId: user._id, jobId: job._id },
    });

    res.json({ message: 'Application deleted.' });
  } catch (error) {
    next(error);
  }
};

const getAllJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const result = listAllJobs({ page, limit, status, search });

    res.json({
      jobs: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSystemActivity = async (req, res, next) => {
  try {
    res.json(listSystemActivity(100));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats: getAdminStatsHandler,
  getAllUsers,
  getUserById: getUserByIdHandler,
  updateUserStatus: updateUserStatusHandler,
  deleteUser: deleteUserHandler,
  getUserJobs,
  createJobForUser,
  updateJobForUser,
  deleteJobForUser,
  getAllJobs,
  getSystemActivity,
};
