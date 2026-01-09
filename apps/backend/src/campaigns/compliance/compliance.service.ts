import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  ComplianceCheckResult,
  ComplianceRun,
  ComplianceCheckStatus,
  ComplianceRuleSeverity,
} from '../entities/compliance.entity';
import { Campaign, CampaignStatus } from '../entities/campaign.entity';
import { getAllComplianceRules, COMPLIANCE_RULES } from './compliance-rules';
import { AuditLogService, AuditAction } from '../../audit-log';

@Injectable()
export class ComplianceService {
  constructor(
    @Inject('COMPLIANCE_CHECK_RESULT_REPOSITORY')
    private checkResultRepository: Repository<ComplianceCheckResult>,
    @Inject('COMPLIANCE_RUN_REPOSITORY')
    private runRepository: Repository<ComplianceRun>,
    @Inject('CAMPAIGN_REPOSITORY')
    private campaignRepository: Repository<Campaign>,
    private auditLogService: AuditLogService,
  ) {}

  async runComplianceChecks(
    campaignId: string,
    userId?: string,
  ): Promise<ComplianceRun> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SUBMITTED) {
      throw new BadRequestException(
        `Cannot run compliance checks on a campaign with status ${campaign.status}`
      );
    }

    const runId = uuidv4();
    const rules = getAllComplianceRules();
    const results: ComplianceCheckResult[] = [];

    let passedChecks = 0;
    let failedChecks = 0;
    let warningChecks = 0;
    let blockerCount = 0;

    for (const rule of rules) {
      const checkResult = rule.check(campaign);

      const result = this.checkResultRepository.create({
        campaignId,
        runId,
        ruleId: rule.id,
        ruleName: rule.name,
        ruleCategory: rule.category,
        ruleSeverity: rule.severity,
        status: checkResult.status,
        message: checkResult.message,
        evidence: checkResult.evidence,
        checkedById: userId,
      });

      results.push(result);

      switch (checkResult.status) {
        case ComplianceCheckStatus.PASS:
          passedChecks++;
          break;
        case ComplianceCheckStatus.FAIL:
          failedChecks++;
          if (rule.severity === ComplianceRuleSeverity.BLOCKER) {
            blockerCount++;
          }
          break;
        case ComplianceCheckStatus.WARN:
          warningChecks++;
          break;
      }
    }

    await this.checkResultRepository.save(results);

    const run = this.runRepository.create({
      id: runId,
      campaignId,
      totalChecks: rules.length,
      passedChecks,
      failedChecks,
      warningChecks,
      blockerCount,
      canApprove: blockerCount === 0,
      isOverridden: false,
      runById: userId,
    });

    const savedRun = await this.runRepository.save(run);

    savedRun.results = results;

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_SUBMIT,
      'compliance_run',
      runId,
      `Compliance checks run for campaign "${campaign.name}": ${passedChecks} passed, ${failedChecks} failed, ${warningChecks} warnings`,
      {
        actorId: userId,
        metadata: {
          campaignId,
          passedChecks,
          failedChecks,
          warningChecks,
          blockerCount,
          canApprove: blockerCount === 0,
        },
        entityOwnerId: campaign.creatorId,
      },
    );

    return savedRun;
  }

  async getLatestRun(campaignId: string): Promise<ComplianceRun | null> {
    const run = await this.runRepository.findOne({
      where: { campaignId },
      order: { createdAt: 'DESC' },
      relations: ['runBy', 'overriddenBy'],
    });

    if (run) {
      run.results = await this.checkResultRepository.find({
        where: { runId: run.id },
        order: { ruleCategory: 'ASC', ruleSeverity: 'ASC' },
      });
    }

    return run;
  }

  async getRunHistory(campaignId: string): Promise<ComplianceRun[]> {
    return this.runRepository.find({
      where: { campaignId },
      order: { createdAt: 'DESC' },
      relations: ['runBy', 'overriddenBy'],
    });
  }

  async getRunById(runId: string): Promise<ComplianceRun | null> {
    const run = await this.runRepository.findOne({
      where: { id: runId },
      relations: ['runBy', 'overriddenBy'],
    });

    if (run) {
      run.results = await this.checkResultRepository.find({
        where: { runId: run.id },
        order: { ruleCategory: 'ASC', ruleSeverity: 'ASC' },
        relations: ['checkedBy'],
      });
    }

    return run;
  }

  async addModeratorNote(
    checkResultId: string,
    note: string,
    moderatorId: string,
  ): Promise<ComplianceCheckResult> {
    const result = await this.checkResultRepository.findOne({
      where: { id: checkResultId },
    });

    if (!result) {
      throw new NotFoundException(`Check result ${checkResultId} not found`);
    }

    result.moderatorNote = note;
    result.checkedById = moderatorId;

    return this.checkResultRepository.save(result);
  }

  async overrideBlockers(
    runId: string,
    reason: string,
    adminId: string,
  ): Promise<ComplianceRun> {
    const run = await this.runRepository.findOne({
      where: { id: runId },
    });

    if (!run) {
      throw new NotFoundException(`Compliance run ${runId} not found`);
    }

    if (run.canApprove) {
      throw new BadRequestException('No blockers to override - campaign can already be approved');
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('Override reason must be at least 10 characters');
    }

    run.isOverridden = true;
    run.overrideReason = reason;
    run.overriddenById = adminId;
    run.canApprove = true;

    const savedRun = await this.runRepository.save(run);

    const campaign = await this.campaignRepository.findOne({
      where: { id: run.campaignId },
    });

    await this.auditLogService.logSuccess(
      AuditAction.CAMPAIGN_APPROVE,
      'compliance_run',
      runId,
      `Admin override: Blockers overridden for campaign "${campaign?.name || run.campaignId}"`,
      {
        actorId: adminId,
        metadata: {
          campaignId: run.campaignId,
          blockerCount: run.blockerCount,
          reason,
        },
        entityOwnerId: campaign?.creatorId,
      },
    );

    return savedRun;
  }

  async canCampaignBeApproved(campaignId: string): Promise<{
    canApprove: boolean;
    reason: string;
    latestRun?: ComplianceRun;
  }> {
    const latestRun = await this.getLatestRun(campaignId);

    if (!latestRun) {
      return {
        canApprove: false,
        reason: 'No compliance checks have been run for this campaign',
      };
    }

    if (latestRun.canApprove) {
      if (latestRun.isOverridden) {
        return {
          canApprove: true,
          reason: `Approved via admin override: ${latestRun.overrideReason}`,
          latestRun,
        };
      }
      return {
        canApprove: true,
        reason: 'All compliance checks passed',
        latestRun,
      };
    }

    return {
      canApprove: false,
      reason: `${latestRun.blockerCount} blocker check(s) failed`,
      latestRun,
    };
  }

  getRules() {
    return COMPLIANCE_RULES.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
    }));
  }
}

