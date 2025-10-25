"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import { NotificationContainer, useNotifications } from "@/components/Notification";
import { 
  getSystemSettings, 
  updateSystemSettings, 
  getUserPreferences, 
  updateUserPreferences,
  getUserProfile,
  updateUserProfile,
  getBusinessProfile,
  updateBusinessProfile,
  type SystemSettings, 
  type UserPreferences,
  type UserProfile,
  type BusinessProfile,
  type UpdateUserProfilePayload,
  type UpdateBusinessProfilePayload
} from "@/services/settings";
import { 
  SessionService, 
  type SessionDto, 
  type SessionStats, 
  getDeviceIcon, 
  getBrowserIcon, 
  getOperatingSystemIcon, 
  formatLastActivity,
  isSessionExpiringSoon 
} from "@/services/sessions";
import { 
  TwoFactorAuthService,
  type TwoFactorStatusResponse,
  type TwoFactorSetupResponse,
  type TwoFactorVerifySetupResponse,
  type BackupCodesResponse
} from "@/services/twoFactorAuth";
import { getCategories, getWarehouses, type Category, type Warehouse } from "@/services/categories";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

export default function SettingsPage() {
  const router = useRouter();
  const { notifications, removeNotification, showSuccess, showError } = useNotifications();
  
  // Authentication and loading states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // API data states
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  
  // Session states
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  
  // 2FA states
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatusResponse | null>(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [setupToken, setSetupToken] = useState<string>('');
  
  // Categories and warehouses states
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [isCreatingNewWarehouse, setIsCreatingNewWarehouse] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newWarehouseName, setNewWarehouseName] = useState('');
  
  // Cloudinary upload hook
  const { uploadImage, uploadProgress, resetUpload } = useCloudinaryUpload();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "", 
    email: "",
    phoneCode: "+234",
    phoneNumber: "",
    address: "",
    city: "",
    country: "Nigeria",
    state: ""
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    backupCodes: []
  });

  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessType: "Tyre Retailer",
    registrationNumber: "",
    taxId: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    website: "",
    staffPosition: "Owner/Manager",
    designation: ""
  });

  // Load user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        
        // Populate account form data
        setFormData(prev => ({
          ...prev,
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          phoneCode: parsed.phoneCode || "+234",
          phoneNumber: parsed.phoneNumber || "",
          address: parsed.address || "",
          city: parsed.city || "",
          country: parsed.country || "Nigeria",
          state: parsed.state || ""
        }));

        // Populate business form data
        setBusinessData(prev => ({
          ...prev,
          businessName: parsed.businessName || "",
          businessType: parsed.businessType || "Tyre Retailer",
          registrationNumber: parsed.registrationNumber || "",
          taxId: parsed.taxId || "",
          businessAddress: parsed.businessAddress || "",
          businessPhone: parsed.businessPhone || "",
          businessEmail: parsed.businessEmail || "",
          website: parsed.website || "",
          staffPosition: parsed.staffPosition || "Owner/Manager",
          designation: parsed.designation || ""
        }));

        // Set profile image if available
        if (parsed.profileImage || parsed.avatar) {
          setProfileImage(parsed.profileImage || parsed.avatar);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  // Fetch settings data from API
  const fetchSettingsData = async () => {
    if (!isAuthenticated) return;
    
    setApiLoading(true);
    setApiError(null);
    
    try {
      const [systemData, preferencesData, profileData, businessData] = await Promise.allSettled([
        getSystemSettings(),
        getUserPreferences(),
        getUserProfile(),
        getBusinessProfile()
      ]);
      
      // Handle system settings
      if (systemData.status === 'fulfilled' && systemData.value) {
        setSystemSettings(systemData.value);
        
        // Populate business form data from API
        setBusinessData(prev => ({
          ...prev,
          businessName: systemData.value.businessName || "",
          businessType: systemData.value.businessType || "Tyre Retailer",
          registrationNumber: systemData.value.registrationNumber || "",
          taxId: systemData.value.taxId || "",
          businessAddress: systemData.value.businessAddress || "",
          businessPhone: systemData.value.businessPhone || "",
          businessEmail: systemData.value.businessEmail || "",
          website: systemData.value.website || "",
          staffPosition: "Owner/Manager", // Default value
          designation: "" // Default value
        }));
        
        // Set selected category and warehouse from API data
        if ((systemData.value as any).primaryCategoryId) {
          setSelectedCategoryId((systemData.value as any).primaryCategoryId);
        }
        if ((systemData.value as any).primaryWarehouseId) {
          setSelectedWarehouseId((systemData.value as any).primaryWarehouseId);
        }
      } else if (systemData.status === 'rejected') {
        console.error('System settings error:', systemData.reason);
      }
      
      // Handle user preferences
      if (preferencesData.status === 'fulfilled' && preferencesData.value) {
        setUserPreferences(preferencesData.value);
      } else if (preferencesData.status === 'rejected') {
        console.error('User preferences error:', preferencesData.reason);
      }
      
      // Handle user profile
      if (profileData.status === 'fulfilled' && profileData.value) {
        setUserProfile(profileData.value);
        
        // Populate personal form data from API
        setFormData(prev => ({
          ...prev,
          firstName: profileData.value.firstName || "",
          lastName: profileData.value.lastName || "",
          email: profileData.value.email || "",
          phoneCode: profileData.value.phoneCode || "+234",
          phoneNumber: profileData.value.phoneNumber || "",
          address: profileData.value.address || "",
          city: profileData.value.city || "",
          country: profileData.value.country || "Nigeria",
          state: profileData.value.state || ""
        }));
        
        // Set profile image if available
        if (profileData.value.profileImage) {
          setProfileImage(profileData.value.profileImage);
        }
      } else if (profileData.status === 'rejected') {
        console.error('User profile error:', profileData.reason);
      }
      
      // Handle business profile
      if (businessData.status === 'fulfilled' && businessData.value) {
        setBusinessProfile(businessData.value);
        
        // Populate business form data from API
        setBusinessData(prev => ({
          ...prev,
          businessName: businessData.value.businessName || "",
          businessType: businessData.value.businessType || "Tyre Retailer",
          registrationNumber: businessData.value.registrationNumber || "",
          taxId: businessData.value.taxId || "",
          businessAddress: businessData.value.businessAddress || "",
          businessPhone: businessData.value.businessPhone || "",
          businessEmail: businessData.value.businessEmail || "",
          website: businessData.value.website || ""
        }));
        
        // Set selected category and warehouse
        if (businessData.value.primaryCategoryId) {
          setSelectedCategoryId(businessData.value.primaryCategoryId);
        }
        if (businessData.value.primaryWarehouseId) {
          setSelectedWarehouseId(businessData.value.primaryWarehouseId);
        }
      } else if (businessData.status === 'rejected') {
        console.error('Business profile error:', businessData.reason);
      }
      
    } catch (err: any) {
      console.error('Settings fetch error:', err);
      const errorMessage = err.message || 'Failed to load settings';
      setApiError(errorMessage);
      showError('Error', errorMessage);
    } finally {
      setApiLoading(false);
    }
  };

  // Fetch session data
  const fetchSessionData = async () => {
    if (!isAuthenticated) return;
    
    setSessionsLoading(true);
    setSessionsError(null);
    
    try {
      const [sessionsData, statsData] = await Promise.all([
        SessionService.getActiveSessions(),
        SessionService.getSessionStats()
      ]);
      
      if (sessionsData) {
        setSessions(sessionsData.sessions || []);
      }
      
      if (statsData) {
        setSessionStats(statsData.stats);
      }
      
    } catch (err: any) {
      setSessionsError(err.message || 'Failed to load session data');
      showError('Error', err.message || 'Failed to load session data');
    } finally {
      setSessionsLoading(false);
    }
  };


  // Fetch 2FA status
  const fetchTwoFactorStatus = async () => {
    if (!isAuthenticated) return;
    
    setTwoFactorLoading(true);
    
    try {
      const status = await TwoFactorAuthService.getStatus();
      setTwoFactorStatus(status);
      
      // Update security data with current 2FA status
      setSecurityData(prev => ({
        ...prev,
        twoFactorEnabled: status.isEnabled
      }));
      
    } catch (err: any) {
      console.warn('Failed to fetch 2FA status:', err);
      // Don't show error for 2FA status fetch
    } finally {
      setTwoFactorLoading(false);
    }
  };

  // Fetch categories and warehouses
  const fetchCategoriesAndWarehouses = async () => {
    if (!isAuthenticated) return;
    
    setCategoriesLoading(true);
    setWarehousesLoading(true);
    
    try {
      const [categoriesData, warehousesData] = await Promise.all([
        getCategories().catch((error) => {
          console.warn('Failed to fetch categories:', error);
          return [];
        }),
        getWarehouses().catch((error) => {
          console.warn('Failed to fetch warehouses:', error);
          return [];
        })
      ]);
      
      setCategories(categoriesData);
      setWarehouses(warehousesData);
      
    } catch (err: any) {
      console.warn('Failed to fetch categories and warehouses:', err);
    } finally {
      setCategoriesLoading(false);
      setWarehousesLoading(false);
    }
  };

  // Load settings when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettingsData();
      fetchSessionData();
      fetchTwoFactorStatus();
      fetchCategoriesAndWarehouses();
    }
  }, [isAuthenticated]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityChange = (field: string, value: string | boolean) => {
    setSecurityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessChange = (field: string, value: string) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Upload to Cloudinary
      const result = await uploadImage(file, {
        folder: 'profile-images',
        transformation: {
          width: 300,
          height: 300,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'auto'
        }
      });
      
      // Set the Cloudinary URL instead of base64
      setProfileImage(result.secure_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      showError('Error', 'Failed to upload image. Please try again.');
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  // Session management functions
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await SessionService.revokeSession(sessionId);
      showSuccess('Success', 'Session revoked successfully');
      await fetchSessionData(); // Refresh session data
    } catch (err: any) {
      showError('Error', err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      await SessionService.revokeAllOthers();
      showSuccess('Success', 'All other sessions revoked successfully');
      await fetchSessionData(); // Refresh session data
    } catch (err: any) {
      showError('Error', err.message || 'Failed to revoke sessions');
    }
  };

  const handleBusinessUpdate = async () => {
    if (!isAuthenticated) return;
    
    setApiLoading(true);
    
    try {
      // Update business profile via API only
      const businessPayload: UpdateBusinessProfilePayload = {
        businessName: businessData.businessName,
        businessType: businessData.businessType,
        registrationNumber: businessData.registrationNumber,
        taxId: businessData.taxId,
        businessAddress: businessData.businessAddress,
        businessPhone: businessData.businessPhone,
        businessEmail: businessData.businessEmail,
        website: businessData.website,
        primaryCategoryId: selectedCategoryId || undefined,
        primaryWarehouseId: selectedWarehouseId || undefined
      };
      
      await updateBusinessProfile(businessPayload);
      
      showSuccess('Success', 'Business information updated successfully!');
      
    } catch (err: any) {
      showError('Error', err.message || 'Failed to update business information');
    } finally {
      setApiLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!isAuthenticated) return;
    
    setApiLoading(true);
    
    try {
      // Update business profile via API
      const businessPayload: UpdateBusinessProfilePayload = {
        businessName: businessData.businessName,
        businessType: businessData.businessType,
        registrationNumber: businessData.registrationNumber,
        taxId: businessData.taxId,
        businessAddress: businessData.businessAddress,
        businessPhone: businessData.businessPhone,
        businessEmail: businessData.businessEmail,
        website: businessData.website,
        primaryCategoryId: selectedCategoryId || undefined,
        primaryWarehouseId: selectedWarehouseId || undefined
      };
      
      await updateBusinessProfile(businessPayload);
      
      // Update system settings via API
      const systemPayload = {
        currency: 'NGN', // Default currency
        timezone: 'Africa/Lagos', // Default timezone
        dateFormat: 'DD/MM/YYYY', // Default date format
        language: 'en', // Default language
        theme: 'light' as const, // Default theme
        maintenanceMode: false,
        backupStatus: 'enabled' as const,
        backupFrequency: 'daily' as const
      };
      
      await updateSystemSettings(systemPayload);
      
      // Update user preferences via API
      const preferencesPayload = {
        theme: 'light' as const,
        language: 'en',
        timezone: 'Africa/Lagos',
        dateFormat: 'DD/MM/YYYY',
        currency: 'NGN',
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true
        },
        dashboard: {
          defaultView: 'overview' as const,
          refreshInterval: 5,
          showCharts: true,
          showAlerts: true
        },
        privacy: {
          profileVisibility: 'private' as const,
          activityTracking: true,
          dataSharing: false
        }
      };
      
      await updateUserPreferences(preferencesPayload);
      
      // Update user profile via API
      const profilePayload: UpdateUserProfilePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneCode: formData.phoneCode,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        state: formData.state,
        profileImage: profileImage || undefined
      };
      
      await updateUserProfile(profilePayload);
      
      // Also update localStorage for backward compatibility
    const userData = localStorage.getItem('userData');
    let existingData: any = {};
    
    if (userData) {
      try {
        existingData = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing existing user data:', error);
      }
    }

    const updatedData = {
      ...existingData,
      ...formData,
      ...businessData,
      profileImage: profileImage || existingData.profileImage || existingData.avatar
    };

    localStorage.setItem('userData', JSON.stringify(updatedData));
    
      showSuccess('Success', 'Settings updated successfully!');
      
      // Refresh settings data
      await fetchSettingsData();
      
    } catch (err: any) {
      showError('Error', err.message || 'Failed to update settings');
    } finally {
      setApiLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword) {
      showError('Error', 'Please fill in all password fields');
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      showError('Error', 'New passwords do not match');
      return;
    }

    // Enhanced password validation to match backend requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(securityData.newPassword)) {
      showError('Error', 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }

    if (securityData.newPassword.length < 8) {
      showError('Error', 'New password must be at least 8 characters long');
      return;
    }

    setApiLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ceeone-api.onrender.com'}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
          confirmPassword: securityData.confirmPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle validation errors specifically
        if (errorData.details && errorData.details.validationErrors) {
          const validationErrors = errorData.details.validationErrors;
          showError('Validation Error', validationErrors.join('. '));
        } else {
          throw new Error(errorData.message || 'Failed to change password');
        }
        return;
      }

      // Clear password fields
      setSecurityData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      showSuccess('Success', 'Password changed successfully!');
      
    } catch (err: any) {
      showError('Error', err.message || 'Failed to change password');
    } finally {
      setApiLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    if (securityData.twoFactorEnabled) {
      // Disable 2FA
      const password = prompt('Enter your password to disable 2FA:');
      if (!password) return;
      
      const token = prompt('Enter your 2FA code:');
      if (!token) return;
      
      setTwoFactorLoading(true);
      
      try {
        await TwoFactorAuthService.disable(password, token);
        setSecurityData(prev => ({ ...prev, twoFactorEnabled: false }));
        await fetchTwoFactorStatus();
        showSuccess('Success', 'Two-factor authentication disabled successfully!');
      } catch (err: any) {
        showError('Error', err.message || 'Failed to disable 2FA');
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      // Enable 2FA - start setup process
      const password = prompt('Enter your password to enable 2FA:');
      if (!password) return;
      
      setTwoFactorLoading(true);
      
      try {
        const setupData = await TwoFactorAuthService.setup(password);
        setQrCode(setupData.qrCode);
        setBackupCodes(setupData.backupCodes);
        setShowTwoFactorSetup(true);
        showSuccess('Success', '2FA setup initiated. Please scan the QR code with your authenticator app.');
      } catch (err: any) {
        showError('Error', err.message || 'Failed to setup 2FA');
      } finally {
        setTwoFactorLoading(false);
      }
    }
  };

  const handleTwoFactorSetupComplete = async () => {
    if (!setupToken) {
      showError('Error', 'Please enter the 6-digit code from your authenticator app');
      return;
    }
    
    const password = prompt('Enter your password to complete 2FA setup:');
    if (!password) return;
    
    setTwoFactorLoading(true);
    
    try {
      const result = await TwoFactorAuthService.verifySetup(setupToken, password);
      setSecurityData(prev => ({ ...prev, twoFactorEnabled: true }));
      setBackupCodes(result.backupCodes);
      setShowTwoFactorSetup(false);
      setShowBackupCodes(true);
      setSetupToken('');
      await fetchTwoFactorStatus();
      showSuccess('Success', 'Two-factor authentication enabled successfully!');
    } catch (err: any) {
      showError('Error', err.message || 'Failed to complete 2FA setup');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleViewBackupCodes = async () => {
    setTwoFactorLoading(true);
    
    try {
      const result = await TwoFactorAuthService.getBackupCodes();
      setBackupCodes(result.backupCodes);
      setShowBackupCodes(true);
    } catch (err: any) {
      showError('Error', err.message || 'Failed to get backup codes');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const password = prompt('Enter your password to regenerate backup codes:');
    if (!password) return;
    
    setTwoFactorLoading(true);
    
    try {
      const result = await TwoFactorAuthService.regenerateBackupCodes(password);
      setBackupCodes(result.backupCodes);
      showSuccess('Success', 'Backup codes regenerated successfully!');
    } catch (err: any) {
      showError('Error', err.message || 'Failed to regenerate backup codes');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    
    // Scroll to the respective section
    setTimeout(() => {
      if (tabId === "business") {
        const businessSection = document.getElementById('business-section');
        if (businessSection) {
          businessSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (tabId === "security") {
        const securitySection = document.getElementById('security-section');
        if (securitySection) {
          securitySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else if (tabId === "account") {
        const accountSection = document.getElementById('account-section');
        if (accountSection) {
          accountSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const tabs = [
    { id: "account", label: "Account" },
    { id: "business", label: "Business" },
    { id: "security", label: "Security" }
  ];

  // Show loading only in main content area, keep sidebar visible
  const renderMainContent = () => {
    if (loading || apiLoading) {
      return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {loading ? 'Loading...' : 'Fetching settings data...'}
            </p>
          </div>
        </div>
      );
    }

    if (apiError) {
      return (
        <div className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Settings</h2>
            <p className="text-gray-600 mb-4">{apiError}</p>
            <button 
              onClick={fetchSettingsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return null; // No loading or error, show main content
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage="settings" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {renderMainContent() || (
        <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Settings" sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto px-5 pt-7">
          {/* Breadcrumbs */}
          <Breadcrumb items={[
            { label: "Home", href: "/dashboard" },
            { label: "Settings", href: "/settings" }
          ]} />
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Account Section */}
          <div id="account-section" className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Account Settings</h2>
              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex gap-3">
                    <div className="relative">
                      <select
                        value={formData.phoneCode}
                        onChange={(e) => handleInputChange('phoneCode', e.target.value)}
                        className="block w-24 pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Country and State */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <div className="relative">
                      <select
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="block w-full pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="Nigeria">Nigeria</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Kenya">Kenya</option>
                        <option value="South Africa">South Africa</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <div className="relative">
                      <select
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="block w-full pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Kano">Kano</option>
                        <option value="Rivers">Rivers</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Picture */}
              <div className="lg:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                      {uploadProgress.isUploading ? (
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                          <p className="text-sm text-gray-600">Uploading...</p>
                          <p className="text-xs text-gray-500">{uploadProgress.progress}%</p>
                        </div>
                      ) : profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">
                            {formData.firstName ? formData.firstName.charAt(0) : 'U'}
                            {formData.lastName ? formData.lastName.charAt(0) : 'S'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <button 
                      onClick={() => document.getElementById('profile-image-upload')?.click()}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    
                    {/* Delete Button */}
                    {profileImage && (
                      <button 
                        onClick={removeImage}
                        className="absolute top-2 right-12 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                  
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Click the upload button to change your profile picture
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Section */}
          <div id="business-section" className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Business Information</h2>
              <button
                onClick={handleBusinessUpdate}
                disabled={apiLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {apiLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Business Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessData.businessName}
                    onChange={(e) => handleBusinessChange('businessName', e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                  <select
                    value={businessData.businessType}
                    onChange={(e) => handleBusinessChange('businessType', e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Tyre Retailer">Tyre Retailer</option>
                    <option value="Automotive Services">Automotive Services</option>
                    <option value="Auto Parts Store">Auto Parts Store</option>
                    <option value="Vehicle Maintenance">Vehicle Maintenance</option>
                    <option value="Fleet Management">Fleet Management</option>
                  </select>
                </div>
                
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Category</label>
                  <div className="space-y-3">
                    {/* Category Dropdown */}
                    {!isCreatingNewCategory && (
                      <div className="relative">
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                          disabled={categoriesLoading}
                        >
                          <option value="">Select a category...</option>
                          {categories.length > 0 ? (
                            categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))
                          ) : (
                            <option value="">{categoriesLoading ? 'Loading categories...' : 'No categories available'}</option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* New Category Input */}
                    {isCreatingNewCategory && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter new category name"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (newCategoryName.trim()) {
                                // Add the new category to the list (you might want to call an API here)
                                const newCategory: Category = {
                                  id: `temp-${Date.now()}`,
                                  name: newCategoryName.trim(),
                                  description: '',
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                };
                                setCategories(prev => [...prev, newCategory]);
                                setSelectedCategoryId(newCategory.id);
                                setNewCategoryName('');
                                setIsCreatingNewCategory(false);
                                showSuccess('Success', 'Category added successfully!');
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Add Category
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingNewCategory(false);
                              setNewCategoryName('');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add New Category Button */}
                    {!isCreatingNewCategory && (
                      <button
                        onClick={() => setIsCreatingNewCategory(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add New Category
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Warehouse Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Warehouse</label>
                  <div className="space-y-3">
                    {/* Warehouse Dropdown */}
                    {!isCreatingNewWarehouse && (
                      <div className="relative">
                        <select
                          value={selectedWarehouseId}
                          onChange={(e) => setSelectedWarehouseId(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                          disabled={warehousesLoading}
                        >
                          <option value="">Select a warehouse...</option>
                          {warehouses.length > 0 ? (
                            warehouses.map((warehouse) => (
                              <option key={warehouse.id} value={warehouse.id}>
                                {warehouse.name} - {warehouse.location}
                              </option>
                            ))
                          ) : (
                            <option value="">{warehousesLoading ? 'Loading warehouses...' : 'No warehouses available'}</option>
                          )}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* New Warehouse Input */}
                    {isCreatingNewWarehouse && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newWarehouseName}
                          onChange={(e) => setNewWarehouseName(e.target.value)}
                          placeholder="Enter new warehouse name"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (newWarehouseName.trim()) {
                                // Add the new warehouse to the list (you might want to call an API here)
                                const newWarehouse: Warehouse = {
                                  id: `temp-${Date.now()}`,
                                  name: newWarehouseName.trim(),
                                  location: 'Location to be set',
                                  description: '',
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                };
                                setWarehouses(prev => [...prev, newWarehouse]);
                                setSelectedWarehouseId(newWarehouse.id);
                                setNewWarehouseName('');
                                setIsCreatingNewWarehouse(false);
                                showSuccess('Success', 'Warehouse added successfully!');
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Add Warehouse
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingNewWarehouse(false);
                              setNewWarehouseName('');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add New Warehouse Button */}
                    {!isCreatingNewWarehouse && (
                      <button
                        onClick={() => setIsCreatingNewWarehouse(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add New Warehouse
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={businessData.registrationNumber}
                    onChange={(e) => handleBusinessChange('registrationNumber', e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                  <input
                    type="text"
                    value={businessData.taxId}
                    onChange={(e) => handleBusinessChange('taxId', e.target.value)}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                    <textarea
                      value={businessData.businessAddress}
                      onChange={(e) => handleBusinessChange('businessAddress', e.target.value)}
                      rows={3}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
                      <input
                        type="tel"
                        value={businessData.businessPhone}
                        onChange={(e) => handleBusinessChange('businessPhone', e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                      <input
                        type="email"
                        value={businessData.businessEmail}
                        onChange={(e) => handleBusinessChange('businessEmail', e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                      <input
                        type="url"
                        value={businessData.website}
                        onChange={(e) => handleBusinessChange('website', e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <select
                      value={businessData.staffPosition}
                      onChange={(e) => handleBusinessChange('staffPosition', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Owner/Manager">Owner/Manager</option>
                      <option value="Sales Manager">Sales Manager</option>
                      <option value="Operations Manager">Operations Manager</option>
                      <option value="Customer Service">Customer Service</option>
                      <option value="Technician">Technician</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Designation</label>
                    <input
                      type="text"
                      value={businessData.designation}
                      onChange={(e) => handleBusinessChange('designation', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div id="security-section" className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Security Settings</h2>
            
            <div className="space-y-6">
              {/* Change Password */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={securityData.currentPassword}
                      onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={securityData.newPassword}
                      onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={securityData.confirmPassword}
                      onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                
                {/* Password Requirements */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li className={`flex items-center ${securityData.newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                      <span className="mr-2">{securityData.newPassword.length >= 8 ? '✓' : '○'}</span>
                      At least 8 characters long
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(securityData.newPassword) ? 'text-green-600' : ''}`}>
                      <span className="mr-2">{/[A-Z]/.test(securityData.newPassword) ? '✓' : '○'}</span>
                      At least one uppercase letter
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(securityData.newPassword) ? 'text-green-600' : ''}`}>
                      <span className="mr-2">{/[a-z]/.test(securityData.newPassword) ? '✓' : '○'}</span>
                      At least one lowercase letter
                    </li>
                    <li className={`flex items-center ${/\d/.test(securityData.newPassword) ? 'text-green-600' : ''}`}>
                      <span className="mr-2">{/\d/.test(securityData.newPassword) ? '✓' : '○'}</span>
                      At least one number
                    </li>
                    <li className={`flex items-center ${/[@$!%*?&]/.test(securityData.newPassword) ? 'text-green-600' : ''}`}>
                      <span className="mr-2">{/[@$!%*?&]/.test(securityData.newPassword) ? '✓' : '○'}</span>
                      At least one special character (@$!%*?&)
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={handlePasswordChange}
                  disabled={apiLoading}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {apiLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={handleTwoFactorToggle}
                    disabled={twoFactorLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      securityData.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securityData.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {securityData.twoFactorEnabled ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-2">Two-factor authentication is enabled</p>
                    <p className="text-xs text-blue-600 mb-3">You'll need to enter a verification code from your authenticator app when signing in.</p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleViewBackupCodes}
                        disabled={twoFactorLoading}
                        className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                      >
                        View Backup Codes
                      </button>
                      <button
                        onClick={handleRegenerateBackupCodes}
                        disabled={twoFactorLoading}
                        className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors disabled:opacity-50"
                      >
                        Regenerate Codes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Two-factor authentication is disabled</p>
                    <p className="text-xs text-gray-500">Enable 2FA to add an extra layer of security to your account.</p>
                  </div>
                )}
              </div>

              {/* Login Sessions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllOthers}
                      className="text-sm text-red-600 font-medium hover:text-red-800 transition-colors"
                    >
                      Revoke All Others
                    </button>
                  )}
                </div>
                
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading sessions...</span>
                  </div>
                ) : sessionsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600 font-medium">Error loading sessions</p>
                    <p className="text-sm text-gray-500 mt-1">{sessionsError}</p>
                    <button
                      onClick={fetchSessionData}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No active sessions found</p>
                  </div>
                ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                      <div 
                        key={session.id} 
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          session.isCurrent 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getDeviceIcon(session.deviceType)}
                          </div>
                    <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900">
                                {session.browser} on {session.operatingSystem}
                              </p>
                              {session.isCurrent && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Current
                                </span>
                              )}
                              {isSessionExpiringSoon(session.expiresAt) && (
                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                  Expiring Soon
                                </span>
                              )}
                    </div>
                            <p className="text-xs text-gray-600">
                              {session.city}, {session.location} • {formatLastActivity(session.lastActivity)}
                            </p>
                            <p className="text-xs text-gray-500">
                              IP: {session.ipAddress}
                            </p>
                  </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-medium ${
                            session.isActive ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {session.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {!session.isCurrent && (
                            <button 
                              onClick={() => handleRevokeSession(session.id)}
                              className="text-xs text-red-600 font-medium hover:text-red-800 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Session Statistics */}
                {sessionStats && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Session Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-600">Total Sessions</p>
                        <p className="text-lg font-semibold text-gray-900">{sessionStats.totalSessions}</p>
                    </div>
                      <div>
                        <p className="text-xs text-gray-600">Active Sessions</p>
                        <p className="text-lg font-semibold text-gray-900">{sessionStats.activeSessions}</p>
                  </div>
                      <div>
                        <p className="text-xs text-gray-600">Expired Sessions</p>
                        <p className="text-lg font-semibold text-gray-900">{sessionStats.expiredSessions}</p>
                </div>
                      <div>
                        <p className="text-xs text-gray-600">Last Login</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {sessionStats.lastLogin ? formatLastActivity(sessionStats.lastLogin) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        </div>
      )}
      
      {/* 2FA Setup Modal */}
      {showTwoFactorSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Two-Factor Authentication</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Scan this QR code with your authenticator app:</p>
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit code from your app:
              </label>
              <input
                type="text"
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleTwoFactorSetupComplete}
                disabled={twoFactorLoading || setupToken.length !== 6}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {twoFactorLoading ? 'Verifying...' : 'Complete Setup'}
              </button>
              <button
                onClick={() => {
                  setShowTwoFactorSetup(false);
                  setSetupToken('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Codes</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Save these backup codes in a safe place. Each code can only be used once.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-sm font-mono text-gray-800 bg-white p-2 rounded border">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackupCodes(false)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                I've Saved These Codes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification Container */}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  );
}
