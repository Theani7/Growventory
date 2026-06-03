# Growventory - Smart Nursery Management System

Growventory is a comprehensive nursery management platform designed to streamline inventory tracking, plant health monitoring, and staff coordination. Built with a focus on data integrity and security, it provides real-time insights for nursery operators.

[![Backend Status](https://img.shields.io/badge/Backend-Express.js-blue?style=flat-square)](https://expressjs.com/)
[![Frontend Status](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL-4479A1?style=flat-square)](https://www.mysql.com/)
[![Security](https://img.shields.io/badge/Security-Hardened-green?style=flat-square)](docs/full_audit_report_2026-06-03.md)

---

## 🚀 Key Features

- **Real-Time Inventory Management**: Advanced tracking of plant stock with automated movement logging.
- **Data Integrity Core**: Powered by a centralized `StockService` utilizing SQL transactions and row-level locking to prevent inventory discrepancies.
- **Plant Health Monitoring**: Scheduled health checks, growth stage tracking, and critical health alerts.
- **Role-Based Access Control (RBAC)**: Secure access for 4 distinct roles:
    - **Admin**: Full system control and user management.
    - **Supervisor**: Management of categories, stock, and health operations.
    - **Staff**: Day-to-day data entry and stock reporting.
    - **Auditor**: Read-only access to logs and reports for transparency.
- **Interactive Dashboard**: Visualized analytics using Recharts for stock levels, health trends, and category distribution.
- **Intelligent Notifications**: Real-time alerts for low stock levels and critical plant health issues.
- **Data Portability**: CSV export/import for plant catalogues and inventory reporting.

---

## 🛠 Tech Stack

### Backend (Robust API)
- **Node.js & Express.js**: High-performance asynchronous API layer.
- **MySQL**: Relational database for structured nursery data.
- **JWT & BCrypt**: Secure authentication and password hashing.
- **Security Hardening**: Protected by `helmet`, `express-rate-limit`, and environment-aware error handling.

### Frontend (Modern UI)
- **React 18 & Vite**: Fast, component-based user interface.
- **Tailwind CSS**: Responsive, utility-first styling for mobile and desktop.
- **Recharts**: Data visualization for nursery analytics.
- **React Hot Toast**: Real-time user feedback and error notifications.

---

## 📦 Project Structure

```bash
growventory/
├── backend/               # Express.js Server
│   ├── config/            # Database and environment config
│   ├── controllers/       # Business logic handlers
│   ├── middleware/        # Auth, RBAC, and Security middleware
│   ├── routes/            # API Route definitions
│   ├── services/          # Centralized services (StockService, etc.)
│   └── tests/             # Jest/Supertest integration tests
├── frontend/              # React SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # Auth and Global state
│   │   ├── pages/         # Dashboard and Module views
│   │   └── services/      # Axios API service with interceptors
└── docs/                  # Technical documentation and Audit reports
```

---

## 🛠 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/yenzee.git
   cd yenzee
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your DB credentials
   npm run dev           # Tables are auto-created on start
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env  # Configure API base URL
   npm run dev
   ```

### Initial Data Setup
- To seed default roles and an admin user, run the `seedAdmin.js` script:
  ```bash
  cd backend
  node seedAdmin.js
  ```

---

## 🛡 Security & Stability (June 2026 Audit)
The project recently underwent a comprehensive security audit. Key improvements include:
- **Centralized Service Layer**: Eliminated direct database modifications in controllers to ensure a 100% reliable audit trail.
- **Concurrency Protection**: Implemented `SELECT FOR UPDATE` locking to prevent "Lost Update" anomalies in high-traffic scenarios.
- **Infrastructure Hardening**: Added rate limiting to authentication endpoints and hardened HTTP headers.
- **Error Resilience**: Added global API interceptors to gracefully handle server-side failures on the frontend.

---

## 📖 Documentation
- [Full Database Schema](docs/Database_Schema.md)
- [API Documentation](docs/API_Documentation.md)
- [Security Audit Report](docs/full_audit_report_2026-06-03.md)
- [Deployment Guide](docs/Deployment_Guide.md)

---

## ⚖️ License
This project is developed as part of a Final Year Project. All rights reserved.
