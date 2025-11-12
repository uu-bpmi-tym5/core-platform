import { IsEnum, IsOptional } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { NotificationStatus } from '../entities';

@InputType()
export class UpdateNotificationInput {
    @Field(() => NotificationStatus, { nullable: true })
    @IsEnum(NotificationStatus)
    @IsOptional()
    status?: NotificationStatus;
}
