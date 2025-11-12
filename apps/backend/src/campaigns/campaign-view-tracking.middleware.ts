import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class CampaignViewTrackingMiddleware implements NestMiddleware {
  constructor(private readonly campaignsService: CampaignsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const campaignId = req.params.id;

    if (campaignId && req.method === 'GET' && req.path.includes('/campaigns/')) {
      try {
        await this.campaignsService.incrementCampaignViews(campaignId);
        await this.campaignsService.handleCampaignViewed(campaignId);
      } catch (error) {
        // Neblokuj request kvůli chybě při trackování
        console.error('Error tracking campaign view:', error);
      }
    }

    next();
  }
}
