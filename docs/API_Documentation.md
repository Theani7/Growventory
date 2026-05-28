# API Documentation

**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer Token (include in Authorization header)

---

## Authentication

### Register User
```
POST /auth/register
```
**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string",
  "phone": "string (optional)",
  "role_id": "number"
}
```

### Login
```
POST /auth/login
```
**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```
**Response:** Returns JWT token and user data

### Get Current User
```
GET /auth/me
```
**Headers:** `Authorization: Bearer <token>`

### Seed Roles (Initial Setup)
```
POST /auth/seed-roles
```
Creates default roles: admin, staff, supervisor, auditor

---

## Categories

### Get All Categories
```
GET /categories
```
**Access:** All authenticated users

### Create Category
```
POST /categories
```
**Access:** Admin, Supervisor  
**Body:**
```json
{
  "category_name": "string",
  "description": "string (optional)"
}
```

### Update Category
```
PUT /categories/:id
```
**Access:** Admin, Supervisor

### Delete Category
```
DELETE /categories/:id
```
**Access:** Admin, Supervisor  
**Note:** Cannot delete if plants are assigned

---

## Plants

### Get All Plants
```
GET /plants
```
**Query Parameters:**
- `search` - Search by name
- `category_id` - Filter by category
- `health_status` - Filter by health
- `min_stock` - Filter by minimum stock

### Get Single Plant
```
GET /plants/:id
```

### Create Plant
```
POST /plants
```
**Access:** Admin, Supervisor, Staff  
**Body:** multipart/form-data
- `name` (required)
- `scientific_name`
- `category_id` (required)
- `current_stock` (required)
- `min_stock_threshold` (required)
- `purchase_price`
- `selling_price`
- `location`
- `description`
- `image` (file)

### Update Plant
```
PUT /plants/:id
```
**Access:** Admin, Supervisor, Staff

### Delete Plant
```
DELETE /plants/:id
```
**Access:** Admin, Supervisor

---

## Stock Movements

### Get All Movements
```
GET /stock/movements
```
**Query Parameters:**
- `plant_id` - Filter by plant
- `movement_type` - Filter by type (IN, OUT, ADJUSTMENT)

### Record Movement
```
POST /stock/movement
```
**Access:** Admin, Supervisor, Staff  
**Body:**
```json
{
  "plant_id": "number",
  "movement_type": "IN | OUT | ADJUSTMENT",
  "quantity": "number",
  "notes": "string (optional)"
}
```

---

## Health Logs

### Get All Health Logs
```
GET /health/logs
```
**Query Parameters:**
- `plant_id` - Filter by plant
- `health_status` - Filter by status

### Record Health Check
```
POST /health/log
```
**Access:** Staff, Supervisor, Admin  
**Body:**
```json
{
  "plant_id": "number",
  "health_status": "healthy | under_observation | poor | critical",
  "growth_stage": "string (optional)",
  "notes": "string (optional)"
}
```

---

## Dashboard

### Get Overview Stats
```
GET /dashboard/overview
```
**Access:** All authenticated users

### Get Low Stock Plants
```
GET /dashboard/low-stock
```

### Get Category Statistics
```
GET /dashboard/category-stats
```

### Get Recent Activities
```
GET /dashboard/recent-activities
```

### Get Health Summary
```
GET /dashboard/health-summary
```

---

## Reports

### Export Inventory CSV
```
GET /reports/inventory-csv
```
**Access:** Admin, Supervisor  
Returns CSV file download

### Export Stock Movements CSV
```
GET /reports/stock-movements-csv
```
**Query Parameters:**
- `plant_id`
- `start_date`
- `end_date`

### Export Health Logs CSV
```
GET /reports/health-logs-csv
```
**Query Parameters:**
- `plant_id`

### Get Summary Report
```
GET /reports/summary
```
**Query Parameters:**
- `download=csv` - Download as CSV

---

## Notifications

### Get All Notifications
```
GET /notifications
```
Returns notifications with unread count

### Get Unread Notifications
```
GET /notifications/unread
```

### Mark as Read
```
PUT /notifications/:id/read
```

### Mark All as Read
```
PUT /notifications/mark-all-read
```

---

## Response Format

All responses follow this format:
```json
{
  "success": true|false,
  "message": "Description",
  "data": { ... },
  "error": "Error message (if failed)"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 500 | Internal Server Error |
