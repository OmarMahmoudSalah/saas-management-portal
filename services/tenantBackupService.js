/**
 * 🏢 Isolated Multi-Tenant Data Backup & Migration Service
 */

import { tenantIsolationService } from './tenantIsolationService.js';

export class TenantBackupService {
  /**
   * Creates an isolated JSON snapshot payload for a single tenant's data.
   */
  createTenantSnapshot(tenantId, tenantRecords = []) {
    if (!tenantId) throw new Error('tenantId is required to create a tenant backup snapshot.');

    const safeTenant = tenantId.toLowerCase().trim();
    const prefix = `tenant_${safeTenant}:`;

    // Filter records belonging strictly to this tenant
    const isolatedRecords = tenantRecords.filter(rec => {
      return rec.id && rec.id.startsWith(prefix);
    });

    const snapshot = {
      version: '1.2.0.7',
      tenantId: safeTenant,
      exportedAt: new Date().toISOString(),
      recordCount: isolatedRecords.length,
      records: isolatedRecords.map(rec => ({
        ...rec,
        unscopedId: tenantIsolationService.extractOriginalKey(rec.id)
      }))
    };

    return snapshot;
  }

  /**
   * Restores/imports a tenant snapshot into an isolated data namespace.
   */
  restoreTenantSnapshot(targetTenantId, snapshotPayload) {
    if (!targetTenantId || !snapshotPayload || !Array.isArray(snapshotPayload.records)) {
      throw new Error('Invalid tenant snapshot restore payload.');
    }

    const restoredRecords = snapshotPayload.records.map(rec => {
      const originalId = rec.unscopedId || tenantIsolationService.extractOriginalKey(rec.id);
      const scopedId = tenantIsolationService.getTenantScopedKey(targetTenantId, originalId);

      return {
        ...rec,
        id: scopedId,
        tenantId: targetTenantId,
        restoredAt: new Date().toISOString()
      };
    });

    return {
      success: true,
      targetTenantId,
      importedCount: restoredRecords.length,
      records: restoredRecords
    };
  }
}

export const tenantBackupService = new TenantBackupService();
