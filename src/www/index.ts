import { frontendDevOrigin, isProdEnvironment } from '@/config';
import { AllExceptionsFilter } from '@/core/exception/http';
import { classvalidatorPipeInstance } from '@/core/pipe';
import { AppModule } from '@/modules';
import { PrismaService } from '@/modules/core/prisma/services';
import { INestApplication, VersioningType } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import morgan from 'morgan';

export interface CreateServerOptions {
  port: number;
  production?: boolean;
  whitelistedDomains?: string[];
}

export default async (
  options: CreateServerOptions,
): Promise<INestApplication> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  let whitelist = options.whitelistedDomains ?? [];
  if (!isProdEnvironment) {
    whitelist = whitelist.concat(frontendDevOrigin as any);
  }

  const corsOptions: CorsOptions = {
    origin: whitelist,
    allowedHeaders: ['Authorization', 'X-Requested-With', 'Content-Type'],
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  };

  app.use(helmet());
  app.enableCors(corsOptions);
  app.use(morgan(options.production ? 'combined' : 'dev'));

  app.useBodyParser('json', { limit: '100mb' });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  app.useGlobalPipes(classvalidatorPipeInstance());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

    const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app)

  app.listen(options.port);

  return app;
};
