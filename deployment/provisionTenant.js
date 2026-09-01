/**
 * 🚀 SaaS Multi-Tenant Automated Provisioning CLI Script
 * Run: node saas/deployment/provisionTenant.js --name "Acme Express" --plan GROWTH --email admin@acmecargo.com
 */

import { tenantService } from '../services/tenantService.js';
import { tenantIsolationService } from '../services/tenantIsolationService.js';
import { domainMappingService } from '../services/domainMappingService.js';
import { licenseObfuscationGuard } from '../security/licenseObfuscationGuard.js';

export function provisionTenantCli(options = {}) {
  const { name = 'Default Corp', plan = 'GROWTH', email = 'admin@example.com', domain = null } = options;

  // 1. Provision Tenant Profile
  const tenant = tenantService.createTenant(name, plan);

  // 2. Generate Scoped DB Namespace
  const dbNamespace = tenantIsolationService.getTenantScopedKey(tenant.tenantId, 'root');

  // 3. Register Custom Domain if provided
  let registeredDomain = null;
  if (domain) {
    registeredDomain = domainMappingService.registerCustomDomain(domain, tenant.tenantId);
  }

  // 4. Generate Hardware-Bound License Token
  const licenseToken = licenseObfuscationGuard.generateSignedLicenseToken(tenant.tenantId, 'prod_server_1', 365);

  // 5. Generate API Key
  const apiKey = `wh_live_${Math.random().toString(36).substr(2, 16)}`;

  const summary = {
    success: true,
    tenantId: tenant.tenantId,
    orgName: name,
    planKey: tenant.planKey,
    adminEmail: email,
    dbNamespace,
    registeredDomain,
    licenseToken,
    apiKey,
    provisionedAt: new Date().toISOString()
  };

  return summary;
}

// CLI runner execution check
if (process.argv[1] && process.argv[1].endsWith('provisionTenant.js')) {
  const args = process.argv.slice(2);
  const nameArg = args.find(a => a.startsWith('--name='))?.split('=')[1] || 'New Logistics Corp';
  const planArg = args.find(a => a.startsWith('--plan='))?.split('=')[1] || 'GROWTH';
  const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1] || 'admin@logistics.com';
  const domainArg = args.find(a => a.startsWith('--domain='))?.split('=')[1] || null;

  const result = provisionTenantCli({ name: nameArg, plan: planArg, email: emailArg, domain: domainArg });
  console.log('\n🎉 ========================================================');
  console.log('🚀 SaaS TENANT PROVISIONED SUCCESSFULLY');
  console.log('========================================================');
  console.log(JSON.stringify(result, null, 2));
  console.log('========================================================\n');
}
