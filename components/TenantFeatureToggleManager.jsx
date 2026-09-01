import React, { useState } from 'react';
import { SUBSCRIPTION_TIERS } from '../config/saasConfig';
import { featureToggleService } from '../services/featureToggleService';

const AVAILABLE_FEATURES = [
  { key: 'supplierAnalytics', label: '360° Supplier BI Analytics', desc: 'Pareto 80/20 concentration, factory output share, item diversity' },
  { key: 'customBilling', label: 'Custom Billing & Rate Cards', desc: 'D2/D4/D5/D8 shipping invoice rate matrices' },
  { key: 'webAuthn', label: 'Biometric Hardware Passkeys', desc: 'FaceID, TouchID, YubiKey FIDO2 authentication' },
  { key: 'apiAccess', label: 'Public REST API & Webhooks', desc: 'Developer API keys, webhook event triggers, HMAC signatures' },
  { key: 'excelExport', label: 'Excel & Pivot Manifest Exports', desc: '1-click Excel workbook downloads' },
  { key: 'godMode', label: 'Super-Admin Sealing Override', desc: 'Bypass in-transit container sealing protection' }
];

export function TenantFeatureToggleManager({ tenantId = 'org_acme_express', planKey = 'GROWTH' }) {
  const [refresh, setRefresh] = useState(0);

  const handleToggle = (featureKey, currentState) => {
    const newState = !currentState;
    featureToggleService.setTenantFeatureOverride(tenantId, featureKey, newState, 'super_admin');
    setRefresh(prev => prev + 1);
  };

  const handleKillSwitch = (featureKey, currentKillState) => {
    const newKillState = !currentKillState;
    featureToggleService.setGlobalKillSwitch(featureKey, newKillState, 'super_admin');
    setRefresh(prev => prev + 1);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', pb: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#0f172a' }}>⚙️ Tenant Feature Flag & Security Manager</h3>
          <span style={{ fontSize: 12, color: '#64748b' }}>Target Organization: <strong>{tenantId}</strong> ({planKey} Plan)</span>
        </div>
        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
          DYNAMIC TOGGLES ACTIVE
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {AVAILABLE_FEATURES.map(feat => {
          const isEnabled = featureToggleService.isFeatureEnabled(tenantId, feat.key, planKey);
          const isGlobalKilled = featureToggleService.globalKillSwitches.get(feat.key) === false;

          return (
            <div key={feat.key} style={{ background: isGlobalKilled ? '#fef2f2' : isEnabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isGlobalKilled ? '#fecaca' : isEnabled ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 8, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{feat.label}</span>
                  {isGlobalKilled && (
                    <span style={{ background: '#ef4444', color: '#ffffff', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                      GLOBAL KILL-SWITCH ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{feat.desc}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => handleToggle(feat.key, isEnabled)}
                  disabled={isGlobalKilled}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: isGlobalKilled ? '#cbd5e1' : isEnabled ? '#10b981' : '#64748b',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isGlobalKilled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isEnabled ? 'Enabled ✓' : 'Disabled ✕'}
                </button>

                <button
                  onClick={() => handleKillSwitch(feat.key, isGlobalKilled)}
                  title="Toggle platform-wide kill-switch"
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #fca5a5',
                    background: isGlobalKilled ? '#ef4444' : '#ffffff',
                    color: isGlobalKilled ? '#ffffff' : '#dc2626',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isGlobalKilled ? 'Re-enable Global' : 'Kill Global ⛔'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
