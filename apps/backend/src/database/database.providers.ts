import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from '../auth/entities/session.entity';

export const databaseProviders = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async () => {
            const explicitEntities = [User, Session].filter(Boolean);
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
