// Definizione dei ruoli disponibili
export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// Permessi per ogni ruolo
export const PERMISSIONS = {
  [ROLES.MEMBER]: [
    'couple:read',
    'couple:update',
    'memory:create',
    'memory:read',
    'memory:update',
    'memory:delete',
    'idea:create',
    'idea:read',
    'idea:update',
    'idea:delete',
    'moment:create',
    'moment:read',
    'moment:participate',
    'moment:upload',
    'moment:complete',
    'notification:read',
    'profile:update',
  ],
  [ROLES.ADMIN]: [
    'couple:read',
    'couple:update',
    'couple:delete',
    'couple:manage_members',
    'memory:create',
    'memory:read',
    'memory:update',
    'memory:delete',
    'memory:manage_all',
    'idea:create',
    'idea:read',
    'idea:update',
    'idea:delete',
    'idea:manage_all',
    'moment:create',
    'moment:read',
    'moment:participate',
    'moment:manage_all',
    'moment:upload',
    'moment:complete',
    'notification:read',
    'notification:manage_all',
    'profile:update',
    'admin:manage_users',
    'admin:system_settings',
  ],
} as const

export type Permission = 
  | typeof PERMISSIONS[typeof ROLES.MEMBER][number]
  | typeof PERMISSIONS[typeof ROLES.ADMIN][number]

// Utility per controllare se un ruolo ha un permesso specifico
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[role] as readonly Permission[]).includes(permission)
}

// Utility per verificare se un utente è admin
export function isAdmin(role: UserRole): boolean {
  return role === ROLES.ADMIN
}

// Utility per verificare se un utente è member
export function isMember(role: UserRole): boolean {
  return role === ROLES.MEMBER
}

// Utility per ottenere tutti i permessi di un ruolo
export function getRolePermissions(role: UserRole): readonly Permission[] {
  return PERMISSIONS[role]
}

// Utility per verificare se un ruolo è valido
export function isValidRole(role: string): role is UserRole {
  return Object.values(ROLES).includes(role as UserRole)
}

// Middleware helper per verificare i permessi
export function checkPermission(userRole: UserRole, requiredPermission: Permission): boolean {
  return hasPermission(userRole, requiredPermission)
}

// Helper per verificare permessi multipli (AND logic)
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

// Helper per verificare almeno uno dei permessi (OR logic)
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
} 