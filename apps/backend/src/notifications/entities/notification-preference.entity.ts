import { ObjectType, Field } from '@nestjs/graphql';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Unique,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity('notification_preferences')
@Unique(['userId'])
export class NotificationPreference {
    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ name: 'user_id' })
    userId: string;

    @Field()
    @Column({ default: true })
    allEnabled: boolean;

    @Field()
    @Column({ default: true })
    infoEnabled: boolean;

    @Field()
    @Column({ default: true })
    successEnabled: boolean;

    @Field()
    @Column({ default: true })
    warningEnabled: boolean;

    @Field()
    @Column({ default: true })
    errorEnabled: boolean;

    @Field()
    @Column({ default: true })
    inAppEnabled: boolean;

    @Field()
    @Column({ default: false })
    emailEnabled: boolean;

    @Field()
    @Column({ default: false })
    pushEnabled: boolean;

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

