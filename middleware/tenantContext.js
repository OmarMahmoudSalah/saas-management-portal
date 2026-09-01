/**
 * 🏢 Multi-Tenant Context Resolver Middleware
 * Extracts and validates tenant identifier from request headers or subdomain.
 */

export function resolveTenantContext(options = {}) {
  const headerName = options.headerName || 'x-tenant-id';
  const defaultTenant = options.defaultTenant || 'tenant_default';

  return (req, res, next) => {
    let tenantId = req.headers[headerName] || req.headers['x-organization-id'];

    // Fallback: Check subdomain if request hostname contains subdomains (e.g. tenant1.warehouse.app)
    if (!tenantId && req.hostname) {
      const parts = req.hostname.split('.');
      if (parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
        tenantId = `tenant_${parts[0]}`;
      }
    }

    // Final fallback for default single-org compatibility
    req.tenantId = (tenantId || defaultTenant).toLowerCase().trim();
    req.tenantContext = {
      tenantId: req.tenantId,
      resolvedAt: Date.now()
    };

    next();
  };
}
