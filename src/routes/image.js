const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');
const Product = require('../models/Product');
const { uploadImageToS3, deleteImageFromS3 } = require('../services/s3Service');
const { basicAuth } = require('../middleware/auth');
const logger = require('../config/logger');
const statsd = require('../config/statsd');

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
  const apiStartTime = Date.now();
  const { productId } = req.params;
  logger.info(`POST /v1/product/${productId}/image - Uploading image`);
  statsd.increment('api.image.upload.count');

  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      logger.warn(`POST /v1/product/${productId}/image - No image file provided`);
      statsd.increment('api.image.upload.no_file');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.upload.time', apiTime);
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Verify product exists and belongs to user
    const dbCheckStartTime = Date.now();
    const product = await Product.findOne({
      where: { id: productId, owner_user_id: userId }
    });
    statsd.timing('database.product.findOne', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`POST /v1/product/${productId}/image - Product not found or unauthorized for user ${userId}`);
      statsd.increment('api.image.upload.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.upload.time', apiTime);
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Upload to S3
    const s3StartTime = Date.now();
    const { fileName, s3Path } = await uploadImageToS3(
      req.file.buffer,
      req.file.originalname,
      userId,
      productId
    );
    const s3UploadTime = Date.now() - s3StartTime;
    statsd.timing('s3.upload.time', s3UploadTime);
    logger.info(`S3 upload completed in ${s3UploadTime}ms for product ${productId}`);

    // Save to database
    const dbCreateStartTime = Date.now();
    const image = await Image.create({
      product_id: productId,
      file_name: fileName,
      s3_bucket_path: s3Path
    });
    statsd.timing('database.image.create', Date.now() - dbCreateStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.upload.time', apiTime);
    logger.info(`POST /v1/product/${productId}/image - Image uploaded successfully: ${image.image_id} in ${apiTime}ms`);

    // Return only required fields
    return res.status(201).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: image.s3_bucket_path
    });

  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.upload.time', apiTime);
    statsd.increment('api.image.upload.error');
    logger.error(`POST /v1/product/${productId}/image - Error uploading image`, { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

// GET /v1/product/:productId/image/:imageId - Get specific image details
router.get('/v1/product/:productId/image/:imageId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId, imageId } = req.params;
  logger.info(`GET /v1/product/${productId}/image/${imageId} - Fetching image details`);
  statsd.increment('api.image.get.count');

  try {
    const userId = req.user.id;

    // Verify product belongs to user
    const dbCheckStartTime = Date.now();
    const product = await Product.findOne({
      where: { id: productId, owner_user_id: userId }
    });
    statsd.timing('database.product.findOne', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`GET /v1/product/${productId}/image/${imageId} - Product not found or unauthorized for user ${userId}`);
      statsd.increment('api.image.get.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.get.time', apiTime);
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Find image
    const dbFindStartTime = Date.now();
    const image = await Image.findOne({
      where: { image_id: imageId, product_id: productId }
    });
    statsd.timing('database.image.findOne', Date.now() - dbFindStartTime);

    if (!image) {
      logger.warn(`GET /v1/product/${productId}/image/${imageId} - Image not found`);
      statsd.increment('api.image.get.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.get.time', apiTime);
      return res.status(404).json({ error: 'Image not found' });
    }

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.get.time', apiTime);
    logger.info(`GET /v1/product/${productId}/image/${imageId} - Image retrieved successfully in ${apiTime}ms`);

    return res.status(200).json({
      image_id: image.image_id,
      product_id: image.product_id,
      file_name: image.file_name,
      date_created: image.date_created,
      s3_bucket_path: image.s3_bucket_path
    });

  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.get.time', apiTime);
    statsd.increment('api.image.get.error');
    logger.error(`GET /v1/product/${productId}/image/${imageId} - Error retrieving image`, { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

// GET /v1/product/:productId/image - Get all images for a product
router.get('/v1/product/:productId/image', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId } = req.params;
  logger.info(`GET /v1/product/${productId}/image - Fetching all images`);
  statsd.increment('api.image.list.count');

  try {
    const userId = req.user.id;

    // Verify product belongs to user
    const dbCheckStartTime = Date.now();
    const product = await Product.findOne({
      where: { id: productId, owner_user_id: userId }
    });
    statsd.timing('database.product.findOne', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`GET /v1/product/${productId}/image - Product not found or unauthorized for user ${userId}`);
      statsd.increment('api.image.list.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.list.time', apiTime);
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Find all images
    const dbFindStartTime = Date.now();
    const images = await Image.findAll({
      where: { product_id: productId },
      attributes: ['image_id', 'product_id', 'file_name', 'date_created', 's3_bucket_path']
    });
    statsd.timing('database.image.findAll', Date.now() - dbFindStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.list.time', apiTime);
    logger.info(`GET /v1/product/${productId}/image - Retrieved ${images.length} images in ${apiTime}ms`);

    return res.status(200).json(images);

  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.list.time', apiTime);
    statsd.increment('api.image.list.error');
    logger.error(`GET /v1/product/${productId}/image - Error retrieving images`, { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to retrieve images' });
  }
});

// DELETE /v1/product/:productId/image/:imageId - Delete image
router.delete('/v1/product/:productId/image/:imageId', basicAuth, async (req, res) => {
  const apiStartTime = Date.now();
  const { productId, imageId } = req.params;
  logger.info(`DELETE /v1/product/${productId}/image/${imageId} - Deleting image`);
  statsd.increment('api.image.delete.count');

  try {
    const userId = req.user.id;

    // Verify product belongs to user
    const dbCheckStartTime = Date.now();
    const product = await Product.findOne({
      where: { id: productId, owner_user_id: userId }
    });
    statsd.timing('database.product.findOne', Date.now() - dbCheckStartTime);

    if (!product) {
      logger.warn(`DELETE /v1/product/${productId}/image/${imageId} - Product not found or unauthorized for user ${userId}`);
      statsd.increment('api.image.delete.forbidden');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.delete.time', apiTime);
      return res.status(403).json({ error: 'Product not found or you do not have permission' });
    }

    // Find image
    const dbFindStartTime = Date.now();
    const image = await Image.findOne({
      where: { image_id: imageId, product_id: productId }
    });
    statsd.timing('database.image.findOne', Date.now() - dbFindStartTime);

    if (!image) {
      logger.warn(`DELETE /v1/product/${productId}/image/${imageId} - Image not found`);
      statsd.increment('api.image.delete.not_found');
      const apiTime = Date.now() - apiStartTime;
      statsd.timing('api.image.delete.time', apiTime);
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from S3 first
    const s3StartTime = Date.now();
    await deleteImageFromS3(image.s3_bucket_path);
    const s3DeleteTime = Date.now() - s3StartTime;
    statsd.timing('s3.delete.time', s3DeleteTime);
    logger.info(`S3 delete completed in ${s3DeleteTime}ms for image ${imageId}`);

    // Delete from database
    const dbDeleteStartTime = Date.now();
    await image.destroy();
    statsd.timing('database.image.delete', Date.now() - dbDeleteStartTime);

    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.delete.time', apiTime);
    logger.info(`DELETE /v1/product/${productId}/image/${imageId} - Image deleted successfully in ${apiTime}ms`);

    return res.status(204).send();

  } catch (error) {
    const apiTime = Date.now() - apiStartTime;
    statsd.timing('api.image.delete.time', apiTime);
    statsd.increment('api.image.delete.error');
    logger.error(`DELETE /v1/product/${productId}/image/${imageId} - Error deleting image`, { error: error.message, stack: error.stack });
    return res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;