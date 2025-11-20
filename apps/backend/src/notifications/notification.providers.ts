import { DataSource } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

export const notificationProviders = [
    {
        provide: 'NOTIFICATION_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Notification),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'NOTIFICATION_PREFERENCES_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(NotificationPreference),
        inject: ['DATA_SOURCE'],
    },
];
