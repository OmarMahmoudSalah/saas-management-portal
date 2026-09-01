/**
 * 🏢 SaaS Multi-Tenant Architecture Facade
 * Export point for all SaaS configuration, services, security guards, and middleware.
 */

export * from './config/saasConfig.js';
export * from './services/tenantService.js';
export * from './services/tenantIsolationService.js';
export * from './services/domainMappingService.js';
export * from './services/billingProviderService.js';
export * from './services/featureToggleService.js';
export * from './services/tenantHealthService.js';
export * from './services/tenantBackupService.js';
export * from './security/saasSecurityGuard.js';
export * from './security/tenantRateLimiter.js';
export * from './security/tenantDataEncryptionService.js';
export * from './security/licenseObfuscationGuard.js';
export * from './security/tenantHeaderTamperGuard.js';
export * from './middleware/tenantContext.js';
export * from './middleware/usageMeter.js';
export * from './middleware/featureGuard.js';
