# Growventory Demo Mode

## Overview
Demo mode allows you to showcase the full frontend of Growventory without requiring:
- Backend server
- Database
- User authentication
- Real API calls

## How to Use

### 1. Access Demo
Visit: `http://localhost:3000/demo` (or your deployed URL)

### 2. Choose Demo Role
Four pre-configured roles available:
- **Admin Demo** - Full system access, manage users & settings
- **Supervisor Demo** - Manage staff, approve stock movements  
- **Staff Demo** - Daily operations, record stock & health
- **Auditor Demo** - View-only access to reports & logs

### 3. Demo Features
✅ **Full navigation** with role-based sidebar  
✅ **Pre-filled data** for plants, stock, health, users  
✅ **Interactive components** - tables, charts, modals  
✅ **Notifications & activity logs**  
✅ **Settings page** with working toggles  
✅ **User management interface**  
✅ **All pages functional** - Plants, Stock, Health, Reports, Tasks, Logs  

### 4. Demo Credentials
Each role has pre-set credentials:
- **Username**: `[role]_demo` (e.g., `admin_demo`, `staff_demo`)
- **Password**: `demo123`

### 5. Mock Data Included
- 8 plant species across 4 categories
- 5 stock movement records
- 4 health check logs  
- 4 notification alerts
- 6 user accounts
- Dashboard statistics
- Activity logs

### 6. Reset Demo
From the user dropdown (top-right), click **"Reset Demo"** to:
- Clear demo session
- Return to demo login page
- Start fresh with any role

## For Client Presentations

### Quick Start
1. Open `http://localhost:3000/demo`
2. Click "Try as Admin" (or any role)
3. Showcase all features immediately

### Key Points to Demonstrate
1. **Role-based access** - Show different sidebar options per role
2. **Pending approval system** - Users page with pending registrations
3. **Stock approval workflow** - Supervisor can approve/reject movements
4. **Health monitoring** - Alerts for critical health status
5. **Reports & analytics** - Auditor can view but not edit
6. **Settings** - Toggle auto-approve registrations

### Technical Details
- **No backend required** - All data is mocked locally
- **Persistent session** - Uses localStorage (clears on reset)
- **Realistic delays** - Simulates API calls (300ms)
- **Error handling** - Graceful fallbacks for demo mode

## Deployment Notes

### For Production Demo
1. Build frontend: `npm run build`
2. Serve with any static server (nginx, Apache, Netlify, Vercel)
3. Demo works without backend

### For Development
1. Start frontend: `npm run dev`
2. Demo available at `http://localhost:3000/demo`
3. Backend optional - demo works standalone

## Security Notes
- Demo mode uses localStorage (not secure for production)
- No real authentication/authorization
- All data is public and reset on page refresh
- Not suitable for real user data

## Customization
Edit `frontend/src/services/mockData.js` to:
- Add more demo plants/categories
- Modify stock movement records
- Update user roles/permissions
- Change dashboard statistics

## Troubleshooting
**Issue**: Demo not loading  
**Fix**: Check localStorage is enabled in browser

**Issue**: Data not appearing  
**Fix**: Click "Reset Demo" and login again

**Issue**: API calls failing  
**Fix**: Ensure demo mode is active (purple "Demo" badge in navbar)

## Next Steps After Demo
1. Client likes it? → Deploy full stack (EC2 + RDS)
2. Need modifications? → Edit code and redeploy
3. Want real data? → Connect to actual backend

---

**Demo URL**: `/demo`  
**Default Port**: 3000  
**Build Command**: `npm run build`  
**Reset Command**: Click "Reset Demo" in user dropdown