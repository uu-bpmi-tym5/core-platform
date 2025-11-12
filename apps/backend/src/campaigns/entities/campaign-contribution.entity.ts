import { ObjectType, Field } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from '../../users/entities/user.entity';
import { Campaign } from './campaign.entity';

@Entity()
@ObjectType()
export class CampaignContribution {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String, { description: 'ID of the contribution' })
  id: string;

  @Column()
  @Field(() => String, { description: 'Campaign ID' })
  campaignId: string;

  @ManyToOne(() => Campaign)
  @Field(() => Campaign, { description: 'Campaign that received the contribution' })
  campaign: Campaign;

  @Column()
  @Field(() => String, { description: 'Contributor user ID' })
  contributorId: string;

  @ManyToOne(() => User)
  @Field(() => User, { description: 'User who made the contribution' })
  contributor: User;

  @Column('decimal', { precision: 10, scale: 2 })
  @Field(() => Number, { description: 'Amount of the contribution' })
  amount: number;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true, description: 'Related wallet transaction ID' })
  walletTxId?: string;

  @Column('text', { nullable: true })
  @Field(() => String, { nullable: true, description: 'Optional message from contributor' })
  message?: string;

  @Column({ default: false })
  @Field(() => Boolean, { description: 'Whether the contribution was refunded' })
  isRefunded: boolean;

  @CreateDateColumn()
  @Field(() => Date, { description: 'Date when contribution was made' })
  createdAt: Date;
}
