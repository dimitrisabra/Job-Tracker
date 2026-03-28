const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const {
  addActivity,
  getUserByEmail,
  getUserById,
  listUserActivity,
  updateUserPassword,
  updateUserProfile,
} = require('../utils/devStore');

const getProfile = async (req, res, next) => {
  try {
    const user = getUserById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email } = req.body;
    const user = getUserById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (email && String(email).toLowerCase() !== user.email) {
      const existing = getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'Email already in use by another account.' });
      }
    }

    const updatedUser = updateUserProfile(req.user._id, { name, email });
    addActivity({
      user: req.user._id,
      action: 'PROFILE_UPDATED',
      description: 'Profile information updated',
    });

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    const user = getUserById(req.user._id, { includePassword: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    await updateUserPassword(req.user._id, newPassword);
    addActivity({
      user: req.user._id,
      action: 'PASSWORD_CHANGED',
      description: 'Password changed successfully',
    });

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    next(error);
  }
};

const getActivityLog = async (req, res, next) => {
  try {
    res.json(listUserActivity(req.user._id, 50));
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, changePassword, getActivityLog };
