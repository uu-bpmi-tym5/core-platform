import {
  Controller,
  Get,
  Query,
  Res,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CampaignExportService } from './campaign-export.service';
import { CampaignsService } from './campaigns.service';
import { ExportContributionsDto, ExportFormat } from './dto/export-contributions.dto';
import { JwtPayload } from '../auth/auth.service';
import { Role } from '../auth/enums';

@Controller('campaigns')
export class CampaignExportController {
  constructor(
    private readonly exportService: CampaignExportService,
    private readonly campaignsService: CampaignsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('export')
  async exportContributions(
    @Query() query: ExportContributionsDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Extract and verify JWT from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ForbiddenException('Authorization required');
      }

      const token = authHeader.split(' ')[1];
      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      } catch {
        throw new ForbiddenException('Invalid token');
      }

      const { campaignId, format = ExportFormat.CSV } = query;

      if (!campaignId) {
        throw new BadRequestException('campaignId is required');
      }

      // Check if campaign exists
      const campaign = await this.exportService.getCampaign(campaignId);
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      // Check ownership (or admin access)
      const isOwner = await this.campaignsService.isOwner(campaignId, payload.userId);
      if (!isOwner && payload.role !== Role.ADMIN) {
        throw new ForbiddenException('You can only export contributions for your own campaigns');
      }

      // Get filtered contributions
      const contributions = await this.exportService.getFilteredContributions(query);

      // Generate file based on format
      const filename = `contributions-${campaignId}-${Date.now()}`;

      if (format === ExportFormat.PDF) {
        const pdfBuffer = await this.exportService.generatePdf(contributions, campaign);
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        });
        res.end(pdfBuffer);
      } else {
        const csvBuffer = this.exportService.generateCsv(contributions);
        res.set({
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'Content-Length': csvBuffer.length.toString(),
          'Cache-Control': 'no-cache',
        });
        res.end(csvBuffer);
      }
    } catch (error) {
      // Return JSON error instead of HTML
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to generate export',
        });
      }
    }
  }
}

