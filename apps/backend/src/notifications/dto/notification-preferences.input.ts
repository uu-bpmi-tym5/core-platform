import { InputType, Field } from '@nestjs/graphql';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateNotificationPreferencesInput {
    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    allEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    infoEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    successEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    warningEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    errorEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    inAppEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    emailEnabled?: boolean;

    @Field({ nullable: true })
    @IsOptional()
    @IsBoolean()
    pushEnabled?: boolean;
}

