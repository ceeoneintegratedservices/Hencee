import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

// Dashboard interfaces
export interface DashboardOverview {
  sales: {
    sales: {
      value: number;
      change: number;
      volume: number;
    };
  };
  customers: {
    customers: {
      value: number;
      change: number;
      active: number;
    };
  };
  products: {
    allProducts: {
      value: number;
      change: number;
    };
    active: {
      value: number;
      change: number;
    };
  };
  orders: {
    allOrders: {
      value: number;
      change: number;
    };
    pending: {
      value: number;
    };
    completed: {
      value: number;
      change: number;
    };
  };
  marketing: {
    acquisition: number;
    purchase: number;
    retention: number;
  };
  volume: {
    volume: {
      value: number;
    };
    receivables: {
      value: number;
    };
    active: {
      value: number;
    };
  };
  users: {
    allUsers: {
      value: number;
      change: number;
    };
    pending: {
      value: number;
      change: number;
    };
    approved: {
      value: number;
      change: number;
    };
    rejected: {
      value: number;
      change: number;
    };
  };
}

export interface DashboardSales {
  sales: {
    value: number;
    change: number;
    volume: number;
  };
}

export interface DashboardCustomers {
  customers: {
    value: number;
    change: number;
    active: number;
  };
}

export interface DashboardProducts {
  allProducts: {
    value: number;
    change: number;
  };
  active: {
    value: number;
    change: number;
  };
}

export interface DashboardOrders {
  allOrders: {
    value: number;
    change: number;
  };
  pending: {
    value: number;
  };
  completed: {
    value: number;
    change: number;
  };
}

export interface DashboardMarketing {
  acquisition: number;
  purchase: number;
  retention: number;
}

export interface DashboardVolume {
  volume: {
    value: number;
  };
  receivables: {
    value: number;
  };
  active: {
    value: number;
  };
}

export interface DashboardUsers {
  allUsers: {
    value: number;
    change: number;
  };
  pending: {
    value: number;
    change: number;
  };
  approved: {
    value: number;
    change: number;
  };
  rejected: {
    value: number;
    change: number;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'sale' | 'order' | 'customer' | 'product' | 'user' | 'inventory';
  description: string;
  timestamp: string;
  amount?: number;
  status?: string;
  user?: string;
}

export interface DashboardActivities {
  activities: DashboardActivity[];
}

export interface DashboardSummary {
  salesData: Array<{
    date: string;
    sales: number;
    orders: number;
    customers: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export type TimeFrame = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'last7days';

// Dashboard API functions
export async function getDashboardOverview(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardOverview> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/overview?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard overview: ${error}`);
  }
}

export async function getDashboardSales(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardSales> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/sales?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard sales: ${error}`);
  }
}

export async function getDashboardCustomers(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardCustomers> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/customers?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard customers: ${error}`);
  }
}

export async function getDashboardProducts(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardProducts> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/products?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard products: ${error}`);
  }
}

export async function getDashboardOrders(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardOrders> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/orders?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard orders: ${error}`);
  }
}

export async function getDashboardMarketing(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardMarketing> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/marketing?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard marketing: ${error}`);
  }
}

export async function getDashboardVolume(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardVolume> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/volume?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard volume: ${error}`);
  }
}

export async function getDashboardUsers(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardUsers> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/users?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard users: ${error}`);
  }
}

export async function getDashboardActivities(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardActivities> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/activities?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard activities: ${error}`);
  }
}

export async function getDashboardSummary(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardSummary> {
  try {
    const response = await authFetch(`${API_ENDPOINTS.dashboard}/summary?timeframe=${timeframe}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch dashboard summary: ${error}`);
  }
}
