import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Field, ObjectType, registerEnumType } from "@nestjs/graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

export enum NotificationType {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    SUCCESS = 'success'
}

export enum NotificationStatus {
    UNREAD = 'unread',
    READ = 'read',
    ARCHIVED = 'archived'
}

registerEnumType(NotificationType, {
    name: 'NotificationType',
});

registerEnumType(NotificationStatus, {
    name: 'NotificationStatus',
});

@ObjectType()
@Entity('notifications')
export class Notification {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column('text')
    message: string;

    @Field(() => NotificationType)
    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.INFO
    })
    type: NotificationType;

    @Field(() => NotificationStatus)
    @Column({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.UNREAD
    })
    status: NotificationStatus;

    @Field()
    @Column({ name: 'user_id' })
    userId: string;

    @Field(() => User)
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Field({ nullable: true })
    @Column({ nullable: true })
    actionUrl?: string;

    @Field(() => GraphQLJSONObject, { nullable: true })
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, string | number | boolean>;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Field({ nullable: true })
    @Column({ name: 'read_at', nullable: true })
    readAt?: Date;
}
