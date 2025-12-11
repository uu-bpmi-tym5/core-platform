import {Inject, Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {Repository} from 'typeorm';
import {Campaign, CampaignStatus} from './entities/campaign.entity';
import {CampaignFeedback} from './entities/campaign-feedback.entity';
import {CampaignStats} from './entities/campaign-stats.entity';
import {CampaignContribution} from './entities/campaign-contribution.entity';
import {Comment} from './entities/comment.entity';
import {CreateCampaignFeedbackInput, CreateCampaignInput, UpdateCampaignInput, UpdateCampaignStatsInput} from './dto';
import {NotificationsClient} from '../notifications/notifications.client';
import {CommentStatus, } from './entities/comment.entity';
import {ReportCommentInput, ModerateCommentInput, ModerationAction, DeleteMyCommentInput,} from './dto/moderation.input';
import {ForbiddenException} from '@nestjs/common';
import {CommentReport} from './entities/comment-report.entity';

//Threshold pro automatické skrytí komentáře po nahlášení
const AUTO_HIDE_THRESHOLD = 5;

@Injectable()
export class CampaignsService {
  constructor(
    @Inject('CAMPAIGN_REPOSITORY')
    private campaignRepository: Repository<Campaign>,
    @Inject('CAMPAIGN_FEEDBACK_REPOSITORY')
    private campaignFeedbackRepository: Repository<CampaignFeedback>,
    @Inject('CAMPAIGN_STATS_REPOSITORY')
    private campaignStatsRepository: Repository<CampaignStats>,
    @Inject('CAMPAIGN_CONTRIBUTION_REPOSITORY')
    private contributionRepository: Repository<CampaignContribution>,
    @Inject('COMMENT_REPOSITORY')
    private commentRepository: Repository<Comment>,
    private notificationsClient: NotificationsClient,
    @Inject('COMMENT_REPORT_REPOSITORY')
    private commentReportRepository: Repository<CommentReport>,
  ) {}

  async createCampaign(createCampaignInput: CreateCampaignInput, creatorId: string): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignInput,
      creatorId,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);

    await this.createCampaignStats(savedCampaign.id);

    // Pošleme notifikaci o vytvoření nové kampaně přes mikroslužbu
    await this.notificationsClient.createSuccessNotification(
      creatorId,
      'Kampaň byla úspěšně vytvořena',
      `Draft vaší kampaně "${savedCampaign.name}" byl úspěšně vytvořen.`,
      `/campaigns/${savedCampaign.id}`
    );

    return savedCampaign;
  }

  async findAllCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.find({
      relations: ['creator'],
      where: {
        status: CampaignStatus.APPROVED
      }
    });
  }

  async findCampaignById(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async updateCampaign(id: string, updateCampaignInput: UpdateCampaignInput): Promise<Campaign> {
    const oldCampaign = await this.findCampaignById(id);
    await this.campaignRepository.update(id, updateCampaignInput);
    const updatedCampaign = await this.findCampaignById(id);

    // Notifikace pro změnu statusu
    if (oldCampaign.status !== updatedCampaign.status) {
      await this.handleStatusChangeNotification(updatedCampaign, oldCampaign.status);
    }

    // Notifikace pro změnu cíle
    if (oldCampaign.goal !== updatedCampaign.goal) {
      await this.notificationsClient.createInfoNotification(
        updatedCampaign.creatorId,
        'Cíl kampaně byl aktualizován',
        `Cíl vaší kampaně "${updatedCampaign.name}" byl změněn z ${oldCampaign.goal} na ${updatedCampaign.goal} Kč`,
        `/campaigns/${updatedCampaign.id}`
      );
    }

    // Notifikace pro změnu názvu
    if (oldCampaign.name !== updatedCampaign.name) {
      await this.notificationsClient.createInfoNotification(
        updatedCampaign.creatorId,
        'Název kampaně byl změněn',
        `Název vaší kampaně byl změněn z "${oldCampaign.name}" na "${updatedCampaign.name}"`,
        `/campaigns/${updatedCampaign.id}`
      );
    }

    return updatedCampaign;
  }

  async removeCampaign(id: string): Promise<boolean> {
    await this.campaignRepository.delete(id);
    return true;
  }

  async findCampaignsByCreator(creatorId: string): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { creatorId },
      relations: ['creator'],
    });
  }

  async createCampaignFeedback(createFeedbackInput: CreateCampaignFeedbackInput, moderatorId: string): Promise<CampaignFeedback> {
    const feedback = this.campaignFeedbackRepository.create({
      ...createFeedbackInput,
      moderatorId,
    });

    return this.campaignFeedbackRepository.save(feedback);
  }

  async findCampaignFeedback(campaignId: string): Promise<CampaignFeedback[]> {
    return this.campaignFeedbackRepository.find({
      where: { campaignId },
      relations: ['campaign', 'moderator'],
      order: { createdAt: 'DESC' },
    });
  }

  async removeCampaignFeedback(id: string): Promise<boolean> {
    await this.campaignFeedbackRepository.delete(id);
    return true;
  }

  async createCampaignStats(campaignId: string): Promise<CampaignStats> {
    const stats = this.campaignStatsRepository.create({
      campaignId,
      viewsCount: 0,
      contributionsCount: 0,
      totalFunding: 0,
    });

    return this.campaignStatsRepository.save(stats);
  }

  async findCampaignStats(campaignId: string): Promise<CampaignStats> {
    const stats = await this.campaignStatsRepository.findOne({
      where: { campaignId },
      relations: ['campaign'],
    });

    if (!stats) {
      throw new NotFoundException(`Campaign stats for campaign ${campaignId} not found`);
    }

    return stats;
  }

  async updateCampaignStats(updateStatsInput: UpdateCampaignStatsInput): Promise<CampaignStats> {
    const { campaignId, ...updateData } = updateStatsInput;

    await this.campaignStatsRepository.update({ campaignId }, updateData);
    return this.findCampaignStats(campaignId);
  }

  async incrementCampaignViews(campaignId: string): Promise<CampaignStats> {
    await this.campaignStatsRepository.increment({ campaignId }, 'viewsCount', 1);
    return this.findCampaignStats(campaignId);
  }

  async incrementCampaignContributions(campaignId: string, amount: number): Promise<CampaignStats> {
    await this.campaignStatsRepository.increment({ campaignId }, 'contributionsCount', 1);
    await this.campaignStatsRepository.increment({ campaignId }, 'totalFunding', amount);

    await this.campaignRepository.increment({ id: campaignId }, 'currentAmount', amount);

    return this.findCampaignStats(campaignId);
  }

  async isOwner(campaignId: string, userId: string): Promise<boolean> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      select: ['creatorId'],
    });

    return campaign?.creatorId === userId;
  }

  async approveCampaign(campaignId: string): Promise<Campaign> {
    await this.campaignRepository.update(campaignId, { status: CampaignStatus.APPROVED });
    return this.findCampaignById(campaignId);
  }

  async rejectCampaign(campaignId: string): Promise<Campaign> {
    await this.campaignRepository.update(campaignId, { status: CampaignStatus.REJECTED });
    return this.findCampaignById(campaignId);
  }

  async submitCampaign(campaignId: string): Promise<Campaign> {
    await this.campaignRepository.update(campaignId, { status: CampaignStatus.SUBMITTED });
    return this.findCampaignById(campaignId);
  }

  async findPendingCampaigns(): Promise<Campaign[]> {
    return this.campaignRepository.find({
      where: { status: CampaignStatus.SUBMITTED },
      relations: ['creator'],
      order: { createdAt: 'ASC' },
    });
  }

  private async handleStatusChangeNotification(campaign: Campaign, oldStatus: CampaignStatus): Promise<void> {
    const { creatorId, name, id, status } = campaign;

    switch (status) {
      case CampaignStatus.APPROVED:
        await this.notificationsClient.createSuccessNotification(
          creatorId,
          'Kampaň byla schválena! 🎉',
          `Vaše kampaň "${name}" byla úspěšně schválena a je nyní veřejně dostupná`,
          `/campaigns/${id}`
        );
        break;

      case CampaignStatus.REJECTED:
        await this.notificationsClient.createErrorNotification(
          creatorId,
          'Kampaň byla zamítnuta',
          `Vaše kampaň "${name}" byla zamítnuta. Zkontrolujte feedback pro více informací`,
          `/campaigns/${id}`
        );
        break;

      case CampaignStatus.SUBMITTED:
        await this.notificationsClient.createInfoNotification(
          creatorId,
          'Kampaň odeslána ke schválení',
          `Vaše kampaň "${name}" byla odeslána ke schválení. Očekávejte odpověď do 3 pracovních dnů`,
          `/campaigns/${id}`
        );
        break;

      case CampaignStatus.DELETED:
        await this.notificationsClient.createWarningNotification(
          creatorId,
          'Kampaň byla smazána',
          `Vaše kampaň "${name}" byla smazána`,
          `/campaigns`
        );
        break;

      default:
        await this.notificationsClient.createInfoNotification(
          creatorId,
          'Stav kampaně byl změněn',
          `Stav vaší kampaně "${name}" byl změněn z ${oldStatus} na ${status}`,
          `/campaigns/${id}`
        );
    }
  }

  async handleDonationReceived(campaignId: string, amount: number, donorName?: string): Promise<void> {
    const campaign = await this.findCampaignById(campaignId);
    const donorText = donorName ? `od ${donorName}` : 'od anonymního dárce';

    await this.notificationsClient.createSuccessNotification(
      campaign.creatorId,
      'Nový příspěvek! 💰',
      `Vaše kampaň "${campaign.name}" získala příspěvek ${amount} Kč ${donorText}`,
      `/campaigns/${campaign.id}`,
    );

    // Zkontrolujeme, jestli dosáhla cíle
    const updatedStats = await this.findCampaignStats(campaignId);
    if (updatedStats.totalFunding >= campaign.goal) {
      await this.notificationsClient.createSuccessNotification(
        campaign.creatorId,
        'Cíl kampaně dosažen! 🎯',
        `Gratulujeme! Vaše kampaň "${campaign.name}" dosáhla svého cíle ${campaign.goal} Kč`,
        `/campaigns/${campaign.id}`
      );
    }
  }

  async handleCampaignViewed(campaignId: string): Promise<void> {
    const campaign = await this.findCampaignById(campaignId);
    const stats = await this.findCampaignStats(campaignId);

    // Notifikujeme každých 100 zobrazení
    if (stats.viewsCount > 0 && stats.viewsCount % 100 === 0) {
      await this.notificationsClient.createInfoNotification(
        campaign.creatorId,
        'Milestone dosažen! 👀',
        `Vaše kampaň "${campaign.name}" dosáhla ${stats.viewsCount} zobrazení`,
        `/campaigns/${campaign.id}/stats`
      );
    }
  }

  async deleteCampaignWithRefunds(campaignId: string, userId: string, reason: string): Promise<boolean> {
    const campaign = await this.findCampaignById(campaignId);

    // Zkontroluj, jestli je uživatel vlastníkem nebo adminem
    if (campaign.creatorId !== userId) {
      throw new BadRequestException('Pouze vlastník kampaně může smazat kampaň');
    }

    // Najdi všechny příspěvky k této kampani
    const contributions = await this.contributionRepository.find({
      where: {
        campaignId,
        isRefunded: false
      },
      relations: ['contributor'],
    });

    // Pokud má kampaň příspěvky, vrať je
    if (contributions.length > 0) {
      // Pozn: Tady by normálně volal WalletService, ale kvůli circular dependency
      // to řešíme jinak - vytvoříme událost, kterou zpracuje WalletService
      for (const contribution of contributions) {
        // Vrať příspěvek přímo v databázi
        await this.contributionRepository.update(contribution.id, { isRefunded: true });

        // Pošli notifikaci přispěvateli
        await this.notificationsClient.createWarningNotification(
          contribution.contributorId,
          'Kampaň byla smazána - příspěvek vrácen 💸',
          `Kampaň "${campaign.name}" byla smazána. Váš příspěvek ${contribution.amount} $ byl vrácen zpět na váš účet. Důvod: ${reason}`,
          `/wallet`
        );
      }

      const totalRefunded = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

      // Pošli notifikaci vlastníkovi
      await this.notificationsClient.createInfoNotification(
        userId,
        'Kampaň smazána s vrácením příspěvků',
        `Vaše kampaň "${campaign.name}" byla smazána. Celkem bylo vráceno ${totalRefunded} $ ve ${contributions.length} příspěvcích.`,
        `/campaigns`
      );
    }

    // Označ kampaň jako smazanou
    await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.DELETED
    });

    return true;
  }

  async getCampaignContributions(campaignId: string): Promise<CampaignContribution[]> {
    return this.contributionRepository.find({
      where: { campaignId },
      relations: ['contributor', 'campaign'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCampaignContributionStats(campaignId: string): Promise<{
    totalContributions: number;
    totalAmount: number;
    averageContribution: number;
    contributorsCount: number;
  }> {
    const contributions = await this.contributionRepository.find({
      where: {
        campaignId,
        isRefunded: false
      },
    });

    const totalContributions = contributions.length;
    const totalAmount = contributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const uniqueContributors = new Set(contributions.map(c => c.contributorId)).size;
    const averageContribution = totalContributions > 0 ? totalAmount / totalContributions : 0;

    return {
      totalContributions,
      totalAmount,
      averageContribution,
      contributorsCount: uniqueContributors,
    };
  }
  async addComment(campaignId: string, userId: string, content: string): Promise<Comment> {
    const comment = this.commentRepository.create({
      campaignId,
      userId,
      content,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Fetch with relations to return full object
    const foundComment = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user', 'campaign'],
    });

    if (!foundComment) {
      throw new NotFoundException('Comment not found after creation');
    }

    return foundComment;
  }

  
  //report komentáře
  async reportComment(userId: string, input: ReportCommentInput): Promise<{ success: boolean; message?: string }> {
    const comment = await this.commentRepository.findOne({ where: { id: input.commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.status === CommentStatus.REMOVED) {
      throw new BadRequestException('Cannot report a removed comment');
    }
    

    //auto skrytí při překročení limitu
    const existingReport = await this.commentReportRepository.findOne({
      where: {
        userId: userId,
        commentId: input.commentId
      }
    });

    if (existingReport) {
      //když už user komentář nahlásil tak mu to nedovolí reportnout znovu
      throw new BadRequestException('You have already reported this comment');
    }else{

      //vytoření reportu
      const report = this.commentReportRepository.create({
        userId,
        commentId: input.commentId,
      });
    
      await this.commentReportRepository.save(report);

      comment.reportsCount += 1;
      comment.lastReportedAt = new Date();

      if (comment.reportsCount >= AUTO_HIDE_THRESHOLD) {
        comment.status = CommentStatus.HIDDEN;
      }
    }
    await this.commentRepository.save(comment);

    return { success: true };
  }

  async moderateComment(moderatorId: string, input: ModerateCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: input.commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Aplikace akce
    switch (input.action) {
      case ModerationAction.HIDE:
        comment.status = CommentStatus.HIDDEN;
        break;
      case ModerationAction.REMOVE:
        comment.status = CommentStatus.REMOVED;
        break;
      case ModerationAction.RESTORE:
        comment.status = CommentStatus.VISIBLE;
        break;
    }

    comment.moderatedBy = moderatorId;
    if (input.reason) {
      comment.moderationReason = input.reason;
    }

    return this.commentRepository.save(comment);
  }

  async deleteMyComment(userId: string, input: DeleteMyCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: input.commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Kontrola vlastnictví
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete - nastavení statusu na REMOVED
    comment.status = CommentStatus.REMOVED;
    // Volitelně: Můžeme přepsat obsah, jak je v zadání
    comment.content = '[Deleted by author]'; 

    return this.commentRepository.save(comment);
  }

  //Úprava metody pro ziskani komentaru, vraci pouze viditelne komentare
  async getComments(campaignId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { 
        campaignId,
        status: CommentStatus.VISIBLE
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
  
}
