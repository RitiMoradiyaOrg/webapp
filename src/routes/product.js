const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { basicAuth } = require('../middleware/auth');
const { validateProductCreate, validateProductUpdate, validateProductPatch } = require('../utils/validation');

// POST /v1/product - Create a new product
router.post('/v1/product', basicAuth, async (req, res) => {
  console.log('📦 Product POST route hit! User:', req.user?.username);
  try {
    const validationErrors = validateProductCreate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;

    const product = await Product.create({
      name,
      description,
      sku,
      manufacturer,
      quantity,
      owner_user_id: req.user.id
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(400).json({ error: 'Failed to create product' });
  }
});

// GET /v1/product/:productId - Get product information
router.get('/v1/product/:productId', basicAuth, async (req, res) => {
  console.log('📦 Product GET route hit! ProductId:', req.params.productId);
  try {
    const product = await Product.findByPk(req.params.productId);

    if (!product) {
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      return res.status(403).end();
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    return res.status(400).end();
  }
});

// PUT /v1/product/:productId - Full update of product
router.put('/v1/product/:productId', basicAuth, async (req, res) => {
  console.log('📦 Product PUT route hit! ProductId:', req.params.productId);
  try {
    const product = await Product.findByPk(req.params.productId);

    if (!product) {
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      return res.status(403).end();
    }

    const validationErrors = validateProductUpdate(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;
    product.name = name;
    product.description = description;
    product.sku = sku;
    product.manufacturer = manufacturer;
    product.quantity = quantity;

    await product.save();
    return res.status(204).end();
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(400).end();
  }
});

// PATCH /v1/product/:productId - Partial update of product
router.patch('/v1/product/:productId', basicAuth, async (req, res) => {
  console.log('📦 Product PATCH route hit! ProductId:', req.params.productId);
  try {
    const product = await Product.findByPk(req.params.productId);

    if (!product) {
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      return res.status(403).end();
    }

    const validationErrors = validateProductPatch(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    const { name, description, sku, manufacturer, quantity } = req.body;
    
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (sku !== undefined) product.sku = sku;
    if (manufacturer !== undefined) product.manufacturer = manufacturer;
    if (quantity !== undefined) product.quantity = quantity;

    await product.save();
    return res.status(204).end();
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(400).end();
  }
});

// DELETE /v1/product/:productId - Delete product
router.delete('/v1/product/:productId', basicAuth, async (req, res) => {
  console.log('📦 Product DELETE route hit! ProductId:', req.params.productId);
  try {
    const product = await Product.findByPk(req.params.productId);

    if (!product) {
      return res.status(404).end();
    }

    if (product.owner_user_id !== req.user.id) {
      return res.status(403).end();
    }

    await product.destroy();
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(400).end();
  }
});

module.exports = router;