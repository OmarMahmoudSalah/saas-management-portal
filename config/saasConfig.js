/**
 * 🏢 SaaS Tier & Subscription Configuration
 * Defines resource quotas, feature flags, and billing plan tiers for multi-tenant deployment.
 */

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free Trial',
    nameAr: 'تجريبي مجاني',
    maxCartons: 500,
    maxContainers: 5,
    maxUsers: 2,
    maxStorageCbm: 50,
    features: {
      supplierAnalytics: false,
      customBilling: false,
      godMode: false,
      webAuthn: true,
      excelExport: true,
      apiAccess: false
    }
  },
  GROWTH: {
    id: 'growth',
    name: 'Growth Warehouse',
    nameAr: 'مستودع النمو',
    maxCartons: 10000,
    maxContainers: 50,
    maxUsers: 5,
    maxStorageCbm: 1000,
    features: {
      supplierAnalytics: true,
      customBilling: true,
      godMode: false,
      webAuthn: true,
      excelExport: true,
      apiAccess: true
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise Logistics',
    nameAr: 'مؤسسي لوجستي',
    maxCartons: Infinity,
    maxContainers: Infinity,
    maxUsers: 50,
    maxStorageCbm: Infinity,
    features: {
      supplierAnalytics: true,
      customBilling: true,
      godMode: true,
      webAuthn: true,
      excelExport: true,
      apiAccess: true
    }
  }
};

export const DEFAULT_TENANT_PLAN = 'FREE';
