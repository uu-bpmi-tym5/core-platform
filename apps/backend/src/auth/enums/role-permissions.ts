import { Role } from './role.enum';
import { Permission } from './permission.enum';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPPORTER]: [
    Permission.VIEW_CAMPAIGNS,
    Permission.CREATE_CAMPAIGN,
    Permission.UPDATE_OWN_CAMPAIGN,
    Permission.DELETE_OWN_CAMPAIGN,
    Permission.CONTRIBUTE_TO_CAMPAIGN,
    Permission.READ_COMMENTS,
    Permission.WRITE_COMMENT,
    Permission.MANAGE_NOTIFICATIONS,
  ],

  [Role.MODERATOR]: [
    Permission.VIEW_CAMPAIGNS,
    Permission.CREATE_CAMPAIGN,
    Permission.UPDATE_OWN_CAMPAIGN,
    Permission.DELETE_OWN_CAMPAIGN,
    Permission.APPROVE_CAMPAIGN,
    Permission.REJECT_CAMPAIGN,
    Permission.READ_COMMENTS,
    Permission.WRITE_COMMENT,
    Permission.MODERATE_COMMENTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PLATFORM_SETTINGS,
  ],

  [Role.ADMIN]: [
    Permission.VIEW_CAMPAIGNS,
    Permission.CREATE_CAMPAIGN,
    Permission.UPDATE_OWN_CAMPAIGN,
    Permission.DELETE_OWN_CAMPAIGN,
    Permission.UPDATE_ANY_CAMPAIGN,
    Permission.DELETE_ANY_CAMPAIGN,
    Permission.APPROVE_CAMPAIGN,
    Permission.REJECT_CAMPAIGN,
    Permission.CONTRIBUTE_TO_CAMPAIGN,
    Permission.READ_COMMENTS,
    Permission.WRITE_COMMENT,
    Permission.MODERATE_COMMENTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_PLATFORM_SETTINGS,
    Permission.MANAGE_NOTIFICATIONS,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

