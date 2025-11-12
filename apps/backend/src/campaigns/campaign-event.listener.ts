import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsClient } from '../notifications/notifications.client';

export class CampaignStatusChangedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly campaignName: string,
    public readonly creatorId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {}
}

export class DonationReceivedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly campaignName: string,
    public readonly creatorId: string,
    public readonly amount: number,
    public readonly donorName?: string,
  ) {}
}

export class CampaignGoalReachedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly campaignName: string,
    public readonly creatorId: string,
    public readonly goalAmount: number,
    public readonly totalFunding: number,
  ) {}
}

@Injectable()
export class CampaignEventListener {
  constructor(private readonly notificationsClient: NotificationsClient) {}

  @OnEvent('campaign.status.changed')
  async handleCampaignStatusChanged(event: CampaignStatusChangedEvent) {
    const { campaignId, campaignName, creatorId, newStatus } = event;

    switch (newStatus) {
      case 'APPROVED':
        await this.notificationsClient.createSuccessNotification(
          creatorId,
          'Kampaň schválena! 🎉',
          `Vaše kampaň "${campaignName}" byla schválena a je nyní aktivní`,
          `/campaigns/${campaignId}`
        );
        break;

      case 'REJECTED':
        await this.notificationsClient.createErrorNotification(
          creatorId,
          'Kampaň zamítnuta',
          `Vaše kampaň "${campaignName}" byla zamítnuta. Zkontrolujte feedback`,
          `/campaigns/${campaignId}`
        );
        break;
    }
  }

  @OnEvent('donation.received')
  async handleDonationReceived(event: DonationReceivedEvent) {
    const { campaignId, campaignName, creatorId, amount, donorName } = event;
    const donorText = donorName ? `od ${donorName}` : 'od anonymního dárce';

    await this.notificationsClient.createSuccessNotification(
      creatorId,
      'Nový příspěvek! 💰',
      `Vaše kampaň "${campaignName}" získala ${amount} Kč ${donorText}`,
      `/campaigns/${campaignId}`,
    );
  }

  @OnEvent('campaign.goal.reached')
  async handleGoalReached(event: CampaignGoalReachedEvent) {
    const { campaignId, campaignName, creatorId, goalAmount } = event;

    await this.notificationsClient.createSuccessNotification(
      creatorId,
      'Cíl dosažen! 🎯🎉',
      `Gratulujeme! Vaše kampaň "${campaignName}" dosáhla cíle ${goalAmount} Kč!`,
      `/campaigns/${campaignId}`,
    );
  }
}
