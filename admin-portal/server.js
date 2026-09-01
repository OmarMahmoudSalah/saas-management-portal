/**
 * 👑 Door to Door — SaaS Central Control Portal Web Server & Live Telemetry Receiver
 * Runs on Port 8080 (Completely isolated from user app on port 5173/3001)
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.SAAS_PORT || 8080;
const indexPath = path.join(__dirname, 'index.html');

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

  // 2. Fetch Live Clients API for Control Dashboard
  if (req.method === 'GET' && req.url === '/api/clients') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Array.from(liveClientsMap.values())));
    return;
  }

  // 3. Remote Status Toggle API
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

  // Serve exact main app src/index.css
  if (req.url === '/src/index.css' || req.url === '/index.css') {
    const cssPath = path.join(__dirname, '..', '..', 'src', 'index.css');
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

  // 4. Serve Dashboard HTML
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
  console.log(`👑 DOOR TO DOOR — SAAS CENTRAL CONTROL PORTAL LIVE`);
  console.log(`========================================================`);
  console.log(`👉 Access Portal: http://localhost:${PORT}`);
  console.log(`========================================================\n`);
});
