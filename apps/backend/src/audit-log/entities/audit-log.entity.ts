import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { User } from '../../users/entities/user.entity';

/**
 * The type of actor performing the action
 */
export enum ActorType {
  USER = 'user',
  SYSTEM = 'system',
}

registerEnumType(ActorType, {
  name: 'ActorType',
  description: 'The type of actor that performed the action',
});


/**
 * Types of actions that can be audited
 */
export enum AuditAction {
  // Campaign actions
  CAMPAIGN_CREATE = 'campaign.create',
  CAMPAIGN_UPDATE = 'campaign.update',
  CAMPAIGN_DELETE = 'campaign.delete',
  CAMPAIGN_SUBMIT = 'campaign.submit',
  CAMPAIGN_APPROVE = 'campaign.approve',
  CAMPAIGN_REJECT = 'campaign.reject',

  // Contribution actions
  CONTRIBUTION_CREATE = 'contribution.create',
  CONTRIBUTION_REFUND = 'contribution.refund',

  // Wallet actions
  WALLET_DEPOSIT = 'wallet.deposit',
  WALLET_WITHDRAWAL = 'wallet.withdrawal',

  // User actions
  USER_REGISTER = 'user.register',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_UPDATE = 'user.update',
  USER_ROLE_CHANGE = 'user.role_change',
  USER_PASSWORD_CHANGE = 'user.password_change',

  // Comment actions
  COMMENT_CREATE = 'comment.create',
  COMMENT_DELETE = 'comment.delete',
  COMMENT_MODERATE = 'comment.moderate',
  COMMENT_REPORT = 'comment.report',

  // Notification actions
  NOTIFICATION_SEND = 'notification.send',

  // Export actions
  EXPORT_CONTRIBUTIONS = 'export.contributions',
}

registerEnumType(AuditAction, {
  name: 'AuditAction',
  description: 'The type of action that was performed',
});

/**
 * AuditLog entity for tracking important system changes
 *
 * Audit logs are read-only and cannot be modified after creation.
 * They track: who performed an action, when, what was changed, and whether it succeeded.
 */
@ObjectType()
@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['actorId'])
@Index(['createdAt'])
@Index(['action'])
export class AuditLog {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => ActorType)
  @Column({
    type: 'enum',
    enum: ActorType,
    default: ActorType.USER,
    name: 'actor_type',
  })
  actorType: ActorType;

  @Field({ nullable: true })
  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: User;

  @Field(() => AuditAction)
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Field()
  @Column({ name: 'entity_type' })
  entityType: string;

  @Field()
  @Column({ name: 'entity_id' })
  entityId: string;

  @Field()
  @Column('text')
  description: string;


  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues?: Record<string, unknown>;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues?: Record<string, unknown>;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Field({ nullable: true })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  /**
   * Optional reference to the owner of the affected entity.
   * Used for access control - regular users can only see logs
   * where they are the actor OR the owner of the affected entity.
   */
  @Field({ nullable: true })
  @Column({ name: 'entity_owner_id', nullable: true })
  @Index()
  entityOwnerId?: string;
}

