import { authFetch } from "./authFetch";
import { API_ENDPOINTS } from "../config/api";

export type ActivityType = 
  | 'order'      // New orders/sales
  | 'payment'    // Payments received
  | 'inventory'  // Stock alerts
  | 'security'   // Login, password reset
  | 'customer'   // Customer created/updated
  | 'product'    // Product created/updated
  | 'user'       // User created/updated
  | 'expense'    // Expense submitted/approved/rejected
  | 'other';     // Other activities

export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  message?: string | null;
  timestamp: string;
  createdAt: string;
  date: string;
  entityId?: string | null;
  user?: string | null;
  amount?: number | null;
}

export interface ActivitiesResponse {
  activities: Activity[];
  recentActivities: Activity[];
  message: string | null;
  description: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'inventory' | 'payment' | 'customer' | 'security' | 'user' | 'expense' | 'product' | 'system';
  unread: boolean;
  timestamp: Date;
}

/**
 * Fetch activities from the dashboard activities endpoint
 */
export async function fetchActivities(
  timeframe: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'last7days' | 'allTime' = 'thisWeek',
  limit: number = 50
): Promise<ActivitiesResponse> {
  try {
    const url = `${API_ENDPOINTS.dashboard}/activities?timeframe=${timeframe}&limit=${limit}`;
    const response = await authFetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
}

/**
 * Filter activities to show only important notification types
 * Based on the requirements, important types are:
 * - order: New orders
 * - payment: Payments received
 * - inventory: Low stock alerts (when action contains "low" or "stock")
 * - security: Login and password reset (when action contains "login" or "password")
 */
export function filterImportantActivities(activities: Activity[]): Activity[] {
  return activities.filter(activity => {
    // Always show orders and payments
    if (activity.type === 'order' || activity.type === 'payment') {
      return true;
    }

    // Show inventory activities only if they're low stock alerts
    if (activity.type === 'inventory') {
      const action = activity.action?.toLowerCase() || '';
      return action.includes('low') || action.includes('stock');
    }

    // Show security activities only if they're login or password reset
    if (activity.type === 'security') {
      const action = activity.action?.toLowerCase() || '';
      return action.includes('login') || action.includes('password') || action.includes('reset');
    }

    // Hide other activity types from notifications
    return false;
  });
}

/**
 * Format ISO 8601 timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  // For older activities, show formatted date
  return time.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Convert Activity to Notification format
 * Handles ALL activity types for comprehensive activity logging
 */
function activityToNotification(activity: Activity): Notification {
  let title = '';
  let type: Notification['type'] = 'system';
  const action = activity.action?.toLowerCase() || '';

  // Map activity types to notification types and titles
  switch (activity.type) {
    case 'order':
      type = 'order';
      if (action.includes('create') || action.includes('new')) {
        title = 'New Order Created';
      } else if (action.includes('update') || action.includes('edit')) {
        title = 'Order Updated';
      } else if (action.includes('cancel')) {
        title = 'Order Cancelled';
      } else if (action.includes('complete')) {
        title = 'Order Completed';
      } else {
        title = 'Order Activity';
      }
      break;
    
    case 'payment':
      type = 'payment';
      if (action.includes('approve')) {
        title = 'Payment Approved';
      } else if (action.includes('receive') || action.includes('record')) {
        title = 'Payment Received';
      } else if (action.includes('reject')) {
        title = 'Payment Rejected';
      } else if (action.includes('query')) {
        title = 'Payment Queried';
      } else {
        title = 'Payment Activity';
      }
      break;
    
    case 'inventory':
      type = 'inventory';
      if (action.includes('low') || action.includes('stock')) {
        title = 'Low Stock Alert';
      } else if (action.includes('add') || action.includes('create')) {
        title = 'Product Added';
      } else if (action.includes('update') || action.includes('edit')) {
        title = 'Product Updated';
      } else if (action.includes('delete') || action.includes('remove')) {
        title = 'Product Removed';
      } else {
        title = 'Inventory Activity';
      }
      break;
    
    case 'security':
      type = 'security';
      if (action.includes('login')) {
        title = 'New Login';
      } else if (action.includes('password') || action.includes('reset')) {
        title = 'Password Reset';
      } else if (action.includes('logout')) {
        title = 'User Logged Out';
      } else {
        title = 'Security Activity';
      }
      break;
    
    case 'customer':
      type = 'customer';
      if (action.includes('create') || action.includes('new')) {
        title = 'New Customer Added';
      } else if (action.includes('update') || action.includes('edit')) {
        title = 'Customer Updated';
      } else {
        title = 'Customer Activity';
      }
      break;
    
    case 'user':
      type = 'system';
      if (action.includes('create') || action.includes('new')) {
        title = 'New User Created';
      } else if (action.includes('update') || action.includes('edit')) {
        title = 'User Updated';
      } else if (action.includes('delete') || action.includes('remove')) {
        title = 'User Removed';
      } else {
        title = 'User Activity';
      }
      break;
    
    case 'expense':
      type = 'system';
      if (action.includes('create') || action.includes('submit')) {
        title = 'Expense Submitted';
      } else if (action.includes('approve')) {
        title = 'Expense Approved';
      } else if (action.includes('reject')) {
        title = 'Expense Rejected';
      } else {
        title = 'Expense Activity';
      }
      break;
    
    case 'product':
      type = 'system';
      if (action.includes('create') || action.includes('new')) {
        title = 'New Product Added';
      } else if (action.includes('update') || action.includes('edit')) {
        title = 'Product Updated';
      } else {
        title = 'Product Activity';
      }
      break;
    
    default:
      type = 'system';
      title = activity.action || 'Activity';
      break;
  }

  // Use description or message, fallback to action if neither available
  const message = activity.description || activity.message || activity.action || 'No description available';
  const timestamp = activity.timestamp || activity.createdAt || activity.date;
  const timeStr = formatRelativeTime(timestamp);

  // Mark as unread if activity is from last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activityDate = new Date(timestamp);
  const unread = activityDate > oneDayAgo;

  return {
    id: activity.id,
    title,
    message,
    time: timeStr,
    type,
    unread,
    timestamp: new Date(timestamp),
  };
}

/**
 * Fetch important notifications from dashboard activities
 * Note: This function filters to show only important notifications (orders, payments, low stock, security)
 */
export async function getImportantNotifications(
  timeframe: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'last7days' | 'allTime' = 'thisWeek',
  limit: number = 50
): Promise<Notification[]> {
  try {
    // Fetch activities from API
    const response = await fetchActivities(timeframe, limit);
    
    // Use recentActivities if available, fallback to activities
    const allActivities = response.recentActivities || response.activities || [];
    
    // Filter to show only important notifications
    const importantActivities = filterImportantActivities(allActivities);
    
    // Convert to Notification format
    const notifications = importantActivities.map(activityToNotification);
    
    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Limit to most recent (already limited by API, but ensure we don't exceed)
    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetch ALL notifications from dashboard activities (no filtering)
 * This shows all activities in the app for the notifications bar
 */
export async function getAllNotifications(
  timeframe: 'thisWeek' | 'lastWeek' | 'thisMonth' | 'last7days' | 'allTime' = 'allTime',
  limit: number = 100
): Promise<Notification[]> {
  try {
    // Fetch activities from API
    const response = await fetchActivities(timeframe, limit);
    
    // Use recentActivities if available, fallback to activities
    const allActivities = response.recentActivities || response.activities || [];
    
    // Convert ALL activities to Notification format (no filtering)
    const notifications = allActivities.map(activityToNotification);
    
    // Sort by timestamp (newest first)
    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Limit to most recent (already limited by API, but ensure we don't exceed)
    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // TODO: Implement API endpoint for marking notifications as read
  // For now, this is a placeholder
  console.log('Marking notification as read:', notificationId);
}

