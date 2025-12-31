import { DataSource } from 'typeorm';
import {
  Campaign,
  CampaignFeedback,
  CampaignStats,
  CampaignContribution,
  Comment,
  CommentReport,
  CampaignSurvey,
  CampaignSurveyResponse,
  ComplianceCheckResult,
  ComplianceRun,
} from './entities';

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
    {
        provide: 'COMMENT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Comment),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'COMMENT_REPORT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CommentReport),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CAMPAIGN_SURVEY_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CampaignSurvey),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'CAMPAIGN_SURVEY_RESPONSE_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(CampaignSurveyResponse),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'COMPLIANCE_CHECK_RESULT_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(ComplianceCheckResult),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: 'COMPLIANCE_RUN_REPOSITORY',
        useFactory: (dataSource: DataSource) => dataSource.getRepository(ComplianceRun),
        inject: ['DATA_SOURCE'],
    },
];
