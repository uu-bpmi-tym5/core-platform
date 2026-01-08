import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Campaign } from './campaign.entity';
import { User } from '../../users/entities/user.entity';

export enum ComplianceRuleSeverity {
  BLOCKER = 'BLOCKER',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

registerEnumType(ComplianceRuleSeverity, {
  name: 'ComplianceRuleSeverity',
  description: 'Severity level of a compliance rule',
});

export enum ComplianceCheckStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARN = 'WARN',
  SKIPPED = 'SKIPPED',
}

registerEnumType(ComplianceCheckStatus, {
  name: 'ComplianceCheckStatus',
  description: 'Result status of a compliance check',
});

export enum ComplianceRuleCategory {
  CONTENT = 'CONTENT',
  FINANCIAL = 'FINANCIAL',
  MEDIA = 'MEDIA',
  LEGAL = 'LEGAL',
  IDENTITY = 'IDENTITY',
}

registerEnumType(ComplianceRuleCategory, {
  name: 'ComplianceRuleCategory',
  description: 'Category of the compliance rule',
});

@ObjectType()
@Entity('compliance_check_results')
@Index(['campaignId', 'ruleId'])
@Index(['campaignId', 'runId'])
export class ComplianceCheckResult {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Field()
  @Column({ name: 'run_id' })
  runId: string;

  @Field()
  @Column({ name: 'rule_id' })
  ruleId: string;

  @Field()
  @Column({ name: 'rule_name' })
  ruleName: string;

  @Field(() => ComplianceRuleCategory)
  @Column({
    type: 'enum',
    enum: ComplianceRuleCategory,
    name: 'rule_category',
  })
  ruleCategory: ComplianceRuleCategory;

  @Field(() => ComplianceRuleSeverity)
  @Column({
    type: 'enum',
    enum: ComplianceRuleSeverity,
    name: 'rule_severity',
  })
  ruleSeverity: ComplianceRuleSeverity;

  @Field(() => ComplianceCheckStatus)
  @Column({
    type: 'enum',
    enum: ComplianceCheckStatus,
  })
  status: ComplianceCheckStatus;

  @Field()
  @Column('text')
  message: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  evidence?: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true, name: 'moderator_note' })
  moderatorNote?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'checked_by' })
  checkedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checked_by' })
  @Field(() => User, { nullable: true })
  checkedBy?: User;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@ObjectType()
@Entity('compliance_runs')
@Index(['campaignId'])
export class ComplianceRun {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ name: 'campaign_id' })
  campaignId: string;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Field()
  @Column({ name: 'total_checks' })
  totalChecks: number;

  @Field()
  @Column({ name: 'passed_checks' })
  passedChecks: number;

  @Field()
  @Column({ name: 'failed_checks' })
  failedChecks: number;

  @Field()
  @Column({ name: 'warning_checks' })
  warningChecks: number;

  @Field()
  @Column({ name: 'blocker_count' })
  blockerCount: number;

  @Field()
  @Column({ name: 'can_approve', default: false })
  canApprove: boolean;

  @Field()
  @Column({ name: 'is_overridden', default: false })
  isOverridden: boolean;

  @Field({ nullable: true })
  @Column('text', { nullable: true, name: 'override_reason' })
  overrideReason?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'overridden_by' })
  overriddenById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'overridden_by' })
  @Field(() => User, { nullable: true })
  overriddenBy?: User;

  @Field({ nullable: true })
  @Column({ nullable: true, name: 'run_by' })
  runById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'run_by' })
  @Field(() => User, { nullable: true })
  runBy?: User;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => [ComplianceCheckResult], { nullable: true })
  results?: ComplianceCheckResult[];
}
