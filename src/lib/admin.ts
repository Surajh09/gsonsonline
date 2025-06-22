/**
 * Check if admin access is enabled based on environment variable
 */
export function isAdminEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_ENABLED === 'true';
} 