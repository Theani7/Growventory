# AWS Deployment Guide

Complete step-by-step guide to deploy Growventory on AWS.

---

## Prerequisites

- AWS Account (free tier eligible)
- Domain name (optional, for SSL)
- Basic terminal/SSH knowledge

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        AWS Cloud                         │
│  ┌─────────────┐        ┌──────────────────────────┐   │
│  │   Route 53  │───────▶│        EC2 Instance      │   │
│  │  (DNS/SSL)  │        │  ┌────────┐   ┌────────┐ │   │
│  └─────────────┘        │  │ Nginx  │──▶│  PM2   │ │   │
│                         │  │ :443   │   │ :5000  │ │   │
│                         │  │ :80    │   │        │ │   │
│                         │  └────────┘   └────────┘ │   │
│                         │       │             │      │   │
│                         │       ▼             │      │   │
│                         │  ┌────────┐         │      │   │
│                         │  │Static  │         │      │   │
│                         │  │ Files  │         │      │   │
│                         │  └────────┘         │      │   │
│                         └─────────────────────┼──────┘   │
│                                               │          │
│                         ┌─────────────────────▼──────┐   │
│                         │      RDS MySQL             │   │
│                         │      (Database)            │   │
│                         └────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Create RDS MySQL Database

### 1.1 Navigate to RDS
1. Go to AWS Console → Services → RDS
2. Click "Create database"

### 1.2 Configure Database
- **Engine:** MySQL
- **Version:** MySQL 8.0+
- **Template:** Free tier (for development)
- **DB instance identifier:** growventory-db
- **Master username:** admin
- **Master password:** (create a strong password)
- **Instance class:** db.t3.micro (free tier)
- **Storage:** 20 GB GP2
- **Public access:** No (for security)
- **VPC:** Default
- **Availability Zone:** Any

### 1.3 Security Group
1. Create a new security group
2. Allow inbound MySQL (port 3306) from your EC2 security group only
3. Name it: growventory-rds-sg

### 1.4 Create Database
1. Click "Create database"
2. Wait 5-10 minutes for provisioning
3. Note the endpoint (e.g., growventory-db.xxxx.us-east-1.rds.amazonaws.com)

---

## Step 2: Launch EC2 Instance

### 2.1 Navigate to EC2
1. Go to AWS Console → Services → EC2
2. Click "Launch Instance"

### 2.2 Configure Instance
- **Name:** growventory-server
- **AMI:** Ubuntu Server 22.04 LTS
- **Instance type:** t2.medium (or t3.medium)
- **Key pair:** Create new or use existing
- **Network:** Default VPC
- **Public IP:** Enable

### 2.3 Security Group (growventory-ec2-sg)
Allow inbound traffic:
| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| HTTP | 80 | Anywhere |
| HTTPS | 443 | Anywhere |

### 2.4 Launch
1. Click "Launch Instance"
2. Wait 2-3 minutes
3. Note the Public IP

---

## Step 3: Connect to EC2

```bash
# Download your key pair (.pem file)
# Set permissions
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

---

## Step 4: Install Dependencies

### 4.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 4.3 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 4.4 Install Nginx
```bash
sudo apt install -y nginx
```

### 4.5 Install Git
```bash
sudo apt install -y git
```

---

## Step 5: Configure MySQL Connection

### 5.1 Test RDS Connection
```bash
sudo apt install -y mysql-client
mysql -h <RDS-ENDPOINT> -u admin -p
# Enter your RDS password

# In MySQL shell:
CREATE DATABASE growventory;
SHOW DATABASES;
EXIT;
```

---

## Step 6: Deploy Backend

### 6.1 Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/growventory.git
cd growventory/backend
```

### 6.2 Install Dependencies
```bash
npm install
```

### 6.3 Create Environment File
```bash
nano .env
```

Paste and update:
```env
PORT=5000
DB_HOST=<RDS-ENDPOINT>
DB_USER=admin
DB_PASSWORD=<RDS-PASSWORD>
DB_NAME=growventory
JWT_SECRET=your_super_secret_production_key_change_this
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

Save with `Ctrl+O`, `Enter`, `Ctrl+X`

### 6.4 Test Backend
```bash
npm start
# Should see: "Server running on port 5000"
# Test: Ctrl+C to stop
```

### 6.5 Start with PM2
```bash
pm2 start server.js --name growventory-api
pm2 save
pm2 startup
# Run the command PM2 outputs
```

---

## Step 7: Deploy Frontend

### 7.1 Navigate to Frontend
```bash
cd /home/ubuntu/growventory/frontend
```

### 7.2 Create Environment File
```bash
nano .env
```

Paste:
```env
VITE_API_BASE_URL=http://<EC2-PUBLIC-IP>:5000/api
```

For production with domain:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

### 7.3 Install and Build
```bash
npm install
npm run build
```

This creates a `dist` folder with static files.

---

## Step 8: Configure Nginx

### 8.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/growventory
```

Paste:
```nginx
server {
    listen 80;
    server_name <EC2-PUBLIC-IP> yourdomain.com www.yourdomain.com;

    # Frontend - serve static files
    location / {
        root /home/ubuntu/growventory/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy to PM2
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads - serve plant images
    location /uploads {
        alias /home/ubuntu/growventory/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 8.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/growventory /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 9: SSL Certificate (Optional but Recommended)

### 9.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow prompts to configure SSL. Certbot automatically updates Nginx config.

### 9.3 Auto-Renewal
```bash
sudo certbot renew --dry-run
```

Certbot sets up automatic renewal via systemd timer.

---

## Step 10: Initial Database Setup

### 10.1 Seed Roles
```bash
curl -X POST http://localhost:5000/api/auth/seed-roles
```

### 10.2 Create Admin User
Use the register endpoint via Postman or curl:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@growventory.com",
    "password": "Admin123!",
    "full_name": "System Admin",
    "role_id": 1
  }'
```

---

## Step 11: Verify Deployment

### 11.1 Check Services
```bash
# Check PM2 status
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check logs
pm2 logs growventory-api
```

### 11.2 Test Application
- Frontend: `http://<EC2-PUBLIC-IP>` or `https://yourdomain.com`
- API: `http://<EC2-PUBLIC-IP>/api/auth/me`
- Login with admin credentials

---

## Step 12: Security Best Practices

### 12.1 Security Groups
- RDS: Only allow MySQL from EC2 security group
- EC2: Restrict SSH to your IP only

### 12.2 Firewall (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 12.3 Environment Variables
- Never commit .env files to Git
- Use strong JWT_SECRET (32+ random characters)
- Rotate database passwords periodically

### 12.4 Database Backups
Enable automated backups in RDS:
1. Go to RDS → your database
2. Modify → Backup
3. Set backup retention period (7-35 days)

---

## Maintenance Commands

### View Logs
```bash
pm2 logs growventory-api
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart growventory-api
sudo systemctl restart nginx
```

### Update Application
```bash
cd /home/ubuntu/growventory
git pull
cd backend && npm install && pm2 restart growventory-api
cd ../frontend && npm install && npm run build
```

### Monitor Resources
```bash
pm2 monit
htop
```

---

## Troubleshooting

### Backend Not Starting
```bash
pm2 logs growventory-api --lines 100
# Check .env file
# Verify RDS connection
```

### Frontend Shows 404
```bash
# Check Nginx config
sudo nginx -t
# Verify dist folder exists
ls -la /home/ubuntu/growventory/frontend/dist
```

### Database Connection Failed
```bash
# Test connection
mysql -h <RDS-ENDPOINT> -u admin -p
# Check security groups
# Verify RDS is in "Available" state
```

### SSL Certificate Error
```bash
# Renew certificate
sudo certbot renew
sudo systemctl restart nginx
```

---

## Cost Estimation (AWS Free Tier)

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| EC2 | t2.medium | ~$15-30 (after free tier) |
| RDS | db.t3.micro | ~$15 (after free tier) |
| EBS | 20 GB | ~$2 |
| Data Transfer | ~10 GB | Free |
| **Total** | | **~$32-47/month** |

Free tier covers first 12 months for EC2 and RDS.

---

## Next Steps

1. Set up domain with Route 53
2. Configure CloudFront CDN
3. Implement S3 for image uploads
4. Set up CloudWatch monitoring
5. Create CI/CD pipeline with CodeDeploy

---

## Support

For issues, check:
- PM2 logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- RDS logs: AWS Console → RDS → Logs
