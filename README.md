# Growventory - Nursery Inventory Management System

A full-stack web application for managing nursery inventory, stock movements, plant health monitoring, and generating reports.

## Tech Stack

**Backend:** Node.js, Express.js, MySQL, JWT Authentication  
**Frontend:** React.js, Vite, Tailwind CSS, Recharts  
**Deployment:** AWS EC2, RDS MySQL, Nginx

## Features

- User authentication with role-based access (Admin, Supervisor, Staff, Auditor)
- Plant catalogue management with categories
- Stock tracking with IN/OUT/ADJUSTMENT movements
- Plant health monitoring and alerts
- Dashboard with analytics and charts
- CSV report generation
- Real-time notifications for low stock and health issues

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if backend URL differs
npm install
npm run dev
```

### Database Setup

1. Create MySQL database: `CREATE DATABASE growventory;`
2. Run the backend - tables are auto-created on first run
3. Seed roles: `POST /api/auth/seed-roles`
4. Register first user via `/register`

## Project Structure

```
growventory/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── uploads/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── public/
└── docs/
```

## API Endpoints

| Module | Endpoint | Method | Description |
|--------|----------|--------|-------------|
| Auth | /api/auth/register | POST | Register user |
| Auth | /api/auth/login | POST | Login user |
| Auth | /api/auth/me | GET | Get current user |
| Plants | /api/plants | GET/POST | List/Create plants |
| Plants | /api/plants/:id | GET/PUT/DELETE | Plant CRUD |
| Categories | /api/categories | GET/POST | List/Create categories |
| Stock | /api/stock/movements | GET | List movements |
| Stock | /api/stock/movement | POST | Record movement |
| Health | /api/health/logs | GET | List health logs |
| Health | /api/health/log | POST | Record health check |
| Dashboard | /api/dashboard/overview | GET | Dashboard stats |
| Reports | /api/reports/inventory-csv | GET | Export inventory |
| Notifications | /api/notifications | GET | Get notifications |

## Deployment

See [docs/Deployment_Guide.md](docs/Deployment_Guide.md) for AWS deployment instructions.

## Documentation

- [API Documentation](docs/API_Documentation.md)
- [Database Schema](docs/Database_Schema.md)
- [Deployment Guide](docs/Deployment_Guide.md)
- [FYP Presentation Notes](docs/FYP_Presentation_Notes.md)

## Author

Final Year Project - 2024/2025
# yenzee
