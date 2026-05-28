# FYP Presentation Notes

## Project Overview

**Title:** Growventory - Nursery Inventory Management System  
**Type:** Web Application (Full-Stack)  
**Duration:** 9 Sprints (Agile Development)

---

## Problem Statement

Traditional nurseries face challenges in:
- Manual tracking of plant inventory
- Lack of real-time stock visibility
- No automated alerts for low stock
- Difficulty monitoring plant health
- No centralized reporting system

**Solution:** A digital inventory management system with real-time tracking, automated alerts, and comprehensive reporting.

---

## Key Features

### 1. Authentication & Authorization
- JWT-based secure authentication
- Role-Based Access Control (RBAC)
- 4 roles: Admin, Supervisor, Staff, Auditor

### 2. Plant Management
- Complete CRUD operations
- Image upload support
- Category-based organization
- Search and filter capabilities

### 3. Stock Management
- Real-time stock tracking
- IN/OUT/ADJUSTMENT movements
- Automatic stock calculation
- Prevents negative stock

### 4. Health Monitoring
- Health status tracking
- Growth stage monitoring
- Historical health logs
- Critical health alerts

### 5. Dashboard & Analytics
- Visual statistics with charts
- Low stock alerts
- Category-wise breakdown
- Recent activity feed

### 6. Reporting
- CSV export for inventory
- Stock movement reports
- Health logs export
- Summary reports

### 7. Notifications
- Real-time alerts
- Low stock warnings
- Health issue notifications
- Read/unread tracking

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| Authentication | JWT, bcryptjs |
| Charts | Recharts |
| Deployment | AWS EC2, RDS, Nginx |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Express   │────▶│   MySQL     │
│   Frontend  │◀────│   Backend   │◀────│   Database  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │
      │                   │
      ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Nginx     │     │     PM2     │
│   Server    │     │  Process    │
└─────────────┘     └─────────────┘
```

---

## Database Design

**8 Tables:**
1. `users` - User accounts
2. `roles` - User roles
3. `categories` - Plant categories
4. `plants` - Plant inventory
5. `stock_movements` - Stock history
6. `plant_health_logs` - Health records
7. `activity_logs` - System activity
8. `notifications` - User alerts

**Key Relationships:**
- Users belong to Roles (N:1)
- Plants belong to Categories (N:1)
- Stock movements reference Plants (N:1)
- Health logs reference Plants (N:1)

---

## Security Features

1. **Password Hashing** - bcryptjs with salt rounds
2. **JWT Tokens** - 7-day expiry, secure transmission
3. **RBAC** - Role-based route protection
4. **SQL Injection Prevention** - Parameterized queries
5. **Input Validation** - Server-side validation

---

## Development Methodology

**Agile - 9 Sprints:**

| Sprint | Deliverable |
|--------|-------------|
| 1 | Backend foundation + Authentication |
| 2 | Plant catalogue & categories |
| 3 | Inventory & stock management |
| 4 | Plant health monitoring |
| 5 | Dashboard & analytics |
| 6 | Reporting & notifications |
| 7 | Frontend setup + Auth UI |
| 8 | Complete frontend pages |
| 9 | Testing & AWS deployment |

---

## Viva Questions & Answers

### Q1: Why did you choose this tech stack?
**A:** Node.js + Express for fast development and JavaScript consistency. React for modern, responsive UI. MySQL for relational data integrity. AWS for scalable, reliable cloud infrastructure.

### Q2: How does the authentication work?
**A:** JWT tokens are issued on login, stored in localStorage, and sent with each request in the Authorization header. The backend validates the token and extracts user info.

### Q3: How do you prevent SQL injection?
**A:** All database queries use parameterized queries via the mysql2 library. User input is never concatenated directly into SQL strings.

### Q4: How does the stock management prevent errors?
**A:** Stock movements use database transactions. OUT movements check stock before processing. The system prevents negative stock and logs all changes for audit.

### Q5: How are notifications generated?
**A:** The notification helper checks stock levels and health status. When stock falls below threshold or health is poor/critical, notifications are created for all admin and supervisor users.

### Q6: What are the deployment steps?
**A:** 
1. Set up RDS MySQL database
2. Launch EC2 instance
3. Install Node.js, PM2, Nginx
4. Clone code, install dependencies
5. Configure environment variables
6. Start backend with PM2
7. Build frontend, serve with Nginx
8. Configure SSL with Let's Encrypt

### Q7: How would you scale this application?
**A:** 
- Use load balancer (ALB)
- Add caching layer (Redis)
- Implement database read replicas
- Use S3 for image storage
- Add CDN for static assets
- Horizontal scaling with auto-scaling groups

---

## Demo Script

1. **Login Page** - Show beautiful UI, enter credentials
2. **Dashboard** - Highlight stats cards, charts, alerts
3. **Plants** - Search, filter, add new plant with image
4. **Stock** - Record IN movement, show automatic update
5. **Health** - Record health check, show status change
6. **Notifications** - Show auto-generated alert
7. **Reports** - Download CSV report
8. **Mobile View** - Demonstrate responsiveness

---

## Future Enhancements

1. Mobile app (React Native)
2. Barcode/QR scanning
3. Supplier management
4. Order processing
5. Sales analytics
6. Email/SMS notifications
7. Multi-branch support
8. Offline mode with sync

---

## Conclusion

Growventory successfully addresses nursery inventory challenges with:
- Modern, user-friendly interface
- Real-time tracking and alerts
- Comprehensive reporting
- Secure, scalable architecture
- Production-ready deployment

The project demonstrates full-stack development skills, cloud deployment, and practical problem-solving for the agriculture industry.
