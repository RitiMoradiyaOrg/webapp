const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { basicAuth } = require('../middleware/auth');
const { validateUserCreate, validateUserUpdate } = require('../utils/validation');
const logger = require('../config/logger');
const statsd = require('../config/statsd');

// Helper function to validate UUID format
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// POST /v1/user - Create a new user
router.post('/v1/user', async (req, res) => {
  const apiStartTime = Date.now();
  logger.info('POST /v1/user - Creating new user');
  statsd.increment('api.user.create.count');

  try {
    // Validate request body
    const validationErrors = validateUserCreate(req.body);
    if (validationErrors.length > 0) {
      logger.warn('POST /v1/user - Validation failed', { errors: validationErrors });
      statsd.increment('api.user.create.validation_error');
      return res.status(400).json({ errors: validationErrors });
    }

    const { first_name, last_name, password, username } = req.body;

    // Check if user already exists
    const dbCheckStartTime = Date.now();
    const existingUser = await User.findOne({ where: { username } });
    statsd.timing('database.user.findOne', Date.now() - dbCheckStartTime);

    if (existingUser) {
      logger.warn('POST /v1/user - User already exists', { username });
      statsd.increment('api.user.create.duplicate_error');
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user (password will be hashed automatically by User model)
    const dbCreateStartTime = Date.now();
    const user = await User.create({
      first_name,
      last_name,
      password,
      username
    });
    statsd.timing('database.user.create', Date.now() - dbCreateStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.create.time', apiTime);
    logger.info(`POST /v1/user - User created successfully: ${username} in ${apiTime}ms`);

    // Return 201 with user data (password excluded by toJSON method)
    return res.status(201).json(user);
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.create.time', apiTime);
    statsd.increment('api.user.create.error');
    logger.error('POST /v1/user - Error creating user', { error: error.message, stack: error.stack });
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(400).json({ error: 'Failed to create user' });
  }
});

// GET /v1/user/self - Get authenticated user information
router.get('/v1/user/self', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  logger.info('GET /v1/user/self - Fetching authenticated user information');
  statsd.increment('api.user.self.count');

  try {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.self.time', apiTime);
    logger.info(`GET /v1/user/self - User retrieved successfully in ${apiTime}ms`);

    // Return authenticated user data (req.user is already populated by basicAuth middleware)
    return res.status(200).json(req.user);
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.self.time', apiTime);
    statsd.increment('api.user.self.error');
    logger.error('GET /v1/user/self - Error getting user', { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

// GET /v1/user/:userId - Get user information
router.get('/v1/user/:userId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { userId } = req.params;
  logger.info(`GET /v1/user/${userId} - Fetching user information`);
  statsd.increment('api.user.get.count');

  try {
    // 1. Validate UUID format
    if (!isValidUUID(userId)) {
      logger.warn(`GET /v1/user/${userId} - Invalid UUID format`);
      statsd.increment('api.user.get.invalid_uuid');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.get.time', apiTime);
      return res.status(400).end();
    }

    // 2. Check if user exists
    const dbStartTime = Date.now();
    const user = await User.findByPk(userId);
    statsd.timing('database.user.findByPk', Date.now() - dbStartTime);

    if (!user) {
      logger.warn(`GET /v1/user/${userId} - User not found`);
      statsd.increment('api.user.get.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.get.time', apiTime);
      return res.status(404).end();
    }

    // 3. Check authorization - user can only access their own info
    if (req.user.id !== userId) {
      logger.warn(`GET /v1/user/${userId} - Unauthorized access attempt by user ${req.user.id}`);
      statsd.increment('api.user.get.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.get.time', apiTime);
      return res.status(403).end();
    }

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.get.time', apiTime);
    logger.info(`GET /v1/user/${userId} - User retrieved successfully in ${apiTime}ms`);

    // Return user data
    return res.status(200).json(req.user);
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.get.time', apiTime);
    statsd.increment('api.user.get.error');
    logger.error(`GET /v1/user/${userId} - Error getting user`, { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

// PUT /v1/user/:userId - Update user information
router.put('/v1/user/:userId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { userId } = req.params;
  logger.info(`PUT /v1/user/${userId} - Updating user information`);
  statsd.increment('api.user.update.count');

  try {
    // 1. Validate UUID format
    if (!isValidUUID(userId)) {
      logger.warn(`PUT /v1/user/${userId} - Invalid UUID format`);
      statsd.increment('api.user.update.invalid_uuid');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.update.time', apiTime);
      return res.status(400).end();
    }

    // 2. Check if user exists
    const dbCheckStartTime = Date.now();
    const user = await User.findByPk(userId);
    statsd.timing('database.user.findByPk', Date.now() - dbCheckStartTime);

    if (!user) {
      logger.warn(`PUT /v1/user/${userId} - User not found`);
      statsd.increment('api.user.update.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.update.time', apiTime);
      return res.status(404).end();
    }

    // 3. Check authorization - user can only update their own info
    if (req.user.id !== userId) {
      logger.warn(`PUT /v1/user/${userId} - Unauthorized update attempt by user ${req.user.id}`);
      statsd.increment('api.user.update.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.update.time', apiTime);
      return res.status(403).end();
    }

    // 4. Validate update data
    const validationErrors = validateUserUpdate(req.body);
    if (validationErrors.length > 0) {
      logger.warn(`PUT /v1/user/${userId} - Validation failed`, { errors: validationErrors });
      statsd.increment('api.user.update.validation_error');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.update.time', apiTime);
      return res.status(400).json({ errors: validationErrors });
    }

    // 5. For PUT, all required fields must be present
    const { first_name, last_name, password } = req.body;
    if (!first_name || !last_name || !password) {
      logger.warn(`PUT /v1/user/${userId} - Missing required fields`);
      statsd.increment('api.user.update.missing_fields');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.user.update.time', apiTime);
      return res.status(400).end();
    }

    // Update fields
    req.user.first_name = first_name;
    req.user.last_name = last_name;
    req.user.password = password; // Will be hashed by setter

    const dbUpdateStartTime = Date.now();
    await req.user.save();
    statsd.timing('database.user.update', Date.now() - dbUpdateStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.update.time', apiTime);
    logger.info(`PUT /v1/user/${userId} - User updated successfully in ${apiTime}ms`);

    // Return 204 No Content
    return res.status(204).end();
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.user.update.time', apiTime);
    statsd.increment('api.user.update.error');
    logger.error(`PUT /v1/user/${userId} - Error updating user`, { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

module.exports = router;