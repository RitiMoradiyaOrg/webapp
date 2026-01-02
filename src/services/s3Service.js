const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

// Initialize S3 Client (uses IAM role automatically on EC2)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Upload image to S3
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} originalFilename - Original filename from user
 * @param {string} userId - User ID who uploaded the image
 * @param {string} productId - Product ID the image belongs to
 * @returns {Promise<{fileName: string, s3Path: string}>}
 */
async function uploadImageToS3(fileBuffer, originalFilename, userId, productId) {
  // Generate unique filename to avoid collisions
  const fileExtension = path.extname(originalFilename);
  const uniqueFileName = `${crypto.randomUUID()}${fileExtension}`;
  
  // Create S3 path: userId/productId/filename
  const s3Key = `${userId}/${productId}/${uniqueFileName}`;
  
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: getContentType(fileExtension)
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    
    return {
      fileName: originalFilename,
      s3Path: s3Key
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error('Failed to upload image to S3');
  }
}

/**
 * Delete image from S3
 * @param {string} s3Path - S3 object key to delete
 * @returns {Promise<void>}
 */
async function deleteImageFromS3(s3Path) {
  const deleteParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Path
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete image from S3');
  }
}

/**
 * Get content type based on file extension
 * @param {string} extension - File extension
 * @returns {string} - MIME type
 */
function getContentType(extension) {
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}

module.exports = {
  uploadImageToS3,
  deleteImageFromS3
};