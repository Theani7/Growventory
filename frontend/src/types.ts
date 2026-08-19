// Shared domain/API types derived from actual usage across pages.
// Pragmatic shapes (fields actually accessed in the UI), not exhaustive DB schemas.

/** Backend wraps every response in { success, message, data }. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  role_name?: string;
  role_id?: number;
  is_active?: boolean | number;
  account_status?: string;
  created_at?: string;
}

export interface Role {
  role_id: number;
  role_name?: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description?: string;
  plant_count?: number;
  total_stock?: number;
}

export interface Plant {
  plant_id: number;
  name: string;
  scientific_name?: string;
  category_id?: number;
  category_name?: string;
  current_stock: number;
  min_stock_threshold: number;
  purchase_price?: number | string;
  selling_price?: number | string;
  location?: string;
  description?: string;
  image_url?: string;
  health_status?: string;
}

export interface StockMovement {
  movement_id: number;
  plant_id: number;
  plant_name: string;
  movement_type: string;
  quantity: number;
  approval_status: string;
  previous_stock?: number;
  new_stock?: number;
  notes?: string;
  created_by_name?: string;
  approved_by_name?: string;
  movement_date: string;
}

export interface Task {
  task_id: number;
  title: string;
  description?: string;
  assigned_to?: number | string;
  assigned_to_name?: string;
  priority?: string;
  due_date?: string;
  status: string;
}

export interface Notification {
  notification_id: number;
  type: string;
  title: string;
  message: string;
  is_read: number | boolean;
  created_at: string;
}

export interface HealthLog {
  log_id: number;
  plant_name: string;
  health_status: string;
  growth_stage?: string;
  notes?: string;
  checked_by_name?: string;
  check_date: string;
}

export interface ActivityLog {
  log_id: number;
  user_id?: number;
  username?: string;
  description?: string;
  table_name?: string;
  action_type?: string;
  record_id?: number;
  created_at: string;
}

export interface SystemSettings {
  app_name?: string;
  low_stock_threshold?: string;
  require_stock_approval?: string;
  notification_email_enabled?: string;
  currency?: string;
  date_format?: string;
  auto_approve_registrations?: string;
}

export interface DashboardStats {
  total_plants?: number;
  total_stock?: number;
  low_stock_count?: number;
}

export interface AdvancedAnalytics {
  stock_trends: { date: string; stock_in: number; stock_out: number }[];
  category_performance: { category_name: string; total_stock?: number; plant_count?: number }[];
}
