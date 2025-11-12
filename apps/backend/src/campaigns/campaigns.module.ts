import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignFeedbackResolver } from './campaign-feedback.resolver';
import { CampaignStatsResolver } from './campaign-stats.resolver';
import { campaignProviders } from './campaign.providers';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [CampaignsController],
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
