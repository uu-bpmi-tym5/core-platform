import { ObjectType, Field } from '@nestjs/graphql';
import { Profile } from '../entities/profile.entity';
import { CreatorProfile } from '../entities/creator-profile.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';

@ObjectType()
export class PublicProfile {
  @Field(() => Profile)
  profile: Profile;

  @Field(() => CreatorProfile, { nullable: true })
  creatorProfile?: CreatorProfile | null;

  @Field(() => [Campaign])
  campaigns: Campaign[];
}

