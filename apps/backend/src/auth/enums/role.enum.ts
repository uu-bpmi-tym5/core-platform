import { registerEnumType } from '@nestjs/graphql';

export enum Role {
  SUPPORTER = 'SUPPORTER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'User role in the system',
});

