/**
 * 🏢 SaaS Dynamic Feature Toggle & Flag Manager Service
 * Manages tenant-level feature overrides, global kill-switches, and audit history.
 */

import { SUBSCRIPTION_TIERS } from '../config/saasConfig.js';

export class FeatureToggleService {
  constructor() {
    // Tenant overrides map: tenantId -> Map<featureKey, boolean>
    this.tenantOverrides = new Map();
    // Global kill-switches: featureKey -> boolean (false means killed globally)
    this.globalKillSwitches = new Map();
    // Audit log of feature toggle changes
    this.toggleAuditLogs = [];
  }

  /**
   * Checks if a feature is enabled for a given tenant.
   * Priority: 1. Global Kill-Switch -> 2. Tenant Explicit Override -> 3. Subscription Plan Tier Default
   */
  isFeatureEnabled(tenantId, featureKey, planKey = 'FREE') {
    if (!featureKey) return false;

    // 1. Check Global Kill-Switch
    if (this.globalKillSwitches.has(featureKey) && this.globalKillSwitches.get(featureKey) === false) {
      return false; // Killed globally across all tenants
    }

    // 2. Check Tenant Explicit Override
    if (tenantId && this.tenantOverrides.has(tenantId)) {
      const overrides = this.tenantOverrides.get(tenantId);
      if (overrides.has(featureKey)) {
        return overrides.get(featureKey);
      }
    }

    // 3. Fallback to Subscription Plan Default
    const plan = SUBSCRIPTION_TIERS[planKey.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;
    return Boolean(plan.features && plan.features[featureKey] === true);
  }

  /**
   * Enables or disables a feature specifically for a tenant.
   */
  setTenantFeatureOverride(tenantId, featureKey, enabled, actor = 'admin') {
    if (!tenantId || !featureKey) throw new Error('tenantId and featureKey are required.');

    if (!this.tenantOverrides.has(tenantId)) {
      this.tenantOverrides.set(tenantId, new Map());
    }

    const previousState = this.tenantOverrides.get(tenantId).get(featureKey) ?? null;
    this.tenantOverrides.get(tenantId).set(featureKey, Boolean(enabled));

    const auditEntry = {
      id: `tgl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      actor,
      tenantId,
      featureKey,
      previousState,
      newState: Boolean(enabled),
      timestamp: new Date().toISOString()
    };

    this.toggleAuditLogs.push(auditEntry);
    return auditEntry;
  }

  /**
   * Sets global kill-switch for a feature across all tenants.
   */
  setGlobalKillSwitch(featureKey, enabled, actor = 'super_admin') {
    this.globalKillSwitches.set(featureKey, Boolean(enabled));
    
    const auditEntry = {
      id: `kill_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      actor,
      tenantId: 'GLOBAL',
      featureKey,
      newState: Boolean(enabled),
      timestamp: new Date().toISOString()
    };

    this.toggleAuditLogs.push(auditEntry);
    return auditEntry;
  }

  getTenantOverrides(tenantId) {
    if (!this.tenantOverrides.has(tenantId)) return {};
    const map = this.tenantOverrides.get(tenantId);
    const result = {};
    map.forEach((val, key) => { result[key] = val; });
    return result;
  }
}

export const featureToggleService = new FeatureToggleService();
