/**
 * 🏢 Custom Domain & Subdomain Resolver Service
 * Maps custom domains (e.g. logistics.acmecargo.com) and subdomains to tenant IDs.
 */

export class DomainMappingService {
  constructor() {
    this.domainMap = new Map();
  }

  registerCustomDomain(customDomain, tenantId) {
    if (!customDomain || !tenantId) throw new Error('Domain and Tenant ID are required.');
    const safeDomain = customDomain.toLowerCase().trim().replace(/^https?:\/\//, '');
    this.domainMap.set(safeDomain, tenantId.toLowerCase().trim());
    return { domain: safeDomain, tenantId: tenantId.toLowerCase().trim(), verified: true };
  }

  resolveTenantFromHost(hostname) {
    if (!hostname) return null;
    const safeHost = hostname.toLowerCase().trim();

    // 1. Check exact custom domain mapping
    if (this.domainMap.has(safeHost)) {
      return this.domainMap.get(safeHost);
    }

    // 2. Check wildcard subdomains (e.g. acme.warehouseapp.com)
    const parts = safeHost.split('.');
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
      return `org_${parts[0]}`;
    }

    return null;
  }

  removeCustomDomain(customDomain) {
    const safeDomain = customDomain.toLowerCase().trim().replace(/^https?:\/\//, '');
    return this.domainMap.delete(safeDomain);
  }
}

export const domainMappingService = new DomainMappingService();
