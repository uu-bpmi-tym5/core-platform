import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignsService } from '../campaigns/campaigns.service';
import { NotificationsClient } from '../notifications/notifications.client';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';

@Injectable()
export class CampaignNotificationScheduler {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly notificationsClient: NotificationsClient,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyCampaignUpdates() {
    const campaigns = await this.campaignsService.findAllCampaigns();

    for (const campaign of campaigns) {
      const stats = await this.campaignsService.findCampaignStats(campaign.id);
      const progress = (stats.totalFunding / campaign.goal) * 100;

      // Pošleme update pokud je kampaň aktivní a má nějaký progress
      if (campaign.status === CampaignStatus.APPROVED && progress > 0 && progress < 100) {
        await this.notificationsClient.createInfoNotification(
          campaign.creatorId,
          'Denní přehled kampaně',
          `Vaše kampaň "${campaign.name}" má aktuálně ${progress.toFixed(1)}% z cíle (${stats.totalFunding}/${campaign.goal} Kč)`,
          `/campaigns/${campaign.id}/stats`
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklyGoalReminders() {
    const campaigns = await this.campaignsService.findAllCampaigns();

    for (const campaign of campaigns) {
      const stats = await this.campaignsService.findCampaignStats(campaign.id);
      const progress = (stats.totalFunding / campaign.goal) * 100;

      if (campaign.status === CampaignStatus.APPROVED && progress < 50) {
        await this.notificationsClient.createWarningNotification(
          campaign.creatorId,
          'Týdenní připomínka cíle',
          `Vaše kampaň "${campaign.name}" má zatím pouze ${progress.toFixed(1)}% z cíle. Zkuste sdílet kampaň více!`,
          `/campaigns/${campaign.id}`
        );
      }
    }
  }

  // @Cron('0 0 * * *') // Půlnoc každý den
  // async checkCampaignDeadlines() {
  //   const campaigns = await this.campaignsService.findAllCampaigns();
  //   const now = new Date();
  //   const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  //
  //   for (const campaign of campaigns) {
  //     // Pokud má kampaň deadline (předpokládáme, že má pole endDate)
  //     // const endDate = new Date(campaign.endDate);
  //
  //     // if (endDate <= threeDaysFromNow && endDate > now) {
  //     //   await this.notificationsClient.createWarningNotification(
  //     //     campaign.creatorId,
  //     //     'Kampaň brzy končí! ⏰',
  //     //     `Vaše kampaň "${campaign.name}" končí za ${Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} dní`,
  //     //     `/campaigns/${campaign.id}`
  //     //   );
  //     // }
  //   }
  // }
}
