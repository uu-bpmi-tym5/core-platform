import { DataSource } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignFeedback } from './entities/campaign-feedback.entity';
import { CampaignStats } from './entities/campaign-stats.entity';
import { CampaignContribution } from './entities/campaign-contribution.entity';

export const campaignProviders = [
    {
        provide: 'CAMPAIGN_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Campaign),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CAMPAIGN_FEEDBACK_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CampaignFeedback),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CAMPAIGN_STATS_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CampaignStats),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CAMPAIGN_CONTRIBUTION_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CampaignContribution),
        inject: ['DATA_SOURCE'],
    },
];
