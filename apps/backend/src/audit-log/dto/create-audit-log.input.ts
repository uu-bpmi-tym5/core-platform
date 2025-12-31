import { AuditAction, ActorType } from '../entities';

/**
 * Internal input for creating audit logs.
 * This is NOT a GraphQL input - audit logs are created programmatically by the service.
 */
export class CreateAuditLogInput {
  actorType: ActorType = ActorType.USER;

  actorId?: string;

  action: AuditAction;

  entityType: string;

  entityId: string;

  description: string;


  oldValues?: Record<string, unknown>;

  newValues?: Record<string, unknown>;

  metadata?: Record<string, unknown>;

  ipAddress?: string;

  userAgent?: string;

  entityOwnerId?: string;
}

