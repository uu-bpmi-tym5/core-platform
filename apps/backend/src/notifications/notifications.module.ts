import { Module, DynamicModule } from '@nestjs/common';
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
    ],
    providers: [
        ...notificationProviders,
        NotificationsService,
        NotificationsResolver,
    ],
    controllers: [NotificationsController],
    exports: [NotificationsService],
})
export class NotificationsModule {
    /**
     * Use this method when you need the NotificationsClient to communicate with
     * the notifications microservice from other modules
     */
    static withClient(): DynamicModule {
        return {
            module: NotificationsModule,
            imports: [DatabaseModule, notificationsClientProvider],
            providers: [
                ...notificationProviders,
                NotificationsService,
                NotificationsResolver,
                NotificationsClient,
            ],
            controllers: [NotificationsController],
            exports: [NotificationsService, NotificationsClient],
        };
    }
}
