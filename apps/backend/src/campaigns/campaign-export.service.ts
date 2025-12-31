import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';
import { CampaignContribution } from './entities/campaign-contribution.entity';
import { Campaign } from './entities/campaign.entity';
import { ExportContributionsDto } from './dto/export-contributions.dto';
import { AuditLogService, AuditAction } from '../audit-log';

interface ContributionForExport {
  id: string;
  amount: number;
  message: string | null;
  isRefunded: boolean;
  createdAt: Date;
  contributorName: string;
  contributorEmail: string;
}

@Injectable()
export class CampaignExportService {
  constructor(
    @Inject('CAMPAIGN_CONTRIBUTION_REPOSITORY')
    private contributionRepository: Repository<CampaignContribution>,
    @Inject('CAMPAIGN_REPOSITORY')
    private campaignRepository: Repository<Campaign>,
    private auditLogService: AuditLogService,
  ) {}

  async getFilteredContributions(
    filters: ExportContributionsDto,
  ): Promise<ContributionForExport[]> {
    const { campaignId, startDate, endDate, includeRefunded } = filters;

    const queryBuilder = this.contributionRepository
      .createQueryBuilder('contribution')
      .leftJoinAndSelect('contribution.contributor', 'contributor')
      .where('contribution.campaignId = :campaignId', { campaignId });

    if (startDate && endDate) {
      queryBuilder.andWhere('contribution.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('contribution.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('contribution.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    if (!includeRefunded) {
      queryBuilder.andWhere('contribution.isRefunded = :isRefunded', { isRefunded: false });
    }

    queryBuilder.orderBy('contribution.createdAt', 'DESC');

    const contributions = await queryBuilder.getMany();

    return contributions.map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      message: c.message ?? null,
      isRefunded: c.isRefunded,
      createdAt: c.createdAt,
      contributorName: c.contributor?.name ?? 'Anonymous',
      contributorEmail: c.contributor?.email ?? '',
    }));
  }

  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.campaignRepository.findOne({ where: { id: campaignId } });
  }

  generateCsv(contributions: ContributionForExport[]): Buffer {
    const records = contributions.map((c) => ({
      'Contribution ID': c.id,
      'Contributor Name': c.contributorName,
      'Contributor Email': c.contributorEmail,
      'Amount': c.amount.toFixed(2),
      'Message': c.message ?? '',
      'Refunded': c.isRefunded ? 'Yes' : 'No',
      'Date': c.createdAt.toISOString(),
    }));

    const csv = stringify(records, {
      header: true,
      columns: ['Contribution ID', 'Contributor Name', 'Contributor Email', 'Amount', 'Message', 'Refunded', 'Date'],
    });

    return Buffer.from(csv, 'utf-8');
  }

  async generatePdf(
    contributions: ContributionForExport[],
    campaign: Campaign,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4',
          bufferPages: true,
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Title
        doc.fontSize(20).font('Helvetica-Bold').text('Campaign Contributions Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica').text(campaign.name, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Summary
        const total = contributions.reduce((sum, c) => sum + c.amount, 0);
        const refundedCount = contributions.filter((c) => c.isRefunded).length;

        doc.fontSize(14).font('Helvetica-Bold').text('Summary');
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Total Contributions: ${contributions.length}`);
        doc.text(`Total Amount: $${total.toFixed(2)}`);
        doc.text(`Refunded: ${refundedCount}`);
        doc.moveDown(1.5);

        // Table
        doc.fontSize(14).font('Helvetica-Bold').text('Contributions');
        doc.moveDown(0.5);

        if (contributions.length === 0) {
          doc.fontSize(11).font('Helvetica').text('No contributions found.');
        } else {
          // Table header
          const tableTop = doc.y;
          const col1 = 50;
          const col2 = 180;
          const col3 = 280;
          const col4 = 350;
          const col5 = 420;

          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Contributor', col1, tableTop);
          doc.text('Amount', col2, tableTop);
          doc.text('Date', col3, tableTop);
          doc.text('Refunded', col4, tableTop);
          doc.text('Message', col5, tableTop);

          // Draw header line
          doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke();

          doc.font('Helvetica').fontSize(9);
          let y = tableTop + 25;

          contributions.forEach((c) => {
            // Check if we need a new page
            if (y > 750) {
              doc.addPage();
              y = 50;
            }

            const name = c.contributorName.length > 20
              ? c.contributorName.substring(0, 20) + '...'
              : c.contributorName;
            const message = c.message
              ? (c.message.length > 15 ? c.message.substring(0, 15) + '...' : c.message)
              : '-';

            doc.text(name, col1, y, { width: 120 });
            doc.text(`$${c.amount.toFixed(2)}`, col2, y, { width: 90 });
            doc.text(c.createdAt.toLocaleDateString(), col3, y, { width: 65 });
            doc.text(c.isRefunded ? 'Yes' : 'No', col4, y, { width: 60 });
            doc.text(message, col5, y, { width: 100 });

            y += 18;
          });
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Log an export action to the audit log
   */
  async logExport(
    campaignId: string,
    format: string,
    actorId: string,
    contributionCount: number,
    campaignOwnerId?: string,
  ): Promise<void> {
    await this.auditLogService.logSuccess(
      AuditAction.EXPORT_CONTRIBUTIONS,
      'campaign',
      campaignId,
      `Exported ${contributionCount} contributions in ${format.toUpperCase()} format`,
      {
        actorId,
        metadata: {
          format,
          contributionCount,
        },
        entityOwnerId: campaignOwnerId,
      },
    );
  }
}
