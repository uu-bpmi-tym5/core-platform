import { DataSource } from 'typeorm';
import { WalletTX } from './entities/wallet-tx.entity';
import { CampaignContribution } from '../campaigns/entities/campaign-contribution.entity';
import { User } from '../users/entities/user.entity';

export const walletProviders = [
  {
    provide: 'WALLET_TX_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(WalletTX),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'CAMPAIGN_CONTRIBUTION_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(CampaignContribution),
    inject: ['DATA_SOURCE'],
  },
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(User),
    inject: ['DATA_SOURCE'],
  },
];
