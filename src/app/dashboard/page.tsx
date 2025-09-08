"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminDashboard() {
  const router = useRouter();
  // For dropdowns (e.g. This Week, Last 7 Days)
  const [summaryFilter] = useState("Sales");
  const [dateFilter] = useState("Last 7 Days");
  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      console.log('Dashboard: Checking auth token:', token);
      console.log('Dashboard: Checking user data:', userData);
      
      // Check if we have any form of authentication
      const hasAuth = token || userData;
      
      if (!hasAuth) {
        console.log('Dashboard: No auth data found, redirecting to login');
        router.push('/login');
      } else {
        console.log('Dashboard: Auth data found, setting authenticated');
        setIsAuthenticated(true);
      }
    };

    // Small delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 100);
    
    // Also check again after a longer delay to catch any timing issues
    const backupTimer = setTimeout(checkAuth, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(backupTimer);
    };
  }, [router]);

  // Handle sidebar keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    router.push('/login');
  };

  // Mock activities for scroll demo
  const activities = [
    { id: 1, text: "User John added a new product." },
    { id: 2, text: "Order #1234 was completed." },
    { id: 3, text: "Inventory updated for Goodyear tires." },
    { id: 4, text: "User Jane assigned admin role." },
    { id: 5, text: "Customer feedback received." },
    { id: 6, text: "Order #1235 was refunded." },
    { id: 7, text: "New user registered: Mike." },
    { id: 8, text: "Product Bridgestone added to catalog." },
  ];

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="flex w-full h-screen bg-[#f4f5fa] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-[#f4f5fa] overflow-hidden">
      {/* Mobile Sidebar Overlay - Removed black overlay to keep dashboard visible */}
      {/* Sidebar */}
      <aside
        className={`fixed lg:static w-[296px] h-screen overflow-y-auto bg-white shadow-lg flex flex-col transition-transform duration-300 z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:block`}
      >
        {/* Top section with logo and navigation */}
        <div className="flex flex-col h-full">
          {/* Logo and Mobile Close Button */}
          <div className="flex items-center justify-between px-5 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Image src="/icons/logoIcon.png" alt="Logo" width={40} height={40} className="w-10 h-10" />
              <span className="font-bold text-[20px] text-black font-['Work_Sans']">Ceeone Wheels</span>
            </div>
            {/* Mobile Close Button */}
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Menu */}
          <nav className="flex flex-col gap-4 mt-6 px-6 flex-1">
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#02016a] text-white font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
                  <path d="M14.0755 0H17.4615C18.8637 0 20 1.14585 20 2.55996V5.97452C20 7.38864 18.8637 8.53449 17.4615 8.53449H14.0755C12.6732 8.53449 11.537 7.38864 11.537 5.97452V2.55996C11.537 1.14585 12.6732 0 14.0755 0" fill="white" opacity="0.4"/>
                  <path d="M5.9248 11.4658C7.3269 11.466 8.46285 12.6114 8.46289 14.0254V17.4404C8.46268 18.8533 7.3268 19.9998 5.9248 20H2.53809C1.13615 19.9998 0.000210316 18.8533 0 17.4404V14.0254C4.54606e-05 12.6115 1.13605 11.4661 2.53809 11.4658H5.9248ZM17.4619 11.4658C18.864 11.4661 20 12.6115 20 14.0254V17.4404C19.9998 18.8533 18.8639 19.9998 17.4619 20H14.0752C12.6732 19.9998 11.5373 18.8533 11.5371 17.4404V14.0254C11.5372 12.6114 12.6731 11.466 14.0752 11.4658H17.4619ZM5.9248 0C7.3268 0.000171152 8.46268 1.14575 8.46289 2.55957V5.97461C8.46285 7.38858 7.3269 8.53401 5.9248 8.53418H2.53809C1.13605 8.53394 4.52055e-05 7.38853 0 5.97461V2.55957C0.000210429 1.14579 1.13615 0.0002388 2.53809 0H5.9248Z" fill="white"/>
                </svg>
              </span>
              <span className="text-sm">Dashboard</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium relative" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 20 21">
                  <path d="M14.2126 20.222H5.86477C2.79841 20.222 0.446004 19.1145 1.1142 14.6568L1.89223 8.6156C2.30413 6.39134 3.72289 5.54008 4.96774 5.54008H15.1462C16.4094 5.54008 17.7458 6.45542 18.2217 8.6156L18.9998 14.6568C19.5673 18.611 17.279 20.222 14.2126 20.222Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.3499 5.32041C14.3499 2.93433 12.4156 1.00004 10.0295 1.00004V1.00004C8.88053 0.99517 7.77692 1.4482 6.96273 2.25895C6.14854 3.06971 5.69085 4.17139 5.69086 5.32041H5.69086" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-sm">Orders</span>
              <span className="ml-auto bg-[#ffcc91] text-[#1c1d22] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 21 21">
                  <path d="M20.169 14.482C20.169 18.06 18.06 20.169 14.482 20.169H6.7C3.113 20.169 1 18.06 1 14.482V6.682C1 3.109 2.314 1 5.893 1H7.893C8.611 1.001 9.287 1.338 9.717 1.913L10.63 3.127C11.062 3.701 11.738 4.039 12.456 4.04H15.286C18.873 4.04 20.197 5.866 20.197 9.517L20.169 14.482Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.2311 13.2129H14.9661" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-sm">Inventory</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 21 20">
                  <path d="M7.842 12.957C11.531 12.957 14.684 13.516 14.684 15.749C14.684 17.982 11.552 18.557 7.842 18.557C4.152 18.557 1 18.003 1 15.769C1 13.535 4.131 12.957 7.842 12.957Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.842 9.77C5.42 9.77 3.456 7.807 3.456 5.385C3.456 2.963 5.42 1 7.842 1C10.263 1 12.227 2.963 12.227 5.385C12.236 7.798 10.286 9.761 7.873 9.77H7.842Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-sm">Customers</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path d="M11.8248 1.3752C11.7121 1.26254 11.5593 1.19924 11.4 1.19924C11.2407 1.19924 11.0879 1.26254 10.9752 1.3752C10.8625 1.48786 10.7992 1.64067 10.7992 1.8C10.7992 1.95933 10.8625 2.11214 10.9752 2.2248L12.3516 3.6H11.4C9.61997 3.6 7.87991 4.12784 6.39987 5.11677C4.91983 6.10571 3.76627 7.51131 3.08508 9.15585C2.4039 10.8004 2.22567 12.61 2.57293 14.3558C2.9202 16.1016 3.77737 17.7053 5.03604 18.964C6.29471 20.2226 7.89836 21.0798 9.64419 21.4271C11.39 21.7743 13.1996 21.5961 14.8442 20.9149C16.4887 20.2337 17.8943 19.0802 18.8832 17.6001C19.8722 16.1201 20.4 14.38 20.4 12.6C20.4 12.4409 20.3368 12.2883 20.2243 12.1757C20.1117 12.0632 19.9591 12 19.8 12C19.6409 12 19.4883 12.0632 19.3757 12.1757C19.2632 12.2883 19.2 12.4409 19.2 12.6C19.2 14.1427 18.7425 15.6507 17.8855 16.9334C17.0284 18.2162 15.8102 19.2159 14.3849 19.8063C12.9597 20.3966 11.3913 20.5511 9.8783 20.2501C8.36524 19.9492 6.97542 19.2063 5.88457 18.1154C4.79372 17.0246 4.05084 15.6348 3.74987 14.1217C3.44891 12.6087 3.60338 11.0403 4.19374 9.61507C4.7841 8.18981 5.78385 6.97161 7.06655 6.11454C8.34926 5.25746 9.85731 4.8 11.4 4.8H12.3516L10.9752 6.1752C10.9194 6.23099 10.8752 6.29721 10.845 6.3701C10.8148 6.44299 10.7992 6.52111 10.7992 6.6C10.7992 6.67889 10.8148 6.75701 10.845 6.8299C10.8752 6.90279 10.9194 6.96901 10.9752 7.0248C11.0879 7.13746 11.2407 7.20076 11.4 7.20076C11.4789 7.20076 11.557 7.18522 11.6299 7.15503C11.7028 7.12484 11.769 7.08059 11.8248 7.0248L14.2248 4.6248C14.2807 4.56907 14.325 4.50285 14.3553 4.42996C14.3855 4.35707 14.4011 4.27892 14.4011 4.2C14.4011 4.12108 14.3855 4.04293 14.3553 3.97004C14.325 3.89715 14.2807 3.83093 14.2248 3.7752L11.8248 1.3752ZM16.0164 8.568C16.0731 8.62268 16.1185 8.688 16.15 8.76023C16.1815 8.83246 16.1985 8.91019 16.1999 8.98897C16.2014 9.06775 16.1873 9.14605 16.1585 9.21939C16.1297 9.29272 16.0867 9.35967 16.032 9.4164L11.412 14.2164C11.356 14.2745 11.2889 14.3207 11.2147 14.3522C11.1405 14.3838 11.0607 14.4 10.98 14.4C10.8993 14.4 10.8195 14.3838 10.7453 14.3522C10.6711 14.3207 10.604 14.2745 10.548 14.2164L8.568 12.1584C8.46448 12.0426 8.40989 11.8912 8.41572 11.736C8.42154 11.5808 8.48731 11.4339 8.59921 11.3262C8.71111 11.2185 8.86042 11.1584 9.01573 11.1585C9.17104 11.1586 9.32026 11.2189 9.432 11.3268L10.98 12.9348L15.168 8.5836C15.2227 8.52687 15.288 8.48146 15.3602 8.44997C15.4325 8.41849 15.5102 8.40154 15.589 8.40009C15.6678 8.39864 15.746 8.41272 15.8194 8.44153C15.8927 8.47034 15.9597 8.51332 16.0164 8.568Z" fill="#101828"/>
                </svg>
              </span>
              <span className="text-sm">Approvals</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-sm">Users & Roles</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path d="M3 1.5H1.5V21C1.5 21.3978 1.65804 21.7794 1.93934 22.0607C2.22064 22.342 2.60218 22.5 3 22.5H22.5V21H3V1.5Z" fill="#101828"/>
                  <path d="M22.5 6.75H17.25V8.25H19.9425L14.25 13.9425L11.0325 10.7175C10.9628 10.6472 10.8798 10.5914 10.7884 10.5533C10.697 10.5153 10.599 10.4957 10.5 10.4957C10.401 10.4957 10.303 10.5153 10.2116 10.5533C10.1202 10.5914 10.0372 10.6472 9.9675 10.7175L4.5 16.1925L5.5575 17.25L10.5 12.3075L13.7175 15.5325C13.7872 15.6028 13.8702 15.6586 13.9616 15.6967C14.053 15.7347 14.151 15.7543 14.25 15.7543C14.349 15.7543 14.447 15.7347 14.5384 15.6967C14.6298 15.6586 14.7128 15.6028 14.7825 15.5325L21 9.3075V12H22.5V6.75Z" fill="#101828"/>
                </svg>
              </span>
              <span className="text-sm">Reports</span>
            </a>
            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium" href="#">
              <span className="w-5 h-5 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path d="M12 13C11.6955 12.9964 11.3973 13.0862 11.1454 13.2573C10.8936 13.4284 10.7001 13.6725 10.5912 13.9568C10.4823 14.2411 10.4631 14.552 10.5361 14.8476C10.6092 15.1431 10.7711 15.4092 11 15.61V17C11 17.2652 11.1054 17.5196 11.2929 17.7071C11.4804 17.8946 11.7348 18 12 18C12.2652 18 12.5196 17.8946 12.7071 17.7071C12.8946 17.5196 13 17.2652 13 17V15.61C13.2289 15.4092 13.3908 15.1431 13.4639 14.8476C13.5369 14.552 13.5177 14.2411 13.4088 13.9568C13.2999 13.6725 13.1064 13.4284 12.8546 13.2573C12.6027 13.0862 12.3045 12.9964 12 13ZM17 9V7C17 5.67392 16.4732 4.40215 15.5355 3.46447C14.5979 2.52678 13.3261 2 12 2C10.6739 2 9.40215 2.52678 8.46447 3.46447C7.52678 4.40215 7 5.67392 7 7V9C6.20435 9 5.44129 9.31607 4.87868 9.87868C4.31607 10.4413 4 11.2044 4 12V19C4 19.7956 4.31607 20.5587 4.87868 21.1213C5.44129 21.6839 6.20435 22 7 22H17C17.7956 22 18.5587 21.6839 19.1213 20.5587C19.6839 19.7956 20 19.7956 20 19V12C20 11.2044 19.6839 10.4413 19.1213 9.87868C18.5587 9.31607 17.7956 9 17 9ZM9 7C9 6.20435 9.31607 5.44129 9.87868 4.87868C10.4413 4.31607 11.2044 4 12 4C12.7956 4 13.5587 4.31607 14.1213 4.87868C14.6839 5.44129 15 6.20435 15 7V9H9V7ZM18 19C18 19.2652 17.8946 19.5196 17.7071 19.7071C17.5196 19.8946 17.2652 20 17 20H7C6.73478 20 6.48043 19.8946 6.29289 19.7071C6.10536 19.5196 6 19.2652 6 19V12C6 11.7348 6.10536 11.4804 6.29289 11.2929C6.48043 11.1054 6.73478 11 7 11H17C17.2652 11 17.5196 11.1054 17.7071 11.2929C17.8946 11.4804 18 11.7348 18 12V19Z" fill="#101828"/>
                </svg>
              </span>
              <span className="text-sm">Audit Logs</span>
            </a>
          </nav>
        </div>
        
        {/* Bottom actions - Fixed at bottom */}
        <div className="flex flex-col gap-3 px-6 py-8 border-t border-gray-100 mt-auto">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#101828] font-medium hover:bg-gray-50 transition-colors" href="#">
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path d="M10.825 22C10.375 22 9.98767 21.85 9.663 21.55C9.33833 21.25 9.14233 20.8833 9.075 20.45L8.85 18.8C8.63333 18.7167 8.42933 18.6167 8.238 18.5C8.04667 18.3833 7.859 18.2583 7.675 18.125L6.125 18.775C5.70833 18.9583 5.29167 18.975 4.875 18.825C4.45833 18.675 4.13333 18.4083 3.9 18.025L2.725 15.975C2.49167 15.5917 2.425 15.1833 2.525 14.75C2.625 14.3167 2.85 13.9583 3.2 13.675L4.525 12.675C4.50833 12.5583 4.5 12.4457 4.5 12.337V11.662C4.5 11.554 4.50833 11.4417 4.525 11.325L3.2 10.325C2.85 10.0417 2.625 9.68333 2.525 9.25C2.425 8.81667 2.49167 8.40833 2.725 8.025L3.9 5.975C4.13333 5.59167 4.45833 5.325 4.875 5.175C5.29167 5.025 5.70833 5.04167 6.125 5.225L7.675 5.875C7.85833 5.74167 8.05 5.61667 8.25 5.5C8.45 5.38333 8.65 5.28333 8.85 5.2L9.075 3.55C9.14167 3.11667 9.33767 2.75 9.663 2.45C9.98833 2.15 10.3757 2 10.825 2H13.175C13.625 2 14.0127 2.15 14.338 2.45C14.6633 2.75 14.859 3.11667 14.925 3.55L15.15 5.2C15.3667 5.28333 15.571 5.38333 15.763 5.5C15.955 5.61667 16.1423 5.74167 16.325 5.875L17.875 5.225C18.2917 5.04167 18.7083 5.025 19.125 5.175C19.5417 5.325 19.8667 5.59167 20.1 5.975L21.275 8.025C21.5083 8.40833 21.575 8.81667 21.475 9.25C21.375 9.68333 21.15 10.0417 20.8 10.325L19.475 11.325C19.4917 11.4417 19.5 11.5543 19.5 11.663V12.337C19.5 12.4457 19.4833 12.5583 19.45 12.675L20.775 13.675C21.125 13.9583 21.35 14.3167 21.45 14.75C21.55 15.1833 21.4833 15.5917 21.25 15.975L20.05 18.025C19.8167 18.4083 19.4917 18.675 19.075 18.825C18.6583 18.975 18.2417 18.9583 17.825 18.775L16.325 18.125C16.1417 18.2583 15.95 18.3833 15.75 18.5C15.55 18.6167 15.35 18.7167 15.15 18.8L14.925 20.45C14.8583 20.8833 14.6627 21.25 14.338 21.55C14.0133 21.85 13.6257 22 13.175 22H10.825ZM11 20H12.975L13.325 17.35C13.8417 17.2167 14.321 17.021 14.763 16.763C15.205 16.505 15.609 16.1923 15.975 15.825L18.45 16.85L19.425 15.15L17.275 13.525C17.3583 13.2917 17.4167 13.046 17.45 12.788C17.4833 12.53 17.5 12.2673 17.5 12C17.5 11.7327 17.4833 11.4703 17.45 11.213C17.4167 10.9557 17.3583 10.7097 17.275 10.475L19.425 8.85L18.45 7.15L15.975 8.2C15.6083 7.81667 15.2043 7.496 14.763 7.238C14.3217 6.98 13.8423 6.784 13.325 6.65L13 4H11.025L10.675 6.65C10.1583 6.78333 9.67933 6.97933 9.238 7.238C8.79667 7.49667 8.39233 7.809 8.025 8.175L5.55 7.15L4.575 8.85L6.725 10.45C6.64167 10.7 6.58333 10.95 6.55 11.2C6.51667 11.45 6.5 11.7167 6.5 12C6.5 12.2667 6.51667 12.525 6.55 12.775C6.58333 13.025 6.64167 13.275 6.725 13.525L4.575 15.15L5.55 16.85L8.025 15.8C8.39167 16.1833 8.796 16.5043 9.238 16.763C9.68 17.0217 10.159 17.2173 10.675 17.35L11 20ZM12.05 15.5C13.0167 15.5 13.8417 15.1583 14.525 14.475C15.2083 13.7917 15.55 12.9667 15.55 12C15.55 11.0333 15.2083 10.2083 14.525 9.525C13.8417 8.84167 13.0167 8.5 12.05 8.5C11.0667 8.5 10.2377 8.84167 9.563 9.525C8.88833 10.2083 8.55067 11.0333 8.55 12C8.54933 12.9667 8.887 13.7917 9.563 14.475C10.239 15.1583 11.068 15.5 12.05 15.5Z" fill="#101828"/>
              </svg>
            </span>
            <span className="text-sm">Settings</span>
          </a>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#ee174b] font-medium w-full text-left hover:bg-red-50 transition-colors"
          >
            <span className="w-5 h-5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20">
                <path d="M0 4.447C0 1.996 2.03024 0 4.52453 0H9.48564C11.9748 0 14 1.99 14 4.437V15.553C14 18.005 11.9698 20 9.47445 20H4.51537C2.02515 20 0 18.01 0 15.563V14.623V4.447Z" fill="#EE174B" opacity="0.4"/>
                <path d="M19.7789 9.4548L16.9331 6.5458C16.639 6.2458 16.1657 6.2458 15.8725 6.5478C15.5804 6.8498 15.5813 7.3368 15.8745 7.6368L17.4337 9.2298H15.9388H7.54845C7.13454 9.2298 6.79854 9.5748 6.79854 9.9998C6.79854 10.4258 7.13454 10.7698 7.54845 10.7698H17.4337L15.8745 12.3628C15.5813 12.6628 15.5804 13.1498 15.8725 13.4518C16.0196 13.6028 16.2115 13.6788 16.4043 13.6788C16.5952 13.6788 16.787 13.6028 16.9331 13.4538L19.7789 10.5458C19.9201 10.4008 20 10.2048 20 9.9998C20 9.7958 19.9201 9.5998 19.7789 9.4548" fill="#EE174B"/>
              </svg>
            </span>
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto transition-all duration-300 relative">
        {/* Click overlay to close sidebar when clicking on main content */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Top Nav */}
        <header className="bg-white flex items-center justify-between px-5 py-4 shadow-sm sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile */}
            <button 
              className="lg:hidden p-2 rounded-md hover:bg-[#f4f5fa] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-[20px] font-poppins font-medium text-[#45464e]">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="bg-[#fef5ea] rounded-lg px-3 py-1 flex items-center gap-2">
              <span className="text-[#1c1d22] text-[14px]">Admin</span>
              <svg width="20" height="20" fill="none"><path d="M6 8l4 4 4-4" stroke="#1c1d22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
          </div>
        </header>
        {/* Breadcrumbs */}
        <div className="bg-white px-5 py-1 border-t border-[#f1f3f9]">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 13 14">
              <path d="M4.42915 12.5214V10.4768C4.42914 9.95873 4.85045 9.53781 5.37229 9.53455H7.28841C7.81258 9.53455 8.23751 9.95642 8.23751 10.4768V10.4768V12.5155C8.2375 12.9649 8.60268 13.3301 9.05529 13.3333H10.3626C10.9731 13.3349 11.5592 13.0952 11.9914 12.6671C12.4237 12.2391 12.6667 11.6578 12.6667 11.0517V5.2439C12.6666 4.75426 12.448 4.28981 12.0697 3.97567L7.62865 0.449512C6.85234 -0.167252 5.74358 -0.147328 4.99026 0.496923L0.644675 3.97567C0.248494 4.28055 0.0117015 4.74638 0 5.2439V11.0458C0 12.3091 1.03159 13.3333 2.30412 13.3333H3.58153C3.79945 13.3349 4.00899 13.25 4.16365 13.0976C4.31831 12.9452 4.40528 12.7378 4.40528 12.5214H4.42915Z" fill="#02016A"/>
            </svg>
            <span className="text-[#8b8d97] text-xs">/</span>
            <span className="text-[#8b8d97] text-xs">Page</span>
          </div>
        </div>
        
        <div className="px-5 pt-7">
          {/* Top Section: 2 rows of summary cards with responsive layout */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-10 gap-3 sm:gap-4 lg:gap-5 mb-5 items-stretch">
            {/* Row 1 - Sales Card (27%) */}
            <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 h-[145px] shadow min-w-0 justify-between items-start col-span-1 sm:col-span-1 lg:col-span-3 overflow-hidden">
              <div className="flex items-center justify-between w-full">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(85,112,241,0.12)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 18 19">
                    <path d="M13.4815 10.8244C14.0438 10.8244 14.5158 11.2884 14.4298 11.8437C13.9254 15.1104 11.1289 17.5358 7.75611 17.5358C4.02453 17.5358 0.999967 14.5113 0.999967 10.7806C0.999967 7.70687 3.33506 4.84371 5.964 4.19634C6.52891 4.05687 7.10786 4.45424 7.10786 5.03581C7.10786 8.97617 7.24032 9.99546 7.98856 10.5498C8.73681 11.1042 9.61663 10.8244 13.4815 10.8244Z" stroke="#5570F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.1604 7.5431C17.2051 5.01152 14.0955 0.930815 10.306 1.00099C10.0113 1.00625 9.77532 1.25187 9.76216 1.54573C9.66655 3.62731 9.79549 6.32467 9.86742 7.54748C9.88935 7.92818 10.1885 8.22731 10.5683 8.24924C11.8253 8.32117 14.6209 8.41941 16.6727 8.10888C16.9516 8.06678 17.156 7.82467 17.1604 7.5431Z" stroke="#5570F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#bec0ca]">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#BEC0CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 lg:gap-8 w-full justify-between">
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Sales</div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-[20px] text-[#45464e]">₦0.00</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Volume</div>
                  <div className="font-medium text-[20px] text-[#45464e]">0</div>
                </div>
              </div>
            </div>
            {/* Row 1 - Customers Card (27%) */}
            <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 h-[145px] shadow min-w-0 justify-between items-start col-span-1 sm:col-span-1 lg:col-span-3 overflow-hidden">
              <div className="flex items-center justify-between w-full">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(255,204,145,0.16)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 18 17">
                    <path d="M6.70167 10.9643C9.77583 10.9643 12.4033 11.4301 12.4033 13.2909C12.4033 15.1518 9.79334 15.6309 6.70167 15.6309C3.62667 15.6309 1 15.1693 1 13.3076C1 11.4459 3.60917 10.9643 6.70167 10.9643Z" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.70167 8.30845C4.68334 8.30845 3.04667 6.67262 3.04667 4.65428C3.04667 2.63595 4.68334 1.00011 6.70167 1.00011C8.71917 1.00011 10.3558 2.63595 10.3558 4.65428C10.3633 6.66512 8.73833 8.30095 6.7275 8.30845H6.70167Z" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.4447 7.35995C13.7788 7.17245 14.8063 6.02745 14.8088 4.64161C14.8088 3.27578 13.813 2.14245 12.5072 1.92828" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.2049 10.5688C15.4974 10.7613 16.3999 11.2146 16.3999 12.1479C16.3999 12.7904 15.9749 13.2071 15.2883 13.4679" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#bec0ca]">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#BEC0CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 lg:gap-8 w-full justify-between">
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Customers</div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-[20px] text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Active</div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-[20px] text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Row 1 - All Orders Card (46%) */}
            <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 h-[145px] shadow min-w-0 justify-between items-start col-span-1 sm:col-span-2 lg:col-span-4 overflow-hidden">
              <div className="flex items-center justify-between w-full">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(255,204,145,0.16)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 20 21">
                    <path d="M14.2126 20.222H5.86477C2.79841 20.222 0.446004 19.1145 1.1142 14.6568L1.89223 8.6156C2.30413 6.39134 3.72289 5.54008 4.96774 5.54008H15.1462C16.4094 5.54008 17.7458 6.45542 18.2217 8.6156L18.9998 14.6568C19.5673 18.611 17.279 20.222 14.2126 20.222Z" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.3499 5.32041C14.3499 2.93433 12.4156 1.00004 10.0295 1.00004V1.00004C8.88053 0.99517 7.77692 1.4482 6.96273 2.25895C6.14854 3.06971 5.69085 4.17139 5.69086 5.32041H5.69086" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#bec0ca]">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#BEC0CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 lg:gap-8 w-full justify-between">
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">All Orders</div>
                  <div className="font-medium text-[20px] text-[#45464e]">0</div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Pending</div>
                  <div className="font-medium text-[20px] text-[#45464e]">0</div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Completed</div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-[20px] text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Row 2 - Total Profit Card (27%) */}
            <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 h-[145px] shadow min-w-0 justify-between items-start col-span-1 sm:col-span-1 lg:col-span-3 overflow-hidden">
              <div className="flex items-center justify-between w-full">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(85,112,241,0.12)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 18 19">
                    <path d="M13.4815 10.8244C14.0438 10.8244 14.5158 11.2884 14.4298 11.8437C13.9254 15.1104 11.1289 17.5358 7.75611 17.5358C4.02453 17.5358 0.999967 14.5113 0.999967 10.7806C0.999967 7.70687 3.33506 4.84371 5.964 4.19634C6.52891 4.05687 7.10786 4.45424 7.10786 5.03581C7.10786 8.97617 7.24032 9.99546 7.98856 10.5498C8.73681 11.1042 9.61663 10.8244 13.4815 10.8244Z" stroke="#5570F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.1604 7.5431C17.2051 5.01152 14.0955 0.930815 10.306 1.00099C10.0113 1.00625 9.77532 1.25187 9.76216 1.54573C9.66655 3.62731 9.79549 6.32467 9.86742 7.54748C9.88935 7.92818 10.1885 8.22731 10.5683 8.24924C11.8253 8.32117 14.6209 8.41941 16.6727 8.10888C16.9516 8.06678 17.156 7.82467 17.1604 7.5431Z" stroke="#5570F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#bec0ca]">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#BEC0CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 lg:gap-8 w-full justify-between">
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Volume</div>
                  <div className="font-medium text-[20px] text-[#45464e]">0</div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Receivables</div>
                  <div className="font-medium text-[20px] text-[#45464e]">₦0.00</div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Active</div>
                  <div className="font-medium text-[20px] text-[#45464e]">0</div>
                </div>
              </div>
            </div>
            {/* Row 2 - Receivables Card (27%) */}
            <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 h-[145px] shadow min-w-0 justify-between items-start col-span-1 sm:col-span-1 lg:col-span-3 overflow-hidden">
              <div className="flex items-center justify-between w-full">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(255,204,145,0.16)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 18 17">
                    <path d="M6.70167 10.9643C9.77583 10.9643 12.4033 11.4301 12.4033 13.2909C12.4033 15.1518 9.79334 15.6309 6.70167 15.6309C3.62667 15.6309 1 15.1693 1 13.3076C1 11.4459 3.60917 10.9643 6.70167 10.9643Z" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.70167 8.30845C4.68334 8.30845 3.04667 6.67262 3.04667 4.65428C3.04667 2.63595 4.68334 1.00011 6.70167 1.00011C8.71917 1.00011 10.3558 2.63595 10.3558 4.65428C10.3633 6.66512 8.73833 8.30095 6.7275 8.30845H6.70167Z" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.4447 7.35995C13.7788 7.17245 14.8063 6.02745 14.8088 4.64161C14.8088 3.27578 13.813 2.14245 12.5072 1.92828" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.2049 10.5688C15.4974 10.7613 16.3999 11.2146 16.3999 12.1479C16.3999 12.7904 15.9749 13.2071 15.2883 13.4679" stroke="#1C1D22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#bec0ca]">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#BEC0CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 lg:gap-8 w-full justify-between">
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Receivables</div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-[20px] text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <div className="text-sm text-[#8b8d97]">Active</div>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-medium text-[20px] text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Row 2 - All Users Card (46%) */}
            <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 h-[145px] shadow min-w-0 justify-between items-start col-span-1 sm:col-span-2 lg:col-span-4 overflow-hidden">
              <div className="flex items-center justify-between w-full">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(255,204,145,0.16)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 20 20">
                    <path d="M9.99992 10C12.3011 10 14.1666 8.13452 14.1666 5.83333C14.1666 3.53215 12.3011 1.66667 9.99992 1.66667C7.69873 1.66667 5.83325 3.53215 5.83325 5.83333C5.83325 8.13452 7.69873 10 9.99992 10Z" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17.1582 18.3333C17.1582 15.1083 13.9499 12.5 9.99988 12.5C6.04988 12.5 2.84155 15.1083 2.84155 18.3333" stroke="#101828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#bec0ca]">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#BEC0CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <div className="flex gap-1 sm:gap-2 lg:gap-4 w-full">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-xs sm:text-sm text-[#8b8d97]">All Users</div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-medium text-lg sm:text-xl text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-xs sm:text-sm text-[#8b8d97]">Pending</div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-medium text-lg sm:text-xl text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-xs sm:text-sm text-[#8b8d97]">Approved</div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-medium text-lg sm:text-xl text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="text-xs sm:text-sm text-[#8b8d97]">Rejected</div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="font-medium text-lg sm:text-xl text-[#45464e]">0</span>
                    <span className="text-xs text-[#519c66]">+0.00%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Third Row: Marketing (square), All Products (top), Recent Activities (bottom) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full mt-5">
            {/* Marketing Card - Square shape */}
            <div className="bg-white rounded-xl p-5 flex flex-col gap-6 shadow min-w-0 h-[400px]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#45464e] text-[16px] font-inter">Marketing</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#8b8d97] text-xs">This Week</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 10 6">
                    <path d="M1 1L5 5L9 1" stroke="#8B8D97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {/* Top level: Acquisition, Purchase, Retention evenly spread */}
              <div className="flex justify-between w-full">
                <div className="flex flex-col items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#5570f1]"></span>
                  <span className="text-xs text-[#45464e] font-medium">Acquisition</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#97a5eb]"></span>
                  <span className="text-xs text-[#45464e] font-medium">Purchase</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#ffcc91]"></span>
                  <span className="text-xs text-[#45464e] font-medium">Retention</span>
                </div>
              </div>
              
              {/* Chart */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-[#fef5ea] flex items-center justify-center">
                  <svg width="110" height="110" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="#fff" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#5570f1" strokeWidth="4" strokeDasharray="25,75" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#97a5eb" strokeWidth="4" strokeDasharray="20,80" strokeDashoffset="25" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#ffcc91" strokeWidth="4" strokeDasharray="15,85" strokeDashoffset="45" />
                  </svg>
                </div>
              </div>
            </div>

            {/* All Products Card - Top of row */}
            <div className="bg-[#11518c] rounded-xl p-4 text-white flex flex-col gap-2.5 min-w-0 h-[400px]">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 flex items-center justify-center bg-[rgba(255,255,255,0.16)] rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 18 18">
                    <path d="M16.9742 12.235C16.9742 15.2166 15.2167 16.9742 12.235 16.9742H5.75002C2.76085 16.9742 1.00002 15.2166 1.00002 12.235V5.73498C1.00002 2.75748 2.09502 0.999983 5.07752 0.999983H6.74418C7.34252 1.00082 7.90585 1.28165 8.26418 1.76082L9.02502 2.77248C9.38502 3.25082 9.94835 3.53248 10.5467 3.53332H12.905C15.8942 3.53332 16.9975 5.05498 16.9975 8.09748L16.9742 12.235Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5.35927 11.1774H12.6384" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </div>
              <div className="flex gap-4 lg:gap-8 w-full justify-between">
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <span className="text-sm font-medium">All Products</span>
                  <span className="text-[20px] font-medium">0</span>
                  <span className="text-xs text-[#dbdeee]">+0.00%</span>
                </div>
                <div className="flex flex-col gap-2 flex-1 text-center">
                  <span className="text-sm font-medium">Active</span>
                  <span className="text-[20px] font-medium">0</span>
                  <span className="text-xs text-[#dbdeee]">+0.00%</span>
                </div>
              </div>
            </div>

            {/* Recent Activities - Bottom of row */}
            <div className="bg-white rounded-xl p-5 flex flex-col gap-10 shadow h-[400px]">
              <span className="font-medium text-[#45464e] text-[16px] font-inter">Recent Activities</span>
              <div className="flex flex-col gap-3 w-full overflow-y-auto max-h-[300px] pr-2">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1">
                    <div className="w-[140px] h-[140px] rounded-full bg-[#f4f5fa] flex items-center justify-center mb-6 relative">
                      <div className="w-[60px] h-[60px] flex items-center justify-center">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 18 20">
                          <path d="M14.0865 5C15.3503 5 16.6767 5.90969 17.1451 8.12012L17.9137 14.3145C18.4793 18.3533 16.2078 20 13.1588 20H4.86873C1.81092 20 -0.531257 18.8626 0.105058 14.3145L0.883378 8.12012C1.28109 5.84602 2.65071 5 3.93221 5H14.0865ZM6.09725 8.3291C5.60921 8.32918 5.21346 8.73693 5.21346 9.23926C5.21363 9.74144 5.60932 10.1484 6.09725 10.1484C6.58524 10.1484 6.98086 9.74149 6.98103 9.23926C6.98103 8.73688 6.58535 8.3291 6.09725 8.3291ZM11.8863 8.3291C11.3982 8.3291 11.0025 8.73688 11.0025 9.23926C11.0027 9.74149 11.3983 10.1484 11.8863 10.1484C12.3743 10.1484 12.7699 9.74146 12.7701 9.23926C12.7701 8.73691 12.3744 8.32915 11.8863 8.3291Z" fill="#130F26"/>
                          <path d="M13.9743 4.77432C13.9774 4.85189 13.9625 4.92913 13.9307 5H12.4936C12.4658 4.92794 12.451 4.85153 12.4501 4.77432C12.4501 2.85682 10.8903 1.30238 8.96615 1.30238C7.04204 1.30238 5.48224 2.85682 5.48224 4.77432C5.49542 4.84898 5.49542 4.92535 5.48224 5H4.01029C3.9971 4.92535 3.9971 4.84898 4.01029 4.77432C4.12212 2.10591 6.32539 0 9.00534 0C11.6853 0 13.8886 2.10591 14.0004 4.77432H13.9743Z" fill="#130F26" opacity="0.4"/>
                        </svg>
                      </div>
                    </div>
                    <span className="font-poppins text-[20px] text-black mb-2 font-semibold">No Activities Yet?</span>
                    <span className="text-[#8b8d97] text-[14px] text-center mb-4">Let's get your ERP system configured.</span>
                  </div>
                ) : (
                  activities.map((a) => (
                    <div key={a.id} className="bg-[#f4f5fa] rounded-lg px-4 py-3 text-[#45464e] text-sm shadow-sm">{a.text}</div>
                  ))
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button 
                  className="bg-[#02016a] text-white rounded-xl py-2 font-semibold w-full shadow"
                  onClick={(e) => e.stopPropagation()}
                >+ New Product</button>
                <button 
                  className="bg-[#02016a] text-white rounded-xl py-2 font-semibold w-full shadow"
                  onClick={(e) => e.stopPropagation()}
                >+ Add New User</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// SummaryCard component for reuse
function SummaryCard({ icon, label, value, sub, filter }: { icon: string; label: string; value: string; sub: string; filter: string }) {
  return (
            <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow min-w-0 min-h-[140px] h-40 justify-between items-start w-full">
      <div className="flex items-center justify-between w-full">
        <span className="w-7 h-7 flex items-center justify-center bg-[#eef0fa] rounded-lg">
          <img src={icon} alt="icon" className="w-5 h-5" />
        </span>
        <span className="text-[#8b8d97] text-xs">{filter}</span>
      </div>
              <span className="text-[#8b8d97] text-[14px]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[#45464e] text-[20px] font-medium">{value}</span>
        <span className="text-[#519c66] text-[12px]">{sub}</span>
      </div>
    </div>
  );
}

// BarChart component (already present, update colors to use CSS vars)
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  // Placeholder: data = [{ label, value }]
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-32 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center w-16">
          <div className="bg-[#5570f1] w-6 rounded-full transition-all duration-300" style={{ height: `${(d.value / maxValue) * 100}%` }}></div>
          <span className="text-xs text-[#8b8d97] mt-2">{d.label}</span>
        </div>
      ))}
    </div>
  );
} 