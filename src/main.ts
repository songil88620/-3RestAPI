import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // TODO: find way to get list of regex origin whitelist form env
  // const whitelistOrigin = process.env.WHITELIST_ORIGIN;

  app.enableCors({
    origin: [
      /localhost:3000$/,
      /localhost:4000$/,
      /\.ponopolon\.io$/,
      /\.ponopolon\.io:3000$/,
      /\.ponopolon\.io:4000$/,
      /\.ap-east-1\.elasticbeanstalk\.com$/,
    ],
    allowedHeaders: [
      'Access-Control-Allow-Origin',
      'Authorization',
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
    ],
    exposedHeaders: ['Authorization', 'Cache-Control', 'No-Store', 'Max-Age=0'],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  const options = new DocumentBuilder()
    .setTitle('Monopolon API')
    .setDescription('The Monopolon API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
