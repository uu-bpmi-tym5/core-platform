import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { User } from '../../users/entities/user.entity';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED'
}

registerEnumType(CampaignStatus, {
  name: 'CampaignStatus',
});

@Entity()
@ObjectType()
export class Campaign {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String, { description: 'ID of the campaign' })
  id: string;

  @Column()
  @Field(() => String, { description: 'Creator ID of the campaign' })
  creatorId: string;

  @ManyToOne(() => User)
  @Field(() => User, { description: 'Creator of the campaign' })
  creator: User;

  @Column()
  @Field(() => String, { description: 'Name of the campaign' })
  name: string;

  @Column('text')
  @Field(() => String, { description: 'Description of the campaign' })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @Field(() => Number, { description: 'Goal amount of the campaign' })
  goal: number;

  @Column({ nullable: true })
  @Field(() => Date, { description: 'End date of the campaign', nullable: true })
  endDate?: Date;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @Field(() => Number, { description: 'Current amount raised for the campaign' })
  currentAmount: number;

  @Column()
  @Field(() => String, { description: 'Category of the campaign' })
  category: string;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT
  })
  @Field(() => CampaignStatus, { description: 'Status of the campaign' })
  status: CampaignStatus;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Creation date of the campaign' })
  createdAt: Date;

  @UpdateDateColumn()
  @Field(() => Date, { description: 'Last update date of the campaign' })
  updatedAt: Date;
}
