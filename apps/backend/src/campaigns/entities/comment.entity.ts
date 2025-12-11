import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';

export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  REMOVED = 'REMOVED',
}
registerEnumType(CommentStatus, {
  name: 'CommentStatus',
  description: 'Status of the comment for moderators',
});

@Entity()
@ObjectType()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  @Field(() => String, { description: 'ID of the comment' })
  id: string;

  @Column('text')
  @Field(() => String, { description: 'Content of the comment' })
  content: string;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Creation date of the comment' })
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.VISIBLE
  })

  @Field(() => CommentStatus)
  status: CommentStatus;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  moderationReason?: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  moderatedBy?: string; //ID moderátora který provedl akci

  @Column({ default: 0 })
  @Field(() => Int)
  reportsCount: number;

  @Column({ nullable: true })
  @Field(() => Date, { nullable: true })
  lastReportedAt?: Date;

  @Column()
  @Field(() => String, { description: 'ID of the campaign' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaignId' })
  @Field(() => Campaign, { description: 'The campaign this comment belongs to' })
  campaign: Campaign;

  @Column()
  @Field(() => String, { description: 'ID of the user who created the comment' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  @Field(() => User, { description: 'The user who created the comment' })
  user: User;
}
