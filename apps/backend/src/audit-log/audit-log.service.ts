import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, ActorType } from './entities';
import { CreateAuditLogInput, AuditLogFilterInput, AuditLogPaginationInput } from './dto';

/**
 * Fields that should be masked in audit logs for security
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'privateKey',
  'creditCard',
  'cvv',
  'ssn',
];

/**
 * Masks sensitive fields in an object by replacing their values with '[REDACTED]'
 */
function maskSensitiveData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!data) return data;

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

@Injectable()
export class AuditLogService {
  constructor(
    @Inject('AUDIT_LOG_REPOSITORY')
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create a new audit log entry.
   * Audit logs are immutable once created.
   */
  async createLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...input,
      // Ensure actorType has a default value
      actorType: input.actorType ?? ActorType.USER,
      // Mask sensitive data before storing
      oldValues: maskSensitiveData(input.oldValues),
      newValues: maskSensitiveData(input.newValues),
      metadata: maskSensitiveData(input.metadata),
    });

    return this.auditLogRepository.save(auditLog);
  }

  /**
   * Convenience method to log an action
   */
  async logSuccess(
    action: AuditAction,
    entityType: string,
    entityId: string,
    description: string,
    options: {
      actorId?: string;
      actorType?: ActorType;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      entityOwnerId?: string;
    } = {},
  ): Promise<AuditLog> {
    return this.createLog({
      action,
      entityType,
      entityId,
      description,
      actorType: options.actorType ?? ActorType.USER,
      actorId: options.actorId,
      oldValues: options.oldValues,
      newValues: options.newValues,
      metadata: options.metadata,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      entityOwnerId: options.entityOwnerId,
    });
  }


  /**
   * Find all audit logs with optional filtering.
   * For admin use only - returns all logs.
   */
  async findAll(
    filter?: AuditLogFilterInput,
    pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    return this.findLogsWithFilter(filter, pagination);
  }

  /**
   * Find audit logs accessible to a specific user.
   * Regular users can only see logs where:
   * - They are the actor (actorId matches)
   * - They are the owner of the affected entity (entityOwnerId matches)
   */
  async findForUser(
    userId: string,
    filter?: AuditLogFilterInput,
    pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    return this.findLogsWithFilter(filter, pagination, userId);
  }

  /**
   * Find audit logs for a specific entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    return this.findLogsWithFilter({ entityType, entityId }, pagination);
  }

  /**
   * Find audit logs by actor
   */
  async findByActor(
    actorId: string,
    pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    return this.findLogsWithFilter({ actorId }, pagination);
  }

  /**
   * Get a single audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['actor'],
    });
  }

  /**
   * Internal method to build and execute filtered queries
   */
  private async findLogsWithFilter(
    filter?: AuditLogFilterInput,
    pagination?: AuditLogPaginationInput,
    restrictToUserId?: string,
  ): Promise<AuditLog[]> {
    const limit = pagination?.limit ?? 20;
    const offset = pagination?.offset ?? 0;

    // Validate pagination
    if (limit <= 0) {
      throw new BadRequestException('Limit must be a positive number');
    }
    if (limit > 100) {
      throw new BadRequestException('Limit cannot exceed 100');
    }
    if (offset < 0) {
      throw new BadRequestException('Offset cannot be negative');
    }

    const query = this.auditLogRepository.createQueryBuilder('log');
    query.leftJoinAndSelect('log.actor', 'actor');

    // If restricted to a user, only show logs they can access
    if (restrictToUserId) {
      query.andWhere(
        '(log.actorId = :userId OR log.entityOwnerId = :userId)',
        { userId: restrictToUserId },
      );
    }

    // Apply filters
    if (filter?.actorId) {
      query.andWhere('log.actorId = :actorId', { actorId: filter.actorId });
    }

    if (filter?.entityType) {
      query.andWhere('log.entityType = :entityType', { entityType: filter.entityType });
    }

    if (filter?.entityId) {
      query.andWhere('log.entityId = :entityId', { entityId: filter.entityId });
    }

    if (filter?.action) {
      query.andWhere('log.action = :action', { action: filter.action });
    }

    if (filter?.fromDate) {
      query.andWhere('log.createdAt >= :fromDate', { fromDate: filter.fromDate });
    }

    if (filter?.toDate) {
      query.andWhere('log.createdAt <= :toDate', { toDate: filter.toDate });
    }

    // Order by most recent first
    query.orderBy('log.createdAt', 'DESC');

    // Apply pagination
    query.take(limit);
    query.skip(offset);

    return query.getMany();
  }

  /**
   * Get total count of audit logs (for pagination)
   */
  async countAll(filter?: AuditLogFilterInput, restrictToUserId?: string): Promise<number> {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (restrictToUserId) {
      query.andWhere(
        '(log.actorId = :userId OR log.entityOwnerId = :userId)',
        { userId: restrictToUserId },
      );
    }

    if (filter?.actorId) {
      query.andWhere('log.actorId = :actorId', { actorId: filter.actorId });
    }

    if (filter?.entityType) {
      query.andWhere('log.entityType = :entityType', { entityType: filter.entityType });
    }

    if (filter?.entityId) {
      query.andWhere('log.entityId = :entityId', { entityId: filter.entityId });
    }

    if (filter?.action) {
      query.andWhere('log.action = :action', { action: filter.action });
    }

    if (filter?.fromDate) {
      query.andWhere('log.createdAt >= :fromDate', { fromDate: filter.fromDate });
    }

    if (filter?.toDate) {
      query.andWhere('log.createdAt <= :toDate', { toDate: filter.toDate });
    }

    return query.getCount();
  }
}
