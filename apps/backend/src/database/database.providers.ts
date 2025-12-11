import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from '../auth/entities/session.entity';
import { Campaign, CampaignContribution, CampaignFeedback, CampaignStats, Comment,} from '../campaigns/entities';
import { Notification, NotificationPreference } from '../notifications/entities';
import { WalletTX } from '../wallet/entities/wallet-tx.entity';
import { Profile } from '../users/entities/profile.entity';
import { CreatorProfile } from '../users/entities/creator-profile.entity';
import { CommentReport } from '../campaigns/entities/comment-report.entity';

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
        Comment,
        CommentReport,
      ].filter(Boolean);

      const entities = Array.from(new Set([...explicitEntities]));

      const options = {
        type: (process.env.DB_TYPE as DataSourceOptions['type']) || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
        username: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'platform',
        entities,
        synchronize: typeof process.env.DB_SYNCHRONIZE !== 'undefined' ? process.env.DB_SYNCHRONIZE === 'true' : true,
      } as DataSourceOptions;

      const dataSource = new DataSource(options);

      return dataSource.initialize();
    },
  },
];
