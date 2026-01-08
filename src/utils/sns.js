const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const logger = require('../config/logger');

// Initialize SNS Client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Publish user registration message to SNS topic
 * @param {Object} userData - User data to publish
 * @param {string} userData.email - User's email
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.token - Verification token
 * @returns {Promise<void>}
 */
async function publishUserRegistration(userData) {
  const topicArn = process.env.SNS_TOPIC_ARN;

  if (!topicArn) {
    logger.error('SNS_TOPIC_ARN not configured in environment variables');
    throw new Error('SNS topic not configured');
  }

  const message = {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    token: userData.token
  };

  const params = {
    TopicArn: topicArn,
    Message: JSON.stringify(message),
    Subject: 'New User Registration - Email Verification'
  };

  try {
    const command = new PublishCommand(params);
    const result = await snsClient.send(command);
    logger.info(`SNS message published successfully: ${result.MessageId}`, {
      email: userData.email,
      messageId: result.MessageId
    });
    return result;
  } catch (error) {
    logger.error('Failed to publish SNS message', {
      error: error.message,
      topicArn,
      email: userData.email
    });
    throw error;
  }
}

module.exports = {
  publishUserRegistration
};