import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { notificationProviders } from './notification.providers';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsController } from './notifications.controller';
import { NotificationsClient } from './notifications.client';
import { notificationsClientProvider } from './notifications-client.provider';

@Module({
    imports: [
        DatabaseModule,
        notificationsClientProvider,
    ],
    providers: [
        ...notificationProviders,
        NotificationsService,
        NotificationsResolver,
        NotificationsClient,
    ],
    controllers: [NotificationsController],
    exports: [NotificationsService, NotificationsClient],
})
export class NotificationsModule {}
