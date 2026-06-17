import app from './app';
import { config } from './config';
import logger from './config/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = config.port;

async function main() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(port, () => {
      logger.info(`Server running on port ${port} in ${config.env} mode`);
      logger.info(`API available at http://localhost:${port}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
