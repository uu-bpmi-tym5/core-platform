import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { NotificationsModule } from './notifications.module';

async function bootstrap() {
  const logger = new Logger('NotificationsMicroservice');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.NOTIFICATIONS_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.NOTIFICATIONS_SERVICE_PORT || '3001', 10),
      },
    },
  );

  await app.listen();

  logger.log('🔔 Notifications microservice is listening on port ' + (process.env.NOTIFICATIONS_SERVICE_PORT || '3001'));
  logger.log('🚀 Microservice is ready to handle message patterns');
}

bootstrap();

