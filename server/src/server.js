const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const seedDemoData = require('./utils/seedDemo');
const logger = require('./utils/logger');

async function startServer() {
  // Connect to MongoDB
  await connectDB();

  // Seed initial demo data for immediate testing if in development
  if (config.env === 'development') {
    await seedDemoData();
  }

  const server = app.listen(config.port, () => {
    logger.info(`[SERVER] SecureShare API running on port ${config.port} in ${config.env} mode`);
    logger.info(`[SERVER] Storage Engine: ${config.storageMode.toUpperCase()}`);
    logger.info(`[SERVER] Authentication: ${config.aws.cognito.userPoolId ? 'AWS Cognito' : 'Local Auth Fallback'}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`[SERVER] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      await disconnectDB();
      logger.info('[SERVER] Graceful shutdown completed. Exiting.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if still hanging
    setTimeout(() => {
      logger.error('[SERVER] Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  logger.error('[SERVER FATAL] Failed to start server:', { error: err.message, stack: err.stack });
  process.exit(1);
});
