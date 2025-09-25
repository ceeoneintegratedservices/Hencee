"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Header({ title, sidebarOpen, setSidebarOpen }: HeaderProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("Admin");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [userProfileImage, setUserProfileImage] = useState<string>("/icons/profile1.png");
  const [userName, setUserName] = useState<string>("Admin User");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);
  const permissionsRef = useRef<HTMLDivElement>(null);
  const [notifications] = useState([
    {
      id: 1,
      title: "New Order Received",
      message: "Order #12345 has been placed by John Smith",
      time: "2 minutes ago",
      type: "order",
      unread: true
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "GL601 tyres are running low (5 units remaining)",
      time: "15 minutes ago",
      type: "inventory",
      unread: true
    },
    {
      id: 3,
      title: "Payment Received",
      message: "Payment of ₦150,000 received for Order #12340",
      time: "1 hour ago",
      type: "payment",
      unread: false
    },
    {
      id: 4,
      title: "New Customer Registration",
      message: "Sarah Johnson has registered as a new customer",
      time: "2 hours ago",
      type: "customer",
      unread: false
    }
  ]);

  useEffect(() => {
    // Get user role from localStorage or user data
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // Handle different possible role structures
        let roleName = "Admin";
        
        if (parsed.role) {
          // If role is an object, get the name property
          roleName = typeof parsed.role === 'object' ? parsed.role.name || parsed.role.id : parsed.role;
        } else if (parsed.roleId) {
          // If roleId is an object, get the name property
          roleName = typeof parsed.roleId === 'object' ? parsed.roleId.name || parsed.roleId.id : parsed.roleId;
        }
        
        // Check for user profile image
        if (parsed.profileImage) {
          setUserProfileImage(parsed.profileImage);
        } else if (parsed.avatar) {
          setUserProfileImage(parsed.avatar);
        }
        
        // Check for user name
        if (parsed.name) {
          setUserName(parsed.name);
        } else if (parsed.firstName && parsed.lastName) {
          setUserName(`${parsed.firstName} ${parsed.lastName}`);
        } else if (parsed.username) {
          setUserName(parsed.username);
        }
        
        // Check for user permissions
        if (parsed.permissions) {
          setUserPermissions(parsed.permissions);
        } else if (parsed.role && typeof parsed.role === 'object' && parsed.role.permissions) {
          setUserPermissions(parsed.role.permissions);
        } else {
          // Default permissions based on role
          const defaultPermissions = getDefaultPermissions(roleName);
          setUserPermissions(defaultPermissions);
        }
        
        setUserRole(roleName);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserRole("Admin");
      }
    }
  }, []);

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
        {/* Role Button with Permissions */}
        <div className="relative" ref={permissionsRef}>
          <button 
            onClick={() => setShowPermissions(!showPermissions)}
            className="bg-[#fef5ea] rounded-lg px-3 py-1 flex items-center gap-2 hover:bg-[#fef0e0] transition-colors cursor-pointer"
          >
            <span className="text-[#1c1d22] text-[14px]">{userRole}</span>
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
                  <span className="text-sm font-medium text-[#02016a]">{userRole}</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userPermissions.map((permission, index) => (
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
        {/* Notification Bell */}
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
        {/* Profile Icon */}
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
      </div>
    </header>
  );
}
