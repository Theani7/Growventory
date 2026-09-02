# Growventory - AI Agent Project Instructions & Memory

## 🌿 Project Context
- **Application:** Growventory (Smart Nursery Management System)
- **Purpose:** University Final Year Project (FYP) Showcase (September 10, 2026)
- **Live Production URL:** [https://growventory.duckdns.org](https://growventory.duckdns.org) 🔒
- **Public IP:** `13.60.98.40` (auto 301 redirects to HTTPS)
- **Conversation History Reference:** Previous setup conversation ID is `21d3c7e6-f3b6-4374-991a-b738baea4d0a`.

---

## ⚡ Production AWS Architecture & Infrastructure Reference
**CRITICAL RULE FOR ALL AI AGENTS:**
All server credentials, SSH commands, database endpoints, Nginx reverse proxy configs, PM2 manifests, and runbooks are permanently documented in:
👉 **`AWS_DEPLOYMENT_INFO.md`** (located at project root).

Always read `AWS_DEPLOYMENT_INFO.md` before executing any production, deployment, or server-related tasks. Do not ask the user for server details—everything is in that file.

---

## 🛠️ Stack & Key Rules
1. **Frontend:** React 18, TypeScript, Vite, Tailwind CSS. Build with `npm run build` in `frontend/`.
2. **Backend:** Express, TypeScript, MySQL (`mysql2/promise`). Build with `npm run build` in `backend/`.
3. **Database:** AWS RDS MySQL 8.4 Community Edition (`growventory-db`).
4. **Deploy Updates:** To deploy latest changes from GitHub to AWS:
   ```bash
   ssh -i ~/Downloads/growventory-key.pem ubuntu@13.60.98.40 "cd ~/Growventory && bash deploy/update.sh"
   ```
5. **Plant Deletions:** When deleting a plant, `plantController.deletePlant` transactionally removes associated records from `plant_health_logs`, `stock_movements`, and the plant itself.
6. **MySQL 8 Query Constraints:** Binary prepared statements (`pool.execute`) reject parameter placeholders (`?`) for `LIMIT` and `OFFSET`. Always use validated integer interpolation (`LIMIT ${limit} OFFSET ${offset}`).
7. **Email & OTP:** Gmail SMTP delivers emails. OTPs are also logged to server logs (`tail -n 100 ~/Growventory/deploy/logs/api-out-0.log | grep OTP`).
