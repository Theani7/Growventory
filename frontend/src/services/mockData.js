// Mock data for demo mode
export const mockPlants = [
  { plant_id: 1, name: 'Monstera Deliciosa', category_id: 1, category_name: 'Indoor', current_stock: 42, low_stock_threshold: 10, image_url: null, created_at: '2024-01-15' },
  { plant_id: 2, name: 'Snake Plant', category_id: 1, category_name: 'Indoor', current_stock: 28, low_stock_threshold: 5, image_url: null, created_at: '2024-01-20' },
  { plant_id: 3, name: 'Fiddle Leaf Fig', category_id: 1, category_name: 'Indoor', current_stock: 8, low_stock_threshold: 10, image_url: null, created_at: '2024-02-05' },
  { plant_id: 4, name: 'Peace Lily', category_id: 1, category_name: 'Indoor', current_stock: 35, low_stock_threshold: 8, image_url: null, created_at: '2024-02-10' },
  { plant_id: 5, name: 'Rose Bush', category_id: 2, category_name: 'Outdoor', current_stock: 64, low_stock_threshold: 20, image_url: null, created_at: '2024-01-25' },
  { plant_id: 6, name: 'Lavender', category_id: 2, category_name: 'Outdoor', current_stock: 52, low_stock_threshold: 15, image_url: null, created_at: '2024-02-01' },
  { plant_id: 7, name: 'Tomato Plant', category_id: 3, category_name: 'Vegetable', current_stock: 120, low_stock_threshold: 30, image_url: null, created_at: '2024-01-30' },
  { plant_id: 8, name: 'Basil', category_id: 3, category_name: 'Herb', current_stock: 75, low_stock_threshold: 20, image_url: null, created_at: '2024-02-12' },
];

export const mockCategories = [
  { category_id: 1, name: 'Indoor', description: 'Houseplants for indoor spaces', plant_count: 4 },
  { category_id: 2, name: 'Outdoor', description: 'Garden plants and shrubs', plant_count: 2 },
  { category_id: 3, name: 'Vegetable', description: 'Edible plants and vegetables', plant_count: 1 },
  { category_id: 4, name: 'Herb', description: 'Culinary and medicinal herbs', plant_count: 1 },
];

export const mockStockMovements = [
  { movement_id: 1, plant_id: 1, plant_name: 'Monstera Deliciosa', movement_type: 'IN', quantity: 20, notes: 'New shipment from supplier', created_at: '2024-05-28T10:30:00', created_by: 'admin_demo', status: 'approved' },
  { movement_id: 2, plant_id: 3, plant_name: 'Fiddle Leaf Fig', movement_type: 'OUT', quantity: 5, notes: 'Sold to customer', created_at: '2024-05-28T14:15:00', created_by: 'staff_demo', status: 'approved' },
  { movement_id: 3, plant_id: 5, plant_name: 'Rose Bush', movement_type: 'IN', quantity: 30, notes: 'Bulk order', created_at: '2024-05-27T09:45:00', created_by: 'supervisor_demo', status: 'pending' },
  { movement_id: 4, plant_id: 7, plant_name: 'Tomato Plant', movement_type: 'OUT', quantity: 15, notes: 'Local market delivery', created_at: '2024-05-27T16:20:00', created_by: 'staff_demo', status: 'approved' },
  { movement_id: 5, plant_id: 2, plant_name: 'Snake Plant', movement_type: 'ADJUSTMENT', quantity: -2, notes: 'Damaged during handling', created_at: '2024-05-26T11:10:00', created_by: 'staff_demo', status: 'approved' },
];

export const mockHealthLogs = [
  { log_id: 1, plant_id: 1, plant_name: 'Monstera Deliciosa', health_status: 'healthy', notes: 'Regular check - all good', checked_by: 'staff_demo', created_at: '2024-05-28T09:00:00' },
  { log_id: 2, plant_id: 3, plant_name: 'Fiddle Leaf Fig', health_status: 'warning', notes: 'Yellowing leaves detected', checked_by: 'supervisor_demo', created_at: '2024-05-27T15:30:00' },
  { log_id: 3, plant_id: 5, plant_name: 'Rose Bush', health_status: 'critical', notes: 'Pest infestation spotted', checked_by: 'admin_demo', created_at: '2024-05-26T14:20:00' },
  { log_id: 4, plant_id: 7, plant_name: 'Tomato Plant', health_status: 'healthy', notes: 'Growing well, new fruits', checked_by: 'staff_demo', created_at: '2024-05-25T10:45:00' },
];

export const mockNotifications = [
  { notification_id: 1, type: 'low_stock', title: 'Low Stock Alert', message: 'Fiddle Leaf Fig stock is below threshold (8 remaining)', is_read: false, created_at: '2024-05-28T16:00:00' },
  { notification_id: 2, type: 'health_alert', title: 'Health Issue Detected', message: 'Rose Bush has critical health status', is_read: true, created_at: '2024-05-27T14:30:00' },
  { notification_id: 3, type: 'approval', title: 'Stock Movement Approval', message: 'New stock movement requires your approval', is_read: false, created_at: '2024-05-27T09:50:00' },
  { notification_id: 4, type: 'task', title: 'Task Assigned', message: 'You have been assigned to water the greenhouse', is_read: true, created_at: '2024-05-26T08:15:00' },
];

export const mockUsers = [
  { user_id: 1, username: 'admin_demo', email: 'admin@demo.com', full_name: 'Demo Admin', role_name: 'admin', is_active: 1, created_at: '2024-01-01' },
  { user_id: 2, username: 'supervisor_demo', email: 'supervisor@demo.com', full_name: 'Demo Supervisor', role_name: 'supervisor', is_active: 1, created_at: '2024-01-05' },
  { user_id: 3, username: 'staff_demo', email: 'staff@demo.com', full_name: 'Demo Staff', role_name: 'staff', is_active: 1, created_at: '2024-01-10' },
  { user_id: 4, username: 'auditor_demo', email: 'auditor@demo.com', full_name: 'Demo Auditor', role_name: 'auditor', is_active: 1, created_at: '2024-01-15' },
  { user_id: 5, username: 'john_doe', email: 'john@example.com', full_name: 'John Doe', role_name: 'staff', is_active: 1, created_at: '2024-02-01' },
  { user_id: 6, username: 'jane_smith', email: 'jane@example.com', full_name: 'Jane Smith', role_name: 'staff', is_active: 0, created_at: '2024-02-10' },
];

export const mockDashboardStats = {
  total_plants: 125,
  total_categories: 8,
  low_stock_items: 3,
  pending_approvals: 2,
  recent_movements: 24,
  health_alerts: 1,
  total_users: 6,
  active_users: 5,
};

export const mockActivityLogs = [
  { log_id: 1, user_id: 3, username: 'staff_demo', action_type: 'CREATE', table_name: 'stock_movements', description: 'Recorded stock movement for Monstera Deliciosa', created_at: '2024-05-28T10:30:00' },
  { log_id: 2, user_id: 1, username: 'admin_demo', action_type: 'APPROVE', table_name: 'users', description: 'Approved new user registration: jane_smith', created_at: '2024-05-28T09:15:00' },
  { log_id: 3, user_id: 2, username: 'supervisor_demo', action_type: 'UPDATE', table_name: 'plants', description: 'Updated stock threshold for Fiddle Leaf Fig', created_at: '2024-05-27T16:45:00' },
  { log_id: 4, user_id: 3, username: 'staff_demo', action_type: 'CREATE', table_name: 'health_logs', description: 'Logged health check for Rose Bush', created_at: '2024-05-27T14:20:00' },
  { log_id: 5, user_id: 4, username: 'auditor_demo', action_type: 'VIEW', table_name: 'reports', description: 'Generated inventory report', created_at: '2024-05-26T11:30:00' },
];

// Mock API responses
export const getMockResponse = (endpoint, params = {}) => {
  const responses = {
    '/plants': { success: true, data: mockPlants, message: 'Plants fetched successfully' },
    '/categories': { success: true, data: mockCategories, message: 'Categories fetched successfully' },
    '/stock/movements': { success: true, data: mockStockMovements, message: 'Stock movements fetched successfully' },
    '/health/logs': { success: true, data: mockHealthLogs, message: 'Health logs fetched successfully' },
    '/notifications': { success: true, data: mockNotifications, message: 'Notifications fetched successfully' },
    '/users': { success: true, data: mockUsers, message: 'Users fetched successfully' },
    '/dashboard/overview': { success: true, data: mockDashboardStats, message: 'Dashboard stats fetched successfully' },
    '/logs': { success: true, data: mockActivityLogs, message: 'Activity logs fetched successfully' },
    '/settings': { 
      success: true, 
      data: {
        app_name: 'Growventory Demo',
        low_stock_threshold: '10',
        require_stock_approval: 'true',
        notification_email_enabled: 'false',
        currency: 'USD',
        date_format: 'YYYY-MM-DD',
        auto_approve_registrations: 'false',
      }, 
      message: 'Settings fetched successfully' 
    },
  };

  return responses[endpoint] || { success: true, data: [], message: 'Mock data fetched' };
};