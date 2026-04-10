import { getConvexClient, api } from "@/lib/convexClient";

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
    allCustomers: {
      value: number;
      change: number;
    };
    activeCustomers: {
      value: number;
      change: number;
    };
    inactiveCustomers: {
      value: number;
      change: number;
    };
    newCustomers: {
      value: number;
      change: number;
    };
    purchasingCustomers: {
      value: number;
      change: number;
    };
    abandonedCarts: {
      value: number;
      change: number;
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
  allCustomers: {
    value: number;
    change: number;
  };
  activeCustomers: {
    value: number;
    change: number;
  };
  inactiveCustomers: {
    value: number;
    change: number;
  };
  newCustomers: {
    value: number;
    change: number;
  };
  purchasingCustomers: {
    value: number;
    change: number;
  };
  abandonedCarts: {
    value: number;
    change: number;
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
  type: 'sale' | 'order' | 'customer' | 'product' | 'user' | 'inventory' | 'payment' | 'security' | 'expense' | 'other';
  action: string;
  description: string;
  message?: string | null;
  timestamp: string;
  createdAt: string;
  date: string;
  entityId?: string | null;
  user?: string | null;
  amount?: number | null;
  status?: string;
}

export interface DashboardActivities {
  activities: DashboardActivity[];
  recentActivities?: DashboardActivity[]; // For compatibility with new API format
  message?: string | null;
  description?: string | null;
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

export type TimeFrame = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'last7days' | 'allTime';

// Dashboard API functions (Convex)
export async function getDashboardOverview(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardOverview> {
  const data = await getConvexClient().query(api.dashboard.overview, { timeframe });
  return data as unknown as DashboardOverview;
}

export async function getDashboardSales(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardSales> {
  const raw = await getConvexClient().query(api.dashboard.salesSlice, { timeframe });
  return {
    sales: {
      value: (raw as { sales: { value: number; change?: number; count?: number } }).sales.value,
      change: (raw as { sales: { change?: number } }).sales.change ?? 0,
      volume: (raw as { sales: { count?: number } }).sales.count ?? 0,
    },
  };
}

export async function getDashboardCustomers(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardCustomers> {
  const raw = await getConvexClient().query(api.dashboard.customersSlice, { timeframe });
  const total = (raw as { total?: number }).total ?? 0;
  return {
    allCustomers: { value: total, change: 0 },
    activeCustomers: { value: total, change: 0 },
    inactiveCustomers: { value: 0, change: 0 },
    newCustomers: { value: 0, change: 0 },
    purchasingCustomers: { value: total, change: 0 },
    abandonedCarts: { value: 0, change: 0 },
  };
}

export async function getDashboardProducts(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardProducts> {
  const raw = await getConvexClient().query(api.dashboard.productsSlice, { timeframe });
  const total = (raw as { total?: number }).total ?? 0;
  return {
    allProducts: { value: total, change: 0 },
    active: { value: total, change: 0 },
  };
}

export async function getDashboardOrders(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardOrders> {
  const raw = await getConvexClient().query(api.dashboard.ordersSlice, { timeframe });
  const total = (raw as { total?: number }).total ?? 0;
  return {
    allOrders: { value: total, change: 0 },
    pending: { value: 0 },
    completed: { value: total, change: 0 },
  };
}

export async function getDashboardMarketing(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardMarketing> {
  return getConvexClient().query(api.dashboard.marketing, { timeframe });
}

export async function getDashboardVolume(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardVolume> {
  const data = await getConvexClient().query(api.dashboard.volume, { timeframe });
  return data as unknown as DashboardVolume;
}

export async function getDashboardUsers(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardUsers> {
  const raw = await getConvexClient().query(api.dashboard.usersSlice, { timeframe });
  const total = (raw as { total?: number }).total ?? 0;
  return {
    allUsers: { value: total, change: 0 },
    pending: { value: 0, change: 0 },
    approved: { value: total, change: 0 },
    rejected: { value: 0, change: 0 },
  };
}

export async function getDashboardActivities(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardActivities> {
  const rows = await getConvexClient().query(api.dashboard.activities, { timeframe });
  return {
    activities: Array.isArray(rows) ? rows : [],
    recentActivities: Array.isArray(rows) ? rows : [],
  };
}

export async function getDashboardSummary(timeframe: TimeFrame = 'thisWeek'): Promise<DashboardSummary> {
  const data = await getConvexClient().query(api.dashboard.summary, { timeframe });
  return data as unknown as DashboardSummary;
}
