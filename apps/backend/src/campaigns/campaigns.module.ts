import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignsResolver } from './campaigns.resolver';
import { CampaignFeedbackResolver } from './campaign-feedback.resolver';
import { CampaignStatsResolver } from './campaign-stats.resolver';
import { CampaignExportService } from './campaign-export.service';
import { CampaignExportController } from './campaign-export.controller';
import { ComplianceService, ComplianceResolver } from './compliance';
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
    ComplianceService,
    ComplianceResolver,
    ...campaignProviders
  ],
  exports: [CampaignsService, ComplianceService, ...campaignProviders],
})
export class CampaignsModule {}
