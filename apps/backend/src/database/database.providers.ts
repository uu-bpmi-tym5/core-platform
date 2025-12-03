import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { Campaign, CampaignContribution, CampaignFeedback, CampaignStats } from '../campaigns/entities';
import { Notification, NotificationPreference } from '../notifications/entities';
import { WalletTX } from '../wallet/entities/wallet-tx.entity';
import { Profile } from '../users/entities/profile.entity';
import { CreatorProfile } from '../users/entities/creator-profile.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const explicitEntities = [
        User,
        Session,
        Campaign,
        CampaignFeedback,
        CampaignStats,
        CampaignContribution,
        Notification,
        NotificationPreference,
        WalletTX,
        Profile,
        CreatorProfile,
      ].filter(Boolean);

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
  },
];
