export interface InventoryItem {
  id: string;
  productName: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  inStock: number;
  discount: number;
  totalValue: number;
  status: "Published" | "Unpublished" | "Draft";
  image: string;
  additionalImages?: string[];
  shortDescription?: string;
  longDescription?: string;
  expiryDate?: string;
  returnPolicy?: string;
  dateAdded: string;
  lastOrder?: string;
  views: number;
  favorites: number;
  brand?: string;
  description?: string;
  warehouseNumber?: string;
}

export interface InventorySummary {
  allProducts: number;
  activeProducts: number;
  lowStockAlert: number;
  expired: number;
  oneStarRating: number;
}

export interface Purchase {
  id: string;
  date: string;
  price: number;
  quantity: number;
  totalAmount: number;
  status: "COMPLETED" | "PENDING" | "CANCELLED" | "RETURNED";
  orderType: string;
  customerName: string;
  customerPhone: string;
  saleReference: string;
}

export class InventoryDataService {
  private static readonly CURRENCY_SYMBOL = "₦";
  
  private static readonly STATUS_COLORS: Record<string, string> = {
    "Published": "bg-blue-100 text-blue-800",
    "Unpublished": "bg-orange-100 text-orange-800",
    "Draft": "bg-gray-100 text-gray-800",
    "Completed": "bg-green-100 text-green-800",
    "Pending": "bg-yellow-100 text-yellow-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Returned": "bg-purple-100 text-purple-800"
  };

  private static readonly TIRE_CATEGORIES = [
    "GL601", "GL602", "GL908", "DW703tx"
  ];

  private static readonly TIRE_BRANDS = [
    "Michelin", "Bridgestone", "Continental", "Goodyear", 
    "Pirelli", "Dunlop", "Firestone", "Hankook", "Maxxis", "Yokohama",
    "Cooper", "Falken", "Nexen", "Kumho", "General", "BFGoodrich"
  ];

  private static readonly TIRE_SIZES = [
    "205/55R16", "215/60R16", "225/45R17", "235/40R18", "245/35R19",
    "255/30R20", "265/35R18", "275/40R19", "285/30R20", "295/25R21",
    "175/70R14", "185/65R15", "195/60R15", "205/50R17", "215/55R17"
  ];

  private static readonly SMART_LOCK_BRANDS = [
    "August", "Schlage", "Yale", "Kwikset", "Lockly", "Ultraloq", 
    "Wyze", "Eufy", "Ring", "Samsung", "Philips", "Honeywell"
  ];

  private static readonly SMART_LOCK_MODELS = [
    "WiFi Smart Lock", "Bluetooth Deadbolt", "Keyless Entry", "Touchscreen Lock",
    "Fingerprint Lock", "Voice Control Lock", "App-Controlled Lock", "Smart Deadbolt"
  ];

  static formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${this.CURRENCY_SYMBOL}0.00`;
    }
    return `${this.CURRENCY_SYMBOL}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  static getStatusColor(status: string): string {
    return this.STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  }

  static generateInventoryItem(itemId: string): InventoryItem {
    const categories = this.TIRE_CATEGORIES;
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    let productName: string;
    let image: string;
    let unitPrice: number;
    let costPrice: number;
    let inStock: number;
    let shortDescription: string;
    let longDescription: string;
    let warehouseNumber: string;
    
    // Generate warehouse number
    warehouseNumber = `WH-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
    
    // Generate tyre products
    const tireBrands = this.TIRE_BRANDS;
    const tireSizes = this.TIRE_SIZES;
    const brand = tireBrands[Math.floor(Math.random() * tireBrands.length)];
    const size = tireSizes[Math.floor(Math.random() * tireSizes.length)];
    
    productName = `${brand} ${category} ${size}`;
    image = `/images/${brand.toLowerCase()}.png`;
    
    // Tyre-specific pricing (higher range for premium tyres)
    unitPrice = brand === "Michelin" || brand === "Bridgestone" || brand === "Continental" ? 
      Math.floor(Math.random() * 200000) + 150000 : // Premium brands: ₦150,000 - ₦350,000
      Math.floor(Math.random() * 150000) + 80000;   // Standard brands: ₦80,000 - ₦230,000
    
    costPrice = Math.floor(unitPrice * 0.65);
    inStock = Math.floor(Math.random() * 50) + 1;
    
    shortDescription = `Premium ${brand} ${category} tyre in ${size} size. High performance and durability.`;
    longDescription = `This ${brand} ${category} tyre offers excellent traction, fuel efficiency, and long-lasting performance. Designed for optimal performance with advanced rubber compound and tread pattern for superior grip in various driving conditions.`;
    
    const discount = Math.random() > 0.8 ? Math.floor(Math.random() * 15000) : 0;
    const totalValue = (unitPrice - discount) * inStock;
    
    const statuses: ("Published" | "Unpublished" | "Draft")[] = ["Published", "Unpublished", "Draft"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const dateAdded = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const lastOrder = Math.random() > 0.5 ? 
      new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined;

    return {
      id: itemId,
      productName,
      category,
      unitPrice,
      costPrice,
      inStock,
      discount,
      totalValue,
      status,
      image,
      shortDescription,
      longDescription,
      expiryDate: Math.random() > 0.9 ? 
        new Date(Date.now() + Math.random() * 1095 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined, // 3 years max
      returnPolicy: Math.random() > 0.6 ? "30-day return policy" : undefined,
      dateAdded: dateAdded.toISOString(),
      lastOrder: lastOrder?.toISOString(),
      views: Math.floor(Math.random() * 2000) + 50,
      favorites: Math.floor(Math.random() * 50) + 1,
      warehouseNumber
    };
  }

  static generateInventoryItems(count: number): InventoryItem[] {
    return Array.from({ length: count }, (_, index) => 
      this.generateInventoryItem(`item-${index + 1}`)
    );
  }

  static generateInventorySummary(items: InventoryItem[]): InventorySummary {
    const allProducts = items.length;
    const activeProducts = items.filter(item => item.status === "Published").length;
    const lowStockAlert = items.filter(item => item.inStock < 10).length;
    const expired = items.filter(item => 
      item.expiryDate && new Date(item.expiryDate) < new Date()
    ).length;
    const oneStarRating = Math.floor(Math.random() * 10);

    return {
      allProducts,
      activeProducts,
      lowStockAlert,
      expired,
      oneStarRating
    };
  }

  static generatePurchases(itemId: string, count: number = 10): Purchase[] {
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      const price = Math.floor(Math.random() * 500000) + 50000;
      const quantity = Math.floor(Math.random() * 5) + 1;
      const totalAmount = price * quantity;
      
      const statuses: ("COMPLETED" | "PENDING" | "CANCELLED" | "RETURNED")[] = 
        ["COMPLETED", "PENDING", "CANCELLED", "RETURNED"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const orderTypes = ["Home Delivery", "Pickup", "Express Delivery"];
      const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];

      // Generate customer names
      const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Lisa", "Robert", "Emily", "James", "Jessica"];
      const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const customerName = `${firstName} ${lastName}`;

      // Generate phone numbers
      const phoneNumbers = ["+2347012345678", "+2348023456789", "+2348034567890", "+2347045678901", "+2348056789012"];
      const customerPhone = phoneNumbers[Math.floor(Math.random() * phoneNumbers.length)];

      // Generate sale reference
      const saleReference = `SALE-${Math.floor(Math.random() * 100000000)}`;

      return {
        id: `purchase-${itemId}-${index + 1}`,
        date: date.toISOString(),
        price,
        quantity,
        totalAmount,
        status,
        orderType,
        customerName,
        customerPhone,
        saleReference
      };
    });
  }

  static getTireBrandImage(productName: string): string {
    // Check for tyre brands first
    const tireBrand = this.TIRE_BRANDS.find(b => 
      productName.toLowerCase().includes(b.toLowerCase())
    );
    
    if (tireBrand) {
      return `/images/${tireBrand.toLowerCase()}.png`;
    }
    
    // Check for smart lock brands
    const smartLockBrand = this.SMART_LOCK_BRANDS.find(b => 
      productName.toLowerCase().includes(b.toLowerCase())
    );
    
    if (smartLockBrand) {
      return `/images/${smartLockBrand.toLowerCase()}.png`;
    }
    
    return "/icons/illustration.png";
  }

  static getTireBrandInitials(productName: string): string {
    // Check for tyre brands first
    const tireBrand = this.TIRE_BRANDS.find(b => 
      productName.toLowerCase().includes(b.toLowerCase())
    );
    
    if (tireBrand) {
      return tireBrand.substring(0, 2).toUpperCase();
    }
    
    // Check for smart lock brands
    const smartLockBrand = this.SMART_LOCK_BRANDS.find(b => 
      productName.toLowerCase().includes(b.toLowerCase())
    );
    
    if (smartLockBrand) {
      return smartLockBrand.substring(0, 2).toUpperCase();
    }
    
    // For other products, use first two characters of product name
    return productName.substring(0, 2).toUpperCase();
  }

  static getProductImage(item: InventoryItem): string {
    return this.getTireBrandImage(item.productName);
  }

  static searchItems(items: InventoryItem[], query: string): InventoryItem[] {
    if (!query.trim()) return items;
    
    const lowercaseQuery = query.toLowerCase();
    return items.filter(item => 
      item.productName.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery) ||
      item.id.toLowerCase().includes(lowercaseQuery)
    );
  }

  static filterItemsByStatus(items: InventoryItem[], status: string): InventoryItem[] {
    if (status === "All") return items;
    return items.filter(item => item.status === status);
  }

  static filterItemsByCategory(items: InventoryItem[], category: string): InventoryItem[] {
    if (category === "All") return items;
    return items.filter(item => item.category === category);
  }

  static sortItems(items: InventoryItem[], sortBy: string, sortOrder: "asc" | "desc"): InventoryItem[] {
    return [...items].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "productName":
          aValue = a.productName.toLowerCase();
          bValue = b.productName.toLowerCase();
          break;
        case "category":
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case "unitPrice":
          aValue = a.unitPrice;
          bValue = b.unitPrice;
          break;
        case "inStock":
          aValue = a.inStock;
          bValue = b.inStock;
          break;
        case "totalValue":
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case "dateAdded":
          aValue = new Date(a.dateAdded).getTime();
          bValue = new Date(b.dateAdded).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }
}
