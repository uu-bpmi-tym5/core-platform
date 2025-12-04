'use client';

import * as React from 'react';
import { jwtDecode } from 'jwt-decode';
import { Role, ROLE_ACTIONS, canPerformAction } from './roles';

interface JwtPayload {
  sub: string;
  email: string;
  userId: string;
  sid: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface UseUserRoleReturn {
  userRole: Role | null;
  userId: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  hasRequiredRole: (requiredRoles: Role[]) => boolean;
  canPerform: (action: keyof typeof ROLE_ACTIONS) => boolean;
}

function decodeAuthToken(token: string | null): { role: Role | null; userId: string | null } {
  if (!token) return { role: null, userId: null };

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return {
      role: decoded.role || null,
      userId: decoded.userId || null
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return { role: null, userId: null };
  }
}

export function useUserRole(): UseUserRoleReturn {
  const [userRole, setUserRole] = React.useState<Role | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Function to update state from token
  const updateFromToken = React.useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authToken');
    const { role, userId: id } = decodeAuthToken(token);
    setUserRole(role);
    setUserId(id);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    // Initial load
    updateFromToken();

    // Listen for storage changes (e.g., login/logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        updateFromToken();
      }
    };

    // Also poll for changes since storage events don't fire in the same tab
    const interval = setInterval(updateFromToken, 1000);

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [updateFromToken]);

  const hasRequiredRole = React.useCallback((requiredRoles: Role[]): boolean => {
    if (!userRole) return false;
    return requiredRoles.includes(userRole);
  }, [userRole]);

  const canPerform = React.useCallback((action: keyof typeof ROLE_ACTIONS): boolean => {
    if (!userRole) return false;
    return canPerformAction(userRole, action);
  }, [userRole]);

  return {
    userRole,
    userId,
    isAdmin: userRole === Role.ADMIN,
    isModerator: userRole === Role.MODERATOR,
    isLoading,
    hasRequiredRole,
    canPerform,
  };
}

