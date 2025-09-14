"use client";

interface HeaderProps {
  title: string;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Header({ title, sidebarOpen, setSidebarOpen }: HeaderProps) {
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
        <div className="bg-[#fef5ea] rounded-lg px-3 py-1 flex items-center gap-2">
          <span className="text-[#1c1d22] text-[14px]">Nanny's Shop</span>
          <svg className="w-4 h-4" fill="none"><path d="M6 8l4 4 4-4" stroke="#1c1d22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
          </svg>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
      </div>
    </header>
  );
}
