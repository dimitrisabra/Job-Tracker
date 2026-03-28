const express = require('express');
const {
  getAdminStats, getAllUsers, getUserById, updateUserStatus, deleteUser,
  getUserJobs, createJobForUser, updateJobForUser, deleteJobForUser,
  getAllJobs, getSystemActivity,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// Platform analytics
router.get('/stats', getAdminStats);
router.get('/activity', getSystemActivity);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Admin: manage a specific user's applications
router.get('/users/:id/jobs', getUserJobs);
router.post('/users/:id/jobs', createJobForUser);
router.put('/users/:userId/jobs/:jobId', updateJobForUser);
router.delete('/users/:userId/jobs/:jobId', deleteJobForUser);

// All jobs system-wide
router.get('/jobs', getAllJobs);

module.exports = router;
