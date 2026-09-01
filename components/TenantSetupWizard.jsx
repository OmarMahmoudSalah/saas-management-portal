import React, { useState } from 'react';
import { SUBSCRIPTION_TIERS } from '../config/saasConfig';
import { tenantService } from '../services/tenantService';
import { tenantIsolationService } from '../services/tenantIsolationService';

export function TenantSetupWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState({
    orgName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    language: 'en',
    allowedModes: ['sea', 'air'],
    planKey: 'GROWTH',
    initialWarehouses: ['China Sea WH', 'Mokattam WH']
  });

  const [provisioned, setProvisioned] = useState(null);

  const handleNext = () => {
    if (step === 1 && (!orgData.orgName || !orgData.adminEmail)) {
      alert('Please enter Organization Name and Admin Email.');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      // Provision Tenant
      const tenant = tenantService.createTenant(orgData.orgName, orgData.planKey);
      const scopedDbKey = tenantIsolationService.getTenantScopedKey(tenant.tenantId, 'root');
      
      const result = {
        tenant,
        scopedDbKey,
        orgData,
        apiKey: `wh_live_${Math.random().toString(36).substr(2, 16)}`,
        provisionedAt: new Date().toISOString()
      };

      setProvisioned(result);
      setStep(5);
      if (typeof onComplete === 'function') onComplete(result);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', background: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      {/* Wizard Header Progress */}
      <div style={{ background: '#0f172a', color: '#ffffff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>🏢 Multi-Tenant Organization Setup Wizard</h3>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Step {step} of 5 — Provisioning New SaaS Tenant</span>
        </div>
        <span style={{ background: '#3b82f6', color: '#ffffff', padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
          {step === 5 ? 'COMPLETED' : `STEP ${step}`}
        </span>
      </div>

      <div style={{ padding: 24 }}>
        {/* Step 1: Organization & Admin */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 15 }}>1. Organization & Admin Profile</h4>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Organization / Company Name</label>
              <input
                type="text"
                value={orgData.orgName}
                onChange={e => setOrgData({ ...orgData, orgName: e.target.value })}
                placeholder="e.g. Acme Express Logistics"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Admin Name</label>
              <input
                type="text"
                value={orgData.adminName}
                onChange={e => setOrgData({ ...orgData, adminName: e.target.value })}
                placeholder="e.g. Omar Salah"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Admin Email</label>
              <input
                type="email"
                value={orgData.adminEmail}
                onChange={e => setOrgData({ ...orgData, adminEmail: e.target.value })}
                placeholder="admin@acmecargo.com"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>
          </div>
        )}

        {/* Step 2: Modes */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 15 }}>2. Operational Freight Modes</h4>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Select freight modes enabled for this organization:</p>
            {['sea', 'air', 'land'].map(mode => (
              <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={orgData.allowedModes.includes(mode)}
                  onChange={e => {
                    const checked = e.target.checked;
                    setOrgData({
                      ...orgData,
                      allowedModes: checked
                        ? [...orgData.allowedModes, mode]
                        : orgData.allowedModes.filter(m => m !== mode)
                    });
                  }}
                />
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{mode} Freight</span>
              </label>
            ))}
          </div>
        )}

        {/* Step 3: Subscription Plan */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 15 }}>3. Select Subscription Plan</h4>
            {Object.values(SUBSCRIPTION_TIERS).map(tier => (
              <div
                key={tier.id}
                onClick={() => setOrgData({ ...orgData, planKey: tier.id.toUpperCase() })}
                style={{
                  padding: 14,
                  borderRadius: 8,
                  border: orgData.planKey === tier.id.toUpperCase() ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: orgData.planKey === tier.id.toUpperCase() ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tier.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Max Cartons: {tier.maxCartons === Infinity ? 'Unlimited' : tier.maxCartons} • Users: {tier.maxUsers}
                  </div>
                </div>
                <input type="radio" checked={orgData.planKey === tier.id.toUpperCase()} readOnly />
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Summary & Provision Confirmation */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 15 }}>4. Review & Provision Tenant</h4>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>Organization:</strong> {orgData.orgName}</div>
              <div><strong>Admin Email:</strong> {orgData.adminEmail}</div>
              <div><strong>Plan Selected:</strong> {orgData.planKey}</div>
              <div><strong>Freight Modes:</strong> {orgData.allowedModes.join(', ').toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Step 5: Provisioned Summary */}
        {step === 5 && provisioned && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 14, borderRadius: 8, color: '#166534' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 15 }}>🎉 SaaS Tenant Successfully Provisioned!</h4>
              <p style={{ margin: 0, fontSize: 12 }}>Organization workspace and isolated database namespace have been created.</p>
            </div>
            <div style={{ background: '#0f172a', color: '#38bdf8', padding: 14, borderRadius: 8, fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>Tenant ID: {provisioned.tenant.tenantId}</div>
              <div>DB Namespace: {provisioned.tenant.namespaceKey}</div>
              <div>API Key: {provisioned.apiKey}</div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          {step > 1 && step < 5 ? (
            <button type="button" onClick={handlePrev} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: 13 }}>
              ← Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button type="button" onClick={handleNext} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              {step === 4 ? 'Provision Tenant ⚡' : 'Next Step →'}
            </button>
          ) : (
            <button type="button" onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#10b981', color: '#ffffff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Close Wizard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
