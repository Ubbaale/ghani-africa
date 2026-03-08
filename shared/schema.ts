import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// ============ CATEGORIES ============
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  parentId: integer("parent_id"),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  products: many(products),
}));

// ============ USER PROFILES (extends auth users) ============
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey(), // matches auth user id
  role: text("role").notNull().default("consumer"), // consumer, trader, manufacturer, admin
  manufacturerType: text("manufacturer_type"), // type of manufacturing business
  lineOfBusiness: text("line_of_business"), // primary industry/sector
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  phone: text("phone"),
  country: text("country").notNull().default("Kenya"),
  city: text("city"),
  address: text("address"),
  verificationLevel: text("verification_level").default("basic"), // basic, verified, trusted
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  ratingsCount: integer("ratings_count").default(0),
  totalSales: integer("total_sales").default(0),
  isDisabled: boolean("is_disabled").default(false), // admin can disable accounts
  preferredCurrency: text("preferred_currency").default("USD"), // user's preferred display currency
  geoFilterEnabled: boolean("geo_filter_enabled").default(false), // filter products by user's location
  storeSlug: text("store_slug").unique(), // unique URL slug for public store page
  storeHeroImage: text("store_hero_image"), // hero image for public store
  socialShareEnabled: boolean("social_share_enabled").default(true), // enable social sharing
  whatsappNumber: text("whatsapp_number"),
  factorySize: text("factory_size"),
  productionCapacity: text("production_capacity"),
  yearEstablished: integer("year_established"),
  totalEmployees: integer("total_employees"),
  factoryAddress: text("factory_address"),
  factoryImages: text("factory_images").array(),
  certifications: text("certifications").array(),
  mainProducts: text("main_products").array(),
  exportMarkets: text("export_markets").array(),
  qualityControl: text("quality_control"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  products: many(products),
  orders: many(orders),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  businessDocuments: many(businessDocuments),
}));

// ============ BUSINESS DOCUMENTS (Certificates, Registration, Awards) ============
export const businessDocuments = pgTable("business_documents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // registration, certificate, standard, tax, award, license
  name: text("name").notNull(), // document name/title
  description: text("description"), // optional description
  documentUrl: text("document_url").notNull(), // URL to uploaded document
  issuingAuthority: text("issuing_authority"), // who issued the document
  issuingCountry: text("issuing_country"), // country that issued it
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  documentNumber: text("document_number"), // registration/certificate number
  isVerified: boolean("is_verified").default(false), // admin verified
  isPublic: boolean("is_public").default(true), // visible to customers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_business_docs_user").on(table.userId),
  index("idx_business_docs_type").on(table.type),
]);

export const businessDocumentsRelations = relations(businessDocuments, ({ one }) => ({
  user: one(userProfiles, {
    fields: [businessDocuments.userId],
    references: [userProfiles.id],
  }),
}));

// ============ PRODUCTS ============
export const products = pgTable("products", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: varchar("seller_id").notNull(),
  categoryId: integer("category_id"),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  moq: integer("moq").default(1), // minimum order quantity
  stock: integer("stock").default(0),
  images: text("images").array(),
  country: text("country").notNull(),
  city: text("city"),
  shippingOptions: jsonb("shipping_options"),
  wholesalePricing: jsonb("wholesale_pricing"), // tiered pricing
  sampleAvailable: boolean("sample_available").default(false),
  samplePrice: decimal("sample_price", { precision: 12, scale: 2 }),
  sampleMaxQty: integer("sample_max_qty").default(5),
  afcftaEligible: boolean("afcfta_eligible").default(false),
  condition: text("condition").default("new"),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_products_seller").on(table.sellerId),
  index("idx_products_category").on(table.categoryId),
  index("idx_products_country").on(table.country),
  index("idx_products_price").on(table.price),
]);

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(userProfiles, {
    fields: [products.sellerId],
    references: [userProfiles.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

// ============ ORDERS ============
export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  buyerId: varchar("buyer_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  status: text("status").default("pending"), // pending, paid, shipped, delivered, cancelled
  orderType: text("order_type").default("standard"), // standard, sample
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  shippingAddress: jsonb("shipping_address"),
  paymentMethod: text("payment_method"),
  paymentStatus: text("payment_status").default("pending"), // pending, held, released
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_orders_buyer").on(table.buyerId),
  index("idx_orders_seller").on(table.sellerId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_created").on(table.createdAt),
]);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(userProfiles, {
    fields: [orders.buyerId],
    references: [userProfiles.id],
  }),
  seller: one(userProfiles, {
    fields: [orders.sellerId],
    references: [userProfiles.id],
  }),
  items: many(orderItems),
}));

// ============ ORDER ITEMS ============
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ============ MESSAGES ============
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  orderId: integer("order_id"), // optional link to order
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_messages_sender").on(table.senderId),
  index("idx_messages_receiver").on(table.receiverId),
]);

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(userProfiles, {
    fields: [messages.senderId],
    references: [userProfiles.id],
    relationName: "sender",
  }),
  receiver: one(userProfiles, {
    fields: [messages.receiverId],
    references: [userProfiles.id],
    relationName: "receiver",
  }),
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
}));

// ============ CART ============
export const cartItems = pgTable("cart_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_cart_user").on(table.userId),
]);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

// ============ WALLETS ============
export const wallets = pgTable("wallets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("active").notNull(), // active, frozen, closed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [wallets.userId],
    references: [userProfiles.id],
  }),
  transactions: many(walletTransactions),
}));

// ============ WALLET TRANSACTIONS ============
export const walletTransactions = pgTable("wallet_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  walletId: integer("wallet_id").notNull(),
  type: text("type").notNull(), // credit, debit, withdrawal, deposit
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  referenceId: text("reference_id"), // order_id, payment_id, etc.
  referenceType: text("reference_type"), // order, payment, escrow, withdrawal
  description: text("description"),
  status: text("status").default("completed").notNull(), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
}));

// ============ PAYMENT INTENTS ============
export const paymentIntents = pgTable("payment_intents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  paymentMethod: text("payment_method").notNull(), // MOBILE_MONEY, CARD, WALLET, BANK_TRANSFER
  provider: text("provider"), // MTN_MOMO, AIRTEL_MONEY, MPESA, VISA, MASTERCARD
  payerPhone: text("payer_phone"),
  payerEmail: text("payer_email"),
  status: text("status").default("pending").notNull(), // pending, processing, success, failed, cancelled
  transactionRef: text("transaction_ref"),
  redirectUrl: text("redirect_url"),
  metadata: jsonb("metadata"),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_payment_intents_order").on(table.orderId),
  index("idx_payment_intents_buyer").on(table.buyerId),
]);

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  order: one(orders, {
    fields: [paymentIntents.orderId],
    references: [orders.id],
  }),
}));

// ============ ESCROW ============
export const escrowTransactions = pgTable("escrow_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull().unique(),
  buyerId: varchar("buyer_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").default("pending").notNull(), // pending, held, released, refunded, disputed
  milestones: text("milestones").array().default([]).notNull(), // PAID, SHIPPED, DELIVERED, CONFIRMED
  releaseCondition: text("release_condition").default("delivery_confirmed"), // delivery_confirmed, time_based, milestone_based
  confirmationMethod: text("confirmation_method"), // OTP, signature, photo
  confirmationCode: text("confirmation_code"),
  releaseAt: timestamp("release_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_escrow_order").on(table.orderId),
  index("idx_escrow_buyer").on(table.buyerId),
  index("idx_escrow_seller").on(table.sellerId),
]);

export const escrowTransactionsRelations = relations(escrowTransactions, ({ one }) => ({
  order: one(orders, {
    fields: [escrowTransactions.orderId],
    references: [orders.id],
  }),
}));

// ============ SHIPMENTS ============
export const shipments = pgTable("shipments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  pickupAddress: jsonb("pickup_address").notNull(), // { address, city, country, phone }
  deliveryAddress: jsonb("delivery_address").notNull(),
  packageInfo: jsonb("package_info"), // { weight_kg, dimensions, type }
  courierId: varchar("courier_id"),
  courierName: text("courier_name"),
  trackingNumber: text("tracking_number"),
  status: text("status").default("pending").notNull(), // pending, assigned, picked_up, in_transit, out_for_delivery, delivered, returned
  priority: text("priority").default("standard"), // standard, express, fastest
  estimatedDelivery: timestamp("estimated_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  shippingCost: decimal("shipping_cost", { precision: 12, scale: 2 }),
  currency: text("currency").default("USD"),
  currentLocation: text("current_location"),
  courierStatus: text("courier_status").default("unassigned"), // unassigned, assigned, accepted, rejected
  courierAssignedAt: timestamp("courier_assigned_at"),
  courierAcceptedAt: timestamp("courier_accepted_at"),
  broadcastedAt: timestamp("broadcasted_at"),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shipments_order").on(table.orderId),
  index("idx_shipments_tracking").on(table.trackingNumber),
  index("idx_shipments_courier").on(table.courierId),
  index("idx_shipments_courier_status").on(table.courierStatus),
]);

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id],
  }),
  trackingEvents: many(trackingEvents),
  proofOfDelivery: one(proofOfDelivery),
}));

// ============ TRACKING EVENTS ============
export const trackingEvents = pgTable("tracking_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shipmentId: integer("shipment_id").notNull(),
  status: text("status").notNull(),
  location: text("location"),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  shipment: one(shipments, {
    fields: [trackingEvents.shipmentId],
    references: [shipments.id],
  }),
}));

// ============ PROOF OF DELIVERY ============
export const proofOfDelivery = pgTable("proof_of_delivery", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  shipmentId: integer("shipment_id").notNull().unique(),
  otp: text("otp"),
  otpVerified: boolean("otp_verified").default(false),
  photoUrl: text("photo_url"),
  signatureUrl: text("signature_url"),
  recipientName: text("recipient_name"),
  notes: text("notes"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const proofOfDeliveryRelations = relations(proofOfDelivery, ({ one }) => ({
  shipment: one(shipments, {
    fields: [proofOfDelivery.shipmentId],
    references: [shipments.id],
  }),
}));

// ============ DISPUTES ============
export const disputes = pgTable("disputes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  escrowId: integer("escrow_id"),
  initiatorId: varchar("initiator_id").notNull(),
  respondentId: varchar("respondent_id").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  evidence: text("evidence").array(),
  status: text("status").default("open").notNull(), // open, under_review, resolved, escalated
  resolution: text("resolution"), // REFUND_BUYER, RELEASE_SELLER, PARTIAL_REFUND, CANCELLED
  resolutionNotes: text("resolution_notes"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  autoRefundAt: timestamp("auto_refund_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_disputes_order").on(table.orderId),
  index("idx_disputes_initiator").on(table.initiatorId),
]);

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(orders, {
    fields: [disputes.orderId],
    references: [orders.id],
  }),
  escrow: one(escrowTransactions, {
    fields: [disputes.escrowId],
    references: [escrowTransactions.id],
  }),
}));

// ============ CONVERSATIONS (Enhanced Chat) ============
export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id"),
  productId: integer("product_id"),
  type: text("type").default("direct"), // direct, order, support
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  userId: varchar("user_id").notNull(),
  lastReadAt: timestamp("last_read_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_conv_participants_conv").on(table.conversationId),
  index("idx_conv_participants_user").on(table.userId),
]);

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  chatMessages: many(chatMessages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
}));

// ============ CHAT MESSAGES (Enhanced) ============
export const chatMessages = pgTable("chat_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  type: text("type").default("TEXT").notNull(), // TEXT, IMAGE, FILE, SYSTEM
  content: text("content"),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"), // image/png, application/pdf, etc.
  attachmentName: text("attachment_name"),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_chat_messages_conv").on(table.conversationId),
  index("idx_chat_messages_sender").on(table.senderId),
]);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [chatMessages.conversationId],
    references: [conversations.id],
  }),
}));

// ============ DROPSHIPPING ============
export const dropshipOffers = pgTable("dropship_offers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  supplierId: varchar("supplier_id").notNull(),
  productId: integer("product_id").notNull(),
  wholesalePrice: decimal("wholesale_price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  minOrderQty: integer("min_order_qty").default(1),
  leadTimeDays: integer("lead_time_days").default(3),
  serviceRegions: text("service_regions").array(), // countries served
  stock: integer("stock").default(0),
  isActive: boolean("is_active").default(true),
  terms: text("terms"), // supplier terms and conditions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dropship_offers_supplier").on(table.supplierId),
  index("idx_dropship_offers_product").on(table.productId),
]);

export const dropshipOffersRelations = relations(dropshipOffers, ({ one, many }) => ({
  supplier: one(userProfiles, {
    fields: [dropshipOffers.supplierId],
    references: [userProfiles.id],
  }),
  product: one(products, {
    fields: [dropshipOffers.productId],
    references: [products.id],
  }),
  listings: many(dropshipListings),
}));

export const dropshipListings = pgTable("dropship_listings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  resellerId: varchar("reseller_id").notNull(),
  offerId: integer("offer_id").notNull(),
  retailPrice: decimal("retail_price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  customName: text("custom_name"), // reseller can rename product
  customDescription: text("custom_description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dropship_listings_reseller").on(table.resellerId),
  index("idx_dropship_listings_offer").on(table.offerId),
]);

export const dropshipListingsRelations = relations(dropshipListings, ({ one }) => ({
  reseller: one(userProfiles, {
    fields: [dropshipListings.resellerId],
    references: [userProfiles.id],
  }),
  offer: one(dropshipOffers, {
    fields: [dropshipListings.offerId],
    references: [dropshipOffers.id],
  }),
}));

export const dropshipFulfillments = pgTable("dropship_fulfillments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  orderItemId: integer("order_item_id").notNull(),
  listingId: integer("listing_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  resellerId: varchar("reseller_id").notNull(),
  wholesaleAmount: decimal("wholesale_amount", { precision: 12, scale: 2 }).notNull(),
  resellerMargin: decimal("reseller_margin", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("pending").notNull(), // pending, acknowledged, shipped, delivered, cancelled
  supplierAckedAt: timestamp("supplier_acked_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dropship_fulfillments_order").on(table.orderId),
  index("idx_dropship_fulfillments_supplier").on(table.supplierId),
  index("idx_dropship_fulfillments_reseller").on(table.resellerId),
]);

export const dropshipFulfillmentsRelations = relations(dropshipFulfillments, ({ one }) => ({
  order: one(orders, {
    fields: [dropshipFulfillments.orderId],
    references: [orders.id],
  }),
  listing: one(dropshipListings, {
    fields: [dropshipFulfillments.listingId],
    references: [dropshipListings.id],
  }),
}));

// ============ RFQ (Request for Quotation) ============
export const rfqs = pgTable("rfqs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id"), // null for guest submissions
  productId: integer("product_id"), // linked product (null for general RFQs)
  sellerId: varchar("seller_id"), // target seller (null for open marketplace RFQs)
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("pieces"), // pieces, kg, tons, boxes
  details: text("details"),
  targetPrice: decimal("target_price", { precision: 12, scale: 2 }),
  currency: text("currency").default("USD"),
  country: text("country"), // buyer's country
  status: text("status").default("open").notNull(), // open, quoted, closed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rfqs_user").on(table.userId),
  index("idx_rfqs_status").on(table.status),
  index("idx_rfqs_product").on(table.productId),
  index("idx_rfqs_seller").on(table.sellerId),
]);

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [rfqs.userId],
    references: [userProfiles.id],
  }),
  quotes: many(rfqQuotes),
}));

// ============ RFQ QUOTES ============
export const rfqQuotes = pgTable("rfq_quotes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  rfqId: integer("rfq_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  moq: integer("moq"),
  leadTime: text("lead_time"),
  message: text("message"),
  status: text("status").default("pending").notNull(), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rfq_quotes_rfq").on(table.rfqId),
  index("idx_rfq_quotes_supplier").on(table.supplierId),
]);

export const rfqQuotesRelations = relations(rfqQuotes, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [rfqQuotes.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(userProfiles, {
    fields: [rfqQuotes.supplierId],
    references: [userProfiles.id],
  }),
}));

// ============ WISHLIST ============
export const wishlistItems = pgTable("wishlist_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  productId: integer("product_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wishlist_user").on(table.userId),
  index("idx_wishlist_product").on(table.productId),
]);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(userProfiles, {
    fields: [wishlistItems.userId],
    references: [userProfiles.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

// ============ ADVERTISEMENTS ============
export const advertisements = pgTable("advertisements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: varchar("seller_id").notNull(),
  productId: integer("product_id").notNull(),
  packageType: text("package_type").notNull(), // basic, premium, featured
  status: text("status").default("pending").notNull(), // pending, active, expired, cancelled
  videoUrl: text("video_url"), // Optional 60-second promotional video
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_advertisements_seller").on(table.sellerId),
  index("idx_advertisements_product").on(table.productId),
  index("idx_advertisements_status").on(table.status),
]);

export const advertisementsRelations = relations(advertisements, ({ one }) => ({
  seller: one(userProfiles, {
    fields: [advertisements.sellerId],
    references: [userProfiles.id],
  }),
  product: one(products, {
    fields: [advertisements.productId],
    references: [products.id],
  }),
}));

// ============ AD SUBSCRIPTIONS (tracks Stripe payment status) ============
export const adSubscriptions = pgTable("ad_subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: varchar("seller_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").default("inactive").notNull(), // inactive, active, cancelled, past_due
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_ad_subscriptions_seller").on(table.sellerId),
  index("idx_ad_subscriptions_stripe").on(table.stripeSubscriptionId),
]);

export const adSubscriptionsRelations = relations(adSubscriptions, ({ one }) => ({
  seller: one(userProfiles, {
    fields: [adSubscriptions.sellerId],
    references: [userProfiles.id],
  }),
}));

// ============ ADMIN CREDENTIALS (separate admin login) ============
export const adminCredentials = pgTable("admin_credentials", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  isActive: boolean("is_active").default(true),
  isSuperAdmin: boolean("is_super_admin").default(false),
  mustResetPassword: boolean("must_reset_password").default(false),
  passwordChangedAt: timestamp("password_changed_at"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============ ADMIN PASSWORD RESET TOKENS ============
export const adminPasswordResets = pgTable("admin_password_resets", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("admin_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============ INSERT SCHEMAS ============
export const insertAdminCredentialSchema = createInsertSchema(adminCredentials).omit({ id: true, createdAt: true, lastLoginAt: true, passwordChangedAt: true, updatedAt: true });
export const insertAdminPasswordResetSchema = createInsertSchema(adminPasswordResets).omit({ id: true, createdAt: true, usedAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertMessageSchema = createInsertSchema(messages);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertCategorySchema = createInsertSchema(categories);
export const insertWalletSchema = createInsertSchema(wallets);
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions);
export const insertPaymentIntentSchema = createInsertSchema(paymentIntents);
export const insertEscrowSchema = createInsertSchema(escrowTransactions);
export const insertShipmentSchema = createInsertSchema(shipments);
export const insertTrackingEventSchema = createInsertSchema(trackingEvents);
export const insertProofOfDeliverySchema = createInsertSchema(proofOfDelivery);
export const insertDisputeSchema = createInsertSchema(disputes);
export const insertConversationSchema = createInsertSchema(conversations);
export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants);
export const insertChatMessageSchema = createInsertSchema(chatMessages);
export const dropshipApplications = pgTable("dropship_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  applicationType: text("application_type").notNull(), // supplier, reseller
  status: text("status").default("draft").notNull(), // draft, submitted, approved, rejected, revoked
  companyName: text("company_name"),
  businessDescription: text("business_description"),
  website: text("website"),
  countriesServed: text("countries_served").array(),
  fulfillmentCapacity: text("fulfillment_capacity"), // small, medium, large, enterprise
  avgLeadTimeDays: integer("avg_lead_time_days"),
  experienceLevel: text("experience_level"), // beginner, intermediate, experienced
  referenceLinks: text("reference_links"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  decidedAt: timestamp("decided_at"),
  decidedBy: varchar("decided_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dropship_applications_user").on(table.userId),
  index("idx_dropship_applications_status").on(table.status),
]);

export const dropshipApplicationsRelations = relations(dropshipApplications, ({ one }) => ({
  user: one(userProfiles, {
    fields: [dropshipApplications.userId],
    references: [userProfiles.id],
  }),
}));

export const insertDropshipApplicationSchema = createInsertSchema(dropshipApplications);

// ============ SHIPPER APPLICATIONS ============
export const shipperApplications = pgTable("shipper_applications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  status: text("status").default("draft").notNull(), // draft, submitted, approved, rejected, revoked
  companyName: text("company_name"),
  companyType: text("company_type"), // individual, small_fleet, logistics_company, freight_forwarder
  businessDescription: text("business_description"),
  fleetSize: text("fleet_size"), // 1, 2-5, 6-20, 20+
  vehicleTypes: text("vehicle_types").array(), // motorcycle, van, truck, container, air_freight
  serviceRegions: text("service_regions").array(), // countries served
  hasInsurance: boolean("has_insurance").default(false),
  insuranceDetails: text("insurance_details"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  website: text("website"),
  experienceYears: integer("experience_years"),
  referenceLinks: text("reference_links"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  decidedAt: timestamp("decided_at"),
  decidedBy: varchar("decided_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shipper_applications_user").on(table.userId),
  index("idx_shipper_applications_status").on(table.status),
]);

export const shipperApplicationsRelations = relations(shipperApplications, ({ one }) => ({
  user: one(userProfiles, {
    fields: [shipperApplications.userId],
    references: [userProfiles.id],
  }),
}));

export const insertShipperApplicationSchema = createInsertSchema(shipperApplications);

export const insertDropshipOfferSchema = createInsertSchema(dropshipOffers);
export const insertDropshipListingSchema = createInsertSchema(dropshipListings);
export const insertDropshipFulfillmentSchema = createInsertSchema(dropshipFulfillments);
export const insertRfqSchema = createInsertSchema(rfqs);
export const insertRfqQuoteSchema = createInsertSchema(rfqQuotes);
export const insertWishlistItemSchema = createInsertSchema(wishlistItems);
// ============ TRADE EXPO ADS ============
export const tradeExpoAds = pgTable("trade_expo_ads", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizerName: text("organizer_name").notNull(),
  organizerEmail: text("organizer_email").notNull(),
  eventName: text("event_name").notNull(),
  eventDescription: text("event_description"),
  location: text("location").notNull(),
  eventDate: text("event_date").notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  websiteUrl: text("website_url").notNull(),
  packageType: text("package_type").notNull(), // basic, premium, featured
  priceAmount: integer("price_amount").notNull(),
  durationDays: integer("duration_days").notNull(),
  status: text("status").default("pending").notNull(), // pending, active, rejected, expired
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_trade_expo_ads_status").on(table.status),
]);

export const insertTradeExpoAdSchema = createInsertSchema(tradeExpoAds).omit({ id: true, createdAt: true });

export const insertAdvertisementSchema = createInsertSchema(advertisements);
export const insertAdSubscriptionSchema = createInsertSchema(adSubscriptions);
export const insertBusinessDocumentSchema = createInsertSchema(businessDocuments);

// ============ TYPES ============
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertPaymentIntent = z.infer<typeof insertPaymentIntentSchema>;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type InsertEscrow = z.infer<typeof insertEscrowSchema>;
export type Escrow = typeof escrowTransactions.$inferSelect;
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipments.$inferSelect;
export type InsertTrackingEvent = z.infer<typeof insertTrackingEventSchema>;
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertProofOfDelivery = z.infer<typeof insertProofOfDeliverySchema>;
export type ProofOfDelivery = typeof proofOfDelivery.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertDropshipApplication = z.infer<typeof insertDropshipApplicationSchema>;
export type DropshipApplication = typeof dropshipApplications.$inferSelect;
export type InsertDropshipOffer = z.infer<typeof insertDropshipOfferSchema>;
export type DropshipOffer = typeof dropshipOffers.$inferSelect;
export type InsertDropshipListing = z.infer<typeof insertDropshipListingSchema>;
export type DropshipListing = typeof dropshipListings.$inferSelect;
export type InsertDropshipFulfillment = z.infer<typeof insertDropshipFulfillmentSchema>;
export type DropshipFulfillment = typeof dropshipFulfillments.$inferSelect;
export type InsertRfq = z.infer<typeof insertRfqSchema>;
export type Rfq = typeof rfqs.$inferSelect;
export type InsertRfqQuote = z.infer<typeof insertRfqQuoteSchema>;
export type RfqQuote = typeof rfqQuotes.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertTradeExpoAd = z.infer<typeof insertTradeExpoAdSchema>;
export type TradeExpoAd = typeof tradeExpoAds.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdSubscription = z.infer<typeof insertAdSubscriptionSchema>;
export type AdSubscription = typeof adSubscriptions.$inferSelect;
export type InsertBusinessDocument = z.infer<typeof insertBusinessDocumentSchema>;
export type BusinessDocument = typeof businessDocuments.$inferSelect;
export type InsertAdminCredential = z.infer<typeof insertAdminCredentialSchema>;
export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminPasswordReset = z.infer<typeof insertAdminPasswordResetSchema>;
export type AdminPasswordReset = typeof adminPasswordResets.$inferSelect;

// ============ AI ASSISTANT CONVERSATIONS ============
export const aiConversations = pgTable("ai_conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id"),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiMessages = pgTable("ai_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_messages_conv").on(table.conversationId),
]);

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

export const insertAiConversationSchema = createInsertSchema(aiConversations);
export const insertAiMessageSchema = createInsertSchema(aiMessages);
export type AiConversation = typeof aiConversations.$inferSelect;
export type AiMessage = typeof aiMessages.$inferSelect;

// ============ SELLER SUBSCRIPTIONS ============
export const sellerSubscriptions = pgTable("seller_subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sellerId: varchar("seller_id").notNull().unique(),
  tier: text("tier").notNull().default("free"), // free, basic, professional, enterprise
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text("status").default("active").notNull(), // active, cancelled, past_due, trialing
  productLimit: integer("product_limit").default(-1), // -1 means unlimited (kept for backwards compatibility)
  featuredSlots: integer("featured_slots").default(0), // featured product slots
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("5.00"), // percentage
  hasVerifiedBadge: boolean("has_verified_badge").default(false), // verified seller badge from subscription
  isHighlyRecommended: boolean("is_highly_recommended").default(false), // "highly recommended" status from subscription
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_seller_subs_seller").on(table.sellerId),
  index("idx_seller_subs_status").on(table.status),
]);

export const sellerSubscriptionsRelations = relations(sellerSubscriptions, ({ one }) => ({
  seller: one(userProfiles, {
    fields: [sellerSubscriptions.sellerId],
    references: [userProfiles.id],
  }),
}));

// ============ PLATFORM FEES ============
export const platformFees = pgTable("platform_fees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id"),
  escrowId: integer("escrow_id"),
  dropshipFulfillmentId: integer("dropship_fulfillment_id"),
  sellerId: varchar("seller_id").notNull(),
  buyerId: varchar("buyer_id"),
  feeType: text("fee_type").notNull(), // commission, escrow_fee, dropship_fee, fx_spread, subscription
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }), // percentage rate applied
  baseAmount: decimal("base_amount", { precision: 15, scale: 2 }), // amount fee was calculated on
  description: text("description"),
  status: text("status").default("pending").notNull(), // pending, collected, refunded
  collectedAt: timestamp("collected_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_platform_fees_order").on(table.orderId),
  index("idx_platform_fees_seller").on(table.sellerId),
  index("idx_platform_fees_type").on(table.feeType),
  index("idx_platform_fees_status").on(table.status),
]);

export const platformFeesRelations = relations(platformFees, ({ one }) => ({
  order: one(orders, {
    fields: [platformFees.orderId],
    references: [orders.id],
  }),
  escrow: one(escrowTransactions, {
    fields: [platformFees.escrowId],
    references: [escrowTransactions.id],
  }),
  seller: one(userProfiles, {
    fields: [platformFees.sellerId],
    references: [userProfiles.id],
  }),
}));

// ============ FEE CONFIGURATION ============
export const feeConfig = pgTable("fee_config", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  feeType: text("fee_type").notNull().unique(), // commission, escrow_fee, dropship_fee, fx_spread
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // percentage
  flatFee: decimal("flat_fee", { precision: 10, scale: 2 }).default("0"), // fixed fee
  minFee: decimal("min_fee", { precision: 10, scale: 2 }).default("0"), // minimum fee
  maxFee: decimal("max_fee", { precision: 10, scale: 2 }), // maximum fee cap
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============ SUBSCRIPTION TIER CONFIG ============
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(), // free, basic, professional, enterprise
  displayName: text("display_name").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  productLimit: integer("product_limit").default(-1), // -1 means unlimited (kept for backwards compatibility)
  featuredSlots: integer("featured_slots").default(0),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // percentage
  hasVerifiedBadge: boolean("has_verified_badge").default(false), // verified seller badge
  isHighlyRecommended: boolean("is_highly_recommended").default(false), // "highly recommended" status
  features: text("features").array(), // list of features
  stripePriceIdMonthly: text("stripe_price_id_monthly"),
  stripePriceIdYearly: text("stripe_price_id_yearly"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

// ============ INSERT SCHEMAS & TYPES ============
export const insertSellerSubscriptionSchema = createInsertSchema(sellerSubscriptions);
export const insertPlatformFeeSchema = createInsertSchema(platformFees);
export const insertFeeConfigSchema = createInsertSchema(feeConfig);
export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers);

export type InsertSellerSubscription = z.infer<typeof insertSellerSubscriptionSchema>;
export type SellerSubscription = typeof sellerSubscriptions.$inferSelect;
export type InsertPlatformFee = z.infer<typeof insertPlatformFeeSchema>;
export type PlatformFee = typeof platformFees.$inferSelect;
export type InsertFeeConfig = z.infer<typeof insertFeeConfigSchema>;
export type FeeConfig = typeof feeConfig.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;

// ============ USER SEARCH PREFERENCES (tracks browsing for promotional emails) ============
export const userSearchPreferences = pgTable("user_search_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  searchTerm: text("search_term"),
  categoryId: integer("category_id"),
  productId: integer("product_id"),
  eventType: text("event_type").notNull(), // search, view, category_browse
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_search_prefs_user").on(table.userId),
  index("idx_search_prefs_category").on(table.categoryId),
  index("idx_search_prefs_event").on(table.eventType),
]);

export const userSearchPreferencesRelations = relations(userSearchPreferences, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userSearchPreferences.userId],
    references: [userProfiles.id],
  }),
  category: one(categories, {
    fields: [userSearchPreferences.categoryId],
    references: [categories.id],
  }),
  product: one(products, {
    fields: [userSearchPreferences.productId],
    references: [products.id],
  }),
}));

// ============ EMAIL PREFERENCES (opt-in/out for promotional emails) ============
export const emailPreferences = pgTable("email_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().unique(),
  promoOptIn: boolean("promo_opt_in").default(true),
  unsubscribeToken: text("unsubscribe_token"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  lastPromoSentAt: timestamp("last_promo_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_email_prefs_user").on(table.userId),
  index("idx_email_prefs_unsub_token").on(table.unsubscribeToken),
]);

export const emailPreferencesRelations = relations(emailPreferences, ({ one }) => ({
  user: one(userProfiles, {
    fields: [emailPreferences.userId],
    references: [userProfiles.id],
  }),
}));

// ============ PROMOTIONAL EMAIL LOG (tracks sent promotional emails) ============
export const promoEmailLog = pgTable("promo_email_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull(),
  subject: text("subject").notNull(),
  productIds: text("product_ids"), // comma-separated product IDs included
  status: text("status").default("sent").notNull(), // sent, failed, bounced
  sentAt: timestamp("sent_at").defaultNow(),
}, (table) => [
  index("idx_promo_log_user").on(table.userId),
  index("idx_promo_log_sent").on(table.sentAt),
]);

// ============ EMAIL CAMPAIGNS (admin-created promotional emails) ============
export const emailCampaigns = pgTable("email_campaigns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  recipientType: text("recipient_type").notNull().default("all"), // all, subscribers, custom
  customEmails: text("custom_emails"), // comma-separated for custom recipient lists
  status: text("status").notNull().default("draft"), // draft, sending, sent, failed
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdBy: text("created_by"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_campaigns_status").on(table.status),
  index("idx_campaigns_created").on(table.createdAt),
]);

// ============ ADMIN EMAIL CONTACTS (additional promotional contacts) ============
export const adminEmailContacts = pgTable("admin_email_contacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name"),
  company: text("company"),
  tags: text("tags"), // comma-separated tags for segmentation
  isActive: boolean("is_active").default(true),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_contacts_email").on(table.email),
  index("idx_admin_contacts_active").on(table.isActive),
]);

// ============ MANUFACTURER OUTREACH ============
export const manufacturerOutreach = pgTable("manufacturer_outreach", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  businessName: text("business_name"),
  contactPerson: text("contact_person"),
  country: text("country"),
  industry: text("industry"),
  status: text("status").notNull().default("pending"),
  invitedAt: timestamp("invited_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  signedUpAt: timestamp("signed_up_at"),
  followUpCount: integer("follow_up_count").default(0),
  notes: text("notes"),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_outreach_email").on(table.email),
  index("idx_outreach_status").on(table.status),
  index("idx_outreach_country").on(table.country),
]);

export const insertManufacturerOutreachSchema = createInsertSchema(manufacturerOutreach).omit({ id: true, createdAt: true });

// ============ REVIEWS & RATINGS ============
export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  revieweeId: varchar("reviewee_id").notNull(),
  role: text("role").notNull(), // buyer_reviewing_seller, seller_reviewing_buyer
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  reviewText: text("review_text"),
  sellerResponse: text("seller_response"),
  sellerRespondedAt: timestamp("seller_responded_at"),
  status: text("status").default("published").notNull(), // published, hidden, flagged
  images: text("images").array(),
  isVerifiedPurchase: boolean("is_verified_purchase").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reviews_order").on(table.orderId),
  index("idx_reviews_reviewer").on(table.reviewerId),
  index("idx_reviews_reviewee").on(table.revieweeId),
  index("idx_reviews_role").on(table.role),
]);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  reviewer: one(userProfiles, {
    fields: [reviews.reviewerId],
    references: [userProfiles.id],
    relationName: "reviewsGiven",
  }),
  reviewee: one(userProfiles, {
    fields: [reviews.revieweeId],
    references: [userProfiles.id],
    relationName: "reviewsReceived",
  }),
}));

export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, updatedAt: true });

export const insertUserSearchPreferenceSchema = createInsertSchema(userSearchPreferences).omit({ id: true, createdAt: true });
export const insertEmailPreferenceSchema = createInsertSchema(emailPreferences).omit({ id: true, createdAt: true });
export const insertPromoEmailLogSchema = createInsertSchema(promoEmailLog).omit({ id: true, sentAt: true });
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({ id: true, createdAt: true });
export const insertAdminEmailContactSchema = createInsertSchema(adminEmailContacts).omit({ id: true, createdAt: true });

// ============ INVOICES ============
export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  orderId: integer("order_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  status: text("status").notNull().default("issued"), // draft, issued, paid, overdue, cancelled, refunded
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  paymentMethod: text("payment_method"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  lineItems: jsonb("line_items").$type<Array<{productId: number; name: string; quantity: number; unitPrice: string; totalPrice: string}>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_invoices_order").on(table.orderId),
  index("idx_invoices_seller").on(table.sellerId),
  index("idx_invoices_buyer").on(table.buyerId),
  index("idx_invoices_status").on(table.status),
]);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
  seller: one(userProfiles, { fields: [invoices.sellerId], references: [userProfiles.id], relationName: "invoiceSeller" }),
  buyer: one(userProfiles, { fields: [invoices.buyerId], references: [userProfiles.id], relationName: "invoiceBuyer" }),
}));

// ============ ACTIVITY LOGS (Transaction Audit Trail) ============
export const activityLogs = pgTable("activity_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id"),
  invoiceId: integer("invoice_id"),
  actorId: varchar("actor_id"), // user id or 'system' or 'admin'
  actorType: text("actor_type").notNull().default("system"), // buyer, seller, admin, system
  action: text("action").notNull(), // order_placed, payment_received, invoice_issued, shipped, delivered, dispute_opened, dispute_resolved, refund_issued, escrow_held, escrow_released, etc.
  description: text("description").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activity_order").on(table.orderId),
  index("idx_activity_actor").on(table.actorId),
  index("idx_activity_action").on(table.action),
  index("idx_activity_created").on(table.createdAt),
]);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  order: one(orders, { fields: [activityLogs.orderId], references: [orders.id] }),
  invoice: one(invoices, { fields: [activityLogs.invoiceId], references: [invoices.id] }),
}));

// ============ ADMIN NOTIFICATIONS ============
export const adminNotifications = pgTable("admin_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  type: text("type").notNull(), // new_order, payment_received, dispute_opened, dispute_resolved, refund_issued, shipment_stale, new_user, subscription_change
  title: text("title").notNull(),
  message: text("message").notNull(),
  orderId: integer("order_id"),
  userId: varchar("user_id"), // related user
  severity: text("severity").notNull().default("info"), // info, warning, critical
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_notif_type").on(table.type),
  index("idx_admin_notif_read").on(table.isRead),
  index("idx_admin_notif_created").on(table.createdAt),
]);

export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  order: one(orders, { fields: [adminNotifications.orderId], references: [orders.id] }),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({ id: true, createdAt: true });

// ============ CONTACT INQUIRIES ============
export const contactInquiries = pgTable("contact_inquiries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, in_progress, resolved, closed
  adminReply: text("admin_reply"),
  adminRepliedAt: timestamp("admin_replied_at"),
  adminRepliedBy: integer("admin_replied_by"),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_contact_inquiry_status").on(table.status),
  index("idx_contact_inquiry_email").on(table.email),
  index("idx_contact_inquiry_created").on(table.createdAt),
]);

export const insertContactInquirySchema = createInsertSchema(contactInquiries).omit({ id: true, createdAt: true, updatedAt: true, adminReply: true, adminRepliedAt: true, adminRepliedBy: true, status: true });

export type InsertUserSearchPreference = z.infer<typeof insertUserSearchPreferenceSchema>;
export type UserSearchPreference = typeof userSearchPreferences.$inferSelect;
export type InsertEmailPreference = z.infer<typeof insertEmailPreferenceSchema>;
export type EmailPreference = typeof emailPreferences.$inferSelect;
export type InsertPromoEmailLog = z.infer<typeof insertPromoEmailLogSchema>;
export type PromoEmailLog = typeof promoEmailLog.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertAdminEmailContact = z.infer<typeof insertAdminEmailContactSchema>;
export type AdminEmailContact = typeof adminEmailContacts.$inferSelect;
export type InsertManufacturerOutreach = z.infer<typeof insertManufacturerOutreachSchema>;
export type ManufacturerOutreach = typeof manufacturerOutreach.$inferSelect;
export type InsertShipperApplication = z.infer<typeof insertShipperApplicationSchema>;
export type ShipperApplication = typeof shipperApplications.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;

// ============ TRADE & TAXATION ============
export const countryTaxRates = pgTable("country_tax_rates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  countryName: text("country_name").notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  importDutyRate: decimal("import_duty_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  exportDutyRate: decimal("export_duty_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  customsProcessingFee: decimal("customs_processing_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  digitalTaxRate: decimal("digital_tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("USD"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_country_tax_code").on(table.countryCode),
]);

export const shippingZones = pgTable("shipping_zones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  originCountryCode: varchar("origin_country_code", { length: 2 }).notNull(),
  destinationCountryCode: varchar("destination_country_code", { length: 2 }).notNull(),
  zoneType: text("zone_type").notNull().default("cross_border"),
  baseShippingCost: decimal("base_shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  perKgRate: decimal("per_kg_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  estimatedDaysMin: integer("estimated_days_min").default(3),
  estimatedDaysMax: integer("estimated_days_max").default(14),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_shipping_zone_origin").on(table.originCountryCode),
  index("idx_shipping_zone_dest").on(table.destinationCountryCode),
]);

export const insertCountryTaxRateSchema = createInsertSchema(countryTaxRates).omit({ id: true, updatedAt: true });
export const insertShippingZoneSchema = createInsertSchema(shippingZones).omit({ id: true, updatedAt: true });

export type CountryTaxRate = typeof countryTaxRates.$inferSelect;
export type InsertCountryTaxRate = z.infer<typeof insertCountryTaxRateSchema>;
export type ShippingZone = typeof shippingZones.$inferSelect;
export type InsertShippingZone = z.infer<typeof insertShippingZoneSchema>;

// ============ PICKUP POINTS ============
export const pickupPoints = pgTable("pickup_points", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  partnerType: text("partner_type").notNull().default("supermarket"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  contactPhone: text("contact_phone"),
  operatingHours: text("operating_hours"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pickup_points_city").on(table.city),
  index("idx_pickup_points_country").on(table.countryCode),
]);

// ============ DELIVERY TIERS ============
export const deliveryTiers = pgTable("delivery_tiers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  tier: text("tier").notNull().default("standard"),
  city: text("city").notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  minDeliveryMinutes: integer("min_delivery_minutes").notNull().default(1440),
  maxDeliveryMinutes: integer("max_delivery_minutes").notNull().default(2880),
  baseFee: decimal("base_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_delivery_tiers_city").on(table.city),
  index("idx_delivery_tiers_country").on(table.countryCode),
  index("idx_delivery_tiers_tier").on(table.tier),
]);

// ============ EXPRESS CORRIDORS ============
export const expressCorridors = pgTable("express_corridors", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  originCity: text("origin_city").notNull(),
  originCountryCode: varchar("origin_country_code", { length: 2 }).notNull(),
  destCity: text("destination_city").notNull(),
  destCountryCode: varchar("destination_country_code", { length: 2 }).notNull(),
  mode: text("mode").notNull().default("road"),
  minDays: integer("min_days").notNull().default(1),
  maxDays: integer("max_days").notNull().default(2),
  corridorFee: decimal("corridor_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_express_corridors_origin").on(table.originCity, table.originCountryCode),
  index("idx_express_corridors_dest").on(table.destCity, table.destCountryCode),
]);

export const insertPickupPointSchema = createInsertSchema(pickupPoints).omit({ id: true, createdAt: true });
export const insertDeliveryTierSchema = createInsertSchema(deliveryTiers).omit({ id: true, createdAt: true });
export const insertExpressCorridorSchema = createInsertSchema(expressCorridors).omit({ id: true, createdAt: true });

export type PickupPoint = typeof pickupPoints.$inferSelect;
export type InsertPickupPoint = z.infer<typeof insertPickupPointSchema>;
export type DeliveryTier = typeof deliveryTiers.$inferSelect;
export type InsertDeliveryTier = z.infer<typeof insertDeliveryTierSchema>;
export type ExpressCorridor = typeof expressCorridors.$inferSelect;
export type InsertExpressCorridor = z.infer<typeof insertExpressCorridorSchema>;

// ============ MOBILE MONEY PAYMENTS ============
export const mobileMoneyPayments = pgTable("mobile_money_payments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer("order_id"),
  provider: text("provider").notNull(), // mpesa, mtn, airtel, orange
  phoneNumber: text("phone_number").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  transactionRef: text("transaction_ref"),
  externalRef: text("external_ref"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_mobile_money_order").on(table.orderId),
  index("idx_mobile_money_status").on(table.status),
  index("idx_mobile_money_ref").on(table.transactionRef),
]);

export const insertMobileMoneyPaymentSchema = createInsertSchema(mobileMoneyPayments).omit({ id: true, createdAt: true, updatedAt: true });
export type MobileMoneyPayment = typeof mobileMoneyPayments.$inferSelect;
export type InsertMobileMoneyPayment = z.infer<typeof insertMobileMoneyPaymentSchema>;

// ============ GROUP BUYS ============
export const groupBuys = pgTable("group_buys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull(),
  organizerId: varchar("organizer_id").notNull(),
  title: text("title").notNull(),
  targetQty: integer("target_qty").notNull(),
  currentQty: integer("current_qty").notNull().default(0),
  pricePerUnit: decimal("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull().default("open"), // open, filled, closed, cancelled, completed
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_group_buys_product").on(table.productId),
  index("idx_group_buys_status").on(table.status),
  index("idx_group_buys_organizer").on(table.organizerId),
]);

export const groupBuyParticipants = pgTable("group_buy_participants", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  groupBuyId: integer("group_buy_id").notNull(),
  userId: varchar("user_id").notNull(),
  quantity: integer("quantity").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => [
  index("idx_gbp_group_buy").on(table.groupBuyId),
  index("idx_gbp_user").on(table.userId),
]);

export const groupBuysRelations = relations(groupBuys, ({ one, many }) => ({
  product: one(products, { fields: [groupBuys.productId], references: [products.id] }),
  organizer: one(userProfiles, { fields: [groupBuys.organizerId], references: [userProfiles.id] }),
  participants: many(groupBuyParticipants),
}));

export const groupBuyParticipantsRelations = relations(groupBuyParticipants, ({ one }) => ({
  groupBuy: one(groupBuys, { fields: [groupBuyParticipants.groupBuyId], references: [groupBuys.id] }),
  user: one(userProfiles, { fields: [groupBuyParticipants.userId], references: [userProfiles.id] }),
}));

export const insertGroupBuySchema = createInsertSchema(groupBuys).omit({ id: true, currentQty: true, createdAt: true });
export const insertGroupBuyParticipantSchema = createInsertSchema(groupBuyParticipants).omit({ id: true, joinedAt: true });
export type GroupBuy = typeof groupBuys.$inferSelect;
export type InsertGroupBuy = z.infer<typeof insertGroupBuySchema>;
export type GroupBuyParticipant = typeof groupBuyParticipants.$inferSelect;
export type InsertGroupBuyParticipant = z.infer<typeof insertGroupBuyParticipantSchema>;

// ============ AFCFTA CERTIFICATES ============
export const afcftaCertificates = pgTable("afcfta_certificates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  originCountry: text("origin_country").notNull(),
  destinationCountry: text("destination_country"),
  hsCode: text("hs_code"),
  status: text("status").notNull().default("requested"), // requested, approved, rejected
  requestNotes: text("request_notes"),
  adminNotes: text("admin_notes"),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [
  index("idx_afcfta_product").on(table.productId),
  index("idx_afcfta_seller").on(table.sellerId),
  index("idx_afcfta_status").on(table.status),
]);

export const insertAfcftaCertificateSchema = createInsertSchema(afcftaCertificates).omit({ id: true, createdAt: true, reviewedAt: true });
export type AfcftaCertificate = typeof afcftaCertificates.$inferSelect;
export type InsertAfcftaCertificate = z.infer<typeof insertAfcftaCertificateSchema>;
