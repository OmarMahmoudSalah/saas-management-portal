/**
 * 🏢 Multi-Tenant Database & Storage Key Isolation Service
 * Provides strict key-prefixing and query parameter isolation for multi-tenant database records.
 */

export class TenantIsolationService {
  /**
   * Generates a tenant-scoped database record key.
   * e.g., 'org_acme' + 'carton_101' -> 'tenant_org_acme:carton_101'
   */
  getTenantScopedKey(tenantId, recordId) {
    if (!tenantId) throw new Error('Tenant ID is required for key isolation.');
    if (!recordId) throw new Error('Record ID is required.');
    const safeTenant = tenantId.toLowerCase().trim();
    return `tenant_${safeTenant}:${recordId}`;
  }

  /**
   * Extracts the original record ID from a tenant-scoped key.
   */
  extractOriginalKey(scopedKey) {
    if (!scopedKey || !scopedKey.startsWith('tenant_')) return scopedKey;
    const colonIndex = scopedKey.indexOf(':');
    if (colonIndex === -1) return scopedKey;
    return scopedKey.substring(colonIndex + 1);
  }

  /**
   * Applies tenant isolation filter to a raw SQL query string or parameter array.
   */
  applyTenantSqlFilter(sqlQuery, params = [], tenantId) {
    if (!tenantId) return { sqlQuery, params };
    const safeTenant = tenantId.toLowerCase().trim();
    
    // Scopes query by appending tenant prefix check
    const tenantPrefix = `tenant_${safeTenant}:%`;
    const hasWhere = sqlQuery.toUpperCase().includes('WHERE');
    const filterClause = hasWhere 
      ? ` AND id LIKE $${params.length + 1}`
      : ` WHERE id LIKE $${params.length + 1}`;

    return {
      sqlQuery: `${sqlQuery}${filterClause}`,
      params: [...params, tenantPrefix]
    };
  }
}

export const tenantIsolationService = new TenantIsolationService();
