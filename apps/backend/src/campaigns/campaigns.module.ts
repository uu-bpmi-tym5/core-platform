import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignFeedbackResolver } from './campaign-feedback.resolver';
import { CampaignStatsResolver } from './campaign-stats.resolver';
import { campaignProviders } from './campaign.providers';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  providers: [
    CampaignsService,
    CampaignsResolver,
    CampaignFeedbackResolver,
    CampaignStatsResolver,
    ...campaignProviders
  ],
  exports: [CampaignsService, ...campaignProviders],
})
export class CampaignsModule {}
