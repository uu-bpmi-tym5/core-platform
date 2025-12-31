import { DataSource } from 'typeorm';
import { AuditLog } from './entities';

export const auditLogProviders = [
  {
    provide: 'AUDIT_LOG_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AuditLog),
    inject: ['DATA_SOURCE'],
  },
];

