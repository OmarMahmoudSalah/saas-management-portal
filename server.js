/**
 * 👑 Door to Door — SaaS Central Control Portal Web Server & Live Telemetry Receiver
 * Standalone Master Management HQ Application (Port 8080)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.SAAS_PORT || process.env.PORT || 8080;
const indexPath = path.join(__dirname, 'index.html');
const cssPath = path.join(__dirname, 'index.css');

// In-Memory Live Clients Store — Populated 100% by Real App Instance Heartbeats
const liveClientsMap = new Map();

const server = http.createServer((req, res) => {
  // CORS Headers for Central Control Dashboard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Live Telemetry Heartbeat Receiver Endpoint
  if (req.method === 'POST' && req.url === '/api/telemetry') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const tenantId = data.tenantId || 'org_default';

        const existing = liveClientsMap.get(tenantId) || {
          id: tenantId,
          name: data.orgName || tenantId,
          plan: 'GROWTH',
          status: 'ACTIVE'
        };

        existing.lastSeen = new Date().toISOString();
        existing.hwFingerprint = data.hwFingerprint || existing.hwFingerprint;
        existing.version = data.version;
        existing.uptime = data.uptime;
        existing.nodeType = 'CHILD_APP_NODE';
        existing.parentAuthority = 'PARENT_MASTER_HQ';

        liveClientsMap.set(tenantId, existing);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, status: existing.status }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid Telemetry Payload' }));
      }
    });
    return;
  }

  // 2. Fetch All Connected Clients Endpoint
  if (req.method === 'GET' && req.url === '/api/clients') {
    const clientsList = Array.from(liveClientsMap.values());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(clientsList));
    return;
  }

  // 3. Toggle Client App Access (Remote Suspension Kill-Switch)
  if (req.method === 'POST' && req.url === '/api/clients/toggle') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { tenantId } = JSON.parse(body);
        const client = liveClientsMap.get(tenantId);
        if (client) {
          client.status = client.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          liveClientsMap.set(tenantId, client);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, client }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to toggle client' }));
      }
    });
    return;
  }

  // 4. Serve Main App CSS
  if (req.url === '/index.css' || req.url === '/src/index.css') {
    fs.readFile(cssPath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('CSS Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(content);
    });
    return;
  }

  // 5. Serve Dashboard HTML
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(indexPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading SaaS Central Control Portal');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n👑 ========================================================`);
  console.log(`👑 DOOR TO DOOR — SAAS MASTER CONTROL PORTAL STANDALONE`);
  console.log(`========================================================`);
  console.log(`👉 Access Portal: http://localhost:${PORT}`);
  console.log(`========================================================\n`);
});
