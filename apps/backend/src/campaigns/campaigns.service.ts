import {Inject, Injectable, NotFoundException, BadRequestException} from '@nestjs/common';
import {Repository} from 'typeorm';
import {Campaign, CampaignStatus} from './entities/campaign.entity';
import {CampaignFeedback} from './entities/campaign-feedback.entity';
import {CampaignStats} from './entities/campaign-stats.entity';
import {CampaignContribution} from './entities/campaign-contribution.entity';
import {Comment} from './entities/comment.entity';
import {CampaignSurvey} from './entities/campaign-survey.entity';
import {CampaignSurveyResponse} from './entities/campaign-survey-response.entity';
import {CreateCampaignFeedbackInput, CreateCampaignInput, UpdateCampaignInput, UpdateCampaignStatsInput, CreateCampaignSurveyInput, SubmitSurveyResponseInput} from './dto';
import {NotificationsClient} from '../notifications/notifications.client';
import {CommentStatus, } from './entities/comment.entity';
import {ReportCommentInput, ModerateCommentInput, ModerationAction, DeleteMyCommentInput,} from './dto/moderation.input';
import {ForbiddenException} from '@nestjs/common';
import {CommentReport} from './entities/comment-report.entity';
import {AuditLogService, AuditAction} from '../audit-log';
import {ComplianceRun} from './entities/compliance.entity';

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
    @Inject('CAMPAIGN_SURVEY_REPOSITORY')
    private surveyRepository: Repository<CampaignSurvey>,
    @Inject('CAMPAIGN_SURVEY_RESPONSE_REPOSITORY')
    private surveyResponseRepository: Repository<CampaignSurveyResponse>,
    private auditLogService: AuditLogService,
    @Inject('COMPLIANCE_RUN_REPOSITORY')
    private complianceRunRepository: Repository<ComplianceRun>,
  ) {}

  async createCampaign(createCampaignInput: CreateCampaignInput, creatorId: string): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignInput,
      creatorId,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);

    await this.createCampaignStats(savedCampaign.id);

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_CREATE,
      'campaign',
      savedCampaign.id,
      `Campaign "${savedCampaign.name}" was created`,
      {
        actorId: creatorId,
        newValues: {
          name: savedCampaign.name,
          goal: savedCampaign.goal,
          status: savedCampaign.status,
        },
        entityOwnerId: creatorId,
      },
    );

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

  async updateCampaign(id: string, updateCampaignInput: UpdateCampaignInput, actorId?: string): Promise<Campaign> {
    const oldCampaign = await this.findCampaignById(id);
    await this.campaignRepository.update(id, updateCampaignInput);
    const updatedCampaign = await this.findCampaignById(id);

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_UPDATE,
      'campaign',
      id,
      `Campaign "${updatedCampaign.name}" was updated`,
      {
        actorId: actorId || oldCampaign.creatorId,
        oldValues: {
          name: oldCampaign.name,
          goal: oldCampaign.goal,
          status: oldCampaign.status,
          description: oldCampaign.description,
        },
        newValues: {
          name: updatedCampaign.name,
          goal: updatedCampaign.goal,
          status: updatedCampaign.status,
          description: updatedCampaign.description,
        },
        entityOwnerId: updatedCampaign.creatorId,
      },
    );

    if (oldCampaign.status !== updatedCampaign.status) {
      await this.handleStatusChangeNotification(updatedCampaign, oldCampaign.status);
    }

    if (oldCampaign.goal !== updatedCampaign.goal) {
      await this.notificationsClient.createInfoNotification(
        updatedCampaign.creatorId,
        'Cíl kampaně byl aktualizován',
        `Cíl vaší kampaně "${updatedCampaign.name}" byl změněn z ${oldCampaign.goal} na ${updatedCampaign.goal} Kč`,
        `/campaigns/${updatedCampaign.id}`
      );
    }

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

  async removeCampaign(id: string, actorId?: string): Promise<boolean> {
    const campaign = await this.findCampaignById(id);

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_DELETE,
      'campaign',
      id,
      `Campaign "${campaign.name}" was deleted`,
      {
        actorId: actorId || campaign.creatorId,
        oldValues: {
          name: campaign.name,
          goal: campaign.goal,
          status: campaign.status,
        },
        entityOwnerId: campaign.creatorId,
      },
    );

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

  async approveCampaign(campaignId: string, moderatorId?: string, skipComplianceCheck: boolean = false): Promise<Campaign> {
    const oldCampaign = await this.findCampaignById(campaignId);

    if (!skipComplianceCheck) {
      const latestRun = await this.complianceRunRepository.findOne({
        where: { campaignId },
        order: { createdAt: 'DESC' },
      });

      if (!latestRun) {
        throw new BadRequestException(
          'Cannot approve campaign: No compliance checks have been run. Please run compliance checks first.'
        );
      }

      if (!latestRun.canApprove) {
        throw new BadRequestException(
          `Cannot approve campaign: ${latestRun.blockerCount} blocker check(s) failed. ` +
          'Please resolve the issues or request an admin override.'
        );
      }
    }

    await this.campaignRepository.update(campaignId, { status: CampaignStatus.APPROVED });
    const campaign = await this.findCampaignById(campaignId);

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_APPROVE,
      'campaign',
      campaignId,
      `Campaign "${campaign.name}" was approved`,
      {
        actorId: moderatorId,
        oldValues: { status: oldCampaign.status },
        newValues: { status: CampaignStatus.APPROVED },
        entityOwnerId: campaign.creatorId,
        metadata: { skipComplianceCheck },
      },
    );

    return campaign;
  }

  async rejectCampaign(campaignId: string, moderatorId?: string): Promise<Campaign> {
    const oldCampaign = await this.findCampaignById(campaignId);
    await this.campaignRepository.update(campaignId, { status: CampaignStatus.REJECTED });
    const campaign = await this.findCampaignById(campaignId);

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_REJECT,
      'campaign',
      campaignId,
      `Campaign "${campaign.name}" was rejected`,
      {
        actorId: moderatorId,
        oldValues: { status: oldCampaign.status },
        newValues: { status: CampaignStatus.REJECTED },
        entityOwnerId: campaign.creatorId,
      },
    );

    return campaign;
  }

  async submitCampaign(campaignId: string, userId?: string): Promise<Campaign> {
    const oldCampaign = await this.findCampaignById(campaignId);
    await this.campaignRepository.update(campaignId, { status: CampaignStatus.SUBMITTED });
    const campaign = await this.findCampaignById(campaignId);

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_SUBMIT,
      'campaign',
      campaignId,
      `Campaign "${campaign.name}" was submitted for review`,
      {
        actorId: userId || campaign.creatorId,
        oldValues: { status: oldCampaign.status },
        newValues: { status: CampaignStatus.SUBMITTED },
        entityOwnerId: campaign.creatorId,
      },
    );

    return campaign;
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

    if (campaign.creatorId !== userId) {
      throw new BadRequestException('Pouze vlastník kampaně může smazat kampaň');
    }

    const contributions = await this.contributionRepository.find({
      where: {
        campaignId,
        isRefunded: false
      },
      relations: ['contributor'],
    });

    if (contributions.length > 0) {
      // Pozn: Tady by normálně volal WalletService, ale kvůli circular dependency
      // to řešíme jinak - vytvoříme událost, kterou zpracuje WalletService
      for (const contribution of contributions) {
        await this.contributionRepository.update(contribution.id, { isRefunded: true });

        await this.notificationsClient.createWarningNotification(
          contribution.contributorId,
          'Kampaň byla smazána - příspěvek vrácen 💸',
          `Kampaň "${campaign.name}" byla smazána. Váš příspěvek ${contribution.amount} $ byl vrácen zpět na váš účet. Důvod: ${reason}`,
          `/wallet`
        );
      }

      const totalRefunded = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

      await this.notificationsClient.createInfoNotification(
        userId,
        'Kampaň smazána s vrácením příspěvků',
        `Vaše kampaň "${campaign.name}" byla smazána. Celkem bylo vráceno ${totalRefunded} $ ve ${contributions.length} příspěvcích.`,
        `/campaigns`
      );
    }

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

    const foundComment = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user', 'campaign'],
    });

    if (!foundComment) {
      throw new NotFoundException('Comment not found after creation');
    }

    const campaign = foundComment.campaign;
    if (campaign && campaign.creatorId !== userId) {
      const commenterName = foundComment.user?.email || 'Někdo';
      const commentPreview = content.length > 50 ? content.substring(0, 50) + '...' : content;

      await this.notificationsClient.createInfoNotification(
        campaign.creatorId,
        'Nový komentář ke kampani 💬',
        `${commenterName} přidal komentář ke kampani "${campaign.name}": "${commentPreview}"`,
        `/campaigns/${campaignId}`
      );
    }

    return foundComment;
  }

  
  async reportComment(userId: string, input: ReportCommentInput): Promise<{ success: boolean; message?: string }> {
    const comment = await this.commentRepository.findOne({ where: { id: input.commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.status === CommentStatus.REMOVED) {
      throw new BadRequestException('Cannot report a removed comment');
    }
    

    const existingReport = await this.commentReportRepository.findOne({
      where: {
        userId: userId,
        commentId: input.commentId
      }
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this comment');
    }else{

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

    const oldStatus = comment.status;

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

    const savedComment = await this.commentRepository.save(comment);

    await this.auditLogService.logSuccess(
      AuditAction.COMMENT_MODERATE,
      'comment',
      input.commentId,
      `Comment moderated: ${input.action}`,
      {
        actorId: moderatorId,
        oldValues: { status: oldStatus },
        newValues: { status: comment.status, moderationReason: input.reason },
        entityOwnerId: comment.userId,
      },
    );

    return savedComment;
  }

  async deleteMyComment(userId: string, input: DeleteMyCommentInput): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id: input.commentId } });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.status = CommentStatus.REMOVED;
    comment.content = '[Deleted by author]';

    return this.commentRepository.save(comment);
  }

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

  async createCampaignSurvey(input: CreateCampaignSurveyInput, creatorId: string): Promise<CampaignSurvey> {
    const campaign = await this.findCampaignById(input.campaignId);
    if (campaign.creatorId !== creatorId) {
      throw new ForbiddenException('Only campaign owner can create surveys');
    }

    const survey = this.surveyRepository.create({
      ...input,
      creatorId,
    });

    const savedSurvey = await this.surveyRepository.save(survey);

    const contributions = await this.contributionRepository.find({
      where: { campaignId: input.campaignId },
      relations: ['contributor'],
    });

    const backerIds = [...new Set(contributions.map(c => c.contributorId))];

    for (const backerId of backerIds) {
      await this.notificationsClient.createInfoNotification(
        backerId,
        'New Survey Available',
        `"${campaign.name}" creator requests your feedback: ${input.title}`,
        `/campaigns/${input.campaignId}/survey/${savedSurvey.id}`
      );
    }

    return savedSurvey;
  }

  async getCampaignSurveys(campaignId: string): Promise<CampaignSurvey[]> {
    return this.surveyRepository.find({
      where: { campaignId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSurveyById(surveyId: string): Promise<CampaignSurvey> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: ['campaign', 'creator'],
    });

    if (!survey) {
      throw new NotFoundException(`Survey with ID ${surveyId} not found`);
    }

    return survey;
  }

  async submitSurveyResponse(input: SubmitSurveyResponseInput, respondentId: string): Promise<CampaignSurveyResponse> {
    const survey = await this.getSurveyById(input.surveyId);

    if (!survey.isActive) {
      throw new BadRequestException('This survey is no longer active');
    }

    const contribution = await this.contributionRepository.findOne({
      where: {
        campaignId: survey.campaignId,
        contributorId: respondentId,
      },
    });

    if (!contribution) {
      throw new ForbiddenException('Only campaign backers can respond to surveys');
    }

    const existingResponse = await this.surveyResponseRepository.findOne({
      where: {
        surveyId: input.surveyId,
        respondentId,
      },
    });

    if (existingResponse) {
      throw new BadRequestException('You have already responded to this survey');
    }

    if (input.answers.length !== survey.questions.length) {
      throw new BadRequestException('Number of answers must match number of questions');
    }

    const response = this.surveyResponseRepository.create({
      ...input,
      respondentId,
    });

    const savedResponse = await this.surveyResponseRepository.save(response);

    await this.notificationsClient.createInfoNotification(
      survey.creatorId,
      'New Survey Response',
      `Someone responded to your survey: ${survey.title}`,
      `/dashboard/campaigns/${survey.campaignId}/surveys/${survey.id}`
    );

    return savedResponse;
  }

  async getSurveyResponses(surveyId: string, requestingUserId: string): Promise<CampaignSurveyResponse[]> {
    const survey = await this.getSurveyById(surveyId);

    if (survey.creatorId !== requestingUserId) {
      throw new ForbiddenException('Only campaign owner can view survey responses');
    }

    return this.surveyResponseRepository.find({
      where: { surveyId },
      relations: ['respondent'],
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserRespondedToSurvey(surveyId: string, userId: string): Promise<boolean> {
    const response = await this.surveyResponseRepository.findOne({
      where: {
        surveyId,
        respondentId: userId,
      },
    });

    return !!response;
  }

  async closeSurvey(surveyId: string, userId: string): Promise<CampaignSurvey> {
    const survey = await this.getSurveyById(surveyId);

    if (survey.creatorId !== userId) {
      throw new ForbiddenException('Only campaign owner can close surveys');
    }

    survey.isActive = false;
    survey.closedAt = new Date();

    return this.surveyRepository.save(survey);
  }

}
