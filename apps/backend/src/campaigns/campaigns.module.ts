import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignFeedbackResolver } from './campaign-feedback.resolver';
import { CampaignStatsResolver } from './campaign-stats.resolver';
import { CampaignExportService } from './campaign-export.service';
import { CampaignExportController } from './campaign-export.controller';
import { campaignProviders } from './campaign.providers';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, AuthModule, NotificationsModule],
  controllers: [CampaignExportController],
  providers: [
    CampaignsService,
    CampaignsResolver,
    CampaignFeedbackResolver,
    CampaignStatsResolver,
    CampaignExportService,
    ...campaignProviders
  ],
  exports: [CampaignsService, ...campaignProviders],
})
export class CampaignsModule {}
