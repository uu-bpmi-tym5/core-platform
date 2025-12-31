import { Module, Global, forwardRef } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogResolver } from './audit-log.resolver';
import { auditLogProviders } from './audit-log.providers';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

/**
 * AuditLogModule - Global module for audit logging
 *
 * This module provides audit logging capabilities throughout the application.
 * It is marked as @Global so that the AuditLogService can be injected
 * anywhere without explicitly importing the module.
 */
@Global()
@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)],
  providers: [...auditLogProviders, AuditLogService, AuditLogResolver],
  exports: [AuditLogService],
})
export class AuditLogModule {}

