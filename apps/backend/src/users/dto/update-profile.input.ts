import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches, IsUrl, MaxLength } from 'class-validator';

@InputType()
export class UpdateProfileInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  displayName?: string;


  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  avatarUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  website?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug can contain lowercase letters, numbers and hyphens, and cannot start or end with a hyphen',
  })
  @Length(3, 50)
  slug?: string;
}

