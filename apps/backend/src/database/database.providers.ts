import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { Campaign, CampaignFeedback, CampaignStats } from '../campaigns/entities';
import { Notification } from '../notifications/entities';

export const databaseProviders = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async () => {
            const explicitEntities = [User, Session, Campaign, CampaignFeedback, CampaignStats, Notification].filter(Boolean);
            const entities = Array.from(new Set([...explicitEntities]));

            const dataSource = new DataSource({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'root',
                password: 'root',
                database: 'platform',
                entities,
                synchronize: true,
            });

            return dataSource.initialize();
        },
    }
];
