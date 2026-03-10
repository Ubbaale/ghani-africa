import {
  userProfiles, products, orders, orderItems, messages, cartItems, categories,
  wallets, walletTransactions, paymentIntents, escrowTransactions,
  shipments, trackingEvents, proofOfDelivery, disputes,
  conversations, conversationParticipants, chatMessages,
  dropshipOffers, dropshipListings, dropshipFulfillments, dropshipApplications,
  rfqs, rfqQuotes, wishlistItems,
  advertisements, adSubscriptions, businessDocuments,
  tradeExpoAds,
  adminCredentials, adminPasswordResets,
  userSearchPreferences, emailPreferences, promoEmailLog,
  emailCampaigns, adminEmailContacts, manufacturerOutreach,
  type UserProfile, type InsertUserProfile,
  type AdminCredential, type AdminPasswordReset,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Message, type InsertMessage,
  type CartItem, type InsertCartItem,
  type Category, type InsertCategory,
  type Wallet, type InsertWallet,
  type WalletTransaction, type InsertWalletTransaction,
  type PaymentIntent, type InsertPaymentIntent,
  type Escrow, type InsertEscrow,
  type Shipment, type InsertShipment,
  type TrackingEvent, type InsertTrackingEvent,
  type ProofOfDelivery, type InsertProofOfDelivery,
  type Dispute, type InsertDispute,
  type Conversation, type InsertConversation,
  type ConversationParticipant, type InsertConversationParticipant,
  type ChatMessage, type InsertChatMessage,
  type DropshipApplication, type InsertDropshipApplication,
  type DropshipOffer, type InsertDropshipOffer,
  type DropshipListing, type InsertDropshipListing,
  type DropshipFulfillment, type InsertDropshipFulfillment,
  type Rfq, type InsertRfq,
  type RfqQuote, type InsertRfqQuote,
  type WishlistItem, type InsertWishlistItem,
  type Advertisement, type InsertAdvertisement,
  type AdSubscription, type InsertAdSubscription,
  type BusinessDocument, type InsertBusinessDocument,
  type TradeExpoAd, type InsertTradeExpoAd,
  type UserSearchPreference, type InsertUserSearchPreference,
  type EmailPreference, type InsertEmailPreference,
  type PromoEmailLog, type InsertPromoEmailLog,
  type EmailCampaign, type InsertEmailCampaign,
  type AdminEmailContact, type InsertAdminEmailContact,
  type ManufacturerOutreach, type InsertManufacturerOutreach,
  type ShipperApplication, type InsertShipperApplication,
  shipperApplications,
  reviews,
  type Review, type InsertReview,
  invoices, activityLogs, adminNotifications, contactInquiries,
  type Invoice, type InsertInvoice,
  type ActivityLog, type InsertActivityLog,
  type AdminNotification, type InsertAdminNotification,
  type ContactInquiry, type InsertContactInquiry,
  countryTaxRates, shippingZones,
  type CountryTaxRate, type InsertCountryTaxRate,
  type ShippingZone, type InsertShippingZone,
  pickupPoints, deliveryTiers, expressCorridors,
  type PickupPoint, type InsertPickupPoint,
  type DeliveryTier, type InsertDeliveryTier,
  type ExpressCorridor, type InsertExpressCorridor,
  mobileMoneyPayments,
  type MobileMoneyPayment, type InsertMobileMoneyPayment,
  groupBuys, groupBuyParticipants,
  type GroupBuy, type InsertGroupBuy,
  type GroupBuyParticipant, type InsertGroupBuyParticipant,
  afcftaCertificates,
  type AfcftaCertificate, type InsertAfcftaCertificate,
  referrals,
  type Referral, type InsertReferral,
  socialPosts,
  type SocialPost, type InsertSocialPost,
  marketingAutomations,
  type MarketingAutomation, type InsertMarketingAutomation,
  bnplPlans, bnplPayments,
  type BnplPlan, type InsertBnplPlan,
  type BnplPayment, type InsertBnplPayment,
  tradeDocuments,
  type TradeDocument, type InsertTradeDocument,
  storefronts,
  type Storefront, type InsertStorefront,
  commodityPrices, priceAlerts,
  type CommodityPrice, type InsertCommodityPrice,
  type PriceAlert, type InsertPriceAlert,
  buyerVerifications,
  type BuyerVerification, type InsertBuyerVerification,
  forumCategories, forumPosts, forumReplies,
  type ForumCategory, type InsertForumCategory,
  type ForumPost, type InsertForumPost,
  type ForumReply, type InsertForumReply,
  logisticsPartners, logisticsBookings,
  type LogisticsPartner, type InsertLogisticsPartner,
  type LogisticsBooking, type InsertLogisticsBooking,
  tradeEvents, eventPromotions,
  type TradeEvent, type InsertTradeEvent,
  type EventPromotion, type InsertEventPromotion,
  agriListings, agriBids,
  type AgriListing, type InsertAgriListing,
  type AgriBid, type InsertAgriBid,
  liveSessions, liveSessionProducts,
  type LiveSession, type InsertLiveSession,
  type LiveSessionProduct, type InsertLiveSessionProduct,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, not, ilike, desc, asc, sql, inArray, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User Profiles
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getUserProfileBySlug(slug: string): Promise<UserProfile | undefined>;
  upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  checkStoreSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getOrCreateCategory(name: string): Promise<Category>;
  
  // Products
  getProducts(filters?: { country?: string; city?: string; categoryId?: number; search?: string; sellerId?: string; minPrice?: number; maxPrice?: number; condition?: string; sortBy?: string; limit?: number; offset?: number }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductWithSeller(id: number): Promise<(Product & { seller: UserProfile | null }) | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getPopularProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  incrementProductViews(id: number): Promise<void>;
  
  // Cart
  getCartItems(userId: string): Promise<(CartItem & { product: Product | null })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: string): Promise<void>;
  
  // Orders
  getOrders(userId: string, role: 'buyer' | 'seller'): Promise<Order[]>;
  getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product | null })[] }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order & { items: OrderItem[] }>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Messages (legacy)
  getConversations(userId: string): Promise<{ partnerId: string; partner: UserProfile | null; lastMessage: Message; unreadCount: number }[]>;
  getMessages(userId: string, partnerId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(userId: string, partnerId: string): Promise<void>;

  // Wallets
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, amount: number, type: 'credit' | 'debit'): Promise<Wallet | undefined>;
  getWalletTransactions(walletId: number): Promise<WalletTransaction[]>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;

  // Payment Intents
  createPaymentIntent(intent: InsertPaymentIntent): Promise<PaymentIntent>;
  getPaymentIntent(id: number): Promise<PaymentIntent | undefined>;
  getPaymentIntentByOrder(orderId: number): Promise<PaymentIntent | undefined>;
  updatePaymentIntent(id: number, data: Partial<PaymentIntent>): Promise<PaymentIntent | undefined>;

  // Escrow
  createEscrow(escrow: InsertEscrow): Promise<Escrow>;
  getEscrow(orderId: number): Promise<Escrow | undefined>;
  updateEscrow(orderId: number, data: Partial<Escrow>): Promise<Escrow | undefined>;
  addEscrowMilestone(orderId: number, milestone: string): Promise<Escrow | undefined>;
  releaseEscrow(orderId: number): Promise<Escrow | undefined>;

  // Shipments
  createShipment(shipment: InsertShipment): Promise<Shipment>;
  getShipment(id: number): Promise<Shipment | undefined>;
  getShipmentByOrder(orderId: number): Promise<Shipment | undefined>;
  getShipmentByTracking(trackingNumber: string): Promise<(Shipment & { events: TrackingEvent[] }) | undefined>;
  getShipmentsBySeller(sellerId: string): Promise<Shipment[]>;
  getShipmentsByBuyer(buyerId: string): Promise<Shipment[]>;
  getStaleShipments(hoursThreshold: number): Promise<Shipment[]>;
  updateShipment(id: number, data: Partial<Shipment>): Promise<Shipment | undefined>;
  addTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent>;
  getTrackingEvents(shipmentId: number): Promise<TrackingEvent[]>;

  // Proof of Delivery
  createProofOfDelivery(pod: InsertProofOfDelivery): Promise<ProofOfDelivery>;
  getProofOfDelivery(shipmentId: number): Promise<ProofOfDelivery | undefined>;
  verifyProofOfDelivery(shipmentId: number, otp: string): Promise<ProofOfDelivery | undefined>;

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDispute(id: number): Promise<Dispute | undefined>;
  getDisputeByOrder(orderId: number): Promise<Dispute | undefined>;
  getUserDisputes(userId: string): Promise<Dispute[]>;
  updateDispute(id: number, data: Partial<Dispute>): Promise<Dispute | undefined>;
  resolveDispute(id: number, resolution: string, resolvedBy: string, notes?: string): Promise<Dispute | undefined>;

  // Enhanced Chat
  createConversation(conv: InsertConversation, participantIds: string[]): Promise<Conversation>;
  getConversationById(id: number): Promise<(Conversation & { participants: ConversationParticipant[] }) | undefined>;
  getUserConversations(userId: string): Promise<(Conversation & { participants: ConversationParticipant[]; lastMessage?: ChatMessage })[]>;
  findConversation(participantIds: string[], orderId?: number): Promise<Conversation | undefined>;
  sendChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(conversationId: number): Promise<ChatMessage[]>;
  markChatMessagesRead(conversationId: number, userId: string): Promise<void>;

  // Dropship Applications
  createDropshipApplication(app: InsertDropshipApplication): Promise<DropshipApplication>;
  getDropshipApplication(id: number): Promise<DropshipApplication | undefined>;
  getDropshipApplicationByUser(userId: string): Promise<DropshipApplication | undefined>;
  updateDropshipApplication(id: number, data: Partial<InsertDropshipApplication>): Promise<DropshipApplication | undefined>;
  submitDropshipApplication(id: number): Promise<DropshipApplication | undefined>;
  decideDropshipApplication(id: number, status: 'approved' | 'rejected', decidedBy: string, notes?: string, rejectionReason?: string): Promise<DropshipApplication | undefined>;
  getDropshipApplicationsByStatus(status?: string): Promise<(DropshipApplication & { user?: UserProfile })[]>;

  // Shipper Applications
  createShipperApplication(app: InsertShipperApplication): Promise<ShipperApplication>;
  getShipperApplication(id: number): Promise<ShipperApplication | undefined>;
  getShipperApplicationByUser(userId: string): Promise<ShipperApplication | undefined>;
  updateShipperApplication(id: number, data: Partial<InsertShipperApplication>): Promise<ShipperApplication | undefined>;
  submitShipperApplication(id: number): Promise<ShipperApplication | undefined>;
  decideShipperApplication(id: number, status: 'approved' | 'rejected', decidedBy: string, notes?: string, rejectionReason?: string): Promise<ShipperApplication | undefined>;
  getShipperApplicationsByStatus(status?: string): Promise<(ShipperApplication & { user?: UserProfile })[]>;
  getApprovedShippers(region?: string): Promise<ShipperApplication[]>;
  getShipperAssignments(courierId: string): Promise<Shipment[]>;
  getAvailableShipments(regions: string[]): Promise<Shipment[]>;

  // Dropship Offers
  createDropshipOffer(offer: InsertDropshipOffer): Promise<DropshipOffer>;
  getDropshipOffer(id: number): Promise<(DropshipOffer & { product: Product }) | undefined>;
  getSupplierOffers(supplierId: string): Promise<(DropshipOffer & { product: Product })[]>;
  getDropshipCatalog(filters?: { region?: string; search?: string }): Promise<(DropshipOffer & { product: Product; supplier: UserProfile })[]>;
  updateDropshipOffer(id: number, data: Partial<InsertDropshipOffer>): Promise<DropshipOffer | undefined>;
  deleteDropshipOffer(id: number): Promise<void>;

  // Dropship Listings
  createDropshipListing(listing: InsertDropshipListing): Promise<DropshipListing>;
  getDropshipListing(id: number): Promise<(DropshipListing & { offer: DropshipOffer & { product: Product } }) | undefined>;
  getResellerListings(resellerId: string): Promise<(DropshipListing & { offer: DropshipOffer & { product: Product } })[]>;
  updateDropshipListing(id: number, data: Partial<InsertDropshipListing>): Promise<DropshipListing | undefined>;
  deleteDropshipListing(id: number): Promise<void>;

  // Dropship Fulfillments
  createDropshipFulfillment(fulfillment: InsertDropshipFulfillment): Promise<DropshipFulfillment>;
  getDropshipFulfillment(id: number): Promise<DropshipFulfillment | undefined>;
  getDropshipFulfillmentByOrder(orderId: number): Promise<DropshipFulfillment[]>;
  getSupplierFulfillments(supplierId: string): Promise<(DropshipFulfillment & { listing: DropshipListing })[]>;
  getResellerFulfillments(resellerId: string): Promise<DropshipFulfillment[]>;
  updateDropshipFulfillmentStatus(id: number, status: string): Promise<DropshipFulfillment | undefined>;
  findDropshipListingByResellerAndProduct(resellerId: string, productId: number): Promise<(DropshipListing & { offer: DropshipOffer }) | undefined>;

  // Admin
  getAllUserProfiles(): Promise<UserProfile[]>;
  updateUserProfile(id: string, data: Partial<UserProfile>): Promise<UserProfile | undefined>;
  setUserDisabled(id: string, isDisabled: boolean): Promise<UserProfile | undefined>;
  getAllProducts(): Promise<(Product & { seller: UserProfile | null })[]>;
  getAllOrders(): Promise<(Order & { buyer: UserProfile | null; seller: UserProfile | null })[]>;
  getAllDisputes(): Promise<(Dispute & { initiator: UserProfile | null; respondent: UserProfile | null })[]>;
  getAllAdvertisements(): Promise<(Advertisement & { product: Product; seller: UserProfile | null })[]>;
  getAllCategories(): Promise<Category[]>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  getAdminStats(): Promise<{ users: number; products: number; orders: number; disputes: number; advertisements: number; revenue: string }>;

  // Admin Credentials
  getAdminByUsername(username: string): Promise<AdminCredential | undefined>;
  getAdminById(id: number): Promise<AdminCredential | undefined>;
  getAdminByEmail(email: string): Promise<AdminCredential | undefined>;
  getAllAdmins(): Promise<AdminCredential[]>;
  createAdmin(data: { username: string; passwordHash: string; displayName?: string; email?: string; isSuperAdmin?: boolean }): Promise<AdminCredential>;
  updateAdmin(id: number, data: Partial<{ displayName: string; email: string; isActive: boolean; isSuperAdmin: boolean; mustResetPassword: boolean }>): Promise<AdminCredential | undefined>;
  updateAdminPassword(id: number, passwordHash: string): Promise<void>;
  updateAdminLastLogin(id: number): Promise<void>;
  deleteAdmin(id: number): Promise<void>;
  
  // Admin Password Reset Tokens
  createPasswordResetToken(adminId: number, tokenHash: string, expiresAt: Date): Promise<AdminPasswordReset>;
  getValidPasswordResetToken(tokenHash: string): Promise<(AdminPasswordReset & { admin: AdminCredential }) | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // RFQ (Request for Quotation)
  createRfq(rfq: InsertRfq): Promise<Rfq>;
  getRfq(id: number): Promise<Rfq | undefined>;
  getUserRfqs(userId: string): Promise<Rfq[]>;
  getSellerRfqs(sellerId: string): Promise<(Rfq & { user: UserProfile | null })[]>;
  getOpenRfqs(): Promise<(Rfq & { user: UserProfile | null })[]>;
  updateRfqStatus(id: number, status: string): Promise<Rfq | undefined>;
  createRfqQuote(quote: InsertRfqQuote): Promise<RfqQuote>;
  getRfqQuotes(rfqId: number): Promise<(RfqQuote & { supplier: UserProfile | null })[]>;
  updateRfqQuoteStatus(id: number, status: string): Promise<RfqQuote | undefined>;

  // Wishlist
  getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product | null })[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number): Promise<void>;
  removeFromWishlistByProduct(userId: string, productId: number): Promise<void>;
  isInWishlist(userId: string, productId: number): Promise<boolean>;

  // Advertisements
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  getAdvertisement(id: number): Promise<(Advertisement & { product: Product }) | undefined>;
  getSellerAdvertisements(sellerId: string): Promise<(Advertisement & { product: Product })[]>;
  getActiveAdvertisements(): Promise<(Advertisement & { product: Product; seller: UserProfile | null })[]>;
  updateAdvertisement(id: number, data: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: number): Promise<void>;
  incrementAdImpressions(id: number): Promise<void>;
  incrementAdClicks(id: number): Promise<void>;

  // Trade Expo Ads
  createTradeExpoAd(ad: InsertTradeExpoAd): Promise<TradeExpoAd>;
  getTradeExpoAd(id: number): Promise<TradeExpoAd | undefined>;
  getActiveTradeExpoAds(): Promise<TradeExpoAd[]>;
  getAllTradeExpoAds(): Promise<TradeExpoAd[]>;
  updateTradeExpoAd(id: number, data: Partial<InsertTradeExpoAd>): Promise<TradeExpoAd | undefined>;
  deleteTradeExpoAd(id: number): Promise<void>;
  getTradeExpoAdByStripeSession(sessionId: string): Promise<TradeExpoAd | undefined>;

  // Ad Subscriptions
  createAdSubscription(sub: InsertAdSubscription): Promise<AdSubscription>;
  getAdSubscription(sellerId: string): Promise<AdSubscription | undefined>;
  getAdSubscriptionByStripeId(stripeSubscriptionId: string): Promise<AdSubscription | undefined>;
  updateAdSubscription(id: number, data: Partial<InsertAdSubscription>): Promise<AdSubscription | undefined>;

  // Business Documents
  createBusinessDocument(doc: InsertBusinessDocument): Promise<BusinessDocument>;
  getBusinessDocument(id: number): Promise<BusinessDocument | undefined>;
  getUserBusinessDocuments(userId: string): Promise<BusinessDocument[]>;
  getPublicBusinessDocuments(userId: string): Promise<BusinessDocument[]>;
  updateBusinessDocument(id: number, data: Partial<InsertBusinessDocument>): Promise<BusinessDocument | undefined>;
  deleteBusinessDocument(id: number): Promise<void>;
  verifyBusinessDocument(id: number, isVerified: boolean): Promise<BusinessDocument | undefined>;

  // Verified Suppliers
  getVerifiedSuppliers(): Promise<UserProfile[]>;
  
  // Suppliers by Product Search
  getSuppliersByProductSearch(search: string): Promise<UserProfile[]>;

  // Search Preferences (for promotional emails)
  trackSearchPreference(data: InsertUserSearchPreference): Promise<UserSearchPreference>;
  getUserSearchPreferences(userId: string, limit?: number): Promise<UserSearchPreference[]>;
  getTopUserCategories(userId: string, limit?: number): Promise<{ categoryId: number; count: number }[]>;
  getTopUserSearchTerms(userId: string, limit?: number): Promise<string[]>;
  getRecentlyViewedProducts(userId: string, limit?: number): Promise<Product[]>;
  getUsersWithRecentViews(hoursAgo: number, maxLastEmailHoursAgo: number): Promise<{ userId: string; email: string; firstName: string | null }[]>;

  // Email Preferences
  getEmailPreference(userId: string): Promise<EmailPreference | undefined>;
  getEmailPreferenceByToken(token: string): Promise<EmailPreference | undefined>;
  upsertEmailPreference(data: InsertEmailPreference): Promise<EmailPreference>;
  updateEmailPreference(userId: string, data: Partial<EmailPreference>): Promise<EmailPreference | undefined>;
  getSubscribedUsers(): Promise<{ userId: string; email: string; firstName: string | null }[]>;

  // Promo Email Log
  logPromoEmail(data: InsertPromoEmailLog): Promise<PromoEmailLog>;
  getPromoEmailStats(): Promise<{ total: number; last24h: number; last7d: number }>;

  // Email Campaigns
  createEmailCampaign(data: InsertEmailCampaign): Promise<EmailCampaign>;
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: number): Promise<EmailCampaign | undefined>;
  updateEmailCampaign(id: number, data: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: number): Promise<void>;

  // Admin Email Contacts
  createAdminEmailContact(data: InsertAdminEmailContact): Promise<AdminEmailContact>;
  getAdminEmailContacts(): Promise<AdminEmailContact[]>;
  updateAdminEmailContact(id: number, data: Partial<AdminEmailContact>): Promise<AdminEmailContact | undefined>;
  deleteAdminEmailContact(id: number): Promise<void>;
  getAllEmailRecipients(): Promise<{ email: string; name: string | null; source: string }[]>;

  // Manufacturer Outreach
  createManufacturerOutreach(data: InsertManufacturerOutreach): Promise<ManufacturerOutreach>;
  bulkCreateManufacturerOutreach(data: InsertManufacturerOutreach[]): Promise<{ created: number; skipped: number }>;
  getManufacturerOutreachContacts(filters?: { status?: string; country?: string }): Promise<ManufacturerOutreach[]>;
  getManufacturerOutreach(id: number): Promise<ManufacturerOutreach | undefined>;
  getManufacturerOutreachByEmail(email: string): Promise<ManufacturerOutreach | undefined>;
  updateManufacturerOutreach(id: number, data: Partial<ManufacturerOutreach>): Promise<ManufacturerOutreach | undefined>;
  deleteManufacturerOutreach(id: number): Promise<void>;
  getManufacturerOutreachStats(): Promise<{ total: number; pending: number; invited: number; reminded: number; signedUp: number }>;
  getPendingFollowUps(daysAfterInvite: number, maxFollowUps: number): Promise<ManufacturerOutreach[]>;

  // Reviews & Ratings
  createReview(review: InsertReview): Promise<Review>;
  getReview(id: number): Promise<Review | undefined>;
  getReviewByOrderAndRole(orderId: number, reviewerId: string, role: string): Promise<Review | undefined>;
  getReviewsForUser(userId: string, role?: string): Promise<(Review & { reviewer: UserProfile | null })[]>;
  getReviewsForOrder(orderId: number): Promise<Review[]>;
  updateReview(id: number, data: Partial<Review>): Promise<Review | undefined>;
  updateUserRating(userId: string): Promise<void>;
  getUnresolvedDisputesPastDeadline(): Promise<Dispute[]>;

  // Invoices
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByOrder(orderId: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoicesByBuyer(buyerId: string): Promise<Invoice[]>;
  getInvoicesBySeller(sellerId: string): Promise<Invoice[]>;
  updateInvoiceStatus(id: number, status: string, paidAt?: Date): Promise<Invoice | undefined>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByOrder(orderId: number): Promise<ActivityLog[]>;
  getActivityLogsByUser(userId: string, limit?: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;

  // Admin Notifications
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getAdminNotifications(filters?: { unreadOnly?: boolean; type?: string; limit?: number }): Promise<AdminNotification[]>;
  markAdminNotificationRead(id: number): Promise<AdminNotification | undefined>;
  markAllAdminNotificationsRead(): Promise<void>;
  getAdminNotificationCount(unreadOnly?: boolean): Promise<number>;

  // Contact Inquiries
  createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry>;
  getContactInquiries(filters?: { status?: string; limit?: number }): Promise<ContactInquiry[]>;
  getContactInquiry(id: number): Promise<ContactInquiry | undefined>;
  updateContactInquiryStatus(id: number, status: string): Promise<ContactInquiry | undefined>;
  replyToContactInquiry(id: number, reply: string, adminId: number): Promise<ContactInquiry | undefined>;
  getContactInquiryCount(status?: string): Promise<number>;
  getContactInquiriesByUser(userId: string): Promise<ContactInquiry[]>;

  getCountryTaxRates(): Promise<CountryTaxRate[]>;
  getCountryTaxRate(countryCode: string): Promise<CountryTaxRate | undefined>;
  upsertCountryTaxRate(data: InsertCountryTaxRate): Promise<CountryTaxRate>;
  getShippingZones(): Promise<ShippingZone[]>;
  getShippingZone(originCode: string, destCode: string): Promise<ShippingZone | undefined>;
  upsertShippingZone(data: InsertShippingZone): Promise<ShippingZone>;

  // Mobile Money Payments
  createMobileMoneyPayment(payment: InsertMobileMoneyPayment): Promise<MobileMoneyPayment>;
  getMobileMoneyPayment(id: number): Promise<MobileMoneyPayment | undefined>;
  getMobileMoneyPaymentByRef(transactionRef: string): Promise<MobileMoneyPayment | undefined>;
  getMobileMoneyPaymentsByOrder(orderId: number): Promise<MobileMoneyPayment[]>;
  updateMobileMoneyPayment(id: number, data: Partial<MobileMoneyPayment>): Promise<MobileMoneyPayment | undefined>;

  // Group Buys
  createGroupBuy(data: InsertGroupBuy): Promise<GroupBuy>;
  getGroupBuy(id: number): Promise<(GroupBuy & { product: Product; organizer: UserProfile | null; participants: (GroupBuyParticipant & { user: UserProfile | null })[] }) | undefined>;
  getGroupBuysByProduct(productId: number): Promise<GroupBuy[]>;
  getActiveGroupBuys(limit?: number): Promise<(GroupBuy & { product: Product })[]>;
  getUserGroupBuys(userId: string): Promise<(GroupBuy & { product: Product })[]>;
  joinGroupBuy(data: InsertGroupBuyParticipant): Promise<GroupBuyParticipant>;
  updateGroupBuyStatus(id: number, status: string): Promise<GroupBuy | undefined>;
  updateGroupBuyCurrentQty(id: number, qty: number): Promise<GroupBuy | undefined>;

  // Pickup Points
  getPickupPoints(filters?: { countryCode?: string; city?: string }): Promise<PickupPoint[]>;
  getPickupPoint(id: number): Promise<PickupPoint | undefined>;
  createPickupPoint(data: InsertPickupPoint): Promise<PickupPoint>;

  // Delivery Tiers
  getDeliveryTiers(filters?: { countryCode?: string; city?: string }): Promise<DeliveryTier[]>;
  getDeliveryTier(id: number): Promise<DeliveryTier | undefined>;
  createDeliveryTier(data: InsertDeliveryTier): Promise<DeliveryTier>;

  // Express Corridors
  getExpressCorridors(filters?: { originCity?: string; originCountryCode?: string; destCity?: string; destCountryCode?: string }): Promise<ExpressCorridor[]>;
  getExpressCorridor(id: number): Promise<ExpressCorridor | undefined>;
  createExpressCorridor(data: InsertExpressCorridor): Promise<ExpressCorridor>;

  // AfCFTA Certificates
  createAfcftaCertificate(data: InsertAfcftaCertificate): Promise<AfcftaCertificate>;
  getAfcftaCertificate(id: number): Promise<AfcftaCertificate | undefined>;
  getAfcftaCertificatesByProduct(productId: number): Promise<AfcftaCertificate[]>;
  getAfcftaCertificatesBySeller(sellerId: string): Promise<AfcftaCertificate[]>;
  getAllAfcftaCertificates(status?: string): Promise<AfcftaCertificate[]>;
  updateAfcftaCertificate(id: number, data: Partial<AfcftaCertificate>): Promise<AfcftaCertificate | undefined>;

  // Referrals
  createReferral(data: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralsByUser(userId: string): Promise<Referral[]>;
  getUserReferralStats(userId: string): Promise<{ total: number; converted: number; rewarded: number; totalEarnings: string }>;
  updateReferral(id: number, data: Partial<Referral>): Promise<Referral | undefined>;

  // Social Posts
  createSocialPost(data: InsertSocialPost): Promise<SocialPost>;
  getSocialPosts(filters?: { platform?: string; status?: string; limit?: number }): Promise<SocialPost[]>;
  getSocialPost(id: number): Promise<SocialPost | undefined>;
  updateSocialPost(id: number, data: Partial<SocialPost>): Promise<SocialPost | undefined>;
  deleteSocialPost(id: number): Promise<void>;
  getScheduledPosts(): Promise<SocialPost[]>;

  // Marketing Automations
  createMarketingAutomation(data: InsertMarketingAutomation): Promise<MarketingAutomation>;
  getMarketingAutomations(): Promise<MarketingAutomation[]>;
  getMarketingAutomation(id: number): Promise<MarketingAutomation | undefined>;
  updateMarketingAutomation(id: number, data: Partial<MarketingAutomation>): Promise<MarketingAutomation | undefined>;
  deleteMarketingAutomation(id: number): Promise<void>;
  getDueAutomations(): Promise<MarketingAutomation[]>;

  // BNPL
  createBnplPlan(plan: InsertBnplPlan): Promise<BnplPlan>;
  getBnplPlan(id: number): Promise<BnplPlan | undefined>;
  getBnplPlansByBuyer(buyerId: string): Promise<BnplPlan[]>;
  updateBnplPlan(id: number, data: Partial<BnplPlan>): Promise<BnplPlan | undefined>;
  createBnplPayment(payment: InsertBnplPayment): Promise<BnplPayment>;
  getBnplPaymentsByPlan(planId: number): Promise<BnplPayment[]>;
  updateBnplPayment(id: number, data: Partial<BnplPayment>): Promise<BnplPayment | undefined>;

  // Trade Documents
  createTradeDocument(doc: InsertTradeDocument): Promise<TradeDocument>;
  getTradeDocumentsByOrder(orderId: number): Promise<TradeDocument[]>;
  getTradeDocument(id: number): Promise<TradeDocument | undefined>;

  // Storefronts
  createStorefront(sf: InsertStorefront): Promise<Storefront>;
  getStorefrontBySeller(sellerId: string): Promise<Storefront | undefined>;
  getStorefrontBySlug(slug: string): Promise<Storefront | undefined>;
  updateStorefront(id: number, data: Partial<Storefront>): Promise<Storefront | undefined>;

  // Commodity Prices
  createCommodityPrice(price: InsertCommodityPrice): Promise<CommodityPrice>;
  getCommodityPrices(): Promise<CommodityPrice[]>;
  getLatestCommodityPrices(): Promise<CommodityPrice[]>;
  createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert>;
  getPriceAlertsByUser(userId: string): Promise<PriceAlert[]>;
  updatePriceAlert(id: number, data: Partial<PriceAlert>): Promise<PriceAlert | undefined>;
  deletePriceAlert(id: number): Promise<void>;

  // Buyer Verifications
  createBuyerVerification(v: InsertBuyerVerification): Promise<BuyerVerification>;
  getBuyerVerification(buyerId: string): Promise<BuyerVerification | undefined>;
  getBuyerVerifications(): Promise<BuyerVerification[]>;
  updateBuyerVerification(id: number, data: Partial<BuyerVerification>): Promise<BuyerVerification | undefined>;

  // Forum
  createForumCategory(cat: InsertForumCategory): Promise<ForumCategory>;
  getForumCategories(): Promise<ForumCategory[]>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getForumPosts(categoryId?: number): Promise<ForumPost[]>;
  getForumPost(id: number): Promise<ForumPost | undefined>;
  updateForumPost(id: number, data: Partial<ForumPost>): Promise<ForumPost | undefined>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;
  getForumReplies(postId: number): Promise<ForumReply[]>;

  // Logistics Partners
  createLogisticsPartner(partner: InsertLogisticsPartner): Promise<LogisticsPartner>;
  getLogisticsPartners(): Promise<LogisticsPartner[]>;
  getLogisticsPartnersByCountry(country: string): Promise<LogisticsPartner[]>;
  createLogisticsBooking(booking: InsertLogisticsBooking): Promise<LogisticsBooking>;
  getLogisticsBookingsByOrder(orderId: number): Promise<LogisticsBooking[]>;

  // Trade Events
  createTradeEvent(event: InsertTradeEvent): Promise<TradeEvent>;
  getTradeEvents(): Promise<TradeEvent[]>;
  getActiveTradeEvents(): Promise<TradeEvent[]>;
  updateTradeEvent(id: number, data: Partial<TradeEvent>): Promise<TradeEvent | undefined>;
  createEventPromotion(promo: InsertEventPromotion): Promise<EventPromotion>;
  getEventPromotions(eventId: number): Promise<EventPromotion[]>;

  // Agricultural Exchange
  createAgriListing(listing: InsertAgriListing): Promise<AgriListing>;
  getAgriListings(): Promise<AgriListing[]>;
  getAgriListing(id: number): Promise<AgriListing | undefined>;
  updateAgriListing(id: number, data: Partial<AgriListing>): Promise<AgriListing | undefined>;
  createAgriBid(bid: InsertAgriBid): Promise<AgriBid>;
  getAgriBids(listingId: number): Promise<AgriBid[]>;

  // Live Sessions
  createLiveSession(session: InsertLiveSession): Promise<LiveSession>;
  getLiveSessions(): Promise<LiveSession[]>;
  getLiveSession(id: number): Promise<LiveSession | undefined>;
  updateLiveSession(id: number, data: Partial<LiveSession>): Promise<LiveSession | undefined>;
  createLiveSessionProduct(product: InsertLiveSessionProduct): Promise<LiveSessionProduct>;
  getLiveSessionProducts(sessionId: number): Promise<LiveSessionProduct[]>;
}

export class DatabaseStorage implements IStorage {
  // User Profiles
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return profile;
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [result] = await db
      .insert(userProfiles)
      .values(profile)
      .onConflictDoUpdate({
        target: userProfiles.id,
        set: { ...profile },
      })
      .returning();
    return result;
  }

  async getUserProfileBySlug(slug: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.storeSlug, slug));
    return profile;
  }

  async checkStoreSlugAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
    const conditions = [eq(userProfiles.storeSlug, slug)];
    if (excludeUserId) {
      const [existing] = await db.select().from(userProfiles).where(
        and(eq(userProfiles.storeSlug, slug), sql`${userProfiles.id} != ${excludeUserId}`)
      );
      return !existing;
    }
    const [existing] = await db.select().from(userProfiles).where(eq(userProfiles.storeSlug, slug));
    return !existing;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [result] = await db.select().from(categories).where(eq(categories.slug, slug));
    return result;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [result] = await db.select().from(categories).where(ilike(categories.name, name));
    return result;
  }

  async getOrCreateCategory(name: string): Promise<Category> {
    // Check if category already exists (case-insensitive)
    const existing = await this.getCategoryByName(name);
    if (existing) {
      return existing;
    }
    
    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Create new category
    const newCategory = await this.createCategory({
      name: name.trim(),
      slug,
      icon: null,
      parentId: null,
    });
    
    return newCategory;
  }

  // Products
  async getProducts(filters?: { country?: string; city?: string; categoryId?: number; search?: string; sellerId?: string; minPrice?: number; maxPrice?: number; condition?: string; sortBy?: string; limit?: number; offset?: number }): Promise<Product[]> {
    const conditions = [eq(products.isActive, true)];
    
    if (filters?.country) {
      conditions.push(eq(products.country, filters.country));
    }
    if (filters?.city) {
      conditions.push(eq(products.city, filters.city));
    }
    if (filters?.categoryId) {
      const subcats = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, filters.categoryId));
      if (subcats.length > 0) {
        const allCatIds = [filters.categoryId, ...subcats.map(s => s.id)];
        conditions.push(inArray(products.categoryId, allCatIds));
      } else {
        conditions.push(eq(products.categoryId, filters.categoryId));
      }
    }
    if (filters?.sellerId) {
      conditions.push(eq(products.sellerId, filters.sellerId));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.description, `%${filters.search}%`)
        )!
      );
    }
    if (filters?.minPrice !== undefined) {
      conditions.push(gte(products.price, String(filters.minPrice)));
    }
    if (filters?.maxPrice !== undefined) {
      conditions.push(lte(products.price, String(filters.maxPrice)));
    }
    if (filters?.condition && filters.condition !== "all") {
      conditions.push(eq(products.condition, filters.condition));
    }

    const queryLimit = filters?.limit ?? 50;
    const queryOffset = filters?.offset ?? 0;

    let orderByClause;
    switch (filters?.sortBy) {
      case "price_asc":
        orderByClause = asc(products.price);
        break;
      case "price_desc":
        orderByClause = desc(products.price);
        break;
      case "newest":
        orderByClause = desc(products.createdAt);
        break;
      case "popular":
        orderByClause = desc(products.views);
        break;
      default:
        orderByClause = desc(products.createdAt);
    }

    return db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(queryLimit)
      .offset(queryOffset);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductWithSeller(id: number): Promise<(Product & { seller: UserProfile | null }) | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(userProfiles, eq(products.sellerId, userProfiles.id))
      .where(eq(products.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.products,
      seller: result.user_profiles,
    };
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(8);
  }

  async getPopularProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.views))
      .limit(12);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(product).returning();
    return result;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [result] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return result;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async incrementProductViews(id: number): Promise<void> {
    await db
      .update(products)
      .set({ views: sql`${products.views} + 1` })
      .where(eq(products.id, id));
  }

  // Cart
  async getCartItems(userId: string): Promise<(CartItem & { product: Product | null })[]> {
    const results = await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    
    return results.map(r => ({
      ...r.cart_items,
      product: r.products,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));
    
    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }
    
    const [result] = await db.insert(cartItems).values(item).returning();
    return result;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [result] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return result;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Orders
  async getOrders(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
    const column = role === 'buyer' ? orders.buyerId : orders.sellerId;
    return db
      .select()
      .from(orders)
      .where(eq(column, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<(Order & { items: (OrderItem & { product: Product | null })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      items: items.map(i => ({
        ...i.order_items,
        product: i.products,
      })),
    };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order & { items: OrderItem[] }> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    const orderItemsWithOrderId = items.map(item => ({
      ...item,
      orderId: newOrder.id,
    }));
    
    const insertedItems = await db.insert(orderItems).values(orderItemsWithOrderId).returning();
    
    return { ...newOrder, items: insertedItems };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [result] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result;
  }

  // Messages (legacy)
  async getConversations(userId: string): Promise<{ partnerId: string; partner: UserProfile | null; lastMessage: Message; unreadCount: number }[]> {
    const allMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    const conversationMap = new Map<string, { lastMessage: Message; unreadCount: number }>();

    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationMap.get(partnerId)!;
        conv.unreadCount++;
      }
    }

    const convs = [];
    const entries = Array.from(conversationMap.entries());
    for (const [partnerId, data] of entries) {
      const [partner] = await db.select().from(userProfiles).where(eq(userProfiles.id, partnerId));
      convs.push({
        partnerId,
        partner: partner || null,
        ...data,
      });
    }

    return convs;
  }

  async getMessages(userId: string, partnerId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, partnerId)),
          and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async markMessagesAsRead(userId: string, partnerId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.senderId, partnerId), eq(messages.receiverId, userId)));
  }

  // ============ WALLETS ============
  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [result] = await db.insert(wallets).values(wallet).returning();
    return result;
  }

  async updateWalletBalance(userId: string, amount: number, type: 'credit' | 'debit'): Promise<Wallet | undefined> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return undefined;

    const currentBalance = Number(wallet.balance);
    const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;

    const [result] = await db
      .update(wallets)
      .set({ balance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(wallets.userId, userId))
      .returning();
    return result;
  }

  async getWalletTransactions(walletId: number): Promise<WalletTransaction[]> {
    return db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, walletId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [result] = await db.insert(walletTransactions).values(transaction).returning();
    return result;
  }

  // ============ PAYMENT INTENTS ============
  async createPaymentIntent(intent: InsertPaymentIntent): Promise<PaymentIntent> {
    const [result] = await db.insert(paymentIntents).values(intent).returning();
    return result;
  }

  async getPaymentIntent(id: number): Promise<PaymentIntent | undefined> {
    const [result] = await db.select().from(paymentIntents).where(eq(paymentIntents.id, id));
    return result;
  }

  async getPaymentIntentByOrder(orderId: number): Promise<PaymentIntent | undefined> {
    const [result] = await db.select().from(paymentIntents).where(eq(paymentIntents.orderId, orderId));
    return result;
  }

  async updatePaymentIntent(id: number, data: Partial<PaymentIntent>): Promise<PaymentIntent | undefined> {
    const [result] = await db
      .update(paymentIntents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentIntents.id, id))
      .returning();
    return result;
  }

  // ============ ESCROW ============
  async createEscrow(escrow: InsertEscrow): Promise<Escrow> {
    const [result] = await db.insert(escrowTransactions).values(escrow).returning();
    return result;
  }

  async getEscrow(orderId: number): Promise<Escrow | undefined> {
    const [result] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.orderId, orderId));
    return result;
  }

  async updateEscrow(orderId: number, data: Partial<Escrow>): Promise<Escrow | undefined> {
    const [result] = await db
      .update(escrowTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(escrowTransactions.orderId, orderId))
      .returning();
    return result;
  }

  async addEscrowMilestone(orderId: number, milestone: string): Promise<Escrow | undefined> {
    const escrow = await this.getEscrow(orderId);
    if (!escrow) return undefined;

    const milestones = [...(escrow.milestones || []), milestone];
    return this.updateEscrow(orderId, { milestones });
  }

  async releaseEscrow(orderId: number): Promise<Escrow | undefined> {
    return this.updateEscrow(orderId, {
      status: 'released',
      releasedAt: new Date(),
    });
  }

  // ============ SHIPMENTS ============
  async createShipment(shipment: InsertShipment): Promise<Shipment> {
    const trackingNum = `PAIDM${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const [result] = await db.insert(shipments).values({
      ...shipment,
      trackingNumber: trackingNum,
    }).returning();
    return result;
  }

  async getShipment(id: number): Promise<Shipment | undefined> {
    const [result] = await db.select().from(shipments).where(eq(shipments.id, id));
    return result;
  }

  async getShipmentByOrder(orderId: number): Promise<Shipment | undefined> {
    const [result] = await db.select().from(shipments).where(eq(shipments.orderId, orderId));
    return result;
  }

  async getShipmentByTracking(trackingNumber: string): Promise<(Shipment & { events: TrackingEvent[] }) | undefined> {
    const [shipment] = await db.select().from(shipments).where(eq(shipments.trackingNumber, trackingNumber));
    if (!shipment) return undefined;

    const events = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.shipmentId, shipment.id))
      .orderBy(desc(trackingEvents.timestamp));

    return { ...shipment, events };
  }

  async getShipmentsBySeller(sellerId: string): Promise<Shipment[]> {
    return db.select().from(shipments).where(eq(shipments.sellerId, sellerId)).orderBy(desc(shipments.createdAt));
  }

  async getShipmentsByBuyer(buyerId: string): Promise<Shipment[]> {
    return db.select().from(shipments).where(eq(shipments.buyerId, buyerId)).orderBy(desc(shipments.createdAt));
  }

  async getStaleShipments(hoursThreshold: number): Promise<Shipment[]> {
    const cutoff = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
    const activeShipments = await db.select().from(shipments).where(
      and(
        not(eq(shipments.status, 'delivered')),
        not(eq(shipments.status, 'returned')),
        not(eq(shipments.status, 'order_confirmed')),
        not(eq(shipments.status, 'pending')),
      )
    );

    const stale: Shipment[] = [];
    for (const shipment of activeShipments) {
      const events = await db
        .select()
        .from(trackingEvents)
        .where(eq(trackingEvents.shipmentId, shipment.id))
        .orderBy(desc(trackingEvents.timestamp))
        .limit(1);

      if (events.length === 0 || (events[0].timestamp && events[0].timestamp < cutoff)) {
        stale.push(shipment);
      }
    }
    return stale;
  }

  async updateShipment(id: number, data: Partial<Shipment>): Promise<Shipment | undefined> {
    const [result] = await db
      .update(shipments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shipments.id, id))
      .returning();
    return result;
  }

  async addTrackingEvent(event: InsertTrackingEvent): Promise<TrackingEvent> {
    const [result] = await db.insert(trackingEvents).values(event).returning();
    return result;
  }

  async getTrackingEvents(shipmentId: number): Promise<TrackingEvent[]> {
    return db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.shipmentId, shipmentId))
      .orderBy(desc(trackingEvents.timestamp));
  }

  // ============ PROOF OF DELIVERY ============
  async createProofOfDelivery(pod: InsertProofOfDelivery): Promise<ProofOfDelivery> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const [result] = await db.insert(proofOfDelivery).values({ ...pod, otp }).returning();
    return result;
  }

  async getProofOfDelivery(shipmentId: number): Promise<ProofOfDelivery | undefined> {
    const [result] = await db.select().from(proofOfDelivery).where(eq(proofOfDelivery.shipmentId, shipmentId));
    return result;
  }

  async verifyProofOfDelivery(shipmentId: number, otp: string): Promise<ProofOfDelivery | undefined> {
    const pod = await this.getProofOfDelivery(shipmentId);
    if (!pod || pod.otp !== otp) return undefined;

    const [result] = await db
      .update(proofOfDelivery)
      .set({ otpVerified: true, verifiedAt: new Date() })
      .where(eq(proofOfDelivery.shipmentId, shipmentId))
      .returning();
    return result;
  }

  // ============ DISPUTES ============
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [result] = await db.insert(disputes).values(dispute).returning();
    return result;
  }

  async getDispute(id: number): Promise<Dispute | undefined> {
    const [result] = await db.select().from(disputes).where(eq(disputes.id, id));
    return result;
  }

  async getDisputeByOrder(orderId: number): Promise<Dispute | undefined> {
    const [result] = await db.select().from(disputes).where(eq(disputes.orderId, orderId));
    return result;
  }

  async getUserDisputes(userId: string): Promise<Dispute[]> {
    return db
      .select()
      .from(disputes)
      .where(or(eq(disputes.initiatorId, userId), eq(disputes.respondentId, userId)))
      .orderBy(desc(disputes.createdAt));
  }

  async updateDispute(id: number, data: Partial<Dispute>): Promise<Dispute | undefined> {
    const [result] = await db
      .update(disputes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(disputes.id, id))
      .returning();
    return result;
  }

  async resolveDispute(id: number, resolution: string, resolvedBy: string, notes?: string): Promise<Dispute | undefined> {
    const [result] = await db
      .update(disputes)
      .set({
        status: 'resolved',
        resolution,
        resolvedBy,
        resolutionNotes: notes,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(disputes.id, id))
      .returning();
    return result;
  }

  // ============ ENHANCED CHAT ============
  async createConversation(conv: InsertConversation, participantIds: string[]): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(conv).returning();
    
    const participants = participantIds.map(userId => ({
      conversationId: conversation.id,
      userId,
    }));
    await db.insert(conversationParticipants).values(participants);
    
    return conversation;
  }

  async getConversationById(id: number): Promise<(Conversation & { participants: ConversationParticipant[] }) | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conversation) return undefined;

    const participants = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, id));

    return { ...conversation, participants };
  }

  async getUserConversations(userId: string): Promise<(Conversation & { participants: ConversationParticipant[]; lastMessage?: ChatMessage })[]> {
    const userParticipations = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId));

    const convIds = userParticipations.map(p => p.conversationId);
    if (convIds.length === 0) return [];

    const convs = await db
      .select()
      .from(conversations)
      .where(inArray(conversations.id, convIds))
      .orderBy(desc(conversations.updatedAt));

    const result = [];
    for (const conv of convs) {
      const participants = await db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conv.id));

      const [lastMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, conv.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      result.push({ ...conv, participants, lastMessage });
    }

    return result;
  }

  async findConversation(participantIds: string[], orderId?: number): Promise<Conversation | undefined> {
    if (orderId) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.orderId, orderId));
      if (conv) return conv;
    }

    const allConvs = await db.select().from(conversations);
    for (const conv of allConvs) {
      const participants = await db
        .select()
        .from(conversationParticipants)
        .where(eq(conversationParticipants.conversationId, conv.id));
      
      const convParticipantIds = participants.map(p => p.userId).sort();
      const targetIds = [...participantIds].sort();
      
      if (convParticipantIds.length === targetIds.length &&
          convParticipantIds.every((id, i) => id === targetIds[i])) {
        return conv;
      }
    }

    return undefined;
  }

  async sendChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [result] = await db.insert(chatMessages).values(message).returning();
    
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return result;
  }

  async getChatMessages(conversationId: number): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(asc(chatMessages.createdAt));
  }

  async markChatMessagesRead(conversationId: number, userId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.conversationId, conversationId),
          sql`${chatMessages.senderId} != ${userId}`
        )
      );

    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  }

  // ============ DROPSHIP APPLICATIONS ============
  async createDropshipApplication(app: InsertDropshipApplication): Promise<DropshipApplication> {
    const [result] = await db.insert(dropshipApplications).values(app).returning();
    return result;
  }

  async getDropshipApplication(id: number): Promise<DropshipApplication | undefined> {
    const [result] = await db.select().from(dropshipApplications).where(eq(dropshipApplications.id, id));
    return result;
  }

  async getDropshipApplicationByUser(userId: string): Promise<DropshipApplication | undefined> {
    const [result] = await db.select().from(dropshipApplications)
      .where(eq(dropshipApplications.userId, userId))
      .orderBy(desc(dropshipApplications.createdAt))
      .limit(1);
    return result;
  }

  async updateDropshipApplication(id: number, data: Partial<InsertDropshipApplication>): Promise<DropshipApplication | undefined> {
    const [result] = await db.update(dropshipApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dropshipApplications.id, id))
      .returning();
    return result;
  }

  async submitDropshipApplication(id: number): Promise<DropshipApplication | undefined> {
    const [result] = await db.update(dropshipApplications)
      .set({ status: 'submitted', submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(dropshipApplications.id, id))
      .returning();
    return result;
  }

  async decideDropshipApplication(id: number, status: 'approved' | 'rejected', decidedBy: string, notes?: string, rejectionReason?: string): Promise<DropshipApplication | undefined> {
    const updateData: Partial<DropshipApplication> = {
      status,
      decidedAt: new Date(),
      decidedBy,
      updatedAt: new Date(),
    };
    if (notes) updateData.adminNotes = notes;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const [result] = await db.update(dropshipApplications)
      .set(updateData)
      .where(eq(dropshipApplications.id, id))
      .returning();

    if (result && status === 'approved') {
      const roleMap: Record<string, string> = { supplier: 'manufacturer', reseller: 'trader' };
      const newRole = roleMap[result.applicationType];
      if (newRole) {
        await db.update(userProfiles)
          .set({ role: newRole })
          .where(eq(userProfiles.id, result.userId));
      }
    }

    return result;
  }

  async getDropshipApplicationsByStatus(status?: string): Promise<(DropshipApplication & { user?: UserProfile })[]> {
    let apps: DropshipApplication[];
    if (status) {
      apps = await db.select().from(dropshipApplications)
        .where(eq(dropshipApplications.status, status))
        .orderBy(desc(dropshipApplications.createdAt));
    } else {
      apps = await db.select().from(dropshipApplications)
        .orderBy(desc(dropshipApplications.createdAt));
    }

    const result: (DropshipApplication & { user?: UserProfile })[] = [];
    for (const app of apps) {
      const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, app.userId));
      result.push({ ...app, user: profile });
    }
    return result;
  }

  // ============ SHIPPER APPLICATIONS ============
  async createShipperApplication(app: InsertShipperApplication): Promise<ShipperApplication> {
    const [result] = await db.insert(shipperApplications).values(app).returning();
    return result;
  }

  async getShipperApplication(id: number): Promise<ShipperApplication | undefined> {
    const [result] = await db.select().from(shipperApplications).where(eq(shipperApplications.id, id));
    return result;
  }

  async getShipperApplicationByUser(userId: string): Promise<ShipperApplication | undefined> {
    const [result] = await db.select().from(shipperApplications)
      .where(eq(shipperApplications.userId, userId))
      .orderBy(desc(shipperApplications.createdAt))
      .limit(1);
    return result;
  }

  async updateShipperApplication(id: number, data: Partial<InsertShipperApplication>): Promise<ShipperApplication | undefined> {
    const [result] = await db.update(shipperApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(shipperApplications.id, id))
      .returning();
    return result;
  }

  async submitShipperApplication(id: number): Promise<ShipperApplication | undefined> {
    const [result] = await db.update(shipperApplications)
      .set({ status: 'submitted', submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(shipperApplications.id, id))
      .returning();
    return result;
  }

  async decideShipperApplication(id: number, status: 'approved' | 'rejected', decidedBy: string, notes?: string, rejectionReason?: string): Promise<ShipperApplication | undefined> {
    const updateData: Partial<ShipperApplication> = {
      status,
      decidedAt: new Date(),
      decidedBy,
      updatedAt: new Date(),
    };
    if (notes) updateData.adminNotes = notes;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const [result] = await db.update(shipperApplications)
      .set(updateData)
      .where(eq(shipperApplications.id, id))
      .returning();

    if (result && status === 'approved') {
      await db.update(userProfiles)
        .set({ role: 'shipper' })
        .where(eq(userProfiles.id, result.userId));
    }

    return result;
  }

  async getShipperApplicationsByStatus(status?: string): Promise<(ShipperApplication & { user?: UserProfile })[]> {
    let apps: ShipperApplication[];
    if (status) {
      apps = await db.select().from(shipperApplications)
        .where(eq(shipperApplications.status, status))
        .orderBy(desc(shipperApplications.createdAt));
    } else {
      apps = await db.select().from(shipperApplications)
        .orderBy(desc(shipperApplications.createdAt));
    }

    const result: (ShipperApplication & { user?: UserProfile })[] = [];
    for (const app of apps) {
      const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, app.userId));
      result.push({ ...app, user: profile });
    }
    return result;
  }

  async getApprovedShippers(region?: string): Promise<ShipperApplication[]> {
    const apps = await db.select().from(shipperApplications)
      .where(eq(shipperApplications.status, 'approved'));

    if (region) {
      return apps.filter(a => a.serviceRegions?.includes(region));
    }
    return apps;
  }

  async getShipperAssignments(courierId: string): Promise<Shipment[]> {
    return db.select().from(shipments)
      .where(eq(shipments.courierId, courierId))
      .orderBy(desc(shipments.createdAt));
  }

  async getAvailableShipments(regions: string[]): Promise<Shipment[]> {
    const allUnassigned = await db.select().from(shipments)
      .where(eq(shipments.courierStatus, 'unassigned'))
      .orderBy(desc(shipments.createdAt));

    if (!regions.length) return allUnassigned;
    return allUnassigned;
  }

  // ============ DROPSHIP OFFERS ============
  async createDropshipOffer(offer: InsertDropshipOffer): Promise<DropshipOffer> {
    const [result] = await db.insert(dropshipOffers).values(offer).returning();
    return result;
  }

  async getDropshipOffer(id: number): Promise<(DropshipOffer & { product: Product }) | undefined> {
    const [offer] = await db.select().from(dropshipOffers).where(eq(dropshipOffers.id, id));
    if (!offer) return undefined;
    
    const [product] = await db.select().from(products).where(eq(products.id, offer.productId));
    return { ...offer, product };
  }

  async getSupplierOffers(supplierId: string): Promise<(DropshipOffer & { product: Product })[]> {
    const offers = await db.select().from(dropshipOffers).where(eq(dropshipOffers.supplierId, supplierId));
    const result: (DropshipOffer & { product: Product })[] = [];
    
    for (const offer of offers) {
      const [product] = await db.select().from(products).where(eq(products.id, offer.productId));
      if (product) {
        result.push({ ...offer, product });
      }
    }
    return result;
  }

  async getDropshipCatalog(filters?: { region?: string; search?: string }): Promise<(DropshipOffer & { product: Product; supplier: UserProfile })[]> {
    let offers = await db.select().from(dropshipOffers).where(eq(dropshipOffers.isActive, true));
    
    const result: (DropshipOffer & { product: Product; supplier: UserProfile })[] = [];
    
    for (const offer of offers) {
      if (filters?.region && offer.serviceRegions && !offer.serviceRegions.includes(filters.region)) {
        continue;
      }
      
      const [product] = await db.select().from(products).where(eq(products.id, offer.productId));
      if (!product) continue;
      
      if (filters?.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        continue;
      }
      
      const [supplier] = await db.select().from(userProfiles).where(eq(userProfiles.id, offer.supplierId));
      if (supplier) {
        result.push({ ...offer, product, supplier });
      }
    }
    
    return result;
  }

  async updateDropshipOffer(id: number, data: Partial<InsertDropshipOffer>): Promise<DropshipOffer | undefined> {
    const [result] = await db
      .update(dropshipOffers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dropshipOffers.id, id))
      .returning();
    return result;
  }

  async deleteDropshipOffer(id: number): Promise<void> {
    await db.delete(dropshipOffers).where(eq(dropshipOffers.id, id));
  }

  // ============ DROPSHIP LISTINGS ============
  async createDropshipListing(listing: InsertDropshipListing): Promise<DropshipListing> {
    const [result] = await db.insert(dropshipListings).values(listing).returning();
    return result;
  }

  async getDropshipListing(id: number): Promise<(DropshipListing & { offer: DropshipOffer & { product: Product } }) | undefined> {
    const [listing] = await db.select().from(dropshipListings).where(eq(dropshipListings.id, id));
    if (!listing) return undefined;
    
    const [offer] = await db.select().from(dropshipOffers).where(eq(dropshipOffers.id, listing.offerId));
    if (!offer) return undefined;
    
    const [product] = await db.select().from(products).where(eq(products.id, offer.productId));
    if (!product) return undefined;
    
    return { ...listing, offer: { ...offer, product } };
  }

  async getResellerListings(resellerId: string): Promise<(DropshipListing & { offer: DropshipOffer & { product: Product } })[]> {
    const listings = await db.select().from(dropshipListings).where(eq(dropshipListings.resellerId, resellerId));
    const result: (DropshipListing & { offer: DropshipOffer & { product: Product } })[] = [];
    
    for (const listing of listings) {
      const [offer] = await db.select().from(dropshipOffers).where(eq(dropshipOffers.id, listing.offerId));
      if (!offer) continue;
      
      const [product] = await db.select().from(products).where(eq(products.id, offer.productId));
      if (!product) continue;
      
      result.push({ ...listing, offer: { ...offer, product } });
    }
    
    return result;
  }

  async updateDropshipListing(id: number, data: Partial<InsertDropshipListing>): Promise<DropshipListing | undefined> {
    const [result] = await db
      .update(dropshipListings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dropshipListings.id, id))
      .returning();
    return result;
  }

  async deleteDropshipListing(id: number): Promise<void> {
    await db.delete(dropshipListings).where(eq(dropshipListings.id, id));
  }

  // ============ DROPSHIP FULFILLMENTS ============
  async createDropshipFulfillment(fulfillment: InsertDropshipFulfillment): Promise<DropshipFulfillment> {
    const [result] = await db.insert(dropshipFulfillments).values(fulfillment).returning();
    return result;
  }

  async getDropshipFulfillment(id: number): Promise<DropshipFulfillment | undefined> {
    const [result] = await db.select().from(dropshipFulfillments).where(eq(dropshipFulfillments.id, id));
    return result;
  }

  async getDropshipFulfillmentByOrder(orderId: number): Promise<DropshipFulfillment[]> {
    return db.select().from(dropshipFulfillments).where(eq(dropshipFulfillments.orderId, orderId));
  }

  async getSupplierFulfillments(supplierId: string): Promise<(DropshipFulfillment & { listing: DropshipListing })[]> {
    const fulfillments = await db.select().from(dropshipFulfillments).where(eq(dropshipFulfillments.supplierId, supplierId));
    const result: (DropshipFulfillment & { listing: DropshipListing })[] = [];
    
    for (const fulfillment of fulfillments) {
      const [listing] = await db.select().from(dropshipListings).where(eq(dropshipListings.id, fulfillment.listingId));
      if (listing) {
        result.push({ ...fulfillment, listing });
      }
    }
    
    return result;
  }

  async getResellerFulfillments(resellerId: string): Promise<DropshipFulfillment[]> {
    return db.select().from(dropshipFulfillments).where(eq(dropshipFulfillments.resellerId, resellerId));
  }

  async updateDropshipFulfillmentStatus(id: number, status: string): Promise<DropshipFulfillment | undefined> {
    const updateData: Partial<DropshipFulfillment> = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (status === 'acknowledged') {
      updateData.supplierAckedAt = new Date();
    } else if (status === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date();
    }
    
    const [result] = await db
      .update(dropshipFulfillments)
      .set(updateData)
      .where(eq(dropshipFulfillments.id, id))
      .returning();
    return result;
  }

  async findDropshipListingByResellerAndProduct(resellerId: string, productId: number): Promise<(DropshipListing & { offer: DropshipOffer }) | undefined> {
    const listings = await db.select().from(dropshipListings).where(eq(dropshipListings.resellerId, resellerId));
    
    for (const listing of listings) {
      const [offer] = await db.select().from(dropshipOffers).where(eq(dropshipOffers.id, listing.offerId));
      if (offer && offer.productId === productId) {
        return { ...listing, offer };
      }
    }
    
    return undefined;
  }

  // ============ ADMIN ============
  async getAllUserProfiles(): Promise<UserProfile[]> {
    return db.select().from(userProfiles).orderBy(desc(userProfiles.createdAt));
  }

  async updateUserProfile(id: string, data: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const [result] = await db
      .update(userProfiles)
      .set(data)
      .where(eq(userProfiles.id, id))
      .returning();
    return result;
  }

  async setUserDisabled(id: string, isDisabled: boolean): Promise<UserProfile | undefined> {
    const [result] = await db
      .update(userProfiles)
      .set({ isDisabled })
      .where(eq(userProfiles.id, id))
      .returning();
    return result;
  }

  // ============ RFQ (Request for Quotation) ============
  async createRfq(rfq: InsertRfq): Promise<Rfq> {
    const [result] = await db.insert(rfqs).values(rfq).returning();
    return result;
  }

  async getRfq(id: number): Promise<Rfq | undefined> {
    const [result] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return result;
  }

  async getUserRfqs(userId: string): Promise<Rfq[]> {
    return db.select().from(rfqs).where(eq(rfqs.userId, userId)).orderBy(desc(rfqs.createdAt));
  }

  async getSellerRfqs(sellerId: string): Promise<(Rfq & { user: UserProfile | null })[]> {
    const results = await db
      .select()
      .from(rfqs)
      .leftJoin(userProfiles, eq(rfqs.userId, userProfiles.id))
      .where(eq(rfqs.sellerId, sellerId))
      .orderBy(desc(rfqs.createdAt));

    return results.map(r => ({
      ...r.rfqs,
      user: r.user_profiles,
    }));
  }

  async getOpenRfqs(): Promise<(Rfq & { user: UserProfile | null })[]> {
    const results = await db
      .select()
      .from(rfqs)
      .leftJoin(userProfiles, eq(rfqs.userId, userProfiles.id))
      .where(eq(rfqs.status, 'open'))
      .orderBy(desc(rfqs.createdAt));
    
    return results.map(r => ({
      ...r.rfqs,
      user: r.user_profiles,
    }));
  }

  async updateRfqStatus(id: number, status: string): Promise<Rfq | undefined> {
    const [result] = await db
      .update(rfqs)
      .set({ status, updatedAt: new Date() })
      .where(eq(rfqs.id, id))
      .returning();
    return result;
  }

  async createRfqQuote(quote: InsertRfqQuote): Promise<RfqQuote> {
    const [result] = await db.insert(rfqQuotes).values(quote).returning();
    return result;
  }

  async getRfqQuotes(rfqId: number): Promise<(RfqQuote & { supplier: UserProfile | null })[]> {
    const results = await db
      .select()
      .from(rfqQuotes)
      .leftJoin(userProfiles, eq(rfqQuotes.supplierId, userProfiles.id))
      .where(eq(rfqQuotes.rfqId, rfqId))
      .orderBy(desc(rfqQuotes.createdAt));
    
    return results.map(r => ({
      ...r.rfq_quotes,
      supplier: r.user_profiles,
    }));
  }

  async updateRfqQuoteStatus(id: number, status: string): Promise<RfqQuote | undefined> {
    const [result] = await db
      .update(rfqQuotes)
      .set({ status })
      .where(eq(rfqQuotes.id, id))
      .returning();
    return result;
  }

  // ============ WISHLIST ============
  async getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product | null })[]> {
    const results = await db
      .select()
      .from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId))
      .orderBy(desc(wishlistItems.createdAt));
    
    return results.map(r => ({
      ...r.wishlist_items,
      product: r.products,
    }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, item.userId), eq(wishlistItems.productId, item.productId)));
    
    if (existing) {
      return existing;
    }
    
    const [result] = await db.insert(wishlistItems).values(item).returning();
    return result;
  }

  async removeFromWishlist(id: number): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }

  async removeFromWishlistByProduct(userId: string, productId: number): Promise<void> {
    await db.delete(wishlistItems).where(
      and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))
    );
  }

  async isInWishlist(userId: string, productId: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return !!existing;
  }

  // ============ ADVERTISEMENTS ============
  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [result] = await db.insert(advertisements).values(ad).returning();
    return result;
  }

  async getAdvertisement(id: number): Promise<(Advertisement & { product: Product }) | undefined> {
    const results = await db
      .select()
      .from(advertisements)
      .innerJoin(products, eq(advertisements.productId, products.id))
      .where(eq(advertisements.id, id));
    
    if (!results[0]) return undefined;
    return {
      ...results[0].advertisements,
      product: results[0].products,
    };
  }

  async getSellerAdvertisements(sellerId: string): Promise<(Advertisement & { product: Product })[]> {
    const results = await db
      .select()
      .from(advertisements)
      .innerJoin(products, eq(advertisements.productId, products.id))
      .where(eq(advertisements.sellerId, sellerId))
      .orderBy(desc(advertisements.createdAt));
    
    return results.map(r => ({
      ...r.advertisements,
      product: r.products,
    }));
  }

  async getActiveAdvertisements(): Promise<(Advertisement & { product: Product; seller: UserProfile | null })[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(advertisements)
      .innerJoin(products, eq(advertisements.productId, products.id))
      .leftJoin(userProfiles, eq(advertisements.sellerId, userProfiles.id))
      .where(and(
        eq(advertisements.status, 'active'),
        sql`${advertisements.startDate} <= ${now}`,
        sql`${advertisements.endDate} >= ${now}`
      ))
      .orderBy(desc(advertisements.packageType));
    
    return results.map(r => ({
      ...r.advertisements,
      product: r.products,
      seller: r.user_profiles,
    }));
  }

  async updateAdvertisement(id: number, data: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [result] = await db
      .update(advertisements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return result;
  }

  async deleteAdvertisement(id: number): Promise<void> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }

  async incrementAdImpressions(id: number): Promise<void> {
    await db
      .update(advertisements)
      .set({ impressions: sql`${advertisements.impressions} + 1` })
      .where(eq(advertisements.id, id));
  }

  async incrementAdClicks(id: number): Promise<void> {
    await db
      .update(advertisements)
      .set({ clicks: sql`${advertisements.clicks} + 1` })
      .where(eq(advertisements.id, id));
  }

  // ============ TRADE EXPO ADS ============
  async createTradeExpoAd(ad: InsertTradeExpoAd): Promise<TradeExpoAd> {
    const [result] = await db.insert(tradeExpoAds).values(ad).returning();
    return result;
  }

  async getTradeExpoAd(id: number): Promise<TradeExpoAd | undefined> {
    const [result] = await db.select().from(tradeExpoAds).where(eq(tradeExpoAds.id, id));
    return result;
  }

  async getActiveTradeExpoAds(): Promise<TradeExpoAd[]> {
    const now = new Date();
    return db.select().from(tradeExpoAds).where(
      and(
        eq(tradeExpoAds.status, 'active'),
        lte(tradeExpoAds.startDate, now),
        gte(tradeExpoAds.endDate, now)
      )
    ).orderBy(desc(tradeExpoAds.createdAt));
  }

  async getAllTradeExpoAds(): Promise<TradeExpoAd[]> {
    return db.select().from(tradeExpoAds).orderBy(desc(tradeExpoAds.createdAt));
  }

  async updateTradeExpoAd(id: number, data: Partial<InsertTradeExpoAd>): Promise<TradeExpoAd | undefined> {
    const [result] = await db.update(tradeExpoAds).set(data).where(eq(tradeExpoAds.id, id)).returning();
    return result;
  }

  async deleteTradeExpoAd(id: number): Promise<void> {
    await db.delete(tradeExpoAds).where(eq(tradeExpoAds.id, id));
  }

  async getTradeExpoAdByStripeSession(sessionId: string): Promise<TradeExpoAd | undefined> {
    const [result] = await db.select().from(tradeExpoAds).where(eq(tradeExpoAds.stripeSessionId, sessionId));
    return result;
  }

  // ============ AD SUBSCRIPTIONS ============
  async createAdSubscription(sub: InsertAdSubscription): Promise<AdSubscription> {
    const [result] = await db.insert(adSubscriptions).values(sub).returning();
    return result;
  }

  async getAdSubscription(sellerId: string): Promise<AdSubscription | undefined> {
    const [result] = await db
      .select()
      .from(adSubscriptions)
      .where(eq(adSubscriptions.sellerId, sellerId));
    return result;
  }

  async getAdSubscriptionByStripeId(stripeSubscriptionId: string): Promise<AdSubscription | undefined> {
    const [result] = await db
      .select()
      .from(adSubscriptions)
      .where(eq(adSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return result;
  }

  async updateAdSubscription(id: number, data: Partial<InsertAdSubscription>): Promise<AdSubscription | undefined> {
    const [result] = await db
      .update(adSubscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adSubscriptions.id, id))
      .returning();
    return result;
  }

  // ============ ADMIN METHODS ============
  async getAllProducts(): Promise<(Product & { seller: UserProfile | null })[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(userProfiles, eq(products.sellerId, userProfiles.id))
      .orderBy(desc(products.createdAt));
    
    return results.map(r => ({
      ...r.products,
      seller: r.user_profiles,
    }));
  }

  async getAllOrders(): Promise<(Order & { buyer: UserProfile | null; seller: UserProfile | null })[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    
    if (allOrders.length === 0) return [];
    
    const userIds = Array.from(new Set(allOrders.flatMap(o => [o.buyerId, o.sellerId])));
    const profiles = await db.select().from(userProfiles).where(inArray(userProfiles.id, userIds));
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    
    return allOrders.map(order => ({
      ...order,
      buyer: profileMap.get(order.buyerId) || null,
      seller: profileMap.get(order.sellerId) || null,
    }));
  }

  async getAllDisputes(): Promise<(Dispute & { initiator: UserProfile | null; respondent: UserProfile | null })[]> {
    const allDisputes = await db.select().from(disputes).orderBy(desc(disputes.createdAt));
    
    if (allDisputes.length === 0) return [];
    
    const userIds = Array.from(new Set(allDisputes.flatMap(d => [d.initiatorId, d.respondentId])));
    const profiles = await db.select().from(userProfiles).where(inArray(userProfiles.id, userIds));
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    
    return allDisputes.map(dispute => ({
      ...dispute,
      initiator: profileMap.get(dispute.initiatorId) || null,
      respondent: profileMap.get(dispute.respondentId) || null,
    }));
  }

  async getAllAdvertisements(): Promise<(Advertisement & { product: Product; seller: UserProfile | null })[]> {
    const results = await db
      .select()
      .from(advertisements)
      .innerJoin(products, eq(advertisements.productId, products.id))
      .leftJoin(userProfiles, eq(advertisements.sellerId, userProfiles.id))
      .orderBy(desc(advertisements.createdAt));
    
    return results.map(r => ({
      ...r.advertisements,
      product: r.products,
      seller: r.user_profiles,
    }));
  }

  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [result] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return result;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getAdminStats(): Promise<{ users: number; products: number; orders: number; disputes: number; advertisements: number; revenue: string }> {
    const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(userProfiles);
    const [productsCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [ordersCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const [disputesCount] = await db.select({ count: sql<number>`count(*)` }).from(disputes);
    const [adsCount] = await db.select({ count: sql<number>`count(*)` }).from(advertisements);
    const [revenueResult] = await db.select({ total: sql<string>`COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0)` }).from(orders).where(eq(orders.status, 'delivered'));
    
    return {
      users: Number(usersCount?.count || 0),
      products: Number(productsCount?.count || 0),
      orders: Number(ordersCount?.count || 0),
      disputes: Number(disputesCount?.count || 0),
      advertisements: Number(adsCount?.count || 0),
      revenue: revenueResult?.total || '0',
    };
  }

  // Business Documents
  async createBusinessDocument(doc: InsertBusinessDocument): Promise<BusinessDocument> {
    const [result] = await db.insert(businessDocuments).values(doc).returning();
    return result;
  }

  async getBusinessDocument(id: number): Promise<BusinessDocument | undefined> {
    const [doc] = await db.select().from(businessDocuments).where(eq(businessDocuments.id, id));
    return doc;
  }

  async getUserBusinessDocuments(userId: string): Promise<BusinessDocument[]> {
    return db.select().from(businessDocuments)
      .where(eq(businessDocuments.userId, userId))
      .orderBy(desc(businessDocuments.createdAt));
  }

  async getPublicBusinessDocuments(userId: string): Promise<BusinessDocument[]> {
    return db.select().from(businessDocuments)
      .where(and(
        eq(businessDocuments.userId, userId),
        eq(businessDocuments.isPublic, true)
      ))
      .orderBy(desc(businessDocuments.createdAt));
  }

  async updateBusinessDocument(id: number, data: Partial<InsertBusinessDocument>): Promise<BusinessDocument | undefined> {
    const [result] = await db
      .update(businessDocuments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businessDocuments.id, id))
      .returning();
    return result;
  }

  async deleteBusinessDocument(id: number): Promise<void> {
    await db.delete(businessDocuments).where(eq(businessDocuments.id, id));
  }

  async verifyBusinessDocument(id: number, isVerified: boolean): Promise<BusinessDocument | undefined> {
    const [result] = await db
      .update(businessDocuments)
      .set({ isVerified, updatedAt: new Date() })
      .where(eq(businessDocuments.id, id))
      .returning();
    return result;
  }

  // Verified Suppliers
  async getVerifiedSuppliers(): Promise<UserProfile[]> {
    return db.select().from(userProfiles)
      .where(
        and(
          or(
            eq(userProfiles.role, 'trader'),
            eq(userProfiles.role, 'manufacturer')
          ),
          or(
            eq(userProfiles.verificationLevel, 'verified'),
            eq(userProfiles.verificationLevel, 'highly_recommended')
          )
        )
      )
      .orderBy(desc(userProfiles.createdAt));
  }

  // Suppliers by Product Search - finds suppliers who have products matching the search
  async getSuppliersByProductSearch(search: string): Promise<UserProfile[]> {
    const searchTerms = search.split(' ').filter(t => t.length > 2);
    if (searchTerms.length === 0) return [];
    
    const matchingProducts = await db.select({ sellerId: products.sellerId })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          or(
            ...searchTerms.map(term => 
              or(
                ilike(products.name, `%${term}%`),
                ilike(products.description, `%${term}%`)
              )
            )
          )
        )
      )
      .groupBy(products.sellerId)
      .limit(20);
    
    if (matchingProducts.length === 0) return [];
    
    const sellerIds = matchingProducts.map(p => p.sellerId);
    
    return db.select().from(userProfiles)
      .where(
        and(
          inArray(userProfiles.id, sellerIds),
          or(
            eq(userProfiles.role, 'trader'),
            eq(userProfiles.role, 'manufacturer')
          )
        )
      )
      .orderBy(desc(userProfiles.verificationLevel));
  }

  // Admin Credentials
  async getAdminByUsername(username: string): Promise<AdminCredential | undefined> {
    const [admin] = await db.select().from(adminCredentials).where(eq(adminCredentials.username, username));
    return admin;
  }

  async getAdminById(id: number): Promise<AdminCredential | undefined> {
    const [admin] = await db.select().from(adminCredentials).where(eq(adminCredentials.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<AdminCredential | undefined> {
    const [admin] = await db.select().from(adminCredentials).where(eq(adminCredentials.email, email));
    return admin;
  }

  async getAllAdmins(): Promise<AdminCredential[]> {
    return db.select().from(adminCredentials).orderBy(desc(adminCredentials.createdAt));
  }

  async createAdmin(data: { username: string; passwordHash: string; displayName?: string; email?: string; isSuperAdmin?: boolean }): Promise<AdminCredential> {
    const [result] = await db.insert(adminCredentials).values({
      username: data.username,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      email: data.email,
      isActive: true,
      isSuperAdmin: data.isSuperAdmin || false,
    }).returning();
    return result;
  }

  async updateAdmin(id: number, data: Partial<{ displayName: string; email: string; isActive: boolean; isSuperAdmin: boolean; mustResetPassword: boolean }>): Promise<AdminCredential | undefined> {
    const [result] = await db.update(adminCredentials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminCredentials.id, id))
      .returning();
    return result;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<void> {
    await db.update(adminCredentials)
      .set({ 
        passwordHash, 
        passwordChangedAt: new Date(),
        mustResetPassword: false,
        updatedAt: new Date() 
      })
      .where(eq(adminCredentials.id, id));
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db.update(adminCredentials)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminCredentials.id, id));
  }

  async deleteAdmin(id: number): Promise<void> {
    await db.delete(adminCredentials).where(eq(adminCredentials.id, id));
  }

  // Admin Password Reset Tokens
  async createPasswordResetToken(adminId: number, tokenHash: string, expiresAt: Date): Promise<AdminPasswordReset> {
    const [result] = await db.insert(adminPasswordResets).values({
      adminId,
      tokenHash,
      expiresAt,
    }).returning();
    return result;
  }

  async getValidPasswordResetToken(tokenHash: string): Promise<(AdminPasswordReset & { admin: AdminCredential }) | undefined> {
    const now = new Date();
    const results = await db.select()
      .from(adminPasswordResets)
      .innerJoin(adminCredentials, eq(adminPasswordResets.adminId, adminCredentials.id))
      .where(
        and(
          eq(adminPasswordResets.tokenHash, tokenHash),
          sql`${adminPasswordResets.expiresAt} > ${now}`,
          sql`${adminPasswordResets.usedAt} IS NULL`
        )
      );
    
    if (results.length === 0) return undefined;
    
    return {
      ...results[0].admin_password_resets,
      admin: results[0].admin_credentials,
    };
  }

  async markPasswordResetTokenUsed(id: number): Promise<void> {
    await db.update(adminPasswordResets)
      .set({ usedAt: new Date() })
      .where(eq(adminPasswordResets.id, id));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    const now = new Date();
    await db.delete(adminPasswordResets).where(sql`${adminPasswordResets.expiresAt} < ${now}`);
  }

  // Search Preferences
  async trackSearchPreference(data: InsertUserSearchPreference): Promise<UserSearchPreference> {
    const [result] = await db.insert(userSearchPreferences).values(data).returning();
    return result;
  }

  async getUserSearchPreferences(userId: string, limit = 50): Promise<UserSearchPreference[]> {
    return db.select().from(userSearchPreferences)
      .where(eq(userSearchPreferences.userId, userId))
      .orderBy(desc(userSearchPreferences.createdAt))
      .limit(limit);
  }

  async getTopUserCategories(userId: string, limit = 5): Promise<{ categoryId: number; count: number }[]> {
    const results = await db.execute(sql`
      SELECT category_id as "categoryId", COUNT(*)::int as count 
      FROM user_search_preferences 
      WHERE user_id = ${userId} AND category_id IS NOT NULL 
      GROUP BY category_id 
      ORDER BY count DESC 
      LIMIT ${limit}
    `);
    return results.rows as any[];
  }

  async getTopUserSearchTerms(userId: string, limit = 10): Promise<string[]> {
    const results = await db.execute(sql`
      SELECT DISTINCT search_term 
      FROM user_search_preferences 
      WHERE user_id = ${userId} AND search_term IS NOT NULL AND search_term != ''
      ORDER BY search_term
      LIMIT ${limit}
    `);
    return results.rows.map((r: any) => r.search_term);
  }

  async getRecentlyViewedProducts(userId: string, limit = 10): Promise<Product[]> {
    const results = await db.execute(sql`
      SELECT DISTINCT ON (p.id) p.*
      FROM user_search_preferences usp
      JOIN products p ON p.id = usp.product_id
      WHERE usp.user_id = ${userId} 
        AND usp.event_type = 'view' 
        AND usp.product_id IS NOT NULL
        AND p.is_active = true
      ORDER BY p.id, usp.created_at DESC
      LIMIT ${limit}
    `);
    return results.rows as Product[];
  }

  async getUsersWithRecentViews(hoursAgo: number, maxLastEmailHoursAgo: number): Promise<{ userId: string; email: string; firstName: string | null }[]> {
    const results = await db.execute(sql`
      SELECT DISTINCT usp.user_id as "userId",
        COALESCE(up.business_name, 'there') as "firstName"
      FROM user_search_preferences usp
      JOIN user_profiles up ON up.id = usp.user_id
      LEFT JOIN email_preferences ep ON ep.user_id = usp.user_id
      WHERE usp.event_type = 'view' 
        AND usp.product_id IS NOT NULL
        AND usp.created_at > NOW() - INTERVAL '1 hour' * ${hoursAgo}
        AND (ep.promo_opt_in IS NULL OR ep.promo_opt_in = true)
        AND (ep.last_promo_sent_at IS NULL OR ep.last_promo_sent_at < NOW() - INTERVAL '1 hour' * ${maxLastEmailHoursAgo})
    `);
    const userIds = results.rows.map((r: any) => r.userId);
    if (userIds.length === 0) return [];
    
    const authResults = await db.execute(sql`
      SELECT id, email FROM users WHERE id = ANY(${userIds})
    `);
    const emailMap = new Map(authResults.rows.map((r: any) => [r.id, r.email]));
    
    return results.rows
      .filter((r: any) => emailMap.has(r.userId))
      .map((r: any) => ({
        userId: r.userId,
        email: emailMap.get(r.userId)!,
        firstName: r.firstName,
      }));
  }

  // Email Preferences
  async getEmailPreference(userId: string): Promise<EmailPreference | undefined> {
    const [result] = await db.select().from(emailPreferences).where(eq(emailPreferences.userId, userId));
    return result;
  }

  async getEmailPreferenceByToken(token: string): Promise<EmailPreference | undefined> {
    const [result] = await db.select().from(emailPreferences).where(eq(emailPreferences.unsubscribeToken, token));
    return result;
  }

  async upsertEmailPreference(data: InsertEmailPreference): Promise<EmailPreference> {
    const [result] = await db.insert(emailPreferences).values(data)
      .onConflictDoUpdate({
        target: emailPreferences.userId,
        set: { promoOptIn: data.promoOptIn, unsubscribeToken: data.unsubscribeToken },
      }).returning();
    return result;
  }

  async updateEmailPreference(userId: string, data: Partial<EmailPreference>): Promise<EmailPreference | undefined> {
    const [result] = await db.update(emailPreferences).set(data).where(eq(emailPreferences.userId, userId)).returning();
    return result;
  }

  async getSubscribedUsers(): Promise<{ userId: string; email: string; firstName: string | null }[]> {
    const { users } = await import("@shared/schema");
    const results = await db.execute(sql`
      SELECT u.id as "userId", u.email, u.first_name as "firstName"
      FROM users u
      LEFT JOIN email_preferences ep ON u.id = ep.user_id
      WHERE u.is_email_verified = true 
        AND (ep.promo_opt_in IS NULL OR ep.promo_opt_in = true)
        AND (ep.last_promo_sent_at IS NULL OR ep.last_promo_sent_at < NOW() - INTERVAL '24 hours')
    `);
    return results.rows as any[];
  }

  // Promo Email Log
  async logPromoEmail(data: InsertPromoEmailLog): Promise<PromoEmailLog> {
    const [result] = await db.insert(promoEmailLog).values(data).returning();
    return result;
  }

  async getPromoEmailStats(): Promise<{ total: number; last24h: number; last7d: number }> {
    const results = await db.execute(sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '24 hours')::int as "last24h",
        COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '7 days')::int as "last7d"
      FROM promo_email_log
    `);
    const row = results.rows[0] as any;
    return { total: row?.total || 0, last24h: row?.last24h || 0, last7d: row?.last7d || 0 };
  }

  // Email Campaigns
  async createEmailCampaign(data: InsertEmailCampaign): Promise<EmailCampaign> {
    const [result] = await db.insert(emailCampaigns).values(data).returning();
    return result;
  }

  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: number): Promise<EmailCampaign | undefined> {
    const [result] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return result;
  }

  async updateEmailCampaign(id: number, data: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const [result] = await db.update(emailCampaigns).set(data).where(eq(emailCampaigns.id, id)).returning();
    return result;
  }

  async deleteEmailCampaign(id: number): Promise<void> {
    await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  }

  // Admin Email Contacts
  async createAdminEmailContact(data: InsertAdminEmailContact): Promise<AdminEmailContact> {
    const [result] = await db.insert(adminEmailContacts).values(data).returning();
    return result;
  }

  async getAdminEmailContacts(): Promise<AdminEmailContact[]> {
    return db.select().from(adminEmailContacts).orderBy(desc(adminEmailContacts.createdAt));
  }

  async updateAdminEmailContact(id: number, data: Partial<AdminEmailContact>): Promise<AdminEmailContact | undefined> {
    const [result] = await db.update(adminEmailContacts).set(data).where(eq(adminEmailContacts.id, id)).returning();
    return result;
  }

  async deleteAdminEmailContact(id: number): Promise<void> {
    await db.delete(adminEmailContacts).where(eq(adminEmailContacts.id, id));
  }

  async getAllEmailRecipients(): Promise<{ email: string; name: string | null; source: string }[]> {
    const registeredUsers = await db.execute(sql`
      SELECT DISTINCT u.email, 
        COALESCE(up.business_name, split_part(u.email, '@', 1)) as name,
        'registered' as source
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.id
      LEFT JOIN email_preferences ep ON u.id = ep.user_id
      WHERE u.email IS NOT NULL AND u.email != ''
        AND (ep.promo_opt_in IS NULL OR ep.promo_opt_in = true)
    `);

    const adminContacts = await db
      .select({ email: adminEmailContacts.email, name: adminEmailContacts.name })
      .from(adminEmailContacts)
      .where(eq(adminEmailContacts.isActive, true));

    const combined: { email: string; name: string | null; source: string }[] = [];
    const seen = new Set<string>();

    for (const row of registeredUsers.rows as any[]) {
      if (!seen.has(row.email)) {
        seen.add(row.email);
        combined.push({ email: row.email, name: row.name, source: 'registered' });
      }
    }

    for (const contact of adminContacts) {
      if (!seen.has(contact.email)) {
        seen.add(contact.email);
        combined.push({ email: contact.email, name: contact.name, source: 'contact' });
      }
    }

    return combined;
  }

  // Manufacturer Outreach
  async createManufacturerOutreach(data: InsertManufacturerOutreach): Promise<ManufacturerOutreach> {
    const [result] = await db.insert(manufacturerOutreach).values(data).returning();
    return result;
  }

  async bulkCreateManufacturerOutreach(data: InsertManufacturerOutreach[]): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;
    for (const item of data) {
      try {
        const existing = await this.getManufacturerOutreachByEmail(item.email);
        if (existing) {
          skipped++;
          continue;
        }
        await db.insert(manufacturerOutreach).values(item);
        created++;
      } catch (e) {
        skipped++;
      }
    }
    return { created, skipped };
  }

  async getManufacturerOutreachContacts(filters?: { status?: string; country?: string }): Promise<ManufacturerOutreach[]> {
    let query = db.select().from(manufacturerOutreach);
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(manufacturerOutreach.status, filters.status));
    }
    if (filters?.country) {
      conditions.push(eq(manufacturerOutreach.country, filters.country));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return (query as any).orderBy(desc(manufacturerOutreach.createdAt));
  }

  async getManufacturerOutreach(id: number): Promise<ManufacturerOutreach | undefined> {
    const [result] = await db.select().from(manufacturerOutreach).where(eq(manufacturerOutreach.id, id));
    return result;
  }

  async getManufacturerOutreachByEmail(email: string): Promise<ManufacturerOutreach | undefined> {
    const [result] = await db.select().from(manufacturerOutreach).where(eq(manufacturerOutreach.email, email.toLowerCase()));
    return result;
  }

  async updateManufacturerOutreach(id: number, data: Partial<ManufacturerOutreach>): Promise<ManufacturerOutreach | undefined> {
    const [result] = await db.update(manufacturerOutreach).set(data).where(eq(manufacturerOutreach.id, id)).returning();
    return result;
  }

  async deleteManufacturerOutreach(id: number): Promise<void> {
    await db.delete(manufacturerOutreach).where(eq(manufacturerOutreach.id, id));
  }

  async getManufacturerOutreachStats(): Promise<{ total: number; pending: number; invited: number; reminded: number; signedUp: number }> {
    const results = await db.execute(sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'invited')::int as invited,
        COUNT(*) FILTER (WHERE status = 'reminded')::int as reminded,
        COUNT(*) FILTER (WHERE status = 'signed_up')::int as "signedUp"
      FROM manufacturer_outreach
    `);
    return results.rows[0] as any;
  }

  async getPendingFollowUps(daysAfterInvite: number, maxFollowUps: number): Promise<ManufacturerOutreach[]> {
    const results = await db.execute(sql`
      SELECT * FROM manufacturer_outreach 
      WHERE status IN ('invited', 'reminded')
        AND invited_at IS NOT NULL
        AND invited_at < NOW() - INTERVAL '1 day' * ${daysAfterInvite}
        AND (follow_up_count IS NULL OR follow_up_count < ${maxFollowUps})
        AND (reminder_sent_at IS NULL OR reminder_sent_at < NOW() - INTERVAL '1 day' * ${daysAfterInvite})
      ORDER BY invited_at ASC
    `);
    return results.rows as ManufacturerOutreach[];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [result] = await db.insert(reviews).values(review).returning();
    return result;
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [result] = await db.select().from(reviews).where(eq(reviews.id, id));
    return result;
  }

  async getReviewByOrderAndRole(orderId: number, reviewerId: string, role: string): Promise<Review | undefined> {
    const [result] = await db.select().from(reviews)
      .where(and(eq(reviews.orderId, orderId), eq(reviews.reviewerId, reviewerId), eq(reviews.role, role)));
    return result;
  }

  async getReviewsForUser(userId: string, role?: string): Promise<(Review & { reviewer: UserProfile | null })[]> {
    const conditions = [eq(reviews.revieweeId, userId), eq(reviews.status, 'published')];
    if (role) conditions.push(eq(reviews.role, role));

    const results = await db.select().from(reviews).where(and(...conditions)).orderBy(desc(reviews.createdAt));
    const withReviewers = await Promise.all(results.map(async (r) => {
      const [reviewer] = await db.select().from(userProfiles).where(eq(userProfiles.id, r.reviewerId));
      return { ...r, reviewer: reviewer || null };
    }));
    return withReviewers;
  }

  async getReviewsForOrder(orderId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.orderId, orderId));
  }

  async updateReview(id: number, data: Partial<Review>): Promise<Review | undefined> {
    const [result] = await db.update(reviews).set({ ...data, updatedAt: new Date() }).where(eq(reviews.id, id)).returning();
    return result;
  }

  async updateUserRating(userId: string): Promise<void> {
    const userReviews = await db.select().from(reviews)
      .where(and(eq(reviews.revieweeId, userId), eq(reviews.status, 'published')));
    if (userReviews.length === 0) return;
    const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
    await db.update(userProfiles).set({
      rating: avgRating.toFixed(1),
      ratingsCount: userReviews.length,
    }).where(eq(userProfiles.id, userId));
  }

  async getUnresolvedDisputesPastDeadline(): Promise<Dispute[]> {
    const now = new Date();
    return db.select().from(disputes)
      .where(and(
        or(eq(disputes.status, 'open'), eq(disputes.status, 'under_review')),
        lte(disputes.autoRefundAt, now)
      ));
  }

  // Invoices
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [result] = await db.insert(invoices).values(invoice).returning();
    return result;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [result] = await db.select().from(invoices).where(eq(invoices.id, id));
    return result;
  }

  async getInvoiceByOrder(orderId: number): Promise<Invoice | undefined> {
    const [result] = await db.select().from(invoices).where(eq(invoices.orderId, orderId));
    return result;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [result] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return result;
  }

  async getInvoicesByBuyer(buyerId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.buyerId, buyerId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesBySeller(sellerId: string): Promise<Invoice[]> {
    return db.select().from(invoices).where(eq(invoices.sellerId, sellerId)).orderBy(desc(invoices.createdAt));
  }

  async updateInvoiceStatus(id: number, status: string, paidAt?: Date): Promise<Invoice | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (paidAt) updateData.paidAt = paidAt;
    const [result] = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
    return result;
  }

  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [result] = await db.insert(activityLogs).values(log).returning();
    return result;
  }

  async getActivityLogsByOrder(orderId: number): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).where(eq(activityLogs.orderId, orderId)).orderBy(desc(activityLogs.createdAt));
  }

  async getActivityLogsByUser(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .where(eq(activityLogs.actorId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async getRecentActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return db.select().from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Admin Notifications
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [result] = await db.insert(adminNotifications).values(notification).returning();
    return result;
  }

  async getAdminNotifications(filters?: { unreadOnly?: boolean; type?: string; limit?: number }): Promise<AdminNotification[]> {
    const conditions = [];
    if (filters?.unreadOnly) conditions.push(eq(adminNotifications.isRead, false));
    if (filters?.type) conditions.push(eq(adminNotifications.type, filters.type));

    const query = db.select().from(adminNotifications);
    if (conditions.length > 0) {
      return (query as any).where(and(...conditions)).orderBy(desc(adminNotifications.createdAt)).limit(filters?.limit || 100);
    }
    return query.orderBy(desc(adminNotifications.createdAt)).limit(filters?.limit || 100);
  }

  async markAdminNotificationRead(id: number): Promise<AdminNotification | undefined> {
    const [result] = await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.id, id)).returning();
    return result;
  }

  async markAllAdminNotificationsRead(): Promise<void> {
    await db.update(adminNotifications).set({ isRead: true }).where(eq(adminNotifications.isRead, false));
  }

  async getAdminNotificationCount(unreadOnly: boolean = false): Promise<number> {
    const condition = unreadOnly ? eq(adminNotifications.isRead, false) : undefined;
    const result = await db.select({ count: sql<number>`count(*)` }).from(adminNotifications).where(condition);
    return Number(result[0]?.count || 0);
  }

  // Contact Inquiries
  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    const [result] = await db.insert(contactInquiries).values(inquiry).returning();
    return result;
  }

  async getContactInquiries(filters?: { status?: string; limit?: number }): Promise<ContactInquiry[]> {
    const conditions = [];
    if (filters?.status) conditions.push(eq(contactInquiries.status, filters.status));
    const query = db.select().from(contactInquiries);
    if (conditions.length > 0) {
      return (query as any).where(and(...conditions)).orderBy(desc(contactInquiries.createdAt)).limit(filters?.limit || 100);
    }
    return query.orderBy(desc(contactInquiries.createdAt)).limit(filters?.limit || 100);
  }

  async getContactInquiry(id: number): Promise<ContactInquiry | undefined> {
    const [result] = await db.select().from(contactInquiries).where(eq(contactInquiries.id, id));
    return result;
  }

  async updateContactInquiryStatus(id: number, status: string): Promise<ContactInquiry | undefined> {
    const [result] = await db.update(contactInquiries).set({ status, updatedAt: new Date() }).where(eq(contactInquiries.id, id)).returning();
    return result;
  }

  async replyToContactInquiry(id: number, reply: string, adminId: number): Promise<ContactInquiry | undefined> {
    const [result] = await db.update(contactInquiries).set({
      adminReply: reply,
      adminRepliedAt: new Date(),
      adminRepliedBy: adminId,
      status: "resolved",
      updatedAt: new Date(),
    }).where(eq(contactInquiries.id, id)).returning();
    return result;
  }

  async getContactInquiryCount(status?: string): Promise<number> {
    const condition = status ? eq(contactInquiries.status, status) : undefined;
    const result = await db.select({ count: sql<number>`count(*)` }).from(contactInquiries).where(condition);
    return Number(result[0]?.count || 0);
  }

  async getContactInquiriesByUser(userId: string): Promise<ContactInquiry[]> {
    return db.select().from(contactInquiries)
      .where(eq(contactInquiries.userId, userId))
      .orderBy(desc(contactInquiries.createdAt));
  }

  async getCountryTaxRates(): Promise<CountryTaxRate[]> {
    return db.select().from(countryTaxRates).where(eq(countryTaxRates.isActive, true)).orderBy(asc(countryTaxRates.countryName));
  }

  async getCountryTaxRate(countryCode: string): Promise<CountryTaxRate | undefined> {
    const [result] = await db.select().from(countryTaxRates).where(and(eq(countryTaxRates.countryCode, countryCode.toUpperCase()), eq(countryTaxRates.isActive, true)));
    return result;
  }

  async upsertCountryTaxRate(data: InsertCountryTaxRate): Promise<CountryTaxRate> {
    const existing = await this.getCountryTaxRate(data.countryCode);
    if (existing) {
      const [result] = await db.update(countryTaxRates).set({ ...data, updatedAt: new Date() }).where(eq(countryTaxRates.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(countryTaxRates).values(data).returning();
    return result;
  }

  async getShippingZones(): Promise<ShippingZone[]> {
    return db.select().from(shippingZones).where(eq(shippingZones.isActive, true)).orderBy(asc(shippingZones.name));
  }

  async getShippingZone(originCode: string, destCode: string): Promise<ShippingZone | undefined> {
    const [result] = await db.select().from(shippingZones).where(
      and(
        eq(shippingZones.originCountryCode, originCode.toUpperCase()),
        eq(shippingZones.destinationCountryCode, destCode.toUpperCase()),
        eq(shippingZones.isActive, true)
      )
    );
    return result;
  }

  async upsertShippingZone(data: InsertShippingZone): Promise<ShippingZone> {
    const existing = await this.getShippingZone(data.originCountryCode, data.destinationCountryCode);
    if (existing) {
      const [result] = await db.update(shippingZones).set({ ...data, updatedAt: new Date() }).where(eq(shippingZones.id, existing.id)).returning();
      return result;
    }
    const [result] = await db.insert(shippingZones).values(data).returning();
    return result;
  }

  // Pickup Points
  async getPickupPoints(filters?: { countryCode?: string; city?: string }): Promise<PickupPoint[]> {
    const conditions = [eq(pickupPoints.isActive, true)];
    if (filters?.countryCode) conditions.push(eq(pickupPoints.countryCode, filters.countryCode.toUpperCase()));
    if (filters?.city) conditions.push(ilike(pickupPoints.city, filters.city));
    return db.select().from(pickupPoints).where(and(...conditions)).orderBy(asc(pickupPoints.name));
  }

  async getPickupPoint(id: number): Promise<PickupPoint | undefined> {
    const [result] = await db.select().from(pickupPoints).where(eq(pickupPoints.id, id));
    return result;
  }

  async createPickupPoint(data: InsertPickupPoint): Promise<PickupPoint> {
    const [result] = await db.insert(pickupPoints).values(data).returning();
    return result;
  }

  // Delivery Tiers
  async getDeliveryTiers(filters?: { countryCode?: string; city?: string }): Promise<DeliveryTier[]> {
    const conditions = [eq(deliveryTiers.isActive, true)];
    if (filters?.countryCode) conditions.push(eq(deliveryTiers.countryCode, filters.countryCode.toUpperCase()));
    if (filters?.city) conditions.push(ilike(deliveryTiers.city, filters.city));
    return db.select().from(deliveryTiers).where(and(...conditions)).orderBy(asc(deliveryTiers.baseFee));
  }

  async getDeliveryTier(id: number): Promise<DeliveryTier | undefined> {
    const [result] = await db.select().from(deliveryTiers).where(eq(deliveryTiers.id, id));
    return result;
  }

  async createDeliveryTier(data: InsertDeliveryTier): Promise<DeliveryTier> {
    const [result] = await db.insert(deliveryTiers).values(data).returning();
    return result;
  }

  // Express Corridors
  async getExpressCorridors(filters?: { originCity?: string; originCountryCode?: string; destCity?: string; destCountryCode?: string }): Promise<ExpressCorridor[]> {
    const conditions = [eq(expressCorridors.isActive, true)];
    if (filters?.originCity) conditions.push(ilike(expressCorridors.originCity, filters.originCity));
    if (filters?.originCountryCode) conditions.push(eq(expressCorridors.originCountryCode, filters.originCountryCode.toUpperCase()));
    if (filters?.destCity) conditions.push(ilike(expressCorridors.destCity, filters.destCity));
    if (filters?.destCountryCode) conditions.push(eq(expressCorridors.destCountryCode, filters.destCountryCode.toUpperCase()));
    return db.select().from(expressCorridors).where(and(...conditions)).orderBy(asc(expressCorridors.corridorFee));
  }

  async getExpressCorridor(id: number): Promise<ExpressCorridor | undefined> {
    const [result] = await db.select().from(expressCorridors).where(eq(expressCorridors.id, id));
    return result;
  }

  async createExpressCorridor(data: InsertExpressCorridor): Promise<ExpressCorridor> {
    const [result] = await db.insert(expressCorridors).values(data).returning();
    return result;
  }

  // Mobile Money Payments
  async createMobileMoneyPayment(payment: InsertMobileMoneyPayment): Promise<MobileMoneyPayment> {
    const [result] = await db.insert(mobileMoneyPayments).values(payment).returning();
    return result;
  }

  async getMobileMoneyPayment(id: number): Promise<MobileMoneyPayment | undefined> {
    const [result] = await db.select().from(mobileMoneyPayments).where(eq(mobileMoneyPayments.id, id));
    return result;
  }

  async getMobileMoneyPaymentByRef(transactionRef: string): Promise<MobileMoneyPayment | undefined> {
    const [result] = await db.select().from(mobileMoneyPayments).where(eq(mobileMoneyPayments.transactionRef, transactionRef));
    return result;
  }

  async getMobileMoneyPaymentsByOrder(orderId: number): Promise<MobileMoneyPayment[]> {
    return db.select().from(mobileMoneyPayments).where(eq(mobileMoneyPayments.orderId, orderId)).orderBy(desc(mobileMoneyPayments.createdAt));
  }

  async updateMobileMoneyPayment(id: number, data: Partial<MobileMoneyPayment>): Promise<MobileMoneyPayment | undefined> {
    const [result] = await db.update(mobileMoneyPayments).set({ ...data, updatedAt: new Date() }).where(eq(mobileMoneyPayments.id, id)).returning();
    return result;
  }

  // Group Buys
  async createGroupBuy(data: InsertGroupBuy): Promise<GroupBuy> {
    const [result] = await db.insert(groupBuys).values(data).returning();
    return result;
  }

  async getGroupBuy(id: number): Promise<(GroupBuy & { product: Product; organizer: UserProfile | null; participants: (GroupBuyParticipant & { user: UserProfile | null })[] }) | undefined> {
    const [gb] = await db.select().from(groupBuys).where(eq(groupBuys.id, id));
    if (!gb) return undefined;

    const [product] = await db.select().from(products).where(eq(products.id, gb.productId));
    if (!product) return undefined;

    const [organizer] = await db.select().from(userProfiles).where(eq(userProfiles.id, gb.organizerId));

    const parts = await db.select().from(groupBuyParticipants).where(eq(groupBuyParticipants.groupBuyId, id)).orderBy(asc(groupBuyParticipants.joinedAt));
    const participantsWithUser: (GroupBuyParticipant & { user: UserProfile | null })[] = [];
    for (const p of parts) {
      const [user] = await db.select().from(userProfiles).where(eq(userProfiles.id, p.userId));
      participantsWithUser.push({ ...p, user: user || null });
    }

    return { ...gb, product, organizer: organizer || null, participants: participantsWithUser };
  }

  async getGroupBuysByProduct(productId: number): Promise<GroupBuy[]> {
    return db.select().from(groupBuys)
      .where(and(eq(groupBuys.productId, productId), eq(groupBuys.status, 'open')))
      .orderBy(desc(groupBuys.createdAt));
  }

  async getActiveGroupBuys(limit: number = 20): Promise<(GroupBuy & { product: Product })[]> {
    const gbs = await db.select().from(groupBuys)
      .where(eq(groupBuys.status, 'open'))
      .orderBy(desc(groupBuys.createdAt))
      .limit(limit);

    const result: (GroupBuy & { product: Product })[] = [];
    for (const gb of gbs) {
      const [product] = await db.select().from(products).where(eq(products.id, gb.productId));
      if (product) result.push({ ...gb, product });
    }
    return result;
  }

  async getUserGroupBuys(userId: string): Promise<(GroupBuy & { product: Product })[]> {
    const participations = await db.select().from(groupBuyParticipants).where(eq(groupBuyParticipants.userId, userId));
    const organized = await db.select().from(groupBuys).where(eq(groupBuys.organizerId, userId));

    const allIds = new Set<number>();
    participations.forEach(p => allIds.add(p.groupBuyId));
    organized.forEach(g => allIds.add(g.id));

    if (allIds.size === 0) return [];

    const gbs = await db.select().from(groupBuys).where(inArray(groupBuys.id, [...allIds])).orderBy(desc(groupBuys.createdAt));
    const result: (GroupBuy & { product: Product })[] = [];
    for (const gb of gbs) {
      const [product] = await db.select().from(products).where(eq(products.id, gb.productId));
      if (product) result.push({ ...gb, product });
    }
    return result;
  }

  async joinGroupBuy(data: InsertGroupBuyParticipant): Promise<GroupBuyParticipant> {
    const [result] = await db.insert(groupBuyParticipants).values(data).returning();
    return result;
  }

  async updateGroupBuyStatus(id: number, status: string): Promise<GroupBuy | undefined> {
    const [result] = await db.update(groupBuys).set({ status }).where(eq(groupBuys.id, id)).returning();
    return result;
  }

  async updateGroupBuyCurrentQty(id: number, qty: number): Promise<GroupBuy | undefined> {
    const [result] = await db.update(groupBuys).set({ currentQty: qty }).where(eq(groupBuys.id, id)).returning();
    return result;
  }

  // AfCFTA Certificates
  async createAfcftaCertificate(data: InsertAfcftaCertificate): Promise<AfcftaCertificate> {
    const [result] = await db.insert(afcftaCertificates).values(data).returning();
    return result;
  }

  async getAfcftaCertificate(id: number): Promise<AfcftaCertificate | undefined> {
    const [result] = await db.select().from(afcftaCertificates).where(eq(afcftaCertificates.id, id));
    return result;
  }

  async getAfcftaCertificatesByProduct(productId: number): Promise<AfcftaCertificate[]> {
    return db.select().from(afcftaCertificates).where(eq(afcftaCertificates.productId, productId)).orderBy(desc(afcftaCertificates.createdAt));
  }

  async getAfcftaCertificatesBySeller(sellerId: string): Promise<AfcftaCertificate[]> {
    return db.select().from(afcftaCertificates).where(eq(afcftaCertificates.sellerId, sellerId)).orderBy(desc(afcftaCertificates.createdAt));
  }

  async getAllAfcftaCertificates(status?: string): Promise<AfcftaCertificate[]> {
    const conditions = [];
    if (status) conditions.push(eq(afcftaCertificates.status, status));
    return db.select().from(afcftaCertificates).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(afcftaCertificates.createdAt));
  }

  async updateAfcftaCertificate(id: number, data: Partial<AfcftaCertificate>): Promise<AfcftaCertificate | undefined> {
    const [result] = await db.update(afcftaCertificates).set(data).where(eq(afcftaCertificates.id, id)).returning();
    return result;
  }

  // Referrals
  async createReferral(data: InsertReferral): Promise<Referral> {
    const [result] = await db.insert(referrals).values(data).returning();
    return result;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [result] = await db.select().from(referrals).where(eq(referrals.referralCode, code));
    return result;
  }

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt));
  }

  async getUserReferralStats(userId: string): Promise<{ total: number; converted: number; rewarded: number; totalEarnings: string }> {
    const allReferrals = await db.select().from(referrals).where(eq(referrals.referrerId, userId));
    const converted = allReferrals.filter(r => r.status === 'signed_up' || r.status === 'first_purchase' || r.status === 'rewarded').length;
    const rewarded = allReferrals.filter(r => r.status === 'rewarded').length;
    const totalEarnings = allReferrals.filter(r => r.rewardAmount).reduce((sum, r) => sum + parseFloat(r.rewardAmount || '0'), 0);
    return { total: allReferrals.length, converted, rewarded, totalEarnings: totalEarnings.toFixed(2) };
  }

  async updateReferral(id: number, data: Partial<Referral>): Promise<Referral | undefined> {
    const [result] = await db.update(referrals).set(data).where(eq(referrals.id, id)).returning();
    return result;
  }

  // Social Posts
  async createSocialPost(data: InsertSocialPost): Promise<SocialPost> {
    const [result] = await db.insert(socialPosts).values(data).returning();
    return result;
  }

  async getSocialPosts(filters?: { platform?: string; status?: string; limit?: number }): Promise<SocialPost[]> {
    const conditions = [];
    if (filters?.platform) conditions.push(eq(socialPosts.platform, filters.platform));
    if (filters?.status) conditions.push(eq(socialPosts.status, filters.status));
    const query = db.select().from(socialPosts).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(socialPosts.createdAt));
    if (filters?.limit) return query.limit(filters.limit);
    return query;
  }

  async getSocialPost(id: number): Promise<SocialPost | undefined> {
    const [result] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return result;
  }

  async updateSocialPost(id: number, data: Partial<SocialPost>): Promise<SocialPost | undefined> {
    const [result] = await db.update(socialPosts).set(data).where(eq(socialPosts.id, id)).returning();
    return result;
  }

  async deleteSocialPost(id: number): Promise<void> {
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
  }

  async getScheduledPosts(): Promise<SocialPost[]> {
    return db.select().from(socialPosts).where(
      and(eq(socialPosts.status, 'scheduled'), lte(socialPosts.scheduledAt, new Date()))
    ).orderBy(asc(socialPosts.scheduledAt));
  }

  // Marketing Automations
  async createMarketingAutomation(data: InsertMarketingAutomation): Promise<MarketingAutomation> {
    const [result] = await db.insert(marketingAutomations).values(data).returning();
    return result;
  }

  async getMarketingAutomations(): Promise<MarketingAutomation[]> {
    return db.select().from(marketingAutomations).orderBy(desc(marketingAutomations.createdAt));
  }

  async getMarketingAutomation(id: number): Promise<MarketingAutomation | undefined> {
    const [result] = await db.select().from(marketingAutomations).where(eq(marketingAutomations.id, id));
    return result;
  }

  async updateMarketingAutomation(id: number, data: Partial<MarketingAutomation>): Promise<MarketingAutomation | undefined> {
    const [result] = await db.update(marketingAutomations).set(data).where(eq(marketingAutomations.id, id)).returning();
    return result;
  }

  async deleteMarketingAutomation(id: number): Promise<void> {
    await db.delete(marketingAutomations).where(eq(marketingAutomations.id, id));
  }

  async getDueAutomations(): Promise<MarketingAutomation[]> {
    return db.select().from(marketingAutomations).where(
      and(
        eq(marketingAutomations.isActive, true),
        or(
          lte(marketingAutomations.nextRunAt, new Date()),
          sql`${marketingAutomations.nextRunAt} IS NULL`
        )
      )
    );
  }

  // BNPL
  async createBnplPlan(plan: InsertBnplPlan): Promise<BnplPlan> {
    const [result] = await db.insert(bnplPlans).values(plan).returning();
    return result;
  }
  async getBnplPlan(id: number): Promise<BnplPlan | undefined> {
    const [result] = await db.select().from(bnplPlans).where(eq(bnplPlans.id, id));
    return result;
  }
  async getBnplPlansByBuyer(buyerId: string): Promise<BnplPlan[]> {
    return db.select().from(bnplPlans).where(eq(bnplPlans.buyerId, buyerId)).orderBy(desc(bnplPlans.createdAt));
  }
  async updateBnplPlan(id: number, data: Partial<BnplPlan>): Promise<BnplPlan | undefined> {
    const [result] = await db.update(bnplPlans).set(data).where(eq(bnplPlans.id, id)).returning();
    return result;
  }
  async createBnplPayment(payment: InsertBnplPayment): Promise<BnplPayment> {
    const [result] = await db.insert(bnplPayments).values(payment).returning();
    return result;
  }
  async getBnplPaymentsByPlan(planId: number): Promise<BnplPayment[]> {
    return db.select().from(bnplPayments).where(eq(bnplPayments.planId, planId)).orderBy(asc(bnplPayments.installmentNumber));
  }
  async updateBnplPayment(id: number, data: Partial<BnplPayment>): Promise<BnplPayment | undefined> {
    const [result] = await db.update(bnplPayments).set(data).where(eq(bnplPayments.id, id)).returning();
    return result;
  }

  // Trade Documents
  async createTradeDocument(doc: InsertTradeDocument): Promise<TradeDocument> {
    const [result] = await db.insert(tradeDocuments).values(doc).returning();
    return result;
  }
  async getTradeDocumentsByOrder(orderId: number): Promise<TradeDocument[]> {
    return db.select().from(tradeDocuments).where(eq(tradeDocuments.orderId, orderId)).orderBy(desc(tradeDocuments.createdAt));
  }
  async getTradeDocument(id: number): Promise<TradeDocument | undefined> {
    const [result] = await db.select().from(tradeDocuments).where(eq(tradeDocuments.id, id));
    return result;
  }

  // Storefronts
  async createStorefront(sf: InsertStorefront): Promise<Storefront> {
    const [result] = await db.insert(storefronts).values(sf).returning();
    return result;
  }
  async getStorefrontBySeller(sellerId: string): Promise<Storefront | undefined> {
    const [result] = await db.select().from(storefronts).where(eq(storefronts.sellerId, sellerId));
    return result;
  }
  async getStorefrontBySlug(slug: string): Promise<Storefront | undefined> {
    const [result] = await db.select().from(storefronts).where(eq(storefronts.slug, slug));
    return result;
  }
  async updateStorefront(id: number, data: Partial<Storefront>): Promise<Storefront | undefined> {
    const [result] = await db.update(storefronts).set(data).where(eq(storefronts.id, id)).returning();
    return result;
  }

  // Commodity Prices
  async createCommodityPrice(price: InsertCommodityPrice): Promise<CommodityPrice> {
    const [result] = await db.insert(commodityPrices).values(price).returning();
    return result;
  }
  async getCommodityPrices(): Promise<CommodityPrice[]> {
    return db.select().from(commodityPrices).orderBy(desc(commodityPrices.date));
  }
  async getLatestCommodityPrices(): Promise<CommodityPrice[]> {
    return db.select().from(commodityPrices).orderBy(desc(commodityPrices.date)).limit(50);
  }
  async createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert> {
    const [result] = await db.insert(priceAlerts).values(alert).returning();
    return result;
  }
  async getPriceAlertsByUser(userId: string): Promise<PriceAlert[]> {
    return db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId)).orderBy(desc(priceAlerts.createdAt));
  }
  async updatePriceAlert(id: number, data: Partial<PriceAlert>): Promise<PriceAlert | undefined> {
    const [result] = await db.update(priceAlerts).set(data).where(eq(priceAlerts.id, id)).returning();
    return result;
  }
  async deletePriceAlert(id: number): Promise<void> {
    await db.delete(priceAlerts).where(eq(priceAlerts.id, id));
  }

  // Buyer Verifications
  async createBuyerVerification(v: InsertBuyerVerification): Promise<BuyerVerification> {
    const [result] = await db.insert(buyerVerifications).values(v).returning();
    return result;
  }
  async getBuyerVerification(buyerId: string): Promise<BuyerVerification | undefined> {
    const [result] = await db.select().from(buyerVerifications).where(eq(buyerVerifications.buyerId, buyerId));
    return result;
  }
  async getBuyerVerifications(): Promise<BuyerVerification[]> {
    return db.select().from(buyerVerifications).orderBy(desc(buyerVerifications.createdAt));
  }
  async updateBuyerVerification(id: number, data: Partial<BuyerVerification>): Promise<BuyerVerification | undefined> {
    const [result] = await db.update(buyerVerifications).set(data).where(eq(buyerVerifications.id, id)).returning();
    return result;
  }

  // Forum
  async createForumCategory(cat: InsertForumCategory): Promise<ForumCategory> {
    const [result] = await db.insert(forumCategories).values(cat).returning();
    return result;
  }
  async getForumCategories(): Promise<ForumCategory[]> {
    return db.select().from(forumCategories).orderBy(asc(forumCategories.sortOrder));
  }
  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [result] = await db.insert(forumPosts).values(post).returning();
    return result;
  }
  async getForumPosts(categoryId?: number): Promise<ForumPost[]> {
    if (categoryId) {
      return db.select().from(forumPosts).where(eq(forumPosts.categoryId, categoryId)).orderBy(desc(forumPosts.createdAt));
    }
    return db.select().from(forumPosts).orderBy(desc(forumPosts.createdAt));
  }
  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [result] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    return result;
  }
  async updateForumPost(id: number, data: Partial<ForumPost>): Promise<ForumPost | undefined> {
    const [result] = await db.update(forumPosts).set(data).where(eq(forumPosts.id, id)).returning();
    return result;
  }
  async createForumReply(reply: InsertForumReply): Promise<ForumReply> {
    const [result] = await db.insert(forumReplies).values(reply).returning();
    return result;
  }
  async getForumReplies(postId: number): Promise<ForumReply[]> {
    return db.select().from(forumReplies).where(eq(forumReplies.postId, postId)).orderBy(asc(forumReplies.createdAt));
  }

  // Logistics Partners
  async createLogisticsPartner(partner: InsertLogisticsPartner): Promise<LogisticsPartner> {
    const [result] = await db.insert(logisticsPartners).values(partner).returning();
    return result;
  }
  async getLogisticsPartners(): Promise<LogisticsPartner[]> {
    return db.select().from(logisticsPartners).where(eq(logisticsPartners.isActive, true));
  }
  async getLogisticsPartnersByCountry(country: string): Promise<LogisticsPartner[]> {
    return db.select().from(logisticsPartners).where(
      and(eq(logisticsPartners.isActive, true), sql`${country} = ANY(${logisticsPartners.countries})`)
    );
  }
  async createLogisticsBooking(booking: InsertLogisticsBooking): Promise<LogisticsBooking> {
    const [result] = await db.insert(logisticsBookings).values(booking).returning();
    return result;
  }
  async getLogisticsBookingsByOrder(orderId: number): Promise<LogisticsBooking[]> {
    return db.select().from(logisticsBookings).where(eq(logisticsBookings.orderId, orderId));
  }

  // Trade Events
  async createTradeEvent(event: InsertTradeEvent): Promise<TradeEvent> {
    const [result] = await db.insert(tradeEvents).values(event).returning();
    return result;
  }
  async getTradeEvents(): Promise<TradeEvent[]> {
    return db.select().from(tradeEvents).orderBy(asc(tradeEvents.startDate));
  }
  async getActiveTradeEvents(): Promise<TradeEvent[]> {
    const now = new Date();
    return db.select().from(tradeEvents).where(
      and(eq(tradeEvents.isActive, true), gte(tradeEvents.endDate, now))
    ).orderBy(asc(tradeEvents.startDate));
  }
  async updateTradeEvent(id: number, data: Partial<TradeEvent>): Promise<TradeEvent | undefined> {
    const [result] = await db.update(tradeEvents).set(data).where(eq(tradeEvents.id, id)).returning();
    return result;
  }
  async createEventPromotion(promo: InsertEventPromotion): Promise<EventPromotion> {
    const [result] = await db.insert(eventPromotions).values(promo).returning();
    return result;
  }
  async getEventPromotions(eventId: number): Promise<EventPromotion[]> {
    return db.select().from(eventPromotions).where(eq(eventPromotions.eventId, eventId));
  }

  // Agricultural Exchange
  async createAgriListing(listing: InsertAgriListing): Promise<AgriListing> {
    const [result] = await db.insert(agriListings).values(listing).returning();
    return result;
  }
  async getAgriListings(): Promise<AgriListing[]> {
    return db.select().from(agriListings).where(eq(agriListings.status, "active")).orderBy(desc(agriListings.createdAt));
  }
  async getAgriListing(id: number): Promise<AgriListing | undefined> {
    const [result] = await db.select().from(agriListings).where(eq(agriListings.id, id));
    return result;
  }
  async updateAgriListing(id: number, data: Partial<AgriListing>): Promise<AgriListing | undefined> {
    const [result] = await db.update(agriListings).set(data).where(eq(agriListings.id, id)).returning();
    return result;
  }
  async createAgriBid(bid: InsertAgriBid): Promise<AgriBid> {
    const [result] = await db.insert(agriBids).values(bid).returning();
    return result;
  }
  async getAgriBids(listingId: number): Promise<AgriBid[]> {
    return db.select().from(agriBids).where(eq(agriBids.listingId, listingId)).orderBy(desc(agriBids.createdAt));
  }

  // Live Sessions
  async createLiveSession(session: InsertLiveSession): Promise<LiveSession> {
    const [result] = await db.insert(liveSessions).values(session).returning();
    return result;
  }
  async getLiveSessions(): Promise<LiveSession[]> {
    return db.select().from(liveSessions).orderBy(desc(liveSessions.createdAt));
  }
  async getLiveSession(id: number): Promise<LiveSession | undefined> {
    const [result] = await db.select().from(liveSessions).where(eq(liveSessions.id, id));
    return result;
  }
  async updateLiveSession(id: number, data: Partial<LiveSession>): Promise<LiveSession | undefined> {
    const [result] = await db.update(liveSessions).set(data).where(eq(liveSessions.id, id)).returning();
    return result;
  }
  async createLiveSessionProduct(product: InsertLiveSessionProduct): Promise<LiveSessionProduct> {
    const [result] = await db.insert(liveSessionProducts).values(product).returning();
    return result;
  }
  async getLiveSessionProducts(sessionId: number): Promise<LiveSessionProduct[]> {
    return db.select().from(liveSessionProducts).where(eq(liveSessionProducts.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
