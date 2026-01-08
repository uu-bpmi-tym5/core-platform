import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches, MaxLength, ValidateIf, IsUrl } from 'class-validator';

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
  @ValidateIf((o) => o.avatarUrl && !o.avatarUrl.startsWith('data:image/'))
  @IsUrl()
  avatarUrl?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;


  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug can contain lowercase letters, numbers and hyphens, and cannot start or end with a hyphen',
  })
  @Length(3, 50)
  slug?: string;
}

