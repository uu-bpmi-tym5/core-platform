import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './entities';
import { AuditLogFilterInput, AuditLogPaginationInput } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { Role } from '../auth/enums';
import type { JwtPayload } from '../auth/auth.service';

@Resolver(() => AuditLog)
export class AuditLogResolver {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Get audit logs - accessible to all authenticated users.
   * - Admins see all logs
   * - Regular users only see logs where they are the actor or entity owner
   */
  @Query(() => [AuditLog], { name: 'auditLogs' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAuditLogs(
    @GetCurrentUser() user: JwtPayload,
    @Args('filter', { nullable: true }) filter?: AuditLogFilterInput,
    @Args('pagination', { nullable: true }) pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    // Admins can see all logs
    if (user.role === Role.ADMIN) {
      return this.auditLogService.findAll(filter, pagination);
    }

    // Regular users can only see their own logs
    return this.auditLogService.findForUser(user.userId, filter, pagination);
  }

  /**
   * Get total count of audit logs for pagination
   */
  @Query(() => Int, { name: 'auditLogsCount' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  async countAuditLogs(
    @GetCurrentUser() user: JwtPayload,
    @Args('filter', { nullable: true }) filter?: AuditLogFilterInput,
  ): Promise<number> {
    if (user.role === Role.ADMIN) {
      return this.auditLogService.countAll(filter);
    }

    return this.auditLogService.countAll(filter, user.userId);
  }

  /**
   * Get a single audit log by ID
   * - Admins can see any log
   * - Regular users can only see logs they have access to
   */
  @Query(() => AuditLog, { name: 'auditLog', nullable: true })
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAuditLogById(
    @Args('id') id: string,
    @GetCurrentUser() user: JwtPayload,
  ): Promise<AuditLog | null> {
    const log = await this.auditLogService.findById(id);

    if (!log) {
      return null;
    }

    // Admins can see any log
    if (user.role === Role.ADMIN) {
      return log;
    }

    // Regular users can only see logs where they are the actor or entity owner
    if (log.actorId === user.userId || log.entityOwnerId === user.userId) {
      return log;
    }

    throw new ForbiddenException('You do not have access to this audit log');
  }

  /**
   * Get audit logs for a specific entity
   * Admin-only endpoint for investigating specific records
   */
  @Query(() => [AuditLog], { name: 'auditLogsForEntity' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAuditLogsForEntity(
    @GetCurrentUser() user: JwtPayload,
    @Args('entityType') entityType: string,
    @Args('entityId') entityId: string,
    @Args('pagination', { nullable: true }) pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    // Only admins can search by entity directly
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can search audit logs by entity');
    }

    return this.auditLogService.findByEntity(entityType, entityId, pagination);
  }

  /**
   * Get my audit logs - shows logs where the current user is the actor
   */
  @Query(() => [AuditLog], { name: 'myAuditLogs' })
  @UseGuards(JwtAuthGuard)
  async findMyAuditLogs(
    @GetCurrentUser() user: JwtPayload,
    @Args('filter', { nullable: true }) filter?: AuditLogFilterInput,
    @Args('pagination', { nullable: true }) pagination?: AuditLogPaginationInput,
  ): Promise<AuditLog[]> {
    // Force filter to only show logs where user is the actor
    const userFilter: AuditLogFilterInput = {
      ...filter,
      actorId: user.userId,
    };

    return this.auditLogService.findAll(userFilter, pagination);
  }
}

