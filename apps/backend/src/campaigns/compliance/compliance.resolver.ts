import { Resolver, Query, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../auth/decorators/get-current-user.decorator';
import type { JwtPayload } from '../../auth/auth.service';
import { Role } from '../../auth/enums/role.enum';
import {
  ComplianceRun,
  ComplianceCheckResult,
  ComplianceRuleSeverity,
  ComplianceRuleCategory,
} from '../entities/compliance.entity';
import { ComplianceService } from './compliance.service';

@ObjectType()
class ComplianceRuleDefinition {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => ComplianceRuleCategory)
  category: ComplianceRuleCategory;

  @Field(() => ComplianceRuleSeverity)
  severity: ComplianceRuleSeverity;
}

@ObjectType()
class CampaignApprovalStatus {
  @Field()
  canApprove: boolean;

  @Field()
  reason: string;

  @Field(() => ComplianceRun, { nullable: true })
  latestRun?: ComplianceRun;
}

@Resolver()
export class ComplianceResolver {
  constructor(private readonly complianceService: ComplianceService) {}


  @UseGuards(JwtAuthGuard)
  @Mutation(() => ComplianceRun, {
    description: 'Run compliance checks for a campaign',
  })
  async runComplianceChecks(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceRun> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can run compliance checks');
    }

    return this.complianceService.runComplianceChecks(campaignId, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => ComplianceRun, {
    nullable: true,
    description: 'Get the latest compliance run for a campaign',
  })
  async latestComplianceRun(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceRun | null> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can view compliance runs');
    }

    return this.complianceService.getLatestRun(campaignId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ComplianceRun], {
    description: 'Get compliance run history for a campaign',
  })
  async complianceRunHistory(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceRun[]> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can view compliance history');
    }

    return this.complianceService.getRunHistory(campaignId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => ComplianceRun, {
    nullable: true,
    description: 'Get a specific compliance run by ID',
  })
  async complianceRun(
    @Args('runId') runId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceRun | null> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can view compliance runs');
    }

    return this.complianceService.getRunById(runId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ComplianceCheckResult, {
    description: 'Add a moderator note to a compliance check result',
  })
  async addComplianceNote(
    @Args('checkResultId') checkResultId: string,
    @Args('note') note: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceCheckResult> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can add compliance notes');
    }

    return this.complianceService.addModeratorNote(checkResultId, note, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => ComplianceRun, {
    description: 'Override blockers to allow campaign approval (Admin only)',
  })
  async overrideComplianceBlockers(
    @Args('runId') runId: string,
    @Args('reason') reason: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceRun> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can override compliance blockers');
    }

    return this.complianceService.overrideBlockers(runId, reason, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => CampaignApprovalStatus, {
    description: 'Check if a campaign can be approved based on compliance checks',
  })
  async campaignApprovalStatus(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<CampaignApprovalStatus> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can check approval status');
    }

    const result = await this.complianceService.canCampaignBeApproved(campaignId);
    return {
      canApprove: result.canApprove,
      reason: result.reason,
      latestRun: result.latestRun,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [ComplianceRuleDefinition], {
    description: 'Get all compliance rules',
  })
  async complianceRules(
    @GetCurrentUser() user: JwtPayload,
  ): Promise<ComplianceRuleDefinition[]> {
    if (user.role !== Role.MODERATOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only moderators and admins can view compliance rules');
    }

    return this.complianceService.getRules();
  }
}

