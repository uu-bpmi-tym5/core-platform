import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length, MaxLength } from 'class-validator';

@InputType()
export class UpdateCreatorProfileInput {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  creatorBio?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  primaryCategory?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  highlights?: string;
}

