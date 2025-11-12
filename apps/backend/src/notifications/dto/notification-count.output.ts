import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class NotificationCount {
    @Field(() => Number)
    total: number;

    @Field(() => Number)
    unread: number;
}
