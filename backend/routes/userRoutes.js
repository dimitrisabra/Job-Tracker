const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile, changePassword, getActivityLog } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.get('/activity', getActivityLog);

router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').optional().trim().isEmail().withMessage('Invalid email').normalizeEmail(),
  ],
  updateProfile
);

router.put(
  '/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  changePassword
);

module.exports = router;
