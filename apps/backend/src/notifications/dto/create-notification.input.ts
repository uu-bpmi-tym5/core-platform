import { IsString, IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { NotificationType } from '../entities';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class CreateNotificationInput {
    @Field()
    @IsString()
    title: string;

    @Field()
    @IsString()
    message: string;

    @Field(() => NotificationType, { nullable: true })
    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;

    @Field()
    @IsUUID()
    userId: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    actionUrl?: string;

    @Field(() => GraphQLJSONObject, { nullable: true })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, string | number | boolean>;
}
