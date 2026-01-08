import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreatorProfile } from './entities/creator-profile.entity';
import { UpdateProfileInput } from './dto/update-profile.input';
import { UpdateCreatorProfileInput } from './dto/update-creator-profile.input';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { CampaignStatus } from '../campaigns/entities/campaign.entity';

@Injectable()
export class ProfileService {
  constructor(
    @Inject('PROFILE_REPOSITORY') private readonly profileRepository: Repository<Profile>,
    @Inject('CREATOR_PROFILE_REPOSITORY') private readonly creatorProfileRepository: Repository<CreatorProfile>,
    @Inject('CAMPAIGN_REPOSITORY') private readonly campaignRepository: Repository<Campaign>,
  ) {}

  async getOrCreateProfileForUser(userId: string, fallbackName: string): Promise<Profile> {
    let profile = await this.profileRepository.findOne({ where: { userId } });
    if (profile) {
      return profile;
    }

    const baseSlug = fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50) || 'user';

    let slug = baseSlug;
    let counter = 1;
    // ensure slug uniqueness
     
    while (true) {
      const existing = await this.profileRepository.findOne({ where: { slug } });
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${counter++}`;
    }

    profile = this.profileRepository.create({
      userId,
      displayName: fallbackName,
      slug,
    });
    return this.profileRepository.save(profile);
  }

  async updateOwnProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (input.slug && input.slug !== profile.slug) {
      const existing = await this.profileRepository.findOne({ where: { slug: input.slug } });
      if (existing) {
        throw new ConflictException('Slug is already in use');
      }
    }

    Object.assign(profile, input);
    return this.profileRepository.save(profile);
  }

  async updateOwnCreatorProfile(userId: string, input: UpdateCreatorProfileInput): Promise<CreatorProfile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    let creatorProfile = await this.creatorProfileRepository.findOne({ where: { profileId: profile.id } });
    if (!creatorProfile) {
      creatorProfile = this.creatorProfileRepository.create({ profileId: profile.id });
    }

    Object.assign(creatorProfile, input);
    return this.creatorProfileRepository.save(creatorProfile);
  }

  async getCreatorProfileByUserId(userId: string): Promise<CreatorProfile | null> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      return null;
    }

    return this.creatorProfileRepository.findOne({ where: { profileId: profile.id } });
  }

  async getPublicProfileBySlug(slug: string): Promise<{ profile: Profile; creatorProfile: CreatorProfile | null; campaigns: Campaign[] }> {
    const profile = await this.profileRepository.findOne({ where: { slug } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const creatorProfile = await this.creatorProfileRepository.findOne({ where: { profileId: profile.id, isPublic: true } });

    const campaigns = await this.campaignRepository.find({
      where: { creatorId: profile.userId, status: CampaignStatus.APPROVED },
      order: { createdAt: 'DESC' },
    });

    return { profile, creatorProfile: creatorProfile ?? null, campaigns };
  }
}

