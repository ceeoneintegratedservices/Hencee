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

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  state: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneCode?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  state?: string;
  profileImage?: string;
}

export interface BusinessProfile {
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
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessProfilePayload {
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
}

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const url = `${API_ENDPOINTS.settingsSystem}`;
    const res = await authFetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(text);
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
    const url = `${API_ENDPOINTS.settingsSystem}`;
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
    const url = `${API_ENDPOINTS.settingsPreferences}`;
    const res = await authFetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const url = `${API_ENDPOINTS.settingsProfile}`;
    const res = await authFetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const text = await res.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  try {
    const url = `${API_ENDPOINTS.settingsProfile}`;
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
 * Update user preferences
 */
export async function updateUserPreferences(payload: UpdateUserPreferencesPayload): Promise<UserPreferences> {
  try {
    const url = `${API_ENDPOINTS.settingsPreferences}`;
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
 * Get business profile
 */
export async function getBusinessProfile(): Promise<BusinessProfile> {
  try {
    const url = `${API_ENDPOINTS.settingsBusiness}`;
    const res = await authFetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    console.log(res);
    const text = await res.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const data = JSON.parse(text);
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Update business profile
 */
export async function updateBusinessProfile(payload: UpdateBusinessProfilePayload): Promise<BusinessProfile> {
  try {
    const url = `${API_ENDPOINTS.settingsBusiness}`;
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
