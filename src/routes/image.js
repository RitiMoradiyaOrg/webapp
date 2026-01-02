const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');
const Product = require('../models/Product');
const { uploadImageToS3, deleteImageFromS3 } = require('../services/s3Service');
const { basicAuth } = require('../middleware/auth');

// Configure multer for memory storage (we'll upload directly to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  }
});

// POST /v1/product/:productId/image - Upload image
router.post('/v1/product/:productId/image', basicAuth, upload.single('image'), async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.user_id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Verify product exists and belongs to user
    const product = await Product.findOne({
      where: { product_id: productId, owner_user_id: userId }
    });

    if (!product) {
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Upload to S3
    const { fileName, s3Path } = await uploadImageToS3(
      req.file.buffer,
      req.file.originalname,
      userId,
      productId
    );

    // Save to database
    const image = await Image.create({
      product_id: productId,
      file_name: fileName,
      s3_bucket_path: s3Path
    });

    // Return only required fields
    return res.status(201).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: image.s3_bucket_path
    });

  } catch (error) {
    console.error('Upload Image Error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET /v1/product/:productId/image/:imageId - Get specific image details
router.get('/v1/product/:productId/image/:imageId', basicAuth, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const userId = req.user.user_id;

    // Verify product belongs to user
    const product = await Product.findOne({
      where: { product_id: productId, owner_user_id: userId }
    });

    if (!product) {
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Find image
    const image = await Image.findOne({
      where: { image_id: imageId, product_id: productId }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    return res.status(200).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: image.s3_bucket_path
    });

  } catch (error) {
    console.error('Get Image Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

// GET /v1/product/:productId/image - Get all images for a product
router.get('/v1/product/:productId/image', basicAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.user_id;

    // Verify product belongs to user
    const product = await Product.findOne({
      where: { product_id: productId, owner_user_id: userId }
    });

    if (!product) {
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Find all images
    const images = await Image.findAll({
      where: { product_id: productId },
      attributes: ['image_id', 'product_id', 'file_name', 'date_created', 's3_bucket_path']
    });

    return res.status(200).json(images);

  } catch (error) {
    console.error('Get Images Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve images' });
  }
});

// DELETE /v1/product/:productId/image/:imageId - Delete image
router.delete('/v1/product/:productId/image/:imageId', basicAuth, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const userId = req.user.user_id;

    // Verify product belongs to user
    const product = await Product.findOne({
      where: { product_id: productId, owner_user_id: userId }
    });

    if (!product) {
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Find image
    const image = await Image.findOne({
      where: { image_id: imageId, product_id: productId }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from S3 first
    await deleteImageFromS3(image.s3_bucket_path);

    // Delete from database
    await image.destroy();

    return res.status(204).send();

  } catch (error) {
    console.error('Delete Image Error:', error);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;