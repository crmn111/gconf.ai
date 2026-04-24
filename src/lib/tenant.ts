import { headers } from 'next/headers';

const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_GCONF_API_KEY || '';

/**
 * Get the tenant API key for the current request.
 * Mirrors chm-website's pattern so middleware-driven per-domain tenants work
 * the same way. Falls back to NEXT_PUBLIC_GCONF_API_KEY when no header is set.
 */
export async function getTenantApiKey(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-tenant-api-key') || DEFAULT_API_KEY;
}
