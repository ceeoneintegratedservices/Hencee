// OrderDataService.ts - Reusable service for handling order data and calculations
export interface OrderItem {
  id: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  orderTotal: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Completed" | "In-Progress" | "Returned" | "Damaged" | "Defective" | "Canceled";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  customerSince: string;
  status: "Active" | "Pending" | "Inactive";
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  trackingId: string;
  customer: Customer;
  homeAddress: string;
  billingAddress: string;
  paymentMethod: string;
  orderType: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Completed" | "In-Progress" | "Returned" | "Damaged" | "Defective" | "Canceled";
  statusColor?: string;
}

export class OrderDataService {
  private static readonly CURRENCY_SYMBOL = "₦";
  private static readonly BASE_ORDER_TOTAL = 25000;
  private static readonly ORDER_INCREMENT = 1000;
  private static readonly STATUSES = ["Completed", "In-Progress", "Pending"];
  private static readonly STATUS_COLORS: Record<string, string> = {
    "Completed": "bg-green-100 text-green-800",
    "In-Progress": "bg-blue-100 text-blue-800", 
    "Pending": "bg-orange-100 text-orange-800",
    "Processing": "bg-blue-100 text-blue-800",
    "Shipped": "bg-purple-100 text-purple-800",
    "Delivered": "bg-green-100 text-green-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Canceled": "bg-red-100 text-red-800",
    "Returned": "bg-yellow-100 text-yellow-800",
    "Damaged": "bg-red-100 text-red-800",
    "Defective": "bg-red-100 text-red-800"
  };

  // Tyre products for realistic order data
  private static readonly TYRE_PRODUCTS = [
    "Michelin Pilot Sport 4",
    "Bridgestone Potenza RE-71R", 
    "Continental ContiSportContact 5",
    "Goodyear Eagle F1 Asymmetric 5",
    "Dunlop SP Sport Maxx 050",
    "Pirelli P Zero PZ4",
    "Hankook Ventus V12 evo2",
    "Maxxis Victra MA-Z1",
    "Firestone Firehawk Indy 500",
    "Yokohama Advan Sport V105"
  ];

  private static readonly CUSTOMERS = [
    "Janet Adebayo",
    "Michael Johnson", 
    "Sarah Williams",
    "David Brown",
    "Lisa Davis",
    "Robert Wilson",
    "Jennifer Garcia",
    "Christopher Martinez",
    "Amanda Anderson",
    "Matthew Taylor"
  ];

  private static readonly PAYMENT_METHODS = ["Master Card", "Visa Card", "PayPal", "Bank Transfer"];
  private static readonly ORDER_TYPES = ["Home Delivery", "Pick Up"];

  /**
   * Generate order data based on order index
   */
  static generateOrder(orderId: string): Order {
    const orderIndex = parseInt(orderId.replace('order-', '')) - 1;
    const orderStatus = this.STATUSES[orderIndex % this.STATUSES.length];
    const orderTotal = this.BASE_ORDER_TOTAL + orderIndex * this.ORDER_INCREMENT;
    
    // Check for persisted status changes
    let finalStatus = orderStatus;
    if (typeof window !== 'undefined') {
      const statusChanges = JSON.parse(localStorage.getItem('orderStatusChanges') || '{}');
      if (statusChanges[orderId]) {
        finalStatus = statusChanges[orderId];
      }
    }
    
    // Generate items based on order complexity
    const itemCount = this.getItemCount(orderIndex);
    const items = this.generateOrderItems(orderTotal, itemCount, finalStatus, orderId);
    
    return {
      id: orderId,
      orderNumber: `#${743648 + orderIndex}`,
      orderDate: this.generateOrderDate(orderIndex),
      trackingId: `9348fjr${(73 + orderIndex).toString().padStart(2, '0')}`,
      customer: this.generateCustomer(orderIndex),
      homeAddress: "No. 15 Adekunle Street, Yaba, Lagos State",
      billingAddress: "No. 15 Adekunle Street, Yaba, Lagos State", 
      paymentMethod: this.PAYMENT_METHODS[orderIndex % this.PAYMENT_METHODS.length],
      orderType: this.ORDER_TYPES[orderIndex % this.ORDER_TYPES.length],
      items,
      totalAmount: orderTotal,
      status: finalStatus as any,
      statusColor: this.STATUS_COLORS[finalStatus]
    };
  }

  /**
   * Generate multiple orders for orders page
   */
  static generateOrders(count: number = 200): Order[] {
    return Array.from({ length: count }, (_, index) => {
      const orderId = `order-${index + 1}`;
      return this.generateOrder(orderId);
    });
  }

  /**
   * Generate previous orders for a customer
   */
  static generatePreviousOrders(customerId: string, currentOrderId: string): Order[] {
    const currentIndex = parseInt(currentOrderId.replace('order-', '')) - 1;
    const previousOrders: Order[] = [];
    
    // Generate 2-3 previous orders
    for (let i = 1; i <= 3; i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0) {
        const orderId = `order-${prevIndex + 1}`;
        previousOrders.push(this.generateOrder(orderId));
      }
    }
    
    return previousOrders;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number): string {
    return `${this.CURRENCY_SYMBOL}${amount.toLocaleString()}.00`;
  }

  /**
   * Get order summary data for dashboard/orders page
   */
  static getOrderSummary(orders: Order[]) {
    return {
      allOrders: orders.length,
      pendingOrders: orders.filter(order => order.status === 'Pending').length,
      completedOrders: orders.filter(order => order.status === 'Completed').length,
      inProgressOrders: orders.filter(order => order.status === 'In-Progress').length,
      canceledOrders: orders.filter(order => order.status === 'Cancelled').length,
      returnedOrders: orders.filter(order => order.status === 'Returned').length,
      damagedOrders: orders.filter(order => order.status === 'Damaged').length
    };
  }

  /**
   * Get time period data (weekly vs monthly)
   */
  static getTimePeriodData(orders: Order[], period: "This Week" | "This Month") {
    const summary = this.getOrderSummary(orders);
    
    if (period === "This Month") {
      return {
        allOrders: Math.floor(summary.allOrders * 4.3),
        pendingOrders: Math.floor(summary.pendingOrders * 4.3),
        completedOrders: Math.floor(summary.completedOrders * 4.3),
        inProgressOrders: Math.floor(summary.inProgressOrders * 4.3),
        canceledOrders: Math.floor(summary.canceledOrders * 4.3),
        returnedOrders: Math.floor(summary.returnedOrders * 4.3),
        damagedOrders: Math.floor(summary.damagedOrders * 4.3)
      };
    }
    
    return summary;
  }

  /**
   * Private helper methods
   */
  private static getItemCount(orderIndex: number): number {
    // Vary item count based on order index for realism
    const patterns = [3, 2, 1, 4, 2, 1, 3, 2, 1, 2];
    return patterns[orderIndex % patterns.length];
  }

  private static generateOrderItems(totalAmount: number, itemCount: number, status: string, orderId: string): OrderItem[] {
    const items: OrderItem[] = [];
    let remainingAmount = totalAmount;
    
    // Check for individual item status changes
    let itemStatusChanges: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      itemStatusChanges = JSON.parse(localStorage.getItem('itemStatusChanges') || '{}');
    }
    
    for (let i = 0; i < itemCount; i++) {
      const isLastItem = i === itemCount - 1;
      const productName = this.TYRE_PRODUCTS[i % this.TYRE_PRODUCTS.length];
      
      let itemTotal: number;
      if (isLastItem) {
        // Last item gets remaining amount
        itemTotal = remainingAmount;
      } else {
        // Distribute amount proportionally
        const percentage = this.getItemPercentage(i, itemCount);
        itemTotal = Math.floor(totalAmount * percentage);
        remainingAmount -= itemTotal;
      }
      
      const quantity = Math.max(1, Math.floor(Math.random() * 3) + 1);
      const unitPrice = Math.floor(itemTotal / quantity);
      const discount = Math.random() > 0.7 ? Math.floor(unitPrice * 0.1) : 0;
      
      // Check if this specific item has a status change
      const itemKey = `${orderId}-item-${i}`;
      const itemStatus = itemStatusChanges[itemKey] || status;
      
      items.push({
        id: `${i + 1}`,
        productName,
        productImage: `/images/${productName.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        unitPrice: unitPrice - discount,
        quantity,
        discount,
        orderTotal: itemTotal,
        status: itemStatus as any
      });
    }
    
    return items;
  }

  private static getItemPercentage(itemIndex: number, totalItems: number): number {
    // Distribute percentages: first item gets more, others get less
    const percentages = [0.4, 0.3, 0.2, 0.1];
    return percentages[itemIndex] || 0.1;
  }

  private static generateCustomer(orderIndex: number): Customer {
    const customerName = this.CUSTOMERS[orderIndex % this.CUSTOMERS.length];
    const customerSince = this.generateCustomerSinceDate(orderIndex);
    
    return {
      id: `customer-${orderIndex + 1}`,
      name: customerName,
      email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      phone: `+234${8000000000 + orderIndex}`,
      customerSince,
      status: "Pending"
    };
  }

  private static generateOrderDate(orderIndex: number): string {
    const daysAgo = orderIndex * 2;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 60);
    const ampm = Math.random() > 0.5 ? "am" : "pm";
    
    return `${day} ${month} ${year} - ${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  }

  private static generateCustomerSinceDate(orderIndex: number): string {
    const daysAgo = (orderIndex + 1) * 10;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }
}
