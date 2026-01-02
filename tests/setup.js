const sequelize = require('../src/config/database');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const HealthCheck = require('../src/models/HealthCheck');
const Image = require('../src/models/Image');

// Setup before all tests
beforeAll(async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Test database connected');

    // Sync database (create tables)
    await sequelize.sync({ force: true }); // force: true drops and recreates tables
    console.log('✓ Test database synchronized');
  } catch (error) {
    console.error('✗ Test setup failed:', error);
    throw error;
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    // Close database connection
    await sequelize.close();
    console.log('✓ Test database connection closed');
  } catch (error) {
    console.error('✗ Test cleanup failed:', error);
  }
});

// Clear data between tests
afterEach(async () => {
  try {
    // Clear all tables (Images first due to foreign key constraint)
    await Image.destroy({ where: {}, force: true });
    await Product.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await HealthCheck.destroy({ where: {}, force: true });
  } catch (error) {
    console.error('✗ Test cleanup between tests failed:', error);
  }
});