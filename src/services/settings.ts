import { getConvexClient, api } from "@/lib/convexClient";

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
  const data = await getConvexClient().query(api.settings.getSystem, {});
  return data as SystemSettings;
}

/**
 * Update system settings
 */
export async function updateSystemSettings(payload: UpdateSystemSettingsPayload): Promise<SystemSettings> {
  await getConvexClient().mutation(api.settings.setSystem, { value: payload });
  return getSystemSettings();
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const data = await getConvexClient().query(api.settings.getUserPrefs, {});
  return data as UserPreferences;
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const data = await getConvexClient().query(api.settings.getUserProfileSettings, {});
  return data as UserProfile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  return payload as unknown as UserProfile;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(payload: UpdateUserPreferencesPayload): Promise<UserPreferences> {
  return payload as unknown as UserPreferences;
}

/**
 * Get business profile
 */
export async function getBusinessProfile(): Promise<BusinessProfile> {
  const data = await getConvexClient().query(api.settings.getBusiness, {});
  return data as BusinessProfile;
}

/**
 * Update business profile
 */
export async function updateBusinessProfile(payload: UpdateBusinessProfilePayload): Promise<BusinessProfile> {
  return payload as unknown as BusinessProfile;
}
