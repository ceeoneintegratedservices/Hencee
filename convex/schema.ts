import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profiles: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    roleType: v.optional(v.string()),
    roleName: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    approvalStatus: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
    ),
    /** Canonical role row from `roles` when assigned from catalog */
    roleId: v.optional(v.id("roles")),
    /** True until user submits a role request on /pick-role */
    mustSelectRole: v.optional(v.boolean()),
    /** Set while a role request is awaiting admin approval */
    pendingRoleRequestId: v.optional(v.id("roleRequests")),
    customerId: v.optional(v.id("customers")),
    isActive: v.optional(v.boolean()),
    isEmailVerified: v.optional(v.boolean()),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  roleRequests: defineTable({
    profileId: v.id("profiles"),
    requestedRoleId: v.id("roles"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedByProfileId: v.optional(v.id("profiles")),
    note: v.optional(v.string()),
  })
    .index("by_profile_status", ["profileId", "status"])
    .index("by_status", ["status"]),

  roles: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    roleType: v.string(),
    permissions: v.array(v.string()),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_roleType", ["roleType"]),

  customers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    homeAddress: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    status: v.optional(v.string()),
    creditLimit: v.optional(v.number()),
    outstandingBalance: v.optional(v.number()),
    customerSince: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_name", ["name"]),

  warehouses: defineTable({
    name: v.string(),
    code: v.optional(v.string()),
    address: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  inventoryItems: defineTable({
    name: v.string(),
    sku: v.string(),
    barcode: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    categoryName: v.optional(v.string()),
    warehouseId: v.optional(v.id("warehouses")),
    expiryWarehouseId: v.optional(v.id("warehouses")),
    purchasePrice: v.optional(v.number()),
    sellingPrice: v.optional(v.number()),
    pricePerPiece: v.optional(v.number()),
    pricePerCarton: v.optional(v.number()),
    pricePerRoll: v.optional(v.number()),
    pricePerDozen: v.optional(v.number()),
    piecesPerCarton: v.optional(v.number()),
    piecesPerRoll: v.optional(v.number()),
    piecesPerDozen: v.optional(v.number()),
    inventoryUnits: v.optional(v.any()),
    productSize: v.optional(v.string()),
    productSizeUnit: v.optional(v.string()),
    packSize: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    reorderPoint: v.optional(v.number()),
    expiryAlertThreshold: v.optional(v.number()),
    isOutsourced: v.optional(v.boolean()),
    outsourcedDetails: v.optional(v.any()),
    status: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sku", ["sku"])
    .index("by_category", ["categoryId"])
    .index("by_warehouse", ["warehouseId"]),

  inventoryDamages: defineTable({
    productId: v.id("inventoryItems"),
    quantity: v.number(),
    reason: v.string(),
    warehouseId: v.optional(v.id("warehouses")),
    action: v.string(),
    inspectorNotes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_product", ["productId"]),

  sales: defineTable({
    customerId: v.id("customers"),
    orderNumber: v.string(),
    orderDate: v.string(),
    trackingId: v.optional(v.string()),
    status: v.string(),
    orderType: v.optional(v.string()),
    /** Pharma / Ceeone: standard stock sale vs outsourced supplier sale */
    saleVariant: v.optional(
      v.union(v.literal("standard"), v.literal("outsourced"))
    ),
    outsourcedSupplierName: v.optional(v.string()),
    outsourcedCost: v.optional(v.number()),
    outsourcedSellingPrice: v.optional(v.number()),
    outsourcedNotes: v.optional(v.string()),
    outsourcedImageUrl: v.optional(v.string()),
    homeAddress: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    payment: v.optional(v.string()),
    paymentAmount: v.optional(v.number()),
    items: v.any(),
    totalAmount: v.number(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_status", ["status"])
    .index("by_saleVariant", ["saleVariant"]),

  /** Internal operational requests (pharma workflow: payment / inventory / expense / order / other). */
  internalRequests: defineTable({
    type: v.string(),
    status: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    requesterProfileId: v.id("profiles"),
    assigneeProfileId: v.optional(v.id("profiles")),
    payload: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_requester", ["requesterProfileId"])
    .index("by_type", ["type"]),

  internalRequestComments: defineTable({
    requestId: v.id("internalRequests"),
    authorProfileId: v.id("profiles"),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_request", ["requestId"]),

  payments: defineTable({
    saleId: v.optional(v.id("sales")),
    customerId: v.optional(v.id("customers")),
    amount: v.number(),
    method: v.optional(v.string()),
    status: v.string(),
    reference: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sale", ["saleId"])
    .index("by_reference", ["reference"])
    .index("by_status", ["status"]),

  expenses: defineTable({
    title: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.optional(v.string()),
    expenseDate: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.optional(v.string()),
    title: v.string(),
    body: v.optional(v.string()),
    type: v.optional(v.string()),
    read: v.boolean(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  auditLogs: defineTable({
    userId: v.optional(v.string()),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  approvals: defineTable({
    type: v.string(),
    status: v.string(),
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    payload: v.optional(v.any()),
    requestedBy: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  refundRequests: defineTable({
    saleId: v.optional(v.id("sales")),
    customerId: v.optional(v.id("customers")),
    status: v.string(),
    amount: v.optional(v.number()),
    reason: v.optional(v.string()),
    payload: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"]),

  supportTickets: defineTable({
    customerId: v.optional(v.id("customers")),
    clerkUserId: v.optional(v.string()),
    subject: v.string(),
    body: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  tires: defineTable({
    name: v.string(),
    sku: v.optional(v.string()),
    brand: v.optional(v.string()),
    metadata: v.optional(v.any()),
    status: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  sessions: defineTable({
    userId: v.string(),
    token: v.string(),
    userAgent: v.optional(v.string()),
    lastActiveAt: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  appSettings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
