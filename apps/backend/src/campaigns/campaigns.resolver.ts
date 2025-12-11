import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { Comment } from './entities/comment.entity';
import { CampaignContribution } from './entities/campaign-contribution.entity';
import { CreateCampaignInput, UpdateCampaignInput } from './dto';
import { CampaignContributionStats } from './dto/campaign-contribution-stats.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Role, Permission } from '../auth/enums';
import type {JwtPayload} from "../auth/auth.service";
import {ReportCommentInput, ModerateCommentInput, DeleteMyCommentInput} from './dto/moderation.input';

@Resolver(() => Campaign)
export class CampaignsResolver {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Mutation(() => Campaign)
  @UseGuards(JwtAuthGuard)
  async createCampaign(
    @Args('createCampaignInput') createCampaignInput: CreateCampaignInput,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Campaign> {
    return this.campaignsService.createCampaign(createCampaignInput, user.userId);
  }

  @Query(() => [Campaign], { name: 'campaigns' })
  async findAllCampaigns(): Promise<Campaign[]> {
    return this.campaignsService.findAllCampaigns();
  }

  @Query(() => Campaign, { name: 'campaign' })
  async findCampaignById(@Args('id') id: string): Promise<Campaign> {
    return this.campaignsService.findCampaignById(id);
  }

  @Query(() => [Campaign], { name: 'myCampaigns' })
  @UseGuards(JwtAuthGuard)
  async findMyCampaigns(
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Campaign[]> {
    return this.campaignsService.findCampaignsByCreator(user.userId);
  }

  @Query(() => [Campaign], { name: 'pendingCampaigns' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions(Permission.APPROVE_CAMPAIGN)
  async findPendingCampaigns(): Promise<Campaign[]> {
    return this.campaignsService.findPendingCampaigns();
  }

  @Mutation(() => Campaign)
  @UseGuards(JwtAuthGuard)
  async updateCampaign(
    @Args('updateCampaignInput') updateCampaignInput: UpdateCampaignInput,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Campaign> {
    // Check if user owns the campaign or is admin
    const isOwner = await this.campaignsService.isOwner(updateCampaignInput.id, user.userId);
    if (!isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only update your own campaigns');
    }
    return this.campaignsService.updateCampaign(updateCampaignInput.id, updateCampaignInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeCampaign(
    @Args('id') id: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    // Check if user owns the campaign or is admin
    const isOwner = await this.campaignsService.isOwner(id, user.userId);
    if (!isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only delete your own campaigns');
    }
    return this.campaignsService.removeCampaign(id);
  }

  @Mutation(() => Campaign)
  @UseGuards(JwtAuthGuard)
  async submitCampaign(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Campaign> {
    const isOwner = await this.campaignsService.isOwner(campaignId, user.userId);
    if (!isOwner) {
      throw new ForbiddenException('You can only submit your own campaigns');
    }
    return this.campaignsService.submitCampaign(campaignId);
  }

  @Mutation(() => Campaign)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions(Permission.APPROVE_CAMPAIGN)
  async approveCampaign(
    @Args('campaignId') campaignId: string,
  ): Promise<Campaign> {
    return this.campaignsService.approveCampaign(campaignId);
  }

  @Mutation(() => Campaign)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions(Permission.REJECT_CAMPAIGN)
  async rejectCampaign(
    @Args('campaignId') campaignId: string,
  ): Promise<Campaign> {
    return this.campaignsService.rejectCampaign(campaignId);
  }

  @Mutation(() => Campaign)
  async incrementCampaignViews(@Args('campaignId') campaignId: string): Promise<Campaign> {
    await this.campaignsService.incrementCampaignViews(campaignId);
    return this.campaignsService.findCampaignById(campaignId);
  }

  @Mutation(() => Boolean)
  async processDonation(
    @Args('campaignId') campaignId: string,
    @Args('amount') amount: number,
    @Args('donorName', { nullable: true }) donorName?: string,
  ): Promise<boolean> {
    await this.campaignsService.incrementCampaignContributions(campaignId, amount);
    await this.campaignsService.handleDonationReceived(campaignId, amount, donorName);
    return true;
  }

  @Mutation(() => Boolean)
  async trackCampaignView(@Args('campaignId') campaignId: string): Promise<boolean> {
    await this.campaignsService.incrementCampaignViews(campaignId);
    await this.campaignsService.handleCampaignViewed(campaignId);
    return true;
  }

  @Mutation(() => Campaign)
  @UseGuards(JwtAuthGuard)
  async updateCampaignWithNotifications(
    @Args('updateCampaignInput') updateCampaignInput: UpdateCampaignInput,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Campaign> {
    const isOwner = await this.campaignsService.isOwner(updateCampaignInput.id, user.userId);
    if (!isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenException('You can only update your own campaigns');
    }
    return this.campaignsService.updateCampaign(updateCampaignInput.id, updateCampaignInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteCampaignWithRefunds(
    @Args('campaignId') campaignId: string,
    @Args('reason') reason: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    return this.campaignsService.deleteCampaignWithRefunds(campaignId, user.userId, reason);
  }

  @Query(() => [CampaignContribution], { name: 'campaignContributions' })
  @UseGuards(JwtAuthGuard)
  async getCampaignContributions(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<CampaignContribution[]> {
    // Check if user is campaign owner or admin
    const isOwner = await this.campaignsService.isOwner(campaignId, user.userId);
    if (!isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access only for campaign owner or administrator');
    }
    return this.campaignsService.getCampaignContributions(campaignId);
  }

  @Query(() => CampaignContributionStats, { name: 'campaignContributionStats' })
  @UseGuards(JwtAuthGuard)
  async getCampaignContributionStats(
    @Args('campaignId') campaignId: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<CampaignContributionStats> {
    // Check if user is campaign owner or admin
    const isOwner = await this.campaignsService.isOwner(campaignId, user.userId);
    if (!isOwner && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access only for campaign owner or administrator');
    }
    return this.campaignsService.getCampaignContributionStats(campaignId);
  }


  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Args('campaignId') campaignId: string,
    @Args('content') content: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Comment> {
    return this.campaignsService.addComment(campaignId, user.userId, content);
  }

  @Query(() => [Comment], { name: 'comments' })
  async getComments(@Args('campaignId') campaignId: string): Promise<Comment[]> {
    return this.campaignsService.getComments(campaignId);
  }

  @Mutation(() => Boolean) 
  @UseGuards(JwtAuthGuard)
  async reportComment(
    @Args('input') input: ReportCommentInput,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const result = await this.campaignsService.reportComment(user.userId, input);
    return result.success;
  }

  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions(Permission.MODERATE_COMMENTS) //Pouze Moderátor/Admin
  async moderateComment(
    @Args('input') input: ModerateCommentInput,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Comment> {
    return this.campaignsService.moderateComment(user.userId, input);
  }

  @Mutation(() => Comment)
  @UseGuards(JwtAuthGuard)
  async deleteMyComment(
    @Args('input') input: DeleteMyCommentInput,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<Comment> {
    return this.campaignsService.deleteMyComment(user.userId, input);
  }

}
