const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const {
  addActivity,
  createUser,
  getUserByEmail,
  getUserById,
  setUserLastLogin,
} = require('../utils/devStore');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    if (getUserByEmail(email)) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await createUser({ name, email, password });
    addActivity({
      user: user._id,
      action: 'SIGNUP',
      description: 'Account created',
      ipAddress: req.ip,
    });

    const token = signToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = getUserByEmail(email, { includePassword: true });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const updatedUser = setUserLastLogin(user._id);
    addActivity({
      user: user._id,
      action: 'LOGIN',
      description: 'User logged in',
      ipAddress: req.ip,
    });

    const token = signToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
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

module.exports = { signup, login, getMe };
