const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { basicAuth } = require('../middleware/auth');
const { validateUserCreate, validateUserUpdate } = require('../utils/validation');

// POST /v1/user - Create a new user
router.post('/v1/user', async (req, res) => {
  try {
    // Validate request body
    const validationErrors = validateUserCreate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { first_name, last_name, password, username } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user (password will be hashed automatically by User model)
    const user = await User.create({
      first_name,
      last_name,
      password,
      username
    });

    // Return 201 with user data (password excluded by toJSON method)
    return res.status(201).json(user);

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(400).json({ error: 'Failed to create user' });
  }
});

// GET /v1/user/:userId - Get user information
router.get('/v1/user/:userId', basicAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if authenticated user is requesting their own info
    if (req.user.id !== userId) {
      return res.status(403).end();
    }

    // User is already loaded in basicAuth middleware
    return res.status(200).json(req.user);

  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(400).end();
  }
});

// PUT /v1/user/:userId - Update user information
router.put('/v1/user/:userId', basicAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if authenticated user is updating their own info
    if (req.user.id !== userId) {
      return res.status(403).end();
    }

    // Validate update data
    const validationErrors = validateUserUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Update allowed fields only
    const { first_name, last_name, password } = req.body;
    
    if (first_name !== undefined) req.user.first_name = first_name;
    if (last_name !== undefined) req.user.last_name = last_name;
    if (password !== undefined) req.user.password = password; // Will be hashed by setter

    await req.user.save();

    // Return 204 No Content
    return res.status(204).end();

  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(400).end();
  }
});

module.exports = router;