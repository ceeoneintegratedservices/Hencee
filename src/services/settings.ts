import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

// Updated to include primaryCategoryId and primaryWarehouseId

export interface SystemSettings {
  id: string;
  businessName: string;
  businessType: string;
  registrationNumber: string;
  taxId: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  website: string;
  primaryCategoryId?: string;
  primaryWarehouseId?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  maintenanceMode: boolean;
  backupStatus: 'enabled' | 'disabled';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    inApp: boolean;
  };
  dashboard: {
    defaultView: 'overview' | 'detailed';
    refreshInterval: number; // in minutes
    showCharts: boolean;
    showAlerts: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team';
    activityTracking: boolean;
    dataSharing: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSystemSettingsPayload {
  businessName?: string;
  businessType?: string;
  registrationNumber?: string;
  taxId?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  primaryCategoryId?: string;
  primaryWarehouseId?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  maintenanceMode?: boolean;
  backupStatus?: 'enabled' | 'disabled';
  backupFrequency?: 'daily' | 'weekly' | 'monthly';
}

export interface UpdateUserPreferencesPayload {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  dashboard?: {
    defaultView?: 'overview' | 'detailed';
    refreshInterval?: number;
    showCharts?: boolean;
    showAlerts?: boolean;
  };
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'team';
    activityTracking?: boolean;
    dataSharing?: boolean;
  };
}

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const url = `${API_ENDPOINTS.settings}/system`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(payload: UpdateSystemSettingsPayload): Promise<SystemSettings> {
  try {
    const url = `${API_ENDPOINTS.settings}/system`;
    const res = await authFetch(url, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const url = `${API_ENDPOINTS.settings}/preferences`;
    const res = await authFetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(payload: UpdateUserPreferencesPayload): Promise<UserPreferences> {
  try {
    const url = `${API_ENDPOINTS.settings}/preferences`;
    const res = await authFetch(url, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (error) {
    throw error;
  }
}
