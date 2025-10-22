// ExpensesDataService.ts - Service for handling company expenses and purchases
export interface ExpenseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  requestDate: string;
  requestedBy: string;
  requestedByEmail: string;
  department: string;
  status: "Pending" | "Approved" | "Rejected" | "Paid";
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  /** Timestamp of last decision (approve/reject) used to gate 1-hour toggle window */
  decisionDate?: string;
  vendor?: string;
  invoiceNumber?: string;
  receiptImage?: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  tags: string[];
}

export interface ExpenseSummary {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  paidExpenses: number;
  totalAmount: number;
  monthlyAmount: number;
  departmentBreakdown: Record<string, number>;
}

export class ExpensesDataService {
  private static readonly CURRENCY_SYMBOL = "₦";
  
  private static readonly STATUS_COLORS: Record<string, string> = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800",
    "Paid": "bg-blue-100 text-blue-800"
  };

  private static readonly PRIORITY_COLORS: Record<string, string> = {
    "Low": "bg-gray-100 text-gray-800",
    "Medium": "bg-blue-100 text-blue-800",
    "High": "bg-orange-100 text-orange-800",
    "Urgent": "bg-red-100 text-red-800"
  };

  private static readonly EXPENSE_CATEGORIES = [
    "Office Supplies",
    "Equipment & Hardware",
    "Software & Licenses",
    "Marketing & Advertising",
    "Travel & Transportation",
    "Meals & Entertainment",
    "Utilities & Bills",
    "Professional Services",
    "Training & Development",
    "Maintenance & Repairs",
    "Insurance",
    "Legal & Compliance",
    "Other"
  ];

  private static readonly DEPARTMENTS = [
    "Administration",
    "Sales & Marketing",
    "IT & Technology",
    "Human Resources",
    "Finance & Accounting",
    "Operations",
    "Customer Service",
    "Research & Development"
  ];

  // Public accessors for UI usage
  static getExpenseCategories(): string[] {
    return this.EXPENSE_CATEGORIES;
  }

  static getDepartmentsList(): string[] {
    return this.DEPARTMENTS;
  }

  private static readonly REQUESTERS = [
    { name: "John Smith", email: "john.smith@company.com", department: "Sales & Marketing" },
    { name: "Sarah Johnson", email: "sarah.johnson@company.com", department: "IT & Technology" },
    { name: "Mike Davis", email: "mike.davis@company.com", department: "Finance & Accounting" },
    { name: "Lisa Wilson", email: "lisa.wilson@company.com", department: "Human Resources" },
    { name: "David Brown", email: "david.brown@company.com", department: "Operations" },
    { name: "Emma Taylor", email: "emma.taylor@company.com", department: "Customer Service" },
    { name: "James Anderson", email: "james.anderson@company.com", department: "Research & Development" },
    { name: "Maria Garcia", email: "maria.garcia@company.com", department: "Administration" }
  ];

  private static readonly VENDORS = [
    "Office Depot",
    "Amazon Business",
    "Dell Technologies",
    "Microsoft",
    "Google Cloud",
    "Adobe",
    "Salesforce",
    "HubSpot",
    "Zoom",
    "Slack",
    "Local Supplier A",
    "Local Supplier B"
  ];

  static formatCurrency(amount: number): string {
    return `${this.CURRENCY_SYMBOL}${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  static getStatusColor(status: string): string {
    return this.STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  }

  static getPriorityColor(priority: string): string {
    return this.PRIORITY_COLORS[priority] || "bg-gray-100 text-gray-800";
  }

  static generateExpenseItem(itemId: string): ExpenseItem {
    const categories = this.EXPENSE_CATEGORIES;
    const departments = this.DEPARTMENTS;
    const requesters = this.REQUESTERS;
    const vendors = this.VENDORS;
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const requester = requesters[Math.floor(Math.random() * requesters.length)];
    const vendor = Math.random() > 0.3 ? vendors[Math.floor(Math.random() * vendors.length)] : undefined;
    
    // All newly created requests should start as Pending
    const status: "Pending" | "Approved" | "Rejected" = "Pending";
    
    const priorities: ("Low" | "Medium" | "High" | "Urgent")[] = 
      ["Low", "Medium", "High", "Urgent"];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    const amount = Math.floor(Math.random() * 500000) + 5000; // ₦5,000 - ₦505,000
    
    const requestDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    const approvers = ["Admin User", "Finance Manager", "Department Head"];
    const approvedBy = undefined; // New expenses are pending, no approver yet
    
    const rejectionReasons = [
      "Budget constraints",
      "Insufficient justification",
      "Duplicate request",
      "Policy violation",
      "Missing documentation"
    ];
    const rejectionReason = undefined; // New expenses are pending, no rejection reason yet
    
    const titles = [
      `${category} Purchase`,
      `Office ${category.toLowerCase()}`,
      `${category} Equipment`,
      `Monthly ${category.toLowerCase()}`,
      `Emergency ${category.toLowerCase()}`,
      `Quarterly ${category.toLowerCase()}`
    ];
    
    const descriptions = [
      `Purchase of ${category.toLowerCase()} for ${requester.department}`,
      `Required ${category.toLowerCase()} for ongoing projects`,
      `Replacement ${category.toLowerCase()} for office use`,
      `Additional ${category.toLowerCase()} for team expansion`,
      `Upgrade ${category.toLowerCase()} for better efficiency`
    ];
    
    const tags = [
      category.toLowerCase().replace(/\s+/g, '-'),
      requester.department.toLowerCase().replace(/\s+/g, '-'),
      priority.toLowerCase(),
      status.toLowerCase()
    ];
    
    return {
      id: itemId,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      category,
      amount,
      currency: "NGN",
      requestDate: requestDate.toISOString(),
      requestedBy: requester.name,
      requestedByEmail: requester.email,
      department: requester.department,
      status,
      approvedBy,
      rejectionReason,
      vendor,
      invoiceNumber: vendor ? `INV-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}` : undefined,
      priority,
      tags
    };
  }

  static generateExpenseItems(count: number): ExpenseItem[] {
    return Array.from({ length: count }, (_, index) => 
      this.generateExpenseItem(`expense-${index + 1}`)
    );
  }

  static generateExpenseSummary(items: ExpenseItem[]): ExpenseSummary {
    const totalExpenses = items.length;
    const pendingExpenses = items.filter(item => item.status === "Pending").length;
    const approvedExpenses = items.filter(item => item.status === "Approved").length;
    const rejectedExpenses = items.filter(item => item.status === "Rejected").length;
    const paidExpenses = items.filter(item => item.status === "Paid").length;
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyAmount = items
      .filter(item => {
        const itemDate = new Date(item.requestDate);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      })
      .reduce((sum, item) => sum + item.amount, 0);
    
    const departmentBreakdown = items.reduce((acc, item) => {
      acc[item.department] = (acc[item.department] || 0) + item.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      paidExpenses,
      totalAmount,
      monthlyAmount,
      departmentBreakdown
    };
  }

  static searchExpenses(items: ExpenseItem[], query: string): ExpenseItem[] {
    if (!query.trim()) return items;
    
    const lowercaseQuery = query.toLowerCase();
    return items.filter(item => 
      item.title.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery) ||
      item.category.toLowerCase().includes(lowercaseQuery) ||
      item.requestedBy.toLowerCase().includes(lowercaseQuery) ||
      item.department.toLowerCase().includes(lowercaseQuery) ||
      item.vendor?.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  static filterExpensesByStatus(items: ExpenseItem[], status: string): ExpenseItem[] {
    if (status === "All") return items;
    return items.filter(item => item.status === status);
  }

  static filterExpensesByCategory(items: ExpenseItem[], category: string): ExpenseItem[] {
    if (category === "All") return items;
    return items.filter(item => item.category === category);
  }

  static filterExpensesByDepartment(items: ExpenseItem[], department: string): ExpenseItem[] {
    if (department === "All") return items;
    return items.filter(item => item.department === department);
  }

  static filterExpensesByPriority(items: ExpenseItem[], priority: string): ExpenseItem[] {
    if (priority === "All") return items;
    return items.filter(item => item.priority === priority);
  }

  static sortExpenses(items: ExpenseItem[], sortBy: string, sortOrder: "asc" | "desc"): ExpenseItem[] {
    return [...items].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "requestDate":
          aValue = new Date(a.requestDate).getTime();
          bValue = new Date(b.requestDate).getTime();
          break;
        case "requestedBy":
          aValue = a.requestedBy.toLowerCase();
          bValue = b.requestedBy.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "priority":
          const priorityOrder = { "Urgent": 4, "High": 3, "Medium": 2, "Low": 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
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

  static approveExpense(expenseId: string, approvedBy: string): ExpenseItem | null {
    // This would typically update a database
    // For now, we'll return a mock updated expense
    const expense = this.generateExpenseItem(expenseId);
    return {
      ...expense,
      status: "Approved",
      approvedBy,
      approvedDate: new Date().toISOString(),
      decisionDate: new Date().toISOString()
    };
  }

  static rejectExpense(expenseId: string, rejectionReason: string): ExpenseItem | null {
    // This would typically update a database
    // For now, we'll return a mock updated expense
    const expense = this.generateExpenseItem(expenseId);
    return {
      ...expense,
      status: "Rejected",
      rejectionReason,
      decisionDate: new Date().toISOString()
    };
  }
  
  static canToggleDecision(expense: ExpenseItem): boolean {
    if (!expense.decisionDate) return false;
    const oneHourMs = 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(expense.decisionDate).getTime();
    return elapsed <= oneHourMs;
  }
}
