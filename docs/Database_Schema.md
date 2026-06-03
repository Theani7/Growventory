# Database Schema

## Entity Relationship Diagram

```
Users ──< Stock_Movements
Users ──< Plant_Health_Logs
Users ──< Activity_Logs
Users ──< Notifications
Users ──< Tasks
Users >── Roles

Categories ──< Plants

Plants ──< Stock_Movements
Plants ──< Plant_Health_Logs
```

---

## Tables

### roles
| Column | Type | Description |
|--------|------|-------------|
| role_id | INT PK AUTO_INCREMENT | Primary key |
| role_name | VARCHAR(50) UNIQUE | Admin, Staff, Supervisor, Auditor |
| description | TEXT | Role description |
| created_at | TIMESTAMP | Creation timestamp |

### users
| Column | Type | Description |
|--------|------|-------------|
| user_id | INT PK AUTO_INCREMENT | Primary key |
| username | VARCHAR(50) UNIQUE | Login username |
| email | VARCHAR(100) UNIQUE | User email |
| password | VARCHAR(255) | Bcrypt hashed password |
| full_name | VARCHAR(100) | Full name |
| phone | VARCHAR(20) | Phone number |
| role_id | INT FK | Reference to roles |
| is_active | BOOLEAN DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

### categories
| Column | Type | Description |
|--------|------|-------------|
| category_id | INT PK AUTO_INCREMENT | Primary key |
| category_name | VARCHAR(100) | Category name |
| description | TEXT | Description |
| created_at | TIMESTAMP | Creation timestamp |

### plants
| Column | Type | Description |
|--------|------|-------------|
| plant_id | INT PK AUTO_INCREMENT | Primary key |
| name | VARCHAR(100) | Plant name |
| scientific_name | VARCHAR(150) | Scientific name |
| category_id | INT FK | Reference to categories |
| current_stock | INT DEFAULT 0 | Current stock quantity |
| min_stock_threshold | INT DEFAULT 10 | Low stock alert threshold |
| health_status | ENUM | healthy, under_observation, poor, critical |
| growth_stage | VARCHAR(50) | Growth stage |
| location | VARCHAR(100) | Physical location |
| purchase_price | DECIMAL(10,2) | Cost price |
| selling_price | DECIMAL(10,2) | Selling price |
| description | TEXT | Additional notes |
| image_url | VARCHAR(255) | Image path |
| last_health_check | TIMESTAMP | Last check date |
| is_active | BOOLEAN DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

### stock_movements
| Column | Type | Description |
|--------|------|-------------|
| movement_id | INT PK AUTO_INCREMENT | Primary key |
| plant_id | INT FK | Reference to plants |
| movement_type | ENUM | IN, OUT, ADJUSTMENT |
| quantity | INT | Quantity moved |
| previous_stock | INT | Stock before movement |
| new_stock | INT | Stock after movement |
| notes | TEXT | Additional notes |
| created_by | INT FK | Reference to users |
| movement_date | TIMESTAMP | Movement timestamp |
| approval_status | ENUM | approved, pending, rejected |
| approved_by | INT NULL | User ID who approved/rejected |
| approved_at | TIMESTAMP NULL | Timestamp of approval/rejection |

### plant_health_logs
| Column | Type | Description |
|--------|------|-------------|
| log_id | INT PK AUTO_INCREMENT | Primary key |
| plant_id | INT FK | Reference to plants |
| health_status | ENUM | healthy, under_observation, poor, critical |
| growth_stage | VARCHAR(50) | Growth stage at check |
| notes | TEXT | Check notes |
| checked_by | INT FK | Reference to users |
| check_date | TIMESTAMP | Check timestamp |

### activity_logs
| Column | Type | Description |
|--------|------|-------------|
| log_id | INT PK AUTO_INCREMENT | Primary key |
| user_id | INT FK | Reference to users |
| action_type | VARCHAR(50) | Action performed |
| table_name | VARCHAR(50) | Affected table |
| record_id | INT | Affected record ID |
| description | TEXT | Action description |
| created_at | TIMESTAMP | Action timestamp |

### notifications
| Column | Type | Description |
|--------|------|-------------|
| notification_id | INT PK AUTO_INCREMENT | Primary key |
| user_id | INT FK | Reference to users |
| title | VARCHAR(100) | Notification title |
| message | TEXT | Notification message |
| type | VARCHAR(50) | system, low_stock, health_issue, etc. |
| is_read | BOOLEAN DEFAULT FALSE | Read status |
| created_at | TIMESTAMP | Creation timestamp |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| task_id | INT PK AUTO_INCREMENT | Primary key |
| title | VARCHAR(200) | Task title |
| description | TEXT | Task details |
| assigned_to | INT FK | Reference to users |
| assigned_by | INT FK | Reference to users |
| priority | ENUM | low, medium, high, urgent |
| status | ENUM | pending, in_progress, completed, cancelled |
| due_date | DATE | Expected completion date |
| completed_at | TIMESTAMP | Actual completion time |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

### system_settings
| Column | Type | Description |
|--------|------|-------------|
| setting_id | INT PK AUTO_INCREMENT | Primary key |
| setting_key | VARCHAR(100) | Unique setting identifier |
| setting_value | TEXT | Configuration value |
| updated_at | TIMESTAMP | Last update timestamp |

---

## SQL Creation Script

The database tables are auto-created when the backend server starts. The SQL is embedded in the backend code using CREATE TABLE IF NOT EXISTS statements.

---

## Indexes

- `idx_plants_category` on plants(category_id)
- `idx_plants_health` on plants(health_status)
- `idx_stock_plant` on stock_movements(plant_id)
- `idx_stock_date` on stock_movements(movement_date)
- `idx_health_plant` on plant_health_logs(plant_id)
- `idx_notifications_user` on notifications(user_id, is_read)

---

## Data Flow

1. **User Registration** → Creates record in users table
2. **Add Plant** → Creates record in plants table, logs to activity_logs
3. **Stock Movement** → Creates record in stock_movements, updates plants.current_stock
4. **Health Check** → Creates record in plant_health_logs, updates plants.health_status
5. **Low Stock/Health Alert** → Creates records in notifications for admin/supervisor users
eck** → Creates record in plant_health_logs, updates plants.health_status
5. **Low Stock/Health Alert** → Creates records in notifications for admin/supervisor users
