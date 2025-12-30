import { InputType, Field } from '@nestjs/graphql';
import { CampaignStatus } from '../entities/campaign.entity';

@InputType()
export class CreateCampaignInput {
  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => Number)
  goal: number;

  @Field(() => String)
  category: string;

  @Field(() => String, { nullable: true })
  imageData?: string;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => CampaignStatus, { nullable: true })
  status?: CampaignStatus;
}
