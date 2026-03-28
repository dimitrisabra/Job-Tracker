const express = require('express');
const { body } = require('express-validator');
const {
  getJobs,
  getStats,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  aiSuggestNotes,
  getActivityLog,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All job routes are protected
router.use(protect);

// Job validation rules
const jobValidation = [
  body('jobTitle').trim().notEmpty().withMessage('Job title is required').isLength({ max: 100 }).withMessage('Job title too long'),
  body('company').trim().notEmpty().withMessage('Company name is required').isLength({ max: 100 }).withMessage('Company name too long'),
  body('status').optional().isIn(['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 5000 }).withMessage('Notes too long (max 5000 chars)'),
  body('dateApplied').optional().isISO8601().withMessage('Invalid date format'),
];

router.get('/stats', getStats);
router.get('/activity', getActivityLog);
router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/', jobValidation, createJob);
router.put('/:id', jobValidation, updateJob);
router.delete('/:id', deleteJob);
router.post('/:id/ai-suggest', aiSuggestNotes);

module.exports = router;
