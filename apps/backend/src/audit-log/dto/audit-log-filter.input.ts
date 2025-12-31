import { InputType, Field } from '@nestjs/graphql';
import { AuditAction } from '../entities';

@InputType()
export class AuditLogFilterInput {
  @Field({ nullable: true, description: 'Filter by actor user ID' })
  actorId?: string;

  @Field({ nullable: true, description: 'Filter by entity type (e.g., "campaign", "user")' })
  entityType?: string;

  @Field({ nullable: true, description: 'Filter by entity ID' })
  entityId?: string;

  @Field(() => AuditAction, { nullable: true, description: 'Filter by action type' })
  action?: AuditAction;

  @Field({ nullable: true, description: 'Filter logs from this date onwards' })
  fromDate?: Date;

  @Field({ nullable: true, description: 'Filter logs until this date' })
  toDate?: Date;
}

@InputType()
export class AuditLogPaginationInput {
  @Field({ defaultValue: 20, description: 'Number of records to return' })
  limit: number = 20;

  @Field({ defaultValue: 0, description: 'Number of records to skip' })
  offset: number = 0;
}

