const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { basicAuth } = require('../middleware/auth');
const { validateProductCreate, validateProductUpdate, validateProductPatch } = require('../utils/validation');
const logger = require('../config/logger');
const statsd = require('../config/statsd');

// GET /v1/product - List all products for authenticated user
router.get('/v1/product', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  logger.info('GET /v1/product - Fetching all products for user', { userId: req.user.id });
  statsd.increment('api.product.list.count');

  try {
    const dbStartTime = Date.now();
    const products = await Product.findAll({
      where: { owner_user_id: req.user.id }
    });
    statsd.timing('database.product.findAll', Date.now() - dbStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.list.time', apiTime);
    logger.info(`GET /v1/product - Retrieved ${products.length} products in ${apiTime}ms`);

    return res.status(200).json(products);
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.list.time', apiTime);
    statsd.increment('api.product.list.error');
    logger.error('GET /v1/product - Error listing products', { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

// POST /v1/product - Create a new product
router.post('/v1/product', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  logger.info('POST /v1/product - Creating new product', { username: req.user?.username });
  statsd.increment('api.product.create.count');

  try {
    const validationErrors = validateProductCreate(req.body);
    if (validationErrors.length > 0) {
      logger.warn('POST /v1/product - Validation failed', { errors: validationErrors });
      statsd.increment('api.product.create.validation_error');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.create.time', apiTime);
      return res.status(400).json({ errors: validationErrors });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;

    const dbStartTime = Date.now();
    const product = await Product.create({
      name,
      description,
      sku,
      manufacturer,
      quantity,
      owner_user_id: req.user.id
    });
    statsd.timing('database.product.create', Date.now() - dbStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.create.time', apiTime);
    logger.info(`POST /v1/product - Product created successfully: ${product.id} in ${apiTime}ms`);

    return res.status(201).json(product);
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.create.time', apiTime);
    statsd.increment('api.product.create.error');
    logger.error('POST /v1/product - Error creating product', { error: error.message, stack: error.stack });
    return res.status(400).json({ error: 'Failed to create product' });
  }
});

// GET /v1/product/:productId - Get product information
router.get('/v1/product/:productId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId } = req.params;
  logger.info(`GET /v1/product/${productId} - Fetching product information`);
  statsd.increment('api.product.get.count');

  try {
    const dbStartTime = Date.now();
    const product = await Product.findByPk(productId);
    statsd.timing('database.product.findByPk', Date.now() - dbStartTime);

    if (!product) {
      logger.warn(`GET /v1/product/${productId} - Product not found`);
      statsd.increment('api.product.get.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.get.time', apiTime);
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      logger.warn(`GET /v1/product/${productId} - Unauthorized access attempt by user ${req.user.id}`);
      statsd.increment('api.product.get.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.get.time', apiTime);
      return res.status(403).end();
    }

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.get.time', apiTime);
    logger.info(`GET /v1/product/${productId} - Product retrieved successfully in ${apiTime}ms`);

    return res.status(200).json(product);
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.get.time', apiTime);
    statsd.increment('api.product.get.error');
    logger.error(`GET /v1/product/${productId} - Error getting product`, { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

// PUT /v1/product/:productId - Full update of product
router.put('/v1/product/:productId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId } = req.params;
  logger.info(`PUT /v1/product/${productId} - Updating product`);
  statsd.increment('api.product.update.count');

  try {
    const dbCheckStartTime = Date.now();
    const product = await Product.findByPk(productId);
    statsd.timing('database.product.findByPk', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`PUT /v1/product/${productId} - Product not found`);
      statsd.increment('api.product.update.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.update.time', apiTime);
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      logger.warn(`PUT /v1/product/${productId} - Unauthorized update attempt by user ${req.user.id}`);
      statsd.increment('api.product.update.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.update.time', apiTime);
      return res.status(403).end();
    }

    const validationErrors = validateProductUpdate(req.body);
    if (validationErrors.length > 0) {
      logger.warn(`PUT /v1/product/${productId} - Validation failed`, { errors: validationErrors });
      statsd.increment('api.product.update.validation_error');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.update.time', apiTime);
      return res.status(400).json({ errors: validationErrors });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;
    product.name = name;
    product.description = description;
    product.sku = sku;
    product.manufacturer = manufacturer;
    product.quantity = quantity;

    const dbUpdateStartTime = Date.now();
    await product.save();
    statsd.timing('database.product.update', Date.now() - dbUpdateStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.update.time', apiTime);
    logger.info(`PUT /v1/product/${productId} - Product updated successfully in ${apiTime}ms`);

    return res.status(204).end();
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.update.time', apiTime);
    statsd.increment('api.product.update.error');
    logger.error(`PUT /v1/product/${productId} - Error updating product`, { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

// PATCH /v1/product/:productId - Partial update of product
router.patch('/v1/product/:productId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId } = req.params;
  logger.info(`PATCH /v1/product/${productId} - Partially updating product`);
  statsd.increment('api.product.patch.count');

  try {
    const dbCheckStartTime = Date.now();
    const product = await Product.findByPk(productId);
    statsd.timing('database.product.findByPk', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`PATCH /v1/product/${productId} - Product not found`);
      statsd.increment('api.product.patch.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.patch.time', apiTime);
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      logger.warn(`PATCH /v1/product/${productId} - Unauthorized patch attempt by user ${req.user.id}`);
      statsd.increment('api.product.patch.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.patch.time', apiTime);
      return res.status(403).end();
    }

    const validationErrors = validateProductPatch(req.body);
    if (validationErrors.length > 0) {
      logger.warn(`PATCH /v1/product/${productId} - Validation failed`, { errors: validationErrors });
      statsd.increment('api.product.patch.validation_error');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.patch.time', apiTime);
      return res.status(400).json({ errors: validationErrors });
    }

    // Ensure at least one field is provided
    const allowedFields = ['name', 'description', 'sku', 'manufacturer', 'quantity'];
    const hasValidField = allowedFields.some(field => req.body.hasOwnProperty(field));
    
    if (!hasValidField) {
      logger.warn(`PATCH /v1/product/${productId} - No valid fields provided`);
      statsd.increment('api.product.patch.no_fields');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.patch.time', apiTime);
      return res.status(400).end();
    }

    const { name, description, sku, manufacturer, quantity } = req.body;
    
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (sku !== undefined) product.sku = sku;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;
    if (quantity !== undefined) product.quantity = quantity;

    const dbUpdateStartTime = Date.now();
    await product.save();
    statsd.timing('database.product.update', Date.now() - dbUpdateStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.patch.time', apiTime);
    logger.info(`PATCH /v1/product/${productId} - Product patched successfully in ${apiTime}ms`);

    return res.status(204).end();
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.patch.time', apiTime);
    statsd.increment('api.product.patch.error');
    logger.error(`PATCH /v1/product/${productId} - Error patching product`, { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

// DELETE /v1/product/:productId - Delete product
router.delete('/v1/product/:productId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId } = req.params;
  logger.info(`DELETE /v1/product/${productId} - Deleting product`);
  statsd.increment('api.product.delete.count');

  try {
    const dbCheckStartTime = Date.now();
    const product = await Product.findByPk(productId);
    statsd.timing('database.product.findByPk', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`DELETE /v1/product/${productId} - Product not found`);
      statsd.increment('api.product.delete.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.delete.time', apiTime);
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      logger.warn(`DELETE /v1/product/${productId} - Unauthorized delete attempt by user ${req.user.id}`);
      statsd.increment('api.product.delete.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.product.delete.time', apiTime);
      return res.status(403).end();
    }

    const dbDeleteStartTime = Date.now();
    await product.destroy();
    statsd.timing('database.product.delete', Date.now() - dbDeleteStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.delete.time', apiTime);
    logger.info(`DELETE /v1/product/${productId} - Product deleted successfully in ${apiTime}ms`);

    return res.status(204).end();
  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.product.delete.time', apiTime);
    statsd.increment('api.product.delete.error');
    logger.error(`DELETE /v1/product/${productId} - Error deleting product`, { error: error.message, stack: error.stack });
    return res.status(400).end();
  }
});

module.exports = router;