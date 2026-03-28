const express = require('express');
const { body } = require('express-validator');
const {
  getPublicPostings,
  getPosting,
  applyToPosting,
  adminGetPostings,
  createPosting,
  updatePosting,
  deletePosting,
  togglePosting,
} = require('../controllers/jobPostingController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── Public routes (no auth needed) ──────────────────────────────────────────
router.get('/', getPublicPostings);
// Individual posting — optionally attach user if logged in
router.get('/:id', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    const jwt = require('jsonwebtoken');
    const { getUserById } = require('../utils/devStore');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = getUserById(decoded.id);
      next();
    } catch {
      next();
    }
  } else {
    next();
  }
}, getPosting);

// ─── Authenticated user routes ────────────────────────────────────────────────
router.post('/:id/apply', protect, applyToPosting);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/all', protect, adminOnly, adminGetPostings);

const postingValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').optional().isIn(['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship']),
  body('experience').optional().isIn(['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Executive']),
];

router.post('/admin', protect, adminOnly, postingValidation, createPosting);
router.put('/admin/:id', protect, adminOnly, updatePosting);
router.delete('/admin/:id', protect, adminOnly, deletePosting);
router.patch('/admin/:id/toggle', protect, adminOnly, togglePosting);

module.exports = router;
