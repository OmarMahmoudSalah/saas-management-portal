# 👑 Door to Door — SaaS Master Central Control Portal & Telemetry Hub

Isolated, Standalone SaaS Management Command Center for Door to Door Company Super-Admins. Controls, licenses, monitors, and remotely manages client warehouse application instances.

---

## 🌟 Key Capabilities

1. **Standalone Architecture**: 100% isolated from client warehouse applications (`Port 8080`).
2. **Real-Time Client Telemetry**: Live heartbeats, uptime metrics, and version monitoring for distributed app instances.
3. **Hardware Anti-Cloning Licensing**: Issues HMAC-SHA256 cryptographically signed tokens (`wh_lic_v1_...`) bound strictly to client VPS Machine IDs.
4. **Remote Kill-Switch**: 1-click **`🚫 Suspend App`** / **`✅ Activate App`** controls to instantly block/restore client access.
5. **Exact App UI & Color Replica**: Built using the exact same Obsidian Antigravity dark theme design system (`Inter`, `Lucide Icons`, CSS variables).

---

## 🚀 Quick Start (Local Run)

```bash
# Install dependencies
npm install

# Start Central Control Portal on Port 8080
npm start
```

Navigate to **`http://localhost:8080`** in your browser.

---

## 🐙 Push to New GitHub Repository

To push this isolated project to a brand-new GitHub repository:

```bash
git init
git add .
git commit -m "feat: initial standalone SaaS Central Control Portal & Telemetry Hub"
git branch -M main
git remote add origin git@github.com:YOUR_ORGANIZATION/saas-management-portal.git
git push -u origin main
```

---

## 🐳 Docker Production Deployment

```bash
docker-compose -f deployment/docker-compose.saas.yml up -d
```

---

## 📄 License
UNLICENSED — Proprietary & Confidential Door to Door Company HQ Property.
