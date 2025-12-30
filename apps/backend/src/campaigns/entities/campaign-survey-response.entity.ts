import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { CampaignSurvey } from './campaign-survey.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@ObjectType()
export class CampaignSurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'ID of the survey response' })
  id: string;

  @Column()
  @Field(() => String, { description: 'Survey ID' })
  surveyId: string;

  @ManyToOne(() => CampaignSurvey)
  @Field(() => CampaignSurvey, { description: 'Survey this response belongs to' })
  survey: CampaignSurvey;

  @Column()
  @Field(() => String, { description: 'Respondent user ID' })
  respondentId: string;

  @ManyToOne(() => User)
  @Field(() => User, { description: 'User who submitted the response' })
  respondent: User;

  @Column('text', { array: true })
  @Field(() => [String], { description: 'Array of responses matching survey questions' })
  answers: string[];

  @CreateDateColumn()
  @Field(() => Date, { description: 'Date when response was submitted' })
  createdAt: Date;
}

