require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const HealthCheck = require('./src/models/HealthCheck');

const PORT = process.env.APP_PORT || 8080;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Sync database (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✓ Database synchronized successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Health check endpoint: http://localhost:${PORT}/healthz`);
    });

  } catch (error) {
    console.error('✗ Unable to start server:', error.message);
    process.exit(1);
  }
}

startServer();