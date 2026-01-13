import { NestFactory } from '@nestjs/core';
import logger from 'moment-logger';
import { allowedDomains, isProduction, port } from './config';
import createServer, { CreateServerOptions } from './www';

async function bootstrap() {
  try {
    logger.log('Starting Server....');
    logger.info(
      `Running in ${isProduction ? 'production' : 'development'} mode`,
    );

    const options: CreateServerOptions = {
      port: port,
      production: isProduction,
      whitelistedDomains: allowedDomains,
    };

    await createServer(options);

    logger.info(`Server started on port ${port}`);
  } catch (error) {
    logger.error(error);
  }
}
bootstrap();
