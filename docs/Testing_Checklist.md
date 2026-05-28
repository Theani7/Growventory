# Testing Checklist

Complete testing guide for Growventory.

---

## Backend Testing

### Environment Setup
- [ ] MySQL database created
- [ ] .env configured with correct credentials
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors (`npm run dev`)

### Authentication Tests
- [ ] POST /api/auth/seed-roles - Creates 4 roles
- [ ] POST /api/auth/register - Registers new user
- [ ] POST /api/auth/register - Validates required fields
- [ ] POST /api/auth/register - Validates unique username/email
- [ ] POST /api/auth/login - Returns JWT token
- [ ] POST /api/auth/login - Rejects wrong password
- [ ] POST /api/auth/login - Rejects non-existent user
- [ ] GET /api/auth/me - Returns current user
- [ ] GET /api/auth/me - Rejects without token
- [ ] GET /api/auth/me - Rejects invalid token

### Categories Tests
- [ ] GET /api/categories - Returns empty array initially
- [ ] POST /api/categories - Creates category (admin/supervisor)
- [ ] POST /api/categories - Rejects duplicate name
- [ ] POST /api/categories - Rejects unauthorized (staff/auditor)
- [ ] GET /api/categories - Returns categories with plant_count
- [ ] PUT /api/categories/:id - Updates category
- [ ] DELETE /api/categories/:id - Deletes category
- [ ] DELETE /api/categories/:id - Fails if plants assigned

### Plants Tests
- [ ] GET /api/plants - Returns empty array initially
- [ ] POST /api/plants - Creates plant with image (admin/supervisor/staff)
- [ ] POST /api/plants - Validates required fields
- [ ] GET /api/plants - Returns plants with category_name
- [ ] GET /api/plants?search= - Search works
- [ ] GET /api/plants?category_id= - Filter works
- [ ] GET /api/plants?health_status= - Filter works
- [ ] GET /api/plants/:id - Returns single plant
- [ ] PUT /api/plants/:id - Updates plant
- [ ] DELETE /api/plants/:id - Deletes plant (admin/supervisor)

### Stock Movement Tests
- [ ] GET /api/stock/movements - Returns empty array
- [ ] POST /api/stock/movement - IN movement increases stock
- [ ] POST /api/stock/movement - OUT movement decreases stock
- [ ] POST /api/stock/movement - OUT fails if insufficient stock
- [ ] POST /api/stock/movement - ADJUSTMENT sets absolute value
- [ ] GET /api/stock/movements - Returns movements
- [ ] GET /api/stock/movements?plant_id= - Filter works
- [ ] GET /api/stock/movements?movement_type= - Filter works
- [ ] Plant stock updates correctly after movement

### Health Logs Tests
- [ ] GET /api/health/logs - Returns empty array
- [ ] POST /api/health/log - Creates health log
- [ ] POST /api/health/log - Updates plant health_status
- [ ] POST /api/health/log - Updates plant growth_stage
- [ ] POST /api/health/log - Updates plant last_health_check
- [ ] GET /api/health/logs - Returns logs
- [ ] GET /api/health/logs?plant_id= - Filter works
- [ ] GET /api/health/logs?health_status= - Filter works

### Dashboard Tests
- [ ] GET /api/dashboard/overview - Returns stats
- [ ] GET /api/dashboard/low-stock - Returns low stock plants
- [ ] GET /api/dashboard/category-stats - Returns category stats
- [ ] GET /api/dashboard/recent-activities - Returns activities
- [ ] GET /api/dashboard/health-summary - Returns health distribution

### Reports Tests
- [ ] GET /api/reports/inventory-csv - Downloads CSV
- [ ] GET /api/reports/stock-movements-csv - Downloads CSV
- [ ] GET /api/reports/stock-movements-csv?plant_id= - Filter works
- [ ] GET /api/reports/stock-movements-csv?start_date= - Filter works
- [ ] GET /api/reports/health-logs-csv - Downloads CSV
- [ ] GET /api/reports/summary - Returns JSON summary
- [ ] GET /api/reports/summary?download=csv - Downloads CSV

### Notifications Tests
- [ ] GET /api/notifications - Returns notifications with unread_count
- [ ] GET /api/notifications/unread - Returns unread only
- [ ] PUT /api/notifications/:id/read - Marks as read
- [ ] PUT /api/notifications/mark-all-read - Marks all as read
- [ ] Low stock creates notification (stock ≤ threshold)
- [ ] Poor/critical health creates notification

### RBAC Tests
- [ ] Admin can access all endpoints
- [ ] Supervisor can access admin endpoints except user management
- [ ] Staff can create plants and stock movements
- [ ] Staff cannot delete categories
- [ ] Auditor can read but not write
- [ ] Unauthorized user blocked from protected routes

---

## Frontend Testing

### Setup Tests
- [ ] npm install completes without errors
- [ ] npm run dev starts development server
- [ ] Application loads at http://localhost:3000
- [ ] No console errors on load

### Authentication UI
- [ ] Login page renders correctly
- [ ] Login page responsive (mobile/desktop)
- [ ] Login form validates empty fields
- [ ] Login shows error for wrong credentials
- [ ] Login redirects to dashboard on success
- [ ] Register page renders correctly
- [ ] Register form validates fields
- [ ] Register shows password mismatch error
- [ ] Register redirects to login on success
- [ ] Logout clears user data
- [ ] Logout redirects to login

### Dashboard Page
- [ ] Stats cards display correct values
- [ ] Charts render without errors
- [ ] Low stock list shows items
- [ ] Recent activities display
- [ ] Loading spinner shows while fetching
- [ ] Responsive on mobile

### Plants Page
- [ ] Plant list displays
- [ ] Search input filters plants
- [ ] Category filter works
- [ ] Health status filter works
- [ ] Add plant modal opens
- [ ] Add plant form validates
- [ ] Image upload works
- [ ] Edit plant modal opens with data
- [ ] Delete confirmation works
- [ ] Table responsive on mobile

### Categories Page
- [ ] Categories display as cards
- [ ] Plant count shows per category
- [ ] Add category modal works
- [ ] Edit category modal works
- [ ] Delete category works
- [ ] Delete fails if plants assigned

### Stock Page
- [ ] Movements list displays
- [ ] Plant filter works
- [ ] Type filter works
- [ ] Record movement modal works
- [ ] IN movement updates stock
- [ ] OUT movement updates stock
- [ ] OUT fails if insufficient stock

### Health Page
- [ ] Health logs list displays
- [ ] Plant filter works
- [ ] Status filter works
- [ ] Record health check modal works
- [ ] Health status updates plant

### Reports Page
- [ ] Report cards display
- [ ] Inventory CSV downloads
- [ ] Stock movements CSV downloads
- [ ] Health logs CSV downloads
- [ ] Summary downloads

### Notifications Page
- [ ] Notifications list displays
- [ ] Unread count shows in navbar
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Notification icons display correctly

### UI/UX Tests
- [ ] All pages have consistent styling
- [ ] Buttons have hover effects
- [ ] Forms have proper focus states
- [ ] Error messages display clearly
- [ ] Success toasts appear
- [ ] Loading states show spinners
- [ ] Modals close on backdrop click
- [ ] Modals close on X button
- [ ] Sidebar navigation works
- [ ] Mobile menu toggles

### Responsive Tests
- [ ] Desktop view (1920px)
- [ ] Laptop view (1366px)
- [ ] Tablet view (768px)
- [ ] Mobile view (375px)
- [ ] Sidebar hidden on mobile
- [ ] Tables scroll horizontally
- [ ] Cards stack vertically

---

## Integration Tests

### End-to-End Flows
- [ ] Register → Login → Dashboard
- [ ] Login → Create Category → Create Plant
- [ ] Login → Record Stock Movement → Check Plant Stock
- [ ] Login → Record Health Check → Check Plant Health
- [ ] Login → Create Plant → Download Inventory Report
- [ ] Low Stock → Notification Generated
- [ ] Poor Health → Notification Generated

### Cross-Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Deployment Testing

### Pre-Deployment
- [ ] All environment variables set
- [ ] Database connection string correct
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] CORS configured for production domain
- [ ] Frontend API URL points to production

### Post-Deployment
- [ ] Backend API responds
- [ ] Frontend loads
- [ ] Login works
- [ ] Database connection established
- [ ] Images upload and serve correctly
- [ ] SSL certificate valid (if configured)
- [ ] No console errors

### Performance Tests
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Images optimized
- [ ] No memory leaks (PM2 monitoring)

---

## Security Tests

- [ ] JWT token expires after 7 days
- [ ] Passwords hashed in database
- [ ] SQL injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF protection (same-site cookies)
- [ ] File upload restricted to images
- [ ] Sensitive routes protected
- [ ] No sensitive data in localStorage except token

---

## Test Data Setup

Use this data for testing:

### Test Users
```
Admin: username: admin, password: Admin123!
Staff: username: staff, password: Staff123!
Supervisor: username: supervisor, password: Super123!
Auditor: username: auditor, password: Audit123!
```

### Test Categories
```
- Indoor Plants
- Outdoor Plants
- Succulents
- Herbs
```

### Test Plants
```
- Monstera Deliciosa (Indoor)
- Snake Plant (Indoor)
- Rose Bush (Outdoor)
- Aloe Vera (Succulent)
```

---

## Bug Report Template

```
**Title:** Brief description of the bug

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:** 

**Actual Result:** 

**Screenshots:** (if applicable)

**Environment:**
- Browser: 
- OS: 
- Device: 
```

---

## Sign-off

After completing all tests:

- [ ] All critical tests pass
- [ ] No high-priority bugs open
- [ ] Performance acceptable
- [ ] Security validated
- [ ] Ready for production deployment

**Tested by:** _________________  
**Date:** _________________  
**Approved by:** _________________
