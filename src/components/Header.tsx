"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getImportantNotifications, type Notification } from "@/services/notifications";

interface HeaderProps {
  title: string;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Header({ title, sidebarOpen, setSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, getUserRole, getUserPermissions, user, isInitialized } = usePermissions();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string>("/icons/profile1.png");
  const [userName, setUserName] = useState<string>("Admin User");
  const notificationRef = useRef<HTMLDivElement>(null);
  const permissionsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && user) {
      // Update user info from permission system
      const roleName = getUserRole();
      
      // Check for user profile image
      if (user.profileImage) {
        setUserProfileImage(user.profileImage);
      } else if (user.avatar) {
        setUserProfileImage(user.avatar);
      }
      
      // Check for user name
      if (user.name) {
        setUserName(user.name);
      } else if (user.firstName && user.lastName) {
        setUserName(`${user.firstName} ${user.lastName}`);
      } else if (user.username) {
        setUserName(user.username);
      }
    }
  }, [isInitialized, user, getUserRole]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isInitialized) return;
      
      setNotificationsLoading(true);
      try {
        const fetchedNotifications = await getImportantNotifications();
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Keep empty array on error
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Get default permissions based on role
  const getDefaultPermissions = (role: string): string[] => {
    const permissionsMap: { [key: string]: string[] } = {
      'Admin': [
        'View Dashboard',
        'Manage Orders',
        'Manage Customers',
        'Manage Inventory',
        'Manage Users & Roles',
        'View Reports',
        'Manage Expenses',
        'System Settings'
      ],
      'Manager': [
        'View Dashboard',
        'Manage Orders',
        'Manage Customers',
        'Manage Inventory',
        'View Reports',
        'Manage Expenses'
      ],
      'Staff': [
        'View Dashboard',
        'Manage Orders',
        'Manage Customers',
        'View Inventory'
      ],
      'Viewer': [
        'View Dashboard',
        'View Orders',
        'View Customers',
        'View Inventory',
        'View Reports'
      ]
    };
    
    return permissionsMap[role] || permissionsMap['Viewer'];
  };

  // Close notifications and permissions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (permissionsRef.current && !permissionsRef.current.contains(event.target as Node)) {
        setShowPermissions(false);
      }
    };

    if (showNotifications || showPermissions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showPermissions]);

  // Generate initials from user name
  const getInitials = (name: string): string => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    return 'AU'; // Admin User fallback
  };

  return (
    <header className="bg-white flex items-center justify-between px-5 py-4 shadow-sm sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        {/* Hamburger for mobile */}
        {setSidebarOpen && (
          <button 
            className="lg:hidden p-2 rounded-md hover:bg-[#f4f5fa] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="text-[20px] font-poppins font-medium text-[#45464e]">{title}</h1>
      </div>
      <div className="flex items-center gap-5">
        {/* Role Button with Permissions - Only show if user has permission to view permissions */}
        {hasPermission('users.view') && (
          <div className="relative" ref={permissionsRef}>
            <button 
              onClick={() => setShowPermissions(!showPermissions)}
              className="bg-[#fef5ea] rounded-lg px-3 py-1 flex items-center gap-2 hover:bg-[#fef0e0] transition-colors cursor-pointer"
            >
              <span className="text-[#1c1d22] text-[14px]">{getUserRole()}</span>
              <svg className={`w-4 h-4 transition-transform ${showPermissions ? 'rotate-180' : ''}`} fill="none">
                <path d="M6 8l4 4 4-4" stroke="#1c1d22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          
          {/* Permissions Modal */}
          {showPermissions && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Your Permissions</h3>
                  <button 
                    onClick={() => setShowPermissions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Role: </span>
                  <span className="text-sm font-medium text-[#02016a]">{getUserRole()}</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {getUserPermissions().map((permission, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">{permission}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button 
                    onClick={() => router.push('/users-roles')}
                    className="text-sm text-[#02016a] hover:text-[#03024a] font-medium"
                  >
                    Manage Roles & Permissions →
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        )}
        {/* Notification Bell - Only show if user has permission to view notifications */}
        {hasAnyPermission(['dashboard.view', 'sales.view', 'inventory.view']) && (
          <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Image 
              src="/icons/Notification.png" 
              alt="Notifications" 
              width={20} 
              height={20} 
              className="w-5 h-5 object-contain" 
            />
            {/* Notification Badge */}
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>
          
          {/* Notifications Modal */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      notification.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'order' ? 'bg-green-500' :
                        notification.type === 'inventory' ? 'bg-orange-500' :
                        notification.type === 'payment' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-100">
                <button className="w-full text-center text-sm text-[#02016a] hover:text-[#03024a] font-medium">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
          </div>
        )}
        {/* Profile Icon - Only show if user has permission to view settings */}
        {hasPermission('settings.view') && (
          <button 
            onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-[#02016a] hover:ring-offset-2 transition-all"
          >
          {userProfileImage && userProfileImage !== "/icons/profile1.png" ? (
            <Image 
              src={userProfileImage} 
              alt="User Profile" 
              width={32} 
              height={32} 
              className="w-8 h-8 object-cover" 
            />
          ) : (
            <div className="w-8 h-8 bg-[#02016a] flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {getInitials(userName)}
              </span>
            </div>
          )}
          </button>
        )}
      </div>
    </header>
  );
}
