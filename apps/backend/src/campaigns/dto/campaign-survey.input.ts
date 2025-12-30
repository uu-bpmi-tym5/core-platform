import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';

@InputType()
export class CreateCampaignSurveyInput {
  @Field(() => String, { description: 'Campaign ID' })
  @IsString()
  campaignId: string;

  @Field(() => String, { description: 'Survey title' })
  @IsString()
  title: string;

  @Field(() => [String], { description: 'Survey questions (1-10 questions)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  questions: string[];
}

@InputType()
export class SubmitSurveyResponseInput {
  @Field(() => String, { description: 'Survey ID' })
  @IsString()
  surveyId: string;

  @Field(() => [String], { description: 'Answers to survey questions' })
  @IsArray()
  @ArrayMinSize(1)
  answers: string[];
}

