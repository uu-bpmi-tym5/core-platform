import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@ObjectType()
export class CampaignSurvey {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'ID of the survey' })
  id: string;

  @Column()
  @Field(() => String, { description: 'Campaign ID' })
  campaignId: string;

  @ManyToOne(() => Campaign)
  @Field(() => Campaign, { description: 'Campaign this survey belongs to' })
  campaign: Campaign;

  @Column()
  @Field(() => String, { description: 'Creator user ID' })
  creatorId: string;

  @ManyToOne(() => User)
  @Field(() => User, { description: 'User who created the survey' })
  creator: User;

  @Column()
  @Field(() => String, { description: 'Survey title' })
  title: string;

  @Column('text', { array: true })
  @Field(() => [String], { description: 'Array of survey questions' })
  questions: string[];

  @Column({ default: true })
  @Field(() => Boolean, { description: 'Whether the survey is active' })
  isActive: boolean;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Date when survey was created' })
  createdAt: Date;

  @Column({ nullable: true })
  @Field(() => Date, { nullable: true, description: 'Date when survey was closed' })
  closedAt?: Date;
}

