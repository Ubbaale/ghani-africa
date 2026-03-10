import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { cachedStorage } from "./cachedStorage";
import { setupAuth, isAuthenticated } from "./auth";
import { openai } from "./replit_integrations/image/client";
import { sendOrderConfirmation, sendShippingNotification, sendMessageNotification, sendStaleShipmentReminder, sendBuyerStaleAlert, sendAutoDisputeNotification, sendEscrowPaymentEmail, sendEscrowShippedEmail, sendEscrowDeliveredEmail, sendEscrowReleasedEmail, sendDisputeAutoRefundEmail, sendSellerNewOrderNotification, sendBuyerTransactionReceipt, sendSellerTransactionReceipt, sendEmail, emailHeader, emailFooter } from "./email";
import subscriptionRoutes from "./subscriptionRoutes";
import { seedFeeConfiguration } from "./seedFees";
import { setupStripeProducts } from "./setupStripeProducts";
import { seedSampleProducts } from "./seedProducts";
import { seedCategories } from "./seedCategories";
import { feeService } from "./feeService";
import { logAndNotify, logActivity, notifyAdmin, generateInvoiceNumber } from "./transactionLogger";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertProductSchema,
  insertCartItemSchema,
  insertMessageSchema,
  insertUserProfileSchema,
  insertPaymentIntentSchema,
  insertEscrowSchema,
  insertShipmentSchema,
  insertDisputeSchema,
  insertChatMessageSchema,
  insertDropshipApplicationSchema,
  insertDropshipOfferSchema,
  insertDropshipListingSchema,
  insertRfqSchema,
  insertWishlistItemSchema,
  insertAdvertisementSchema,
  insertContactInquirySchema,
  insertGroupBuySchema,
  insertAfcftaCertificateSchema,
} from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql, eq } from "drizzle-orm";
import { z } from "zod";
import { apiLimiter, authLimiter, searchLimiter, uploadLimiter } from "./rateLimit";
import { apiCacheHeaders } from "./cacheHeaders";
import { db } from "./db";
import { users } from "@shared/models/auth";

async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function parsePagination(query: any): { limit: number; offset: number; page: number } {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit as string) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

// African currencies mapping with approximate exchange rates to USD
const AFRICAN_CURRENCIES: Record<string, { code: string; name: string; symbol: string; rateToUSD: number }> = {
  // North Africa
  "Algeria": { code: "DZD", name: "Algerian Dinar", symbol: "DA", rateToUSD: 135 },
  "Egypt": { code: "EGP", name: "Egyptian Pound", symbol: "E£", rateToUSD: 50 },
  "Libya": { code: "LYD", name: "Libyan Dinar", symbol: "LD", rateToUSD: 4.85 },
  "Morocco": { code: "MAD", name: "Moroccan Dirham", symbol: "DH", rateToUSD: 10 },
  "Sudan": { code: "SDG", name: "Sudanese Pound", symbol: "SDG", rateToUSD: 600 },
  "Tunisia": { code: "TND", name: "Tunisian Dinar", symbol: "DT", rateToUSD: 3.1 },
  // West Africa - CFA Franc Zone (BCEAO)
  "Benin": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Burkina Faso": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Ivory Coast": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Guinea-Bissau": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Mali": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Niger": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Senegal": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  "Togo": { code: "XOF", name: "West African CFA Franc", symbol: "CFA", rateToUSD: 610 },
  // West Africa - Other
  "Cabo Verde": { code: "CVE", name: "Cape Verdean Escudo", symbol: "CVE", rateToUSD: 102 },
  "Gambia": { code: "GMD", name: "Gambian Dalasi", symbol: "D", rateToUSD: 68 },
  "Ghana": { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", rateToUSD: 15.5 },
  "Guinea": { code: "GNF", name: "Guinean Franc", symbol: "GNF", rateToUSD: 8600 },
  "Liberia": { code: "LRD", name: "Liberian Dollar", symbol: "L$", rateToUSD: 192 },
  "Mauritania": { code: "MRU", name: "Mauritanian Ouguiya", symbol: "UM", rateToUSD: 40 },
  "Nigeria": { code: "NGN", name: "Nigerian Naira", symbol: "₦", rateToUSD: 1550 },
  "Sierra Leone": { code: "SLE", name: "Sierra Leonean Leone", symbol: "Le", rateToUSD: 22500 },
  // Central Africa - CFA Franc Zone (BEAC)
  "Cameroon": { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateToUSD: 610 },
  "Central African Republic": { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateToUSD: 610 },
  "Chad": { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateToUSD: 610 },
  "Congo": { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateToUSD: 610 },
  "Equatorial Guinea": { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateToUSD: 610 },
  "Gabon": { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", rateToUSD: 610 },
  // Central Africa - Other
  "DR Congo": { code: "CDF", name: "Congolese Franc", symbol: "FC", rateToUSD: 2750 },
  "Sao Tome and Principe": { code: "STN", name: "Sao Tome Dobra", symbol: "Db", rateToUSD: 23 },
  // East Africa
  "Burundi": { code: "BIF", name: "Burundian Franc", symbol: "FBu", rateToUSD: 2850 },
  "Comoros": { code: "KMF", name: "Comorian Franc", symbol: "CF", rateToUSD: 450 },
  "Djibouti": { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj", rateToUSD: 178 },
  "Eritrea": { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk", rateToUSD: 15 },
  "Ethiopia": { code: "ETB", name: "Ethiopian Birr", symbol: "Br", rateToUSD: 57 },
  "Kenya": { code: "KES", name: "Kenyan Shilling", symbol: "KSh", rateToUSD: 153 },
  "Madagascar": { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", rateToUSD: 4500 },
  "Malawi": { code: "MWK", name: "Malawian Kwacha", symbol: "MK", rateToUSD: 1700 },
  "Mauritius": { code: "MUR", name: "Mauritian Rupee", symbol: "Rs", rateToUSD: 45 },
  "Mozambique": { code: "MZN", name: "Mozambican Metical", symbol: "MT", rateToUSD: 64 },
  "Rwanda": { code: "RWF", name: "Rwandan Franc", symbol: "FRw", rateToUSD: 1300 },
  "Seychelles": { code: "SCR", name: "Seychellois Rupee", symbol: "SR", rateToUSD: 14.5 },
  "Somalia": { code: "SOS", name: "Somali Shilling", symbol: "Sh.So.", rateToUSD: 571 },
  "South Sudan": { code: "SSP", name: "South Sudanese Pound", symbol: "SSP", rateToUSD: 130 },
  "Tanzania": { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", rateToUSD: 2550 },
  "Uganda": { code: "UGX", name: "Ugandan Shilling", symbol: "USh", rateToUSD: 3780 },
  // Southern Africa
  "Angola": { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", rateToUSD: 830 },
  "Botswana": { code: "BWP", name: "Botswana Pula", symbol: "P", rateToUSD: 13.5 },
  "Eswatini": { code: "SZL", name: "Swazi Lilangeni", symbol: "L", rateToUSD: 18.5 },
  "Lesotho": { code: "LSL", name: "Lesotho Loti", symbol: "L", rateToUSD: 18.5 },
  "Namibia": { code: "NAD", name: "Namibian Dollar", symbol: "N$", rateToUSD: 18.5 },
  "South Africa": { code: "ZAR", name: "South African Rand", symbol: "R", rateToUSD: 18.5 },
  "Zambia": { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", rateToUSD: 26 },
  "Zimbabwe": { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$", rateToUSD: 14000 },
};

// Helper to convert price between currencies
function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first
  let usdAmount = amount;
  if (fromCurrency !== "USD") {
    const fromRate = Object.values(AFRICAN_CURRENCIES).find(c => c.code === fromCurrency)?.rateToUSD || 1;
    usdAmount = amount / fromRate;
  }
  
  // Convert from USD to target currency
  if (toCurrency === "USD") return usdAmount;
  
  const toRate = Object.values(AFRICAN_CURRENCIES).find(c => c.code === toCurrency)?.rateToUSD || 1;
  return usdAmount * toRate;
}

async function seedDefaultAdmin() {
  try {
    const bcrypt = await import("bcryptjs");
    const existingAdmin = await storage.getAdminByUsername("admin");
    if (!existingAdmin) {
      const defaultPasswordHash = await bcrypt.hash("Gayaza123!", 10);
      await storage.createAdmin({
        username: "admin",
        passwordHash: defaultPasswordHash,
        displayName: "Administrator",
        email: "admin@ghani.africa",
        isSuperAdmin: true,
      });
      console.log("Default admin account created");
    } else {
      if (!existingAdmin.isActive) {
        await storage.updateAdmin(existingAdmin.id, { isActive: true });
      }
      console.log("Admin account verified");
    }
  } catch (error) {
    console.error("Failed to seed default admin:", error);
  }
}

// Admin check middleware
function isAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  storage.getUserProfile(req.user.id).then(profile => {
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, error: "Admin access required" });
    }
    next();
  }).catch(() => {
    res.status(500).json({ success: false, error: "Failed to verify admin status" });
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (custom email/password auth)
  await setupAuth(app);

  // Apply rate limiting and caching to all API routes
  app.use("/api", apiLimiter);
  app.use("/api", apiCacheHeaders);

  // Seed fee configuration and subscription tiers
  await seedFeeConfiguration();
  
  // Setup Stripe products and prices for subscriptions & advertising
  await setupStripeProducts();
  
  // Seed default admin account if none exists
  await seedDefaultAdmin();

  // Seed sample products if database is empty
  await seedSampleProducts();
  await seedCategories();

  // Register subscription and fee routes
  app.use(subscriptionRoutes);

  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);

  // ============ SERVER-SIDE IMAGE UPLOAD WITH AUTO-RESIZE ============
  app.post("/api/uploads/image", isAuthenticated, uploadLimiter, async (req: any, res) => {
    try {
      const { imageData, filename } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: "No image data provided" });
      }

      if (typeof imageData !== 'string' || imageData.length > 15 * 1024 * 1024) {
        return res.status(400).json({ error: "Image too large. Maximum size is 10MB" });
      }

      const base64Match = imageData.match(/^data:image\/(jpeg|jpg|png|gif|webp|bmp|tiff);base64,(.+)$/i);
      if (!base64Match) {
        return res.status(400).json({ error: "Invalid image format. Supported: JPEG, PNG, GIF, WebP" });
      }

      const imageBuffer = Buffer.from(base64Match[2], 'base64');

      if (imageBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "Image too large. Maximum size is 10MB" });
      }

      let sharp: any;
      try {
        sharp = (await import('sharp')).default;
      } catch (sharpErr) {
        console.error("Sharp module not available:", sharpErr);
        return res.status(500).json({ error: "Image processing service unavailable" });
      }

      const metadata = await sharp(imageBuffer).metadata();
      console.log(`Image upload: original ${metadata.width}x${metadata.height}, format: ${metadata.format}, size: ${(imageBuffer.length / 1024).toFixed(0)}KB`);

      const resizedBuffer = await sharp(imageBuffer)
        .rotate()
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const resizedMeta = await sharp(resizedBuffer).metadata();
      const imgWidth = resizedMeta.width || 800;
      const imgHeight = resizedMeta.height || 800;
      console.log(`Image resized to: ${imgWidth}x${imgHeight}, size: ${(resizedBuffer.length / 1024).toFixed(0)}KB`);

      const watermarkedSvg = Buffer.from(`
        <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="96%" text-anchor="middle" font-size="13" font-family="Arial, sans-serif"
            fill="rgba(255,255,255,0.35)" stroke="rgba(0,0,0,0.1)" stroke-width="0.5">
            ghaniafrica.com
          </text>
        </svg>
      `);

      const finalBuffer = await sharp(resizedBuffer)
        .composite([{
          input: watermarkedSvg,
          top: 0,
          left: 0,
        }])
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const { ObjectStorageService } = await import('./replit_integrations/object_storage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: finalBuffer,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload to storage failed: ${uploadResponse.status}`);
      }

      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      console.log(`Image uploaded successfully: ${objectPath}`);

      res.json({ success: true, objectPath });
    } catch (error: any) {
      console.error("Image upload error:", error?.message || error);
      res.status(500).json({ error: "Failed to upload image. Please try again." });
    }
  });

  // ============ CATEGORIES ============
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await cachedStorage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch categories" });
    }
  });

  // ============ PRODUCTS ============
  app.get("/api/products", async (req, res) => {
    try {
      const { country, city, categoryId, search, sellerId, minPrice, maxPrice, condition, sortBy } = req.query;
      const { limit, offset } = parsePagination(req.query);
      
      const parsedMinPrice = minPrice ? parseFloat(minPrice as string) : undefined;
      const parsedMaxPrice = maxPrice ? parseFloat(maxPrice as string) : undefined;
      const validSortValues = ["price_asc", "price_desc", "newest", "popular"];
      const validConditions = ["new", "used", "refurbished", "all"];
      
      const products = await storage.getProducts({
        country: country as string,
        city: city as string,
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        search: search as string,
        sellerId: sellerId as string,
        minPrice: parsedMinPrice !== undefined && !isNaN(parsedMinPrice) && parsedMinPrice >= 0 ? parsedMinPrice : undefined,
        maxPrice: parsedMaxPrice !== undefined && !isNaN(parsedMaxPrice) && parsedMaxPrice >= 0 ? parsedMaxPrice : undefined,
        condition: condition && validConditions.includes(condition as string) ? (condition as string) : undefined,
        sortBy: sortBy && validSortValues.includes(sortBy as string) ? (sortBy as string) : undefined,
        limit,
        offset,
      });
      res.json(products);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await cachedStorage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/popular", async (req, res) => {
    try {
      const products = await storage.getPopularProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch popular products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductWithSeller(id);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      await storage.incrementProductViews(id);
      res.json(product);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { categoryName, ...productData } = req.body;
      
      // Handle auto-creation of category if categoryName is provided
      let categoryId = productData.categoryId;
      if (categoryName && !categoryId) {
        const category = await storage.getOrCreateCategory(categoryName);
        categoryId = category.id;
      }
      
      const parsed = insertProductSchema.safeParse({ 
        ...productData, 
        sellerId: userId,
        categoryId: categoryId || null,
      });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const product = await storage.createProduct(parsed.data);
      cachedStorage.invalidateFeaturedProducts();
      // Invalidate categories cache if a new category was created
      if (categoryName) {
        cachedStorage.invalidateCategories();
      }
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ success: false, error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getProduct(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      if (existing.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      const product = await storage.updateProduct(id, req.body);
      cachedStorage.invalidateProduct(id);
      cachedStorage.invalidateFeaturedProducts();
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getProduct(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      if (existing.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await storage.deleteProduct(id);
      cachedStorage.invalidateProduct(id);
      cachedStorage.invalidateFeaturedProducts();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete product" });
    }
  });

  // ============ USER PROFILE ============
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existingProfile = await storage.getUserProfile(userId);
      const mergedData = {
        ...(existingProfile || { country: "Kenya", role: "consumer" }),
        ...req.body,
        id: userId,
      };
      Object.keys(mergedData).forEach(key => {
        if (mergedData[key] === undefined) {
          delete mergedData[key];
        }
      });
      const parsed = insertUserProfileSchema.safeParse(mergedData);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const profile = await storage.upsertUserProfile(parsed.data);
      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update profile" });
    }
  });

  app.get("/api/sellers/:id", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, error: "Seller not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch seller" });
    }
  });

  async function computeTrustScore(sellerId: string) {
    const profile = await storage.getUserProfile(sellerId);
    if (!profile) return { score: 0, maxScore: 100, level: "New Seller", breakdown: [] };

    const sellerOrders = await storage.getOrders(profile.id, 'seller');
    const completedCount = sellerOrders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length;

    let score = 0;
    const breakdown: { factor: string; points: number; maxPoints: number; detail: string }[] = [];

    const verificationPoints = profile.verificationLevel === 'trusted' ? 25 : profile.verificationLevel === 'verified' ? 20 : profile.verificationLevel === 'pending' ? 5 : 0;
    breakdown.push({ factor: "Identity Verification", points: verificationPoints, maxPoints: 25, detail: profile.verificationLevel || "basic" });
    score += verificationPoints;

    const avgRating = profile.rating ? Number(profile.rating) : 0;
    const ratingsCount = profile.ratingsCount || 0;
    const ratingPoints = ratingsCount > 0 ? Math.min(25, Math.round((avgRating / 5) * 25 * Math.min(ratingsCount / 5, 1))) : 0;
    breakdown.push({ factor: "Customer Reviews", points: ratingPoints, maxPoints: 25, detail: ratingsCount > 0 ? `${avgRating.toFixed(1)}/5 (${ratingsCount} reviews)` : "No reviews yet" });
    score += ratingPoints;

    const transactionPoints = Math.min(25, completedCount * 3);
    breakdown.push({ factor: "Completed Transactions", points: transactionPoints, maxPoints: 25, detail: `${completedCount} completed` });
    score += transactionPoints;

    const createdAt = profile.createdAt ? new Date(profile.createdAt) : new Date();
    const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const accountPoints = Math.min(15, Math.floor(accountAgeDays / 30) * 3);
    breakdown.push({ factor: "Account Age", points: accountPoints, maxPoints: 15, detail: accountAgeDays > 30 ? `${Math.floor(accountAgeDays / 30)} months` : `${accountAgeDays} days` });
    score += accountPoints;

    const profileComplete = !!(profile.businessName && profile.country && profile.city && profile.businessDescription);
    const profilePoints = profileComplete ? 10 : (profile.businessName ? 5 : 0);
    breakdown.push({ factor: "Profile Completeness", points: profilePoints, maxPoints: 10, detail: profileComplete ? "Complete" : "Incomplete" });
    score += profilePoints;

    const level = score >= 80 ? "Excellent" : score >= 60 ? "Very Good" : score >= 40 ? "Good" : score >= 20 ? "Fair" : "New Seller";
    return { score, maxScore: 100, level, breakdown };
  }

  app.get("/api/sellers/:id/trust-score", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ success: false, error: "Seller not found" });
      }
      const data = await computeTrustScore(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to compute trust score" });
    }
  });

  // ============ PUBLIC STORES ============
  app.get("/api/stores/:slug", async (req, res) => {
    try {
      let profile = await storage.getUserProfileBySlug(req.params.slug);
      if (!profile) {
        profile = await storage.getUserProfile(req.params.slug);
      }
      if (!profile || profile.isDisabled) {
        return res.status(404).json({ success: false, error: "Store not found" });
      }
      const sellerProducts = await storage.getProducts({ sellerId: profile.id });
      const documents = await storage.getPublicBusinessDocuments(profile.id);
      
      // Get seller subscription for badge info
      const subscription = await feeService.getSellerSubscription(profile.id);
      const subscriptionInfo = subscription ? {
        hasVerifiedBadge: subscription.hasVerifiedBadge || false,
        isHighlyRecommended: subscription.isHighlyRecommended || false,
        tier: subscription.tier,
      } : { hasVerifiedBadge: false, isHighlyRecommended: false, tier: 'free' };
      
      res.json({ 
        store: profile, 
        products: sellerProducts, 
        documents,
        subscription: subscriptionInfo,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch store" });
    }
  });

  app.get("/api/store-slug/check", async (req, res) => {
    try {
      const { slug, userId } = req.query;
      if (!slug || typeof slug !== "string") {
        return res.status(400).json({ success: false, error: "Slug required" });
      }
      const available = await storage.checkStoreSlugAvailable(slug, userId as string);
      res.json({ available });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to check slug" });
    }
  });

  // ============ BUSINESS DOCUMENTS ============
  app.get("/api/business-documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getUserBusinessDocuments(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch documents" });
    }
  });

  app.get("/api/business-documents/public/:userId", async (req, res) => {
    try {
      const documents = await storage.getPublicBusinessDocuments(req.params.userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch documents" });
    }
  });

  app.post("/api/business-documents", isAuthenticated, uploadLimiter, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const documentData = {
        ...req.body,
        userId,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      };
      const document = await storage.createBusinessDocument(documentData);
      res.json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create document" });
    }
  });

  app.patch("/api/business-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getBusinessDocument(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Document not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      const updateData = {
        ...req.body,
        issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
      };
      const document = await storage.updateBusinessDocument(id, updateData);
      res.json({ success: true, data: document });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update document" });
    }
  });

  app.delete("/api/business-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getBusinessDocument(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Document not found" });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await storage.deleteBusinessDocument(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete document" });
    }
  });

  // ============ IMAGE SEARCH ============
  app.post("/api/search/image", searchLimiter, async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: "Image data required" });
      }
      
      // Validate image size (max 10MB base64 ~ 7.5MB raw)
      if (imageBase64.length > 10 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: "Image too large (max 10MB)" });
      }
      
      // Validate data URL format
      if (typeof imageBase64 !== "string" || (!imageBase64.startsWith("data:image/") && !/^[A-Za-z0-9+/=]+$/.test(imageBase64))) {
        return res.status(400).json({ success: false, error: "Invalid image format" });
      }
      
      // Use GPT-5 Vision to analyze the image and extract search keywords
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this product image and extract search keywords. Return a JSON object with:
- "keywords": array of 3-5 specific search terms that describe the product (e.g., "leather bag", "handbag", "brown leather")
- "category": the most likely product category (e.g., "fashion", "electronics", "agriculture", "food", "crafts", "textiles")
- "description": a brief 10-15 word description of what the image shows

Only return valid JSON, no other text or markdown.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_completion_tokens: 200,
      });
      
      let content = response.choices[0]?.message?.content || "{}";
      // Strip markdown code blocks if present
      content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      
      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse image analysis response:", content);
        result = { keywords: [], category: "general", description: "Unable to analyze image" };
      }
      
      res.json({ success: true, data: result });
    } catch (error) {
      console.error("Image search error:", error);
      res.status(500).json({ success: false, error: "Failed to analyze image" });
    }
  });

  // Search suppliers by product keywords
  app.get("/api/suppliers/search", async (req, res) => {
    try {
      const { search } = req.query;
      if (!search || typeof search !== 'string') {
        return res.json([]);
      }
      const suppliers = await storage.getSuppliersByProductSearch(search);
      res.json(suppliers);
    } catch (error) {
      console.error("Supplier search error:", error);
      res.status(500).json({ success: false, error: "Failed to search suppliers" });
    }
  });

  // ============ IP-BASED LOCATION DETECTION ============
  const COUNTRY_CODE_TO_NAME: Record<string, string> = {
    "DZ": "Algeria", "AO": "Angola", "BJ": "Benin", "BW": "Botswana", "BF": "Burkina Faso",
    "BI": "Burundi", "CV": "Cabo Verde", "CM": "Cameroon", "CF": "Central African Republic",
    "TD": "Chad", "KM": "Comoros", "CG": "Congo", "CD": "DR Congo", "CI": "Ivory Coast",
    "DJ": "Djibouti", "EG": "Egypt", "GQ": "Equatorial Guinea", "ER": "Eritrea", "SZ": "Eswatini",
    "ET": "Ethiopia", "GA": "Gabon", "GM": "Gambia", "GH": "Ghana", "GN": "Guinea",
    "GW": "Guinea-Bissau", "KE": "Kenya", "LS": "Lesotho", "LR": "Liberia", "LY": "Libya",
    "MG": "Madagascar", "MW": "Malawi", "ML": "Mali", "MR": "Mauritania", "MU": "Mauritius",
    "MA": "Morocco", "MZ": "Mozambique", "NA": "Namibia", "NE": "Niger", "NG": "Nigeria",
    "RW": "Rwanda", "ST": "Sao Tome and Principe", "SN": "Senegal", "SC": "Seychelles",
    "SL": "Sierra Leone", "SO": "Somalia", "ZA": "South Africa", "SS": "South Sudan",
    "SD": "Sudan", "TZ": "Tanzania", "TG": "Togo", "TN": "Tunisia", "UG": "Uganda",
    "ZM": "Zambia", "ZW": "Zimbabwe",
  };

  app.get("/api/geo/detect", async (req, res) => {
    try {
      const tzCountryMap: Record<string, string> = {
        "Africa/Nairobi": "KE", "Africa/Lagos": "NG", "Africa/Accra": "GH",
        "Africa/Johannesburg": "ZA", "Africa/Cairo": "EG", "Africa/Casablanca": "MA",
        "Africa/Addis_Ababa": "ET", "Africa/Dar_es_Salaam": "TZ", "Africa/Kampala": "UG",
        "Africa/Kigali": "RW", "Africa/Lusaka": "ZM", "Africa/Harare": "ZW",
        "Africa/Maputo": "MZ", "Africa/Windhoek": "NA", "Africa/Gaborone": "BW",
        "Africa/Douala": "CM", "Africa/Dakar": "SN", "Africa/Tunis": "TN",
        "Africa/Algiers": "DZ", "Africa/Tripoli": "LY", "Africa/Khartoum": "SD",
        "Africa/Mogadishu": "SO", "Africa/Djibouti": "DJ", "Africa/Asmara": "ER",
        "Africa/Bujumbura": "BI", "Africa/Bangui": "CF", "Africa/Brazzaville": "CG",
        "Africa/Kinshasa": "CD", "Africa/Libreville": "GA", "Africa/Malabo": "GQ",
        "Africa/Niamey": "NE", "Africa/Ouagadougou": "BF", "Africa/Bamako": "ML",
        "Africa/Conakry": "GN", "Africa/Freetown": "SL", "Africa/Monrovia": "LR",
        "Africa/Banjul": "GM", "Africa/Nouakchott": "MR", "Africa/Lome": "TG",
        "Africa/Porto-Novo": "BJ", "Africa/Abidjan": "CI", "Africa/Luanda": "AO",
        "Africa/Ndjamena": "TD", "Africa/Juba": "SS", "Africa/Maseru": "LS",
        "Africa/Mbabane": "SZ", "Africa/Antananarivo": "MG", "Africa/Blantyre": "MW",
        "Indian/Mauritius": "MU", "Indian/Mahe": "SC", "Indian/Comoro": "KM",
      };

      const timezone = req.query.timezone as string;
      if (timezone) {
        const countryCode = tzCountryMap[timezone];
        if (countryCode) {
          const countryName = COUNTRY_CODE_TO_NAME[countryCode];
          if (countryName) {
            const currency = AFRICAN_CURRENCIES[countryName];
            return res.json({
              success: true,
              data: {
                country: countryName,
                countryCode: countryCode,
                city: null,
                currency: currency || null,
                isAfrican: true,
                source: "timezone",
              }
            });
          }
        }
      }

      const forwarded = req.headers["x-forwarded-for"];
      let clientIp = "";
      if (typeof forwarded === "string") {
        const ips = forwarded.split(",").map(ip => ip.trim());
        clientIp = ips[0];
      } else {
        clientIp = req.socket.remoteAddress || "";
      }
      
      const cleanIp = clientIp.replace("::ffff:", "");
      const isLocalIp = cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp === "localhost" || 
                         cleanIp.startsWith("10.") || cleanIp.startsWith("192.168.") || cleanIp.startsWith("172.");
      
      if (!isLocalIp && cleanIp) {
        try {
          const response = await fetch(`https://ipapi.co/${cleanIp}/json/`);
          if (response.ok) {
            const data = await response.json();
            if (data.country_code && !data.error) {
              const countryCode = data.country_code;
              const countryName = COUNTRY_CODE_TO_NAME[countryCode] || data.country_name;
              const currency = AFRICAN_CURRENCIES[countryName];
              
              return res.json({
                success: true,
                data: {
                  country: countryName,
                  countryCode: countryCode,
                  city: data.city,
                  currency: currency || null,
                  isAfrican: !!COUNTRY_CODE_TO_NAME[countryCode],
                  source: "ip",
                }
              });
            }
          }
        } catch (ipError) {
          console.error("IP lookup failed:", ipError);
        }
      }
      
      res.json({ success: false, error: "Could not detect location" });
    } catch (error) {
      console.error("IP geolocation error:", error);
      res.json({ success: false, error: "Location detection failed" });
    }
  });

  // ============ GEOLOCATION (GPS-based fallback) ============
  const AFRICAN_COUNTRIES_GEO = [
    { name: "Algeria", code: "DZ", lat: 28.0339, lng: 1.6596 },
    { name: "Angola", code: "AO", lat: -11.2027, lng: 17.8739 },
    { name: "Benin", code: "BJ", lat: 9.3077, lng: 2.3158 },
    { name: "Botswana", code: "BW", lat: -22.3285, lng: 24.6849 },
    { name: "Burkina Faso", code: "BF", lat: 12.2383, lng: -1.5616 },
    { name: "Cameroon", code: "CM", lat: 7.3697, lng: 12.3547 },
    { name: "Egypt", code: "EG", lat: 26.8206, lng: 30.8025 },
    { name: "Ethiopia", code: "ET", lat: 9.145, lng: 40.4897 },
    { name: "Ghana", code: "GH", lat: 7.9465, lng: -1.0232 },
    { name: "Ivory Coast", code: "CI", lat: 7.54, lng: -5.5471 },
    { name: "Kenya", code: "KE", lat: -0.0236, lng: 37.9062 },
    { name: "Morocco", code: "MA", lat: 31.7917, lng: -7.0926 },
    { name: "Nigeria", code: "NG", lat: 9.082, lng: 8.6753 },
    { name: "Rwanda", code: "RW", lat: -1.9403, lng: 29.8739 },
    { name: "Senegal", code: "SN", lat: 14.4974, lng: -14.4524 },
    { name: "South Africa", code: "ZA", lat: -30.5595, lng: 22.9375 },
    { name: "Tanzania", code: "TZ", lat: -6.369, lng: 34.8888 },
    { name: "Tunisia", code: "TN", lat: 33.8869, lng: 9.5375 },
    { name: "Uganda", code: "UG", lat: 1.3733, lng: 32.2903 },
    { name: "Zambia", code: "ZM", lat: -13.1339, lng: 27.8493 },
    { name: "Zimbabwe", code: "ZW", lat: -19.0154, lng: 29.1549 },
  ];
  
  app.get("/api/geo/countries", async (req, res) => {
    // Map coordinates to African countries
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      // Return all African countries if no coordinates provided
      return res.json({ success: true, data: { countries: AFRICAN_COUNTRIES_GEO } });
    }
    
    // Validate coordinates
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ success: false, error: "Invalid coordinates" });
    }
    
    // Validate range
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, error: "Coordinates out of range" });
    }
    
    // Calculate distance to each country and find nearest
    let nearestCountry = AFRICAN_COUNTRIES_GEO[0];
    let minDistance = Number.MAX_VALUE;
    
    for (const country of AFRICAN_COUNTRIES_GEO) {
      const distance = Math.sqrt(
        Math.pow(country.lat - latitude, 2) + Math.pow(country.lng - longitude, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCountry = country;
      }
    }
    
    res.json({ 
      success: true, 
      data: { 
        detectedCountry: nearestCountry,
        countries: AFRICAN_COUNTRIES_GEO,
      } 
    });
  });

  // ============ CART ============
  app.get("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getCartItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertCartItemSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const item = await storage.addToCart(parsed.data);
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to add to cart" });
    }
  });

  app.patch("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const item = await storage.updateCartItem(id, quantity);
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to remove from cart" });
    }
  });

  // ============ ORDERS ============
  app.get("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const role = (req.query.role as 'buyer' | 'seller') || 'buyer';
      const orders = await storage.getOrders(userId, role);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { items, ...orderData } = req.body;
      const order = await storage.createOrder(
        { ...orderData, buyerId: userId },
        items
      );
      
      // Check for dropship items and create fulfillment records
      const sellerId = orderData.sellerId;
      
      // Match request items to inserted order items by productId
      for (let i = 0; i < items.length; i++) {
        const requestItem = items[i];
        const orderItem = order.items.find(oi => oi.productId === requestItem.productId);
        
        if (!orderItem) continue;
        
        const dropshipListing = await storage.findDropshipListingByResellerAndProduct(
          sellerId, 
          requestItem.productId
        );
        
        if (dropshipListing) {
          // This is a dropship item - create fulfillment record
          const wholesaleAmount = parseFloat(dropshipListing.offer.wholesalePrice) * orderItem.quantity;
          const retailAmount = parseFloat(dropshipListing.retailPrice) * orderItem.quantity;
          const resellerMargin = retailAmount - wholesaleAmount;
          
          // Create dropship fulfillment record with proper order item ID
          // The fulfillment record tracks the payment split between supplier and reseller
          // When escrow is released, use wholesaleAmount for supplier and resellerMargin for reseller
          await storage.createDropshipFulfillment({
            orderId: order.id,
            orderItemId: orderItem.id,
            listingId: dropshipListing.id,
            supplierId: dropshipListing.offer.supplierId,
            resellerId: sellerId,
            wholesaleAmount: wholesaleAmount.toFixed(2),
            resellerMargin: resellerMargin.toFixed(2),
            currency: order.currency || "USD",
            status: "pending",
          });
        }
      }
      
      await storage.clearCart(userId);
      
      // Calculate and record platform fees
      try {
        const orderAmount = parseFloat(order.totalAmount);
        const fees = await feeService.calculateOrderFees(sellerId, orderAmount, true);
        
        // Record commission fee
        await feeService.recordPlatformFee({
          orderId: order.id,
          sellerId: sellerId,
          buyerId: userId,
          feeType: "commission",
          amount: fees.commission.amount,
          rate: fees.commission.rate,
          baseAmount: fees.commission.baseAmount,
          description: fees.commission.description,
          currency: order.currency || "USD",
        });
        
        // Record escrow fee if applicable
        if (fees.escrowFee) {
          await feeService.recordPlatformFee({
            orderId: order.id,
            sellerId: sellerId,
            buyerId: userId,
            feeType: "escrow_fee",
            amount: fees.escrowFee.amount,
            rate: fees.escrowFee.rate,
            baseAmount: fees.escrowFee.baseAmount,
            description: fees.escrowFee.description,
            currency: order.currency || "USD",
          });
        }
      } catch (feeError) {
        console.error("Failed to record platform fees:", feeError);
      }
      
      try {
        const user = req.user as any;
        const buyerEmail = user?.email;
        const buyerName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username || 'Buyer');
        const orderAmount = parseFloat(order.totalAmount);

        const receiptItems = order.items.map((oi: any) => ({
          name: oi.product?.name || `Product #${oi.productId}`,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice || "0",
          totalPrice: oi.totalPrice || String(Number(oi.unitPrice || 0) * oi.quantity),
        }));

        const platformFeeAmount = (orderAmount * 0.05).toFixed(2);
        const totalWithFee = (orderAmount + parseFloat(platformFeeAmount)).toFixed(2);

        let commissionRate = "5%";
        let commissionDecimal = 0.05;
        try {
          const fees = await feeService.calculateOrderFees(sellerId, orderAmount, true);
          commissionDecimal = Number(fees.commission.rate);
          commissionRate = `${(commissionDecimal * 100).toFixed(1)}%`;
        } catch {}

        if (buyerEmail) {
          sendBuyerTransactionReceipt(
            buyerEmail, order.id, receiptItems,
            order.totalAmount, platformFeeAmount, totalWithFee,
            orderData.paymentMethod || 'escrow', orderData.shippingAddress
          ).catch(e => console.error("Buyer receipt email failed:", e));
        }

        const sellerResult = await db.execute(sql`SELECT email FROM users WHERE id = ${sellerId} LIMIT 1`);
        const sellerEmail = sellerResult.rows[0]?.email as string | undefined;
        if (sellerEmail) {
          sendSellerNewOrderNotification(
            sellerEmail, order.id, order.totalAmount, buyerName,
            receiptItems, commissionRate, orderData.shippingAddress
          ).catch(e => console.error("Seller notification email failed:", e));

          const commissionAmount = (orderAmount * commissionDecimal).toFixed(2);
          const netPayout = (orderAmount - parseFloat(commissionAmount)).toFixed(2);
          sendSellerTransactionReceipt(
            sellerEmail, order.id, receiptItems,
            order.totalAmount, commissionAmount, commissionRate, netPayout
          ).catch(e => console.error("Seller receipt email failed:", e));
        }
        const invoiceNumber = generateInvoiceNumber();
        storage.createInvoice({
          invoiceNumber,
          orderId: order.id,
          sellerId: order.sellerId,
          buyerId: order.buyerId || userId,
          status: 'issued',
          subtotal: order.totalAmount,
          platformFee: platformFeeAmount,
          totalAmount: totalWithFee,
          currency: order.currency || 'USD',
          paymentMethod: order.paymentMethod || 'escrow',
          lineItems: receiptItems.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        }).catch(e => console.error("Invoice creation failed:", e));
      } catch (emailError) {
        console.error("Failed to send transaction emails:", emailError);
      }

      logActivity({
        orderId: order.id,
        actorId: userId,
        actorType: "buyer",
        action: "order_placed",
        description: `Order #${order.id} placed for ${order.totalAmount} ${order.currency || 'USD'}`,
      }).catch(e => console.error("Activity log failed:", e));

      notifyAdmin({
        type: "new_order",
        title: "New Order Placed",
        message: `Order #${order.id} for ${order.totalAmount} ${order.currency || 'USD'} has been placed`,
        orderId: order.id,
        userId,
        severity: "info",
      }).catch(e => console.error("Admin notification failed:", e));
      
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ success: false, error: "Failed to create order" });
    }
  });

  app.post("/api/orders/sample", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId, quantity, shippingAddress, paymentMethod } = req.body;

      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ success: false, error: "Product ID and quantity are required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }

      if (!product.sampleAvailable) {
        return res.status(400).json({ success: false, error: "Samples are not available for this product" });
      }

      const maxQty = product.sampleMaxQty || 5;
      if (quantity > maxQty) {
        return res.status(400).json({ success: false, error: `Maximum sample quantity is ${maxQty}` });
      }

      const samplePrice = product.samplePrice ? parseFloat(product.samplePrice) : parseFloat(product.price);
      const totalAmount = (samplePrice * quantity).toFixed(2);

      const order = await storage.createOrder(
        {
          buyerId: userId,
          sellerId: product.sellerId,
          status: "pending",
          orderType: "sample",
          totalAmount,
          currency: product.currency || "USD",
          shippingAddress: shippingAddress || null,
          paymentMethod: paymentMethod || "escrow",
          notes: `Sample order - ${quantity} unit(s) at sample price`,
        },
        [
          {
            orderId: 0,
            productId: product.id,
            quantity,
            unitPrice: samplePrice.toFixed(2),
            totalPrice: totalAmount,
          },
        ]
      );

      logActivity({
        orderId: order.id,
        actorId: userId,
        actorType: "buyer",
        action: "order_placed",
        description: `Sample order #${order.id} placed for ${totalAmount} ${product.currency || 'USD'}`,
      }).catch(e => console.error("Activity log failed:", e));

      notifyAdmin({
        type: "new_order",
        title: "New Sample Order Placed",
        message: `Sample order #${order.id} for ${totalAmount} ${product.currency || 'USD'}`,
        orderId: order.id,
        userId,
        severity: "info",
      }).catch(e => console.error("Admin notification failed:", e));

      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error("Sample order creation error:", error);
      res.status(500).json({ success: false, error: "Failed to create sample order" });
    }
  });

  app.patch("/api/orders/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update order status" });
    }
  });

  // ============ MESSAGES (Legacy) ============
  app.get("/api/messages/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/messages/:partnerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { partnerId } = req.params;
      const messages = await storage.getMessages(userId, partnerId);
      await storage.markMessagesAsRead(userId, partnerId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertMessageSchema.safeParse({ ...req.body, senderId: userId });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const message = await storage.sendMessage(parsed.data);
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send message" });
    }
  });

  // ============ WALLETS API ============
  app.get("/api/wallets/balance", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        wallet = await storage.createWallet({ userId, balance: "0", currency: "USD", status: "active" });
      }
      
      res.json({ success: true, data: wallet });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch wallet balance" });
    }
  });

  app.get("/api/wallets/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        return res.json({ success: true, data: [] });
      }
      
      const transactions = await storage.getWalletTransactions(wallet.id);
      res.json({ success: true, data: transactions });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch wallet transactions" });
    }
  });

  app.post("/api/wallets/withdraw", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, method, destination } = req.body;
      
      const wallet = await storage.getWallet(userId);
      if (!wallet) {
        return res.status(404).json({ success: false, error: "Wallet not found" });
      }
      
      if (Number(wallet.balance) < amount) {
        return res.status(400).json({ success: false, error: "Insufficient balance" });
      }
      
      await storage.updateWalletBalance(userId, amount, 'debit');
      
      const transaction = await storage.createWalletTransaction({
        walletId: wallet.id,
        type: 'withdrawal',
        amount: amount.toString(),
        currency: wallet.currency,
        referenceType: 'withdrawal',
        description: `Withdrawal to ${method}: ${destination}`,
        status: 'pending',
      });
      
      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to process withdrawal" });
    }
  });

  app.post("/api/wallets/fund", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount } = req.body;

      if (!amount || amount < 1 || amount > 10000) {
        return res.status(400).json({ success: false, error: "Amount must be between $1 and $10,000" });
      }

      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Wallet Top-Up',
              description: `Add $${amount.toFixed(2)} to your Ghani Africa wallet`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/wallet?funded=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/wallet?cancelled=true`,
        metadata: {
          userId,
          type: 'wallet_fund',
          amount: amount.toString(),
        },
      });

      res.json({ success: true, url: session.url });
    } catch (error) {
      console.error("Wallet fund error:", error);
      res.status(500).json({ success: false, error: "Failed to create funding session" });
    }
  });

  app.post("/api/wallets/fund/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.body;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ success: false, error: "Valid session ID is required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ success: false, error: "Payment not completed" });
      }

      if (session.metadata?.type !== 'wallet_fund') {
        return res.status(403).json({ success: false, error: "Invalid session type" });
      }

      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ success: false, error: "Session does not belong to this user" });
      }

      const amountFromStripe = (session.amount_total || 0) / 100;
      if (amountFromStripe <= 0) {
        return res.status(400).json({ success: false, error: "Invalid payment amount" });
      }

      let wallet = await storage.getWallet(userId);
      if (!wallet) {
        wallet = await storage.createWallet({ userId, balance: "0", currency: "USD", status: "active" });
      }

      const existingTxns = await storage.getWalletTransactions(wallet.id);
      const referenceKey = `stripe_fund:${sessionId}`;
      const alreadyProcessed = existingTxns.some((t: any) => t.referenceId === referenceKey || t.description === referenceKey);
      if (alreadyProcessed) {
        const currentWallet = await storage.getWallet(userId);
        return res.json({ success: true, data: currentWallet, message: "Already processed" });
      }

      await storage.updateWalletBalance(userId, amountFromStripe, 'credit');

      await storage.createWalletTransaction({
        walletId: wallet.id,
        type: 'deposit',
        amount: amountFromStripe.toString(),
        currency: 'USD',
        referenceType: 'stripe_deposit',
        referenceId: referenceKey,
        description: referenceKey,
        status: 'completed',
      });

      const updatedWallet = await storage.getWallet(userId);
      res.json({ success: true, data: updatedWallet });
    } catch (error) {
      console.error("Wallet fund complete error:", error);
      res.status(500).json({ success: false, error: "Failed to complete wallet funding" });
    }
  });

  // ============ PAYMENTS API ============
  app.post("/api/payments/intents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { order_id, amount, currency, payment_method, provider, payer_phone, payer_email, idempotency_key } = req.body;
      
      if (idempotency_key) {
        const existing = await storage.getPaymentIntentByOrder(order_id);
        if (existing && existing.status === 'pending' && existing.redirectUrl) {
          return res.json({ success: true, data: { payment_intent_id: `PAY${existing.id}`, status: existing.status, redirect_url: existing.redirectUrl } });
        }
      }

      let redirectUrl: string | null = null;
      let stripeSessionId: string | null = null;

      try {
        const stripe = await getUncachableStripeClient();
        const order = await storage.getOrder(order_id);

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: (currency || 'USD').toLowerCase(),
              product_data: {
                name: `Order #${order_id} Payment`,
                description: order ? `Payment for order on Ghani Africa` : `Order payment`,
              },
              unit_amount: Math.round(parseFloat(amount) * 100),
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${req.protocol}://${req.get('host')}/orders?payment=success&order_id=${order_id}`,
          cancel_url: `${req.protocol}://${req.get('host')}/orders?payment=cancelled&order_id=${order_id}`,
          metadata: {
            userId,
            orderId: order_id.toString(),
            type: 'order_payment',
          },
        });

        redirectUrl = session.url;
        stripeSessionId = session.id;
      } catch (stripeError) {
        console.log("Stripe not available for payment intent, using internal tracking:", stripeError);
      }
      
      const intent = await storage.createPaymentIntent({
        orderId: order_id,
        buyerId: userId,
        amount: amount.toString(),
        currency: currency || 'USD',
        paymentMethod: payment_method || 'stripe',
        provider: provider || 'stripe',
        payerPhone: payer_phone,
        payerEmail: payer_email,
        status: 'pending',
        idempotencyKey: idempotency_key,
        redirectUrl: redirectUrl,
      });
      
      res.status(201).json({
        success: true,
        data: {
          payment_intent_id: `PAY${intent.id}`,
          status: intent.status,
          redirect_url: redirectUrl || intent.redirectUrl,
          stripe_session_id: stripeSessionId,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create payment intent" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const { payment_intent_id, status, transaction_ref } = req.body;
      
      const intentId = parseInt(payment_intent_id.replace('PAY', ''));
      const intent = await storage.getPaymentIntent(intentId);
      
      if (!intent) {
        return res.status(404).json({ success: false, error: "Payment intent not found" });
      }
      
      await storage.updatePaymentIntent(intentId, {
        status: status.toLowerCase(),
        transactionRef: transaction_ref,
      });
      
      if (status === 'SUCCESS') {
        await storage.updateOrderStatus(intent.orderId, 'paid');
        
        const order = await storage.getOrder(intent.orderId);
        if (order) {
          await storage.createEscrow({
            orderId: intent.orderId,
            buyerId: intent.buyerId,
            sellerId: order.sellerId,
            amount: intent.amount,
            currency: intent.currency,
            status: 'held',
            milestones: ['PAID'],
          });

          const buyerUser = await getUserById(intent.buyerId);
          if (buyerUser?.email) {
            sendEscrowPaymentEmail(buyerUser.email, intent.orderId, intent.amount, intent.currency).catch(console.error);
          }
        }

        logActivity({
          orderId: intent.orderId,
          actorId: intent.buyerId,
          actorType: "buyer",
          action: "payment_received",
          description: `Payment of ${intent.amount} ${intent.currency} received for order #${intent.orderId}`,
        }).catch(e => console.error("Activity log failed:", e));

        notifyAdmin({
          type: "payment_received",
          title: "Payment Received",
          message: `Payment of ${intent.amount} ${intent.currency} confirmed for order #${intent.orderId}`,
          orderId: intent.orderId,
          userId: intent.buyerId,
          severity: "info",
        }).catch(e => console.error("Admin notification failed:", e));
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to process webhook" });
    }
  });

  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      let event = req.body;
      const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (signingSecret) {
        try {
          const stripe = await getUncachableStripeClient();
          const sig = req.headers['stripe-signature'];
          if (!sig) {
            console.error("Stripe webhook: missing signature header");
            return res.status(400).json({ error: "Missing stripe-signature header" });
          }
          const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          event = stripe.webhooks.constructEvent(rawBody, sig, signingSecret);
        } catch (sigError: any) {
          console.error("Stripe webhook signature verification failed:", sigError.message);
          return res.status(400).json({ error: "Webhook signature verification failed" });
        }
      } else {
        console.log("Stripe webhook: No STRIPE_WEBHOOK_SECRET configured, processing without signature verification");
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object;
        if (!session) {
          return res.json({ received: true });
        }

        const type = session.metadata?.type;
        const userId = session.metadata?.userId;

        if (type === 'wallet_fund' && userId && session.payment_status === 'paid') {
          const amountFromStripe = (session.amount_total || 0) / 100;
          if (amountFromStripe > 0) {
            let wallet = await storage.getWallet(userId);
            if (!wallet) {
              wallet = await storage.createWallet({ userId, balance: "0", currency: "USD", status: "active" });
            }

            const referenceKey = `stripe_fund:${session.id}`;
            const existingTxns = await storage.getWalletTransactions(wallet.id);
            const alreadyProcessed = existingTxns.some((t: any) => t.referenceId === referenceKey || t.description === referenceKey);

            if (!alreadyProcessed) {
              await storage.updateWalletBalance(userId, amountFromStripe, 'credit');
              await storage.createWalletTransaction({
                walletId: wallet.id,
                type: 'deposit',
                amount: amountFromStripe.toString(),
                currency: 'USD',
                referenceType: 'stripe_deposit',
                referenceId: referenceKey,
                description: referenceKey,
                status: 'completed',
              });
              console.log(`Webhook: Wallet funded $${amountFromStripe} for user ${userId}`);
            }
          }
        }

        if (type === 'order_payment' && userId && session.payment_status === 'paid') {
          const orderId = parseInt(session.metadata?.orderId || '0');
          if (orderId > 0) {
            const order = await storage.getOrder(orderId);
            if (order && order.status !== 'paid') {
              await storage.updateOrderStatus(orderId, 'paid');
              console.log(`Webhook: Order #${orderId} marked as paid via Stripe`);

              const amountFromStripe = (session.amount_total || 0) / 100;
              const orderTotal = parseFloat(order.totalAmount || '0');
              if (Math.abs(amountFromStripe - orderTotal) > 1) {
                console.warn(`Webhook: Amount mismatch for order #${orderId}: Stripe=$${amountFromStripe}, Order=$${orderTotal}`);
              }

              try {
                await storage.createEscrow({
                  orderId,
                  buyerId: userId,
                  sellerId: order.sellerId,
                  amount: orderTotal.toString(),
                  currency: order.currency || 'USD',
                  status: 'held',
                });
              } catch (escrowErr) {
                console.error("Webhook escrow creation error:", escrowErr);
              }
            }
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(200).json({ received: true });
    }
  });

  app.get("/api/payments/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const intent = await storage.getPaymentIntentByOrder(orderId);
      
      if (!intent) {
        return res.status(404).json({ success: false, error: "Payment not found" });
      }
      
      res.json({ success: true, data: intent });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch payment" });
    }
  });

  // ============ ESCROW API ============
  app.post("/api/escrow/create", isAuthenticated, async (req: any, res) => {
    try {
      const { order_id, buyer_id, seller_id, amount, currency } = req.body;
      
      const existingEscrow = await storage.getEscrow(order_id);
      if (existingEscrow) {
        return res.status(400).json({ success: false, error: "Escrow already exists for this order" });
      }
      
      const escrow = await storage.createEscrow({
        orderId: order_id,
        buyerId: buyer_id,
        sellerId: seller_id,
        amount: amount.toString(),
        currency: currency || 'USD',
        status: 'held',
        milestones: ['PAID'],
      });

      logActivity({
        orderId: order_id,
        actorId: buyer_id,
        actorType: "buyer",
        action: "escrow_held",
        description: `Escrow of ${amount} ${currency || 'USD'} held for order #${order_id}`,
      }).catch(e => console.error("Activity log failed:", e));

      notifyAdmin({
        type: "escrow_held",
        title: "Escrow Created",
        message: `Escrow of ${amount} ${currency || 'USD'} held for order #${order_id}`,
        orderId: order_id,
        userId: buyer_id,
        severity: "info",
      }).catch(e => console.error("Admin notification failed:", e));
      
      res.status(201).json({ success: true, data: escrow });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create escrow" });
    }
  });

  app.post("/api/escrow/release", isAuthenticated, async (req: any, res) => {
    try {
      const { order_id, confirmation_method } = req.body;
      
      const escrow = await storage.getEscrow(order_id);
      if (!escrow) {
        return res.status(404).json({ success: false, error: "Escrow not found" });
      }
      
      if (escrow.status === 'released') {
        return res.status(400).json({ success: false, error: "Escrow already released" });
      }
      
      const updatedEscrow = await storage.releaseEscrow(order_id);
      
      const sellerWallet = await storage.getWallet(escrow.sellerId);
      if (sellerWallet) {
        await storage.updateWalletBalance(escrow.sellerId, Number(escrow.amount), 'credit');
        await storage.createWalletTransaction({
          walletId: sellerWallet.id,
          type: 'credit',
          amount: escrow.amount,
          currency: escrow.currency,
          referenceId: order_id.toString(),
          referenceType: 'escrow',
          description: `Payment released for order #${order_id}`,
          status: 'completed',
        });
      }
      
      await storage.updateOrderStatus(order_id, 'completed');

      logActivity({
        orderId: order_id,
        actorId: escrow.sellerId,
        actorType: "system",
        action: "escrow_released",
        description: `Escrow of ${escrow.amount} ${escrow.currency} released for order #${order_id}`,
      }).catch(e => console.error("Activity log failed:", e));

      notifyAdmin({
        type: "escrow_released",
        title: "Escrow Released",
        message: `Escrow of ${escrow.amount} ${escrow.currency} released to seller for order #${order_id}`,
        orderId: order_id,
        userId: escrow.sellerId,
        severity: "info",
      }).catch(e => console.error("Admin notification failed:", e));
      
      res.json({ success: true, data: updatedEscrow });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to release escrow" });
    }
  });

  app.get("/api/secure-transactions/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const buyerOrders = await storage.getOrders(userId, 'buyer');
      const sellerOrders = await storage.getOrders(userId, 'seller');
      const allOrders = [...buyerOrders, ...sellerOrders];

      const protectedOrders = await Promise.all(
        allOrders.map(async (order) => {
          const escrow = await storage.getEscrow(order.id);
          const shipment = await storage.getShipmentByOrder(order.id);
          if (!escrow) return null;

          const now = new Date();
          const createdAt = new Date(escrow.createdAt || now);
          const autoReleaseDate = escrow.releaseAt ? new Date(escrow.releaseAt) : new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
          const disputeWindowEnd = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
          const autoReleaseMs = Math.max(0, autoReleaseDate.getTime() - now.getTime());
          const disputeWindowMs = Math.max(0, disputeWindowEnd.getTime() - now.getTime());

          const sellerProfile = await storage.getUserProfile(escrow.sellerId);
          const trustScoreData = await computeTrustScore(escrow.sellerId);

          const coverageLimit = trustScoreData.score >= 80 ? Number(escrow.amount) * 1.5
            : trustScoreData.score >= 60 ? Number(escrow.amount) * 1.2
            : Number(escrow.amount);
          const protectionTier = trustScoreData.score >= 60 ? "Premium" : "Standard";

          return {
            orderId: order.id,
            orderStatus: order.status,
            totalAmount: order.totalAmount,
            currency: order.currency || 'USD',
            createdAt: order.createdAt,
            escrow: {
              status: escrow.status.toUpperCase(),
              milestones: escrow.milestones,
              amount: escrow.amount,
              releaseCondition: escrow.releaseCondition,
            },
            shipment: shipment ? {
              trackingNumber: shipment.trackingNumber,
              status: shipment.status,
              courierName: shipment.courierName,
              estimatedDelivery: shipment.estimatedDelivery,
            } : null,
            seller: {
              id: escrow.sellerId,
              name: sellerProfile?.businessName || 'Seller',
              trustScore: trustScoreData.score,
              trustLevel: trustScoreData.level,
            },
            protection: {
              tier: protectionTier,
              coverageAmount: coverageLimit.toFixed(2),
              autoReleaseDays: Math.ceil(autoReleaseMs / (24 * 60 * 60 * 1000)),
              disputeWindowDays: Math.ceil(disputeWindowMs / (24 * 60 * 60 * 1000)),
              autoReleaseDate: autoReleaseDate.toISOString(),
              disputeWindowEnd: disputeWindowEnd.toISOString(),
            },
            role: buyerOrders.some(o => o.id === order.id) ? 'buyer' : 'seller',
          };
        })
      );

      const filtered = protectedOrders.filter(Boolean);
      const stats = {
        totalProtected: filtered.length,
        totalCoverage: filtered.reduce((sum, o: any) => sum + Number(o.escrow.amount), 0).toFixed(2),
        activeEscrows: filtered.filter((o: any) => o.escrow.status === 'HELD').length,
        completedTransactions: filtered.filter((o: any) => o.escrow.status === 'RELEASED').length,
        disputeCount: filtered.filter((o: any) => o.escrow.status === 'DISPUTED').length,
      };

      res.json({ success: true, data: { orders: filtered, stats } });
    } catch (error) {
      console.error("Secure transactions dashboard error:", error);
      res.status(500).json({ success: false, error: "Failed to load dashboard" });
    }
  });

  app.get("/api/seller/:sellerId/trade-assurance", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const profile = await storage.getUserProfile(sellerId);
      const trustScoreData = await computeTrustScore(sellerId);

      const isVerified = profile?.verificationLevel === 'verified' || profile?.verificationLevel === 'premium';
      const protectionTier = trustScoreData.score >= 60 ? "Premium" : "Standard";
      const coverageLimit = trustScoreData.score >= 80 ? 15000
        : trustScoreData.score >= 60 ? 10000
        : trustScoreData.score >= 40 ? 5000
        : 2000;

      res.json({
        success: true,
        data: {
          eligible: true,
          verified: isVerified,
          trustScore: trustScoreData.score,
          trustLevel: trustScoreData.level,
          protectionTier,
          coverageLimit,
          features: protectionTier === 'Premium'
            ? ['Escrow Protection', '30-Day Dispute Window', 'Quality Guarantee', 'On-Time Delivery', 'Extended Coverage', 'Priority Support']
            : ['Escrow Protection', '30-Day Dispute Window', 'Quality Guarantee', 'On-Time Delivery'],
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get trade assurance info" });
    }
  });

  app.get("/api/escrow/status/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const escrow = await storage.getEscrow(orderId);
      
      if (!escrow) {
        return res.status(404).json({ success: false, error: "Escrow not found" });
      }
      
      res.json({
        success: true,
        data: {
          status: escrow.status.toUpperCase(),
          milestones: escrow.milestones,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch escrow status" });
    }
  });

  app.post("/api/escrow/milestone", isAuthenticated, async (req: any, res) => {
    try {
      const { order_id, milestone } = req.body;
      
      const escrow = await storage.addEscrowMilestone(order_id, milestone);
      if (!escrow) {
        return res.status(404).json({ success: false, error: "Escrow not found" });
      }
      
      res.json({ success: true, data: escrow });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to add milestone" });
    }
  });

  // ============ LOGISTICS API ============
  app.post("/api/logistics/shipments", isAuthenticated, async (req: any, res) => {
    try {
      const { order_id, pickup, delivery, package: packageInfo } = req.body;
      
      const order = await storage.getOrder(order_id);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      const shipment = await storage.createShipment({
        orderId: order_id,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        pickupAddress: pickup,
        deliveryAddress: delivery,
        packageInfo,
        status: 'pending',
      });
      
      await storage.addTrackingEvent({
        shipmentId: shipment.id,
        status: 'pending',
        location: pickup.city,
        description: 'Shipment created, awaiting pickup',
      });
      
      await storage.addEscrowMilestone(order_id, 'SHIPMENT_CREATED');
      
      res.status(201).json({
        success: true,
        data: {
          shipment_id: `SHIP${shipment.id}`,
          tracking_number: shipment.trackingNumber,
          status: shipment.status,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create shipment" });
    }
  });

  app.post("/api/logistics/assign", isAuthenticated, async (req: any, res) => {
    try {
      const { shipment_id, priority, courier_id, courier_name } = req.body;
      
      const id = parseInt(shipment_id.replace('SHIP', ''));
      const shipment = await storage.updateShipment(id, {
        status: 'assigned',
        priority,
        courierId: courier_id,
        courierName: courier_name || 'PAIDM Express',
        estimatedDelivery: new Date(Date.now() + (priority === 'fastest' ? 2 : priority === 'express' ? 4 : 7) * 24 * 60 * 60 * 1000),
      });
      
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      
      await storage.addTrackingEvent({
        shipmentId: id,
        status: 'assigned',
        description: `Courier assigned: ${courier_name || 'PAIDM Express'}`,
      });
      
      res.json({ success: true, data: shipment });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to assign courier" });
    }
  });

  app.get("/api/logistics/track/:shipmentId", async (req, res) => {
    try {
      const { shipmentId } = req.params;
      
      let shipment;
      if (shipmentId.startsWith('SHIP')) {
        const id = parseInt(shipmentId.replace('SHIP', ''));
        const s = await storage.getShipment(id);
        if (s) {
          const events = await storage.getTrackingEvents(id);
          shipment = { ...s, events };
        }
      } else {
        shipment = await storage.getShipmentByTracking(shipmentId);
      }
      
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      
      res.json({
        success: true,
        data: {
          status: shipment.status.toUpperCase(),
          eta: shipment.estimatedDelivery,
          location: shipment.currentLocation,
          tracking_number: shipment.trackingNumber,
          events: shipment.events,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to track shipment" });
    }
  });

  app.post("/api/logistics/update", isAuthenticated, async (req: any, res) => {
    try {
      const { shipment_id, status, location, description } = req.body;
      
      const id = parseInt(shipment_id.replace('SHIP', ''));
      const shipment = await storage.updateShipment(id, {
        status,
        currentLocation: location,
      });
      
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      
      await storage.addTrackingEvent({
        shipmentId: id,
        status,
        location,
        description,
      });
      
      if (status === 'shipped') {
        await storage.addEscrowMilestone(shipment.orderId, 'SHIPPED');
        await storage.updateOrderStatus(shipment.orderId, 'shipped');
        
        // Send shipping notification email to buyer
        try {
          const order = await storage.getOrder(shipment.orderId);
          if (order) {
            const buyer = await getUserById(order.buyerId);
            if (buyer?.email && shipment.trackingNumber) {
              await sendShippingNotification(buyer.email, order.id, shipment.trackingNumber);
            }
          }
        } catch (emailError) {
          console.error("Failed to send shipping notification email:", emailError);
        }

        logActivity({
          orderId: shipment.orderId,
          actorId: req.user?.id || shipment.sellerId,
          actorType: "seller",
          action: "order_shipped",
          description: `Order #${shipment.orderId} has been shipped`,
        }).catch(e => console.error("Activity log failed:", e));

        notifyAdmin({
          type: "shipment_update",
          title: "Order Shipped",
          message: `Order #${shipment.orderId} has been shipped`,
          orderId: shipment.orderId,
          severity: "info",
        }).catch(e => console.error("Admin notification failed:", e));
      }

      if (status === 'delivered') {
        logActivity({
          orderId: shipment.orderId,
          actorId: req.user?.id || shipment.sellerId,
          actorType: "system",
          action: "order_delivered",
          description: `Order #${shipment.orderId} has been delivered`,
        }).catch(e => console.error("Activity log failed:", e));

        notifyAdmin({
          type: "shipment_update",
          title: "Order Delivered",
          message: `Order #${shipment.orderId} has been delivered`,
          orderId: shipment.orderId,
          severity: "info",
        }).catch(e => console.error("Admin notification failed:", e));
      }
      
      res.json({ success: true, data: shipment });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update shipment" });
    }
  });

  app.post("/api/logistics/pod", isAuthenticated, async (req: any, res) => {
    try {
      const { shipment_id, otp, photo_url, signature_url, recipient_name } = req.body;
      
      const id = parseInt(shipment_id.replace('SHIP', ''));
      const shipment = await storage.getShipment(id);
      
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      
      let pod = await storage.getProofOfDelivery(id);
      
      if (!pod) {
        pod = await storage.createProofOfDelivery({
          shipmentId: id,
          photoUrl: photo_url,
          signatureUrl: signature_url,
          recipientName: recipient_name,
        });
      }
      
      if (otp) {
        const verified = await storage.verifyProofOfDelivery(id, otp);
        if (!verified) {
          return res.status(400).json({ success: false, error: "Invalid OTP" });
        }
        
        await storage.updateShipment(id, {
          status: 'delivered',
          actualDelivery: new Date(),
        });
        
        await storage.addTrackingEvent({
          shipmentId: id,
          status: 'delivered',
          description: 'Package delivered and confirmed',
        });
        
        await storage.addEscrowMilestone(shipment.orderId, 'DELIVERED');
        await storage.addEscrowMilestone(shipment.orderId, 'CONFIRMED');
        await storage.updateOrderStatus(shipment.orderId, 'delivered');
        
        await storage.releaseEscrow(shipment.orderId);
        
        res.json({ success: true, data: { verified: true, pod: verified } });
      } else {
        res.json({ success: true, data: { otp_required: true, pod } });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to process proof of delivery" });
    }
  });

  // ============ ENHANCED SHIPPING/TRACKING API ============

  app.get("/api/logistics/seller/shipments", isAuthenticated, async (req: any, res) => {
    try {
      const sellerId = req.user.id;
      const shipmentsList = await storage.getShipmentsBySeller(sellerId);

      const shipmentsWithEvents = await Promise.all(
        shipmentsList.map(async (s) => {
          const events = await storage.getTrackingEvents(s.id);
          const lastEvent = events[0] || null;
          const hoursSinceUpdate = lastEvent?.timestamp
            ? (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60)
            : null;
          return {
            ...s,
            events,
            lastEvent,
            hoursSinceUpdate: hoursSinceUpdate ? Math.round(hoursSinceUpdate) : null,
            needsUpdate: hoursSinceUpdate !== null && hoursSinceUpdate > 24 && s.status !== 'delivered' && s.status !== 'returned',
          };
        })
      );

      res.json({ success: true, data: shipmentsWithEvents });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch seller shipments" });
    }
  });

  app.get("/api/logistics/buyer/shipments", isAuthenticated, async (req: any, res) => {
    try {
      const buyerId = req.user.id;
      const shipmentsList = await storage.getShipmentsByBuyer(buyerId);

      const shipmentsWithDetails = await Promise.all(
        shipmentsList.map(async (s) => {
          const events = await storage.getTrackingEvents(s.id);
          const escrow = await storage.getEscrow(s.orderId);
          const pod = await storage.getProofOfDelivery(s.id);
          return {
            ...s,
            events,
            escrow: escrow ? {
              status: escrow.status,
              amount: escrow.amount,
              currency: escrow.currency,
              milestones: escrow.milestones,
            } : null,
            proofOfDelivery: pod ? {
              verified: pod.otpVerified,
              recipientName: pod.recipientName,
              verifiedAt: pod.verifiedAt,
            } : null,
          };
        })
      );

      res.json({ success: true, data: shipmentsWithDetails });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch buyer shipments" });
    }
  });

  app.get("/api/logistics/order/:orderId/tracking", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const userId = req.user.id;

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }

      if (order.buyerId !== userId && order.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }

      const shipment = await storage.getShipmentByOrder(orderId);
      if (!shipment) {
        return res.json({ success: true, data: { hasShipment: false, order: { id: order.id, status: order.status, totalAmount: order.totalAmount } } });
      }

      const events = await storage.getTrackingEvents(shipment.id);
      const escrow = await storage.getEscrow(orderId);
      const pod = await storage.getProofOfDelivery(shipment.id);

      const lastEvent = events[0] || null;
      const hoursSinceUpdate = lastEvent?.timestamp
        ? (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60)
        : null;

      res.json({
        success: true,
        data: {
          hasShipment: true,
          order: { id: order.id, status: order.status, totalAmount: order.totalAmount },
          shipment: {
            id: shipment.id,
            trackingNumber: shipment.trackingNumber,
            status: shipment.status,
            priority: shipment.priority,
            estimatedDelivery: shipment.estimatedDelivery,
            actualDelivery: shipment.actualDelivery,
            currentLocation: shipment.currentLocation,
            courierName: shipment.courierName,
            pickupAddress: shipment.pickupAddress,
            deliveryAddress: shipment.deliveryAddress,
            packageInfo: shipment.packageInfo,
            shippingCost: shipment.shippingCost,
            currency: shipment.currency,
            createdAt: shipment.createdAt,
          },
          events: events.map(e => ({
            status: e.status,
            location: e.location,
            description: e.description,
            timestamp: e.timestamp,
          })),
          escrow: escrow ? {
            status: escrow.status,
            amount: escrow.amount,
            currency: escrow.currency,
            milestones: escrow.milestones,
            releaseCondition: escrow.releaseCondition,
          } : null,
          proofOfDelivery: pod ? {
            verified: pod.otpVerified,
            recipientName: pod.recipientName,
            photoUrl: pod.photoUrl,
            verifiedAt: pod.verifiedAt,
          } : null,
          hoursSinceLastUpdate: hoursSinceUpdate ? Math.round(hoursSinceUpdate) : null,
          isStale: hoursSinceUpdate !== null && hoursSinceUpdate > 24 && shipment.status !== 'delivered' && shipment.status !== 'returned',
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch tracking" });
    }
  });

  app.post("/api/logistics/seller/update", isAuthenticated, async (req: any, res) => {
    try {
      const sellerId = req.user.id;
      const { shipment_id, status, location, description, notes } = req.body;

      const id = typeof shipment_id === 'string' ? parseInt(shipment_id.replace('SHIP', '')) : shipment_id;
      const shipment = await storage.getShipment(id);

      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }

      if (shipment.sellerId !== sellerId) {
        return res.status(403).json({ success: false, error: "Not authorized to update this shipment" });
      }

      const updated = await storage.updateShipment(id, {
        status: status || shipment.status,
        currentLocation: location || shipment.currentLocation,
      });

      await storage.addTrackingEvent({
        shipmentId: id,
        status: status || shipment.status,
        location,
        description: description || `Status updated to ${status}`,
      });

      if (status === 'shipped') {
        await storage.addEscrowMilestone(shipment.orderId, 'SHIPPED');
        await storage.updateOrderStatus(shipment.orderId, 'shipped');
      } else if (status === 'delivered') {
        await storage.addEscrowMilestone(shipment.orderId, 'DELIVERED');
        await storage.updateOrderStatus(shipment.orderId, 'delivered');
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update shipment" });
    }
  });

  app.post("/api/logistics/buyer/confirm-delivery", isAuthenticated, async (req: any, res) => {
    try {
      const buyerId = req.user.id;
      const { shipment_id, otp } = req.body;

      const id = typeof shipment_id === 'string' ? parseInt(shipment_id.replace('SHIP', '')) : shipment_id;
      const shipment = await storage.getShipment(id);

      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }

      if (shipment.buyerId !== buyerId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }

      let pod = await storage.getProofOfDelivery(id);
      if (!pod) {
        pod = await storage.createProofOfDelivery({ shipmentId: id });
      }

      if (otp) {
        const verified = await storage.verifyProofOfDelivery(id, otp);
        if (!verified) {
          return res.status(400).json({ success: false, error: "Invalid OTP code" });
        }
      }

      await storage.updateShipment(id, {
        status: 'delivered',
        actualDelivery: new Date(),
      });

      await storage.addTrackingEvent({
        shipmentId: id,
        status: 'delivered',
        description: 'Delivery confirmed by buyer',
      });

      await storage.addEscrowMilestone(shipment.orderId, 'DELIVERED');
      await storage.addEscrowMilestone(shipment.orderId, 'CONFIRMED');
      await storage.updateOrderStatus(shipment.orderId, 'delivered');
      await storage.releaseEscrow(shipment.orderId);

      res.json({ success: true, message: "Delivery confirmed and payment released to seller" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to confirm delivery" });
    }
  });

  app.get("/api/logistics/public/track/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const shipment = await storage.getShipmentByTracking(trackingNumber);

      if (!shipment) {
        return res.status(404).json({ success: false, error: "Tracking number not found" });
      }

      res.json({
        success: true,
        data: {
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          priority: shipment.priority,
          estimatedDelivery: shipment.estimatedDelivery,
          actualDelivery: shipment.actualDelivery,
          currentLocation: shipment.currentLocation,
          courierName: shipment.courierName,
          createdAt: shipment.createdAt,
          events: shipment.events.map(e => ({
            status: e.status,
            location: e.location,
            description: e.description,
            timestamp: e.timestamp,
          })),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to track shipment" });
    }
  });

  app.get("/api/logistics/stale-shipments", isAuthenticated, async (req: any, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const stale = await storage.getStaleShipments(hours);
      res.json({ success: true, data: stale });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch stale shipments" });
    }
  });

  // ============ DISPUTES API ============
  app.post("/api/disputes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { order_id, reason, description, evidence } = req.body;
      
      const order = await storage.getOrder(order_id);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      const respondentId = order.buyerId === userId ? order.sellerId : order.buyerId;
      
      const escrow = await storage.getEscrow(order_id);
      
      const autoRefundAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const dispute = await storage.createDispute({
        orderId: order_id,
        escrowId: escrow?.id,
        initiatorId: userId,
        respondentId,
        reason,
        description,
        evidence,
        status: 'open',
        autoRefundAt,
      });
      
      if (escrow) {
        await storage.updateEscrow(order_id, { status: 'disputed' });
      }

      logActivity({
        orderId: order_id,
        actorId: userId,
        actorType: "buyer",
        action: "dispute_opened",
        description: `Dispute opened for order #${order_id}: ${reason}`,
      }).catch(e => console.error("Activity log failed:", e));

      notifyAdmin({
        type: "dispute_opened",
        title: "Dispute Opened",
        message: `A dispute has been opened for order #${order_id}: ${reason}`,
        orderId: order_id,
        userId,
        severity: "warning",
      }).catch(e => console.error("Admin notification failed:", e));
      
      res.status(201).json({ success: true, data: dispute });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create dispute" });
    }
  });

  app.get("/api/disputes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const disputes = await storage.getUserDisputes(userId);
      res.json({ success: true, data: disputes });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch disputes" });
    }
  });

  app.get("/api/disputes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const dispute = await storage.getDispute(id);
      
      if (!dispute) {
        return res.status(404).json({ success: false, error: "Dispute not found" });
      }
      
      res.json({ success: true, data: dispute });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch dispute" });
    }
  });

  app.post("/api/disputes/:id/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const { resolution, notes } = req.body;
      
      const dispute = await storage.getDispute(id);
      if (!dispute) {
        return res.status(404).json({ success: false, error: "Dispute not found" });
      }
      
      const resolved = await storage.resolveDispute(id, resolution, userId, notes);
      
      if (dispute.escrowId) {
        const escrow = await storage.getEscrow(dispute.orderId);
        if (escrow) {
          if (resolution === 'REFUND_BUYER') {
            await storage.updateEscrow(dispute.orderId, { status: 'refunded' });
            const buyerWallet = await storage.getWallet(escrow.buyerId);
            if (buyerWallet) {
              await storage.updateWalletBalance(escrow.buyerId, Number(escrow.amount), 'credit');
            }
          } else if (resolution === 'RELEASE_SELLER') {
            await storage.releaseEscrow(dispute.orderId);
          }
        }
      }

      logActivity({
        orderId: dispute.orderId,
        actorId: userId,
        actorType: "admin",
        action: "dispute_resolved",
        description: `Dispute #${id} for order #${dispute.orderId} resolved with: ${resolution}`,
      }).catch(e => console.error("Activity log failed:", e));

      notifyAdmin({
        type: "dispute_resolved",
        title: "Dispute Resolved",
        message: `Dispute #${id} for order #${dispute.orderId} has been resolved: ${resolution}`,
        orderId: dispute.orderId,
        userId,
        severity: "info",
      }).catch(e => console.error("Admin notification failed:", e));
      
      res.json({ success: true, data: resolved });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to resolve dispute" });
    }
  });

  // ============ REVIEWS & RATINGS API ============
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { orderId, revieweeId, role, rating, title, reviewText, images } = req.body;

      if (!orderId || !revieweeId || !role || !rating) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: "Rating must be between 1 and 5" });
      }
      if (role !== 'buyer_reviewing_seller' && role !== 'seller_reviewing_buyer') {
        return res.status(400).json({ success: false, error: "Invalid review role" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      if (order.status !== 'delivered' && order.status !== 'completed') {
        return res.status(400).json({ success: false, error: "Can only review completed or delivered orders" });
      }

      if (role === 'buyer_reviewing_seller' && order.buyerId !== userId) {
        return res.status(403).json({ success: false, error: "Only the buyer can leave a buyer review" });
      }
      if (role === 'seller_reviewing_buyer' && order.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Only the seller can leave a seller review" });
      }

      const existing = await storage.getReviewByOrderAndRole(orderId, userId, role);
      if (existing) {
        return res.status(400).json({ success: false, error: "You have already reviewed this order" });
      }

      const reviewImages = Array.isArray(images) ? images.filter((img: any) => typeof img === 'string' && img.length > 0) : [];

      const review = await storage.createReview({
        orderId,
        reviewerId: userId,
        revieweeId,
        role,
        rating,
        title: title || null,
        reviewText: reviewText || null,
        images: reviewImages.length > 0 ? reviewImages : null,
        isVerifiedPurchase: true,
        status: 'published',
      });

      await storage.updateUserRating(revieweeId);

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create review" });
    }
  });

  app.get("/api/reviews/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const role = req.query.role as string | undefined;
      const reviews = await storage.getReviewsForUser(userId, role);
      res.json({ success: true, data: reviews });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const reviews = await storage.getReviewsForOrder(orderId);
      res.json({ success: true, data: reviews });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { response } = req.body;
      const userId = req.user.id;

      const review = await storage.getReview(id);
      if (!review) {
        return res.status(404).json({ success: false, error: "Review not found" });
      }
      if (review.revieweeId !== userId) {
        return res.status(403).json({ success: false, error: "Only the reviewed party can respond" });
      }

      const updated = await storage.updateReview(id, {
        sellerResponse: response,
        sellerRespondedAt: new Date(),
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to respond to review" });
    }
  });

  app.get("/api/reviews/seller/:sellerId/summary", async (req, res) => {
    try {
      const { sellerId } = req.params;
      const profile = await storage.getUserProfile(sellerId);
      if (!profile) {
        return res.status(404).json({ success: false, error: "Seller not found" });
      }
      const reviews = await storage.getReviewsForUser(sellerId, 'buyer_reviewing_seller');
      const distribution = [0, 0, 0, 0, 0];
      reviews.forEach(r => { distribution[r.rating - 1]++; });

      res.json({
        success: true,
        data: {
          averageRating: parseFloat(profile.rating || '0'),
          totalReviews: profile.ratingsCount || 0,
          distribution: { 1: distribution[0], 2: distribution[1], 3: distribution[2], 4: distribution[3], 5: distribution[4] },
          recentReviews: reviews.slice(0, 5),
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch review summary" });
    }
  });

  // ============ IDENTITY VERIFICATION API ============
  app.post("/api/verification/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const docs = await storage.getUserBusinessDocuments(userId);
      if (docs.length === 0) {
        return res.status(400).json({ success: false, error: "Please upload at least one identity document first" });
      }

      const profile = await storage.getUserProfile(userId);
      if (profile?.verificationLevel === 'verified' || profile?.verificationLevel === 'trusted') {
        return res.status(400).json({ success: false, error: "Already verified" });
      }

      await storage.updateUserProfile(userId, { verificationLevel: 'pending' });
      res.json({ success: true, message: "Verification request submitted. Admin will review your documents." });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to submit verification request" });
    }
  });

  app.get("/api/verification/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      const docs = await storage.getUserBusinessDocuments(userId);
      res.json({
        success: true,
        data: {
          verificationLevel: profile?.verificationLevel || 'basic',
          documentsUploaded: docs.length,
          documentsVerified: docs.filter(d => d.isVerified).length,
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch verification status" });
    }
  });

  // ============ ENHANCED CHAT API ============
  app.post("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { participants, order_id, product_id } = req.body;
      
      const allParticipants = Array.from(new Set([userId, ...participants]));
      
      let conversation = await storage.findConversation(allParticipants, order_id);
      
      if (!conversation) {
        conversation = await storage.createConversation(
          {
            orderId: order_id,
            productId: product_id,
            type: order_id ? 'order' : 'direct',
          },
          allParticipants
        );
      }
      
      res.json({ success: true, data: { chat_id: conversation.id } });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create conversation" });
    }
  });

  app.get("/api/chats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      res.json({ success: true, data: conversations });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/chats/:chatId", isAuthenticated, async (req: any, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const conversation = await storage.getConversationById(chatId);
      
      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation not found" });
      }
      
      res.json({ success: true, data: conversation });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/chats/:chatId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chatId = parseInt(req.params.chatId);
      const { type, message, attachment_url, attachment_type, attachment_name } = req.body;
      
      const chatMessage = await storage.sendChatMessage({
        conversationId: chatId,
        senderId: userId,
        type: type || 'TEXT',
        content: message,
        attachmentUrl: attachment_url,
        attachmentType: attachment_type,
        attachmentName: attachment_name,
      });
      
      res.status(201).json({ success: true, data: chatMessage });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send message" });
    }
  });

  app.get("/api/chats/:chatId/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const chatId = parseInt(req.params.chatId);
      
      const messages = await storage.getChatMessages(chatId);
      await storage.markChatMessagesRead(chatId, userId);
      
      res.json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch messages" });
    }
  });

  // ============ DROPSHIP OFFERS API ============
  // ============ DROPSHIP APPLICATIONS ============
  app.get("/api/dropship/application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const application = await storage.getDropshipApplicationByUser(userId);
      res.json({ success: true, data: application || null });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch application" });
    }
  });

  app.post("/api/dropship/application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getDropshipApplicationByUser(userId);
      if (existing && ['submitted', 'approved'].includes(existing.status)) {
        return res.status(400).json({ success: false, error: "You already have an active application" });
      }

      const parsed = insertDropshipApplicationSchema.safeParse({
        ...req.body,
        userId,
        status: 'draft',
      });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Invalid application data", details: parsed.error.errors });
      }

      if (existing && existing.status === 'rejected') {
        const updated = await storage.updateDropshipApplication(existing.id, {
          ...parsed.data,
          status: 'draft',
          rejectionReason: null,
          adminNotes: null,
          decidedAt: null,
          decidedBy: null,
        });
        return res.json({ success: true, data: updated });
      }

      const application = await storage.createDropshipApplication(parsed.data);
      res.json({ success: true, data: application });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create application" });
    }
  });

  app.patch("/api/dropship/application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getDropshipApplicationByUser(userId);
      if (!existing) {
        return res.status(404).json({ success: false, error: "No application found" });
      }
      if (existing.status !== 'draft') {
        return res.status(400).json({ success: false, error: "Can only edit draft applications" });
      }

      const updated = await storage.updateDropshipApplication(existing.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update application" });
    }
  });

  app.post("/api/dropship/application/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getDropshipApplicationByUser(userId);
      if (!existing) {
        return res.status(404).json({ success: false, error: "No application found" });
      }
      if (existing.status !== 'draft') {
        return res.status(400).json({ success: false, error: "Application is not in draft status" });
      }
      if (!existing.applicationType || !existing.companyName || !existing.businessDescription) {
        return res.status(400).json({ success: false, error: "Please complete all required fields before submitting" });
      }

      const submitted = await storage.submitDropshipApplication(existing.id);
      res.json({ success: true, data: submitted });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to submit application" });
    }
  });

  // Admin dropship application routes
  app.get("/api/admin/dropship/applications", isAdminSession, async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getDropshipApplicationsByStatus(status as string);
      res.json({ success: true, data: applications });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/dropship/applications/:id/decide", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes, rejectionReason } = req.body;

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: "Status must be 'approved' or 'rejected'" });
      }

      const adminId = (req.session as any).adminId || 'admin';
      const result = await storage.decideDropshipApplication(id, status, adminId, notes, rejectionReason);

      if (!result) {
        return res.status(404).json({ success: false, error: "Application not found" });
      }

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to process decision" });
    }
  });

  app.patch("/api/admin/dropship/applications/:id/revoke", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getDropshipApplication(id);
      if (!application) {
        return res.status(404).json({ success: false, error: "Application not found" });
      }

      const result = await storage.updateDropshipApplication(id, { status: 'revoked' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to revoke application" });
    }
  });

  // ============ SHIPPER APPLICATION ROUTES ============
  app.get("/api/shipper/application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const application = await storage.getShipperApplicationByUser(userId);
      res.json({ success: true, data: application || null });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch application" });
    }
  });

  app.post("/api/shipper/application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getShipperApplicationByUser(userId);
      if (existing && ['submitted', 'approved'].includes(existing.status)) {
        return res.status(400).json({ success: false, error: "Application already exists" });
      }
      const application = await storage.createShipperApplication({
        userId,
        status: 'draft',
        ...req.body,
      });
      res.json({ success: true, data: application });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create application" });
    }
  });

  app.patch("/api/shipper/application", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getShipperApplicationByUser(userId);
      if (!existing) {
        return res.status(404).json({ success: false, error: "No application found" });
      }
      if (existing.status !== 'draft') {
        return res.status(400).json({ success: false, error: "Can only edit draft applications" });
      }
      const updated = await storage.updateShipperApplication(existing.id, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update application" });
    }
  });

  app.post("/api/shipper/application/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const existing = await storage.getShipperApplicationByUser(userId);
      if (!existing) {
        return res.status(404).json({ success: false, error: "No application found" });
      }
      if (existing.status !== 'draft') {
        return res.status(400).json({ success: false, error: "Application already submitted" });
      }
      if (!existing.companyName || !existing.companyType || !existing.contactPhone) {
        return res.status(400).json({ success: false, error: "Please complete all required fields" });
      }
      const result = await storage.submitShipperApplication(existing.id);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to submit application" });
    }
  });

  // Admin shipper application routes
  app.get("/api/admin/shipper/applications", isAdminSession, async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getShipperApplicationsByStatus(status as string);
      res.json({ success: true, data: applications });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/shipper/applications/:id/decide", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes, rejectionReason } = req.body;
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: "Status must be 'approved' or 'rejected'" });
      }
      const adminId = (req.session as any).adminId || 'admin';
      const result = await storage.decideShipperApplication(id, status, adminId, notes, rejectionReason);
      if (!result) {
        return res.status(404).json({ success: false, error: "Application not found" });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to process decision" });
    }
  });

  app.patch("/api/admin/shipper/applications/:id/revoke", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getShipperApplication(id);
      if (!application) {
        return res.status(404).json({ success: false, error: "Application not found" });
      }
      const result = await storage.updateShipperApplication(id, { status: 'revoked' });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to revoke application" });
    }
  });

  // ============ SHIPPER OPERATIONS ============
  app.get("/api/shipper/assignments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignments = await storage.getShipperAssignments(userId);
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/shipper/available", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const application = await storage.getShipperApplicationByUser(userId);
      if (!application || application.status !== 'approved') {
        return res.status(403).json({ success: false, error: "Not an approved shipper" });
      }
      const shipments = await storage.getAvailableShipments(application.serviceRegions || []);
      res.json({ success: true, data: shipments });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch available shipments" });
    }
  });

  app.post("/api/shipper/assignments/:shipmentId/accept", isAuthenticated, async (req: any, res) => {
    try {
      const shipmentId = parseInt(req.params.shipmentId);
      const userId = req.user.id;
      const application = await storage.getShipperApplicationByUser(userId);
      if (!application || application.status !== 'approved') {
        return res.status(403).json({ success: false, error: "Not an approved shipper" });
      }
      const shipment = await storage.getShipment(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      if (shipment.courierStatus === 'accepted' && shipment.courierId !== userId) {
        return res.status(409).json({ success: false, error: "This shipment has already been claimed by another courier" });
      }
      if (shipment.courierId && shipment.courierId !== userId && shipment.courierStatus !== 'unassigned') {
        return res.status(409).json({ success: false, error: "Shipment assigned to another courier" });
      }
      const updated = await storage.updateShipment(shipmentId, {
        courierId: userId,
        courierName: application.companyName || 'Shipper',
        courierStatus: 'accepted',
        courierAssignedAt: shipment.courierAssignedAt || new Date(),
        courierAcceptedAt: new Date(),
        status: 'assigned',
      });
      await storage.addTrackingEvent({
        shipmentId,
        status: 'assigned',
        description: `Courier ${application.companyName || 'Shipper'} accepted the shipment`,
        location: (shipment.pickupAddress as any)?.city || '',
      });

      // Notify buyer about courier assignment
      try {
        const order = await storage.getOrder(shipment.orderId);
        if (order) {
          const [buyerUser] = await db.select().from(users).where(eq(users.id, order.buyerId));
          if (buyerUser?.email) {
            const { sendShipperAssignmentNotification } = await import("./email");
            await sendShipperAssignmentNotification(
              buyerUser.email,
              order.id,
              application.companyName || 'Shipper',
              shipment.trackingNumber || ''
            );
          }
        }
      } catch (emailError) {
        console.error("Failed to send courier assignment email:", emailError);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to accept shipment" });
    }
  });

  app.post("/api/shipper/assignments/:shipmentId/reject", isAuthenticated, async (req: any, res) => {
    try {
      const shipmentId = parseInt(req.params.shipmentId);
      const userId = req.user.id;
      const shipment = await storage.getShipment(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      if (shipment.courierId !== userId) {
        return res.status(403).json({ success: false, error: "Not assigned to you" });
      }
      const updated = await storage.updateShipment(shipmentId, {
        courierId: null,
        courierName: null,
        courierStatus: 'unassigned',
      });
      await storage.addTrackingEvent({
        shipmentId,
        status: 'pending',
        description: 'Courier declined the shipment, awaiting new assignment',
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to reject shipment" });
    }
  });

  app.post("/api/shipper/shipments/:shipmentId/status", isAuthenticated, async (req: any, res) => {
    try {
      const shipmentId = parseInt(req.params.shipmentId);
      const userId = req.user.id;
      const { status, location, description } = req.body;
      const shipment = await storage.getShipment(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      if (shipment.courierId !== userId) {
        return res.status(403).json({ success: false, error: "Not assigned to you" });
      }
      const updated = await storage.updateShipment(shipmentId, {
        status,
        currentLocation: location || shipment.currentLocation,
      });
      await storage.addTrackingEvent({
        shipmentId,
        status,
        location: location || '',
        description: description || `Status updated to ${status}`,
      });

      // Handle milestone events
      if (status === 'shipped') {
        await storage.addEscrowMilestone(shipment.orderId, 'SHIPPED');
        await storage.updateOrderStatus(shipment.orderId, 'shipped');
        try {
          const order = await storage.getOrder(shipment.orderId);
          if (order) {
            const [buyerUser] = await db.select().from(users).where(eq(users.id, order.buyerId));
            if (buyerUser?.email && shipment.trackingNumber) {
              await sendShippingNotification(buyerUser.email, order.id, shipment.trackingNumber);
            }
          }
        } catch (e) { console.error("Shipping notification error:", e); }
      }
      if (status === 'delivered') {
        await storage.addEscrowMilestone(shipment.orderId, 'DELIVERED');
        await storage.updateOrderStatus(shipment.orderId, 'delivered');
        await storage.updateShipment(shipmentId, { actualDelivery: new Date() });
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update shipment status" });
    }
  });

  // List approved couriers for dispatch (seller-facing)
  app.get("/api/logistics/couriers", isAuthenticated, async (_req: any, res) => {
    try {
      const apps = await storage.getShipperApplicationsByStatus("approved");
      const couriers = apps.map((a: any) => ({
        userId: a.userId,
        companyName: a.companyName,
        companyType: a.companyType,
        fleetSize: a.fleetSize,
        vehicleTypes: a.vehicleTypes,
        serviceRegions: a.serviceRegions,
      }));
      res.json({ success: true, data: couriers });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Broadcast shipment to all approved couriers (first-come-first-served)
  app.post("/api/logistics/dispatch", isAuthenticated, async (req: any, res) => {
    try {
      const { shipmentId } = req.body;
      const shipment = await storage.getShipment(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      if (shipment.courierStatus === 'accepted') {
        return res.status(400).json({ success: false, error: "Shipment already accepted by a courier" });
      }

      const now = new Date();
      await storage.updateShipment(shipmentId, {
        courierStatus: 'unassigned',
        broadcastedAt: now,
        lastNotifiedAt: now,
      });
      await storage.addTrackingEvent({
        shipmentId,
        status: 'pending',
        description: 'Shipment broadcasted to all available couriers',
        location: (shipment.pickupAddress as any)?.city || '',
      });

      // Notify all approved couriers
      let notifiedCount = 0;
      try {
        const approvedApps = await storage.getShipperApplicationsByStatus("approved");
        const { sendShipmentBroadcastNotification } = await import("./email");
        const pickupCity = (shipment.pickupAddress as any)?.city || 'Unknown';
        const deliveryCity = (shipment.deliveryAddress as any)?.city || 'Unknown';
        const packageType = (shipment.packageInfo as any)?.type;
        for (const app of approvedApps) {
          if (app.contactEmail) {
            try {
              await sendShipmentBroadcastNotification(app.contactEmail, shipmentId, pickupCity, deliveryCity, packageType);
              notifiedCount++;
            } catch (e) { console.error(`Failed to notify courier ${app.companyName}:`, e); }
          }
        }
      } catch (e) { console.error("Broadcast notification error:", e); }

      res.json({ success: true, data: { shipmentId, notifiedCount, message: `Broadcasted to ${notifiedCount} courier(s)` } });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to broadcast shipment" });
    }
  });

  // Re-notify couriers for an unclaimed shipment
  app.post("/api/logistics/dispatch/:shipmentId/renotify", isAuthenticated, async (req: any, res) => {
    try {
      const shipmentId = parseInt(req.params.shipmentId);
      const shipment = await storage.getShipment(shipmentId);
      if (!shipment) {
        return res.status(404).json({ success: false, error: "Shipment not found" });
      }
      if (shipment.courierStatus === 'accepted') {
        return res.status(400).json({ success: false, error: "Shipment already accepted by a courier" });
      }

      const now = new Date();
      await storage.updateShipment(shipmentId, { lastNotifiedAt: now });

      let notifiedCount = 0;
      try {
        const approvedApps = await storage.getShipperApplicationsByStatus("approved");
        const { sendShipmentBroadcastNotification } = await import("./email");
        const pickupCity = (shipment.pickupAddress as any)?.city || 'Unknown';
        const deliveryCity = (shipment.deliveryAddress as any)?.city || 'Unknown';
        const packageType = (shipment.packageInfo as any)?.type;
        for (const app of approvedApps) {
          if (app.contactEmail) {
            try {
              await sendShipmentBroadcastNotification(app.contactEmail, shipmentId, pickupCity, deliveryCity, packageType);
              notifiedCount++;
            } catch (e) { console.error(`Failed to re-notify courier ${app.companyName}:`, e); }
          }
        }
      } catch (e) { console.error("Re-notification error:", e); }

      res.json({ success: true, data: { shipmentId, notifiedCount, message: `Re-notified ${notifiedCount} courier(s)` } });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to re-notify couriers" });
    }
  });

  // Get available couriers for a region
  app.get("/api/logistics/couriers", isAuthenticated, async (req: any, res) => {
    try {
      const { region } = req.query;
      const couriers = await storage.getApprovedShippers(region as string);
      res.json({ success: true, data: couriers });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch couriers" });
    }
  });

  // ============ DROPSHIP CATALOG & OFFERS ============
  app.get("/api/dropship/catalog", isAuthenticated, async (req: any, res) => {
    try {
      const { region, search } = req.query;
      const catalog = await storage.getDropshipCatalog({
        region: region as string,
        search: search as string,
      });
      res.json({ success: true, data: catalog });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch dropship catalog" });
    }
  });

  app.get("/api/dropship/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const offers = await storage.getSupplierOffers(userId);
      res.json({ success: true, data: offers });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch dropship offers" });
    }
  });

  app.get("/api/dropship/offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const offer = await storage.getDropshipOffer(id);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }
      res.json({ success: true, data: offer });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch dropship offer" });
    }
  });

  app.post("/api/dropship/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertDropshipOfferSchema.safeParse({ ...req.body, supplierId: userId });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const offer = await storage.createDropshipOffer(parsed.data);
      res.status(201).json({ success: true, data: offer });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create dropship offer" });
    }
  });

  app.patch("/api/dropship/offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getDropshipOffer(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }
      if (existing.supplierId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      const offer = await storage.updateDropshipOffer(id, req.body);
      res.json({ success: true, data: offer });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update dropship offer" });
    }
  });

  app.delete("/api/dropship/offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getDropshipOffer(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }
      if (existing.supplierId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await storage.deleteDropshipOffer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete dropship offer" });
    }
  });

  // ============ DROPSHIP LISTINGS API ============
  app.get("/api/dropship/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const listings = await storage.getResellerListings(userId);
      res.json({ success: true, data: listings });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch dropship listings" });
    }
  });

  app.get("/api/dropship/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const listing = await storage.getDropshipListing(id);
      if (!listing) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch dropship listing" });
    }
  });

  app.post("/api/dropship/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { offer_id, retail_price, currency, custom_name, custom_description } = req.body;
      
      const offer = await storage.getDropshipOffer(offer_id);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }
      
      if (parseFloat(retail_price) <= parseFloat(offer.wholesalePrice)) {
        return res.status(400).json({ 
          success: false, 
          error: "Retail price must be higher than wholesale price" 
        });
      }
      
      const listing = await storage.createDropshipListing({
        resellerId: userId,
        offerId: offer_id,
        retailPrice: retail_price,
        currency: currency || offer.currency,
        customName: custom_name,
        customDescription: custom_description,
      });
      res.status(201).json({ success: true, data: listing });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create dropship listing" });
    }
  });

  app.patch("/api/dropship/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getDropshipListing(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      if (existing.resellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      
      const { retail_price, custom_name, custom_description, is_active } = req.body;
      const updateData: any = {};
      if (retail_price !== undefined) {
        if (parseFloat(retail_price) <= parseFloat(existing.offer.wholesalePrice)) {
          return res.status(400).json({ 
            success: false, 
            error: "Retail price must be higher than wholesale price" 
          });
        }
        updateData.retailPrice = retail_price;
      }
      if (custom_name !== undefined) updateData.customName = custom_name;
      if (custom_description !== undefined) updateData.customDescription = custom_description;
      if (is_active !== undefined) updateData.isActive = is_active;
      
      const listing = await storage.updateDropshipListing(id, updateData);
      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update dropship listing" });
    }
  });

  app.delete("/api/dropship/listings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getDropshipListing(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Listing not found" });
      }
      if (existing.resellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await storage.deleteDropshipListing(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete dropship listing" });
    }
  });

  // ============ DROPSHIP FULFILLMENTS API ============
  app.get("/api/dropship/fulfillments/supplier", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fulfillments = await storage.getSupplierFulfillments(userId);
      res.json({ success: true, data: fulfillments });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch supplier fulfillments" });
    }
  });

  app.get("/api/dropship/fulfillments/reseller", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const fulfillments = await storage.getResellerFulfillments(userId);
      res.json({ success: true, data: fulfillments });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch reseller fulfillments" });
    }
  });

  app.patch("/api/dropship/fulfillments/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const fulfillment = await storage.getDropshipFulfillment(id);
      if (!fulfillment) {
        return res.status(404).json({ success: false, error: "Fulfillment not found" });
      }
      
      if (fulfillment.supplierId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      
      const validStatuses = ['acknowledged', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }
      
      const updated = await storage.updateDropshipFulfillmentStatus(id, status);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update fulfillment status" });
    }
  });

  // ============ CURRENCY API ============
  app.get("/api/currencies", async (req, res) => {
    try {
      const currencies = Object.entries(AFRICAN_CURRENCIES).map(([country, data]) => ({
        country,
        ...data
      }));
      res.json({ success: true, data: currencies });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch currencies" });
    }
  });

  app.post("/api/currencies/convert", async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;
      
      if (!amount || !fromCurrency || !toCurrency) {
        return res.status(400).json({ success: false, error: "amount, fromCurrency, and toCurrency are required" });
      }
      
      const convertedAmount = convertCurrency(parseFloat(amount), fromCurrency, toCurrency);
      const targetCurrencyInfo = Object.values(AFRICAN_CURRENCIES).find(c => c.code === toCurrency) || { symbol: "$" };
      
      res.json({ 
        success: true, 
        data: { 
          original: { amount: parseFloat(amount), currency: fromCurrency },
          converted: { amount: Math.round(convertedAmount * 100) / 100, currency: toCurrency },
          symbol: targetCurrencyInfo.symbol
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to convert currency" });
    }
  });

  // Get currency for a country
  app.get("/api/currencies/country/:country", async (req, res) => {
    try {
      const { country } = req.params;
      const currency = AFRICAN_CURRENCIES[country];
      
      if (!currency) {
        return res.json({ success: true, data: { code: "USD", name: "US Dollar", symbol: "$", rateToUSD: 1 } });
      }
      
      res.json({ success: true, data: currency });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch currency" });
    }
  });

  // ============ INVOICES API ============
  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const role = req.query.role as string || 'buyer';
      const invoiceList = role === 'seller'
        ? await storage.getInvoicesBySeller(userId)
        : await storage.getInvoicesByBuyer(userId);
      res.json({ success: true, data: invoiceList });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const invoice = await storage.getInvoiceByOrder(orderId);
      if (!invoice) {
        return res.status(404).json({ success: false, error: "Invoice not found" });
      }
      const userId = req.user.id;
      if (invoice.buyerId !== userId && invoice.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch invoice" });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ success: false, error: "Invoice not found" });
      }
      const userId = req.user.id;
      if (invoice.buyerId !== userId && invoice.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }
      res.json({ success: true, data: invoice });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch invoice" });
    }
  });

  // ============ ACTIVITY LOGS API ============
  app.get("/api/activity/order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      const userId = req.user.id;
      if (order.buyerId !== userId && order.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }
      const logs = await storage.getActivityLogsByOrder(orderId);
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/activity/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getActivityLogsByUser(userId, limit);
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch activity logs" });
    }
  });

  // ============ ADMIN NOTIFICATIONS API ============
  app.get("/api/admin/notifications", async (req: any, res) => {
    try {
      const session = req.session as any;
      if (!session?.adminUser?.isAuthenticated) {
        return res.status(401).json({ success: false, error: "Admin authentication required" });
      }
      const unreadOnly = req.query.unreadOnly === 'true';
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 100;
      const notifications = await storage.getAdminNotifications({ unreadOnly, type, limit });
      const unreadCount = await storage.getAdminNotificationCount(true);
      res.json({ success: true, data: notifications, unreadCount });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/admin/notifications/:id/read", async (req: any, res) => {
    try {
      const session = req.session as any;
      if (!session?.adminUser?.isAuthenticated) {
        return res.status(401).json({ success: false, error: "Admin authentication required" });
      }
      const id = parseInt(req.params.id);
      const notification = await storage.markAdminNotificationRead(id);
      res.json({ success: true, data: notification });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/admin/notifications/read-all", async (req: any, res) => {
    try {
      const session = req.session as any;
      if (!session?.adminUser?.isAuthenticated) {
        return res.status(401).json({ success: false, error: "Admin authentication required" });
      }
      await storage.markAllAdminNotificationsRead();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/admin/activity-logs", async (req: any, res) => {
    try {
      const session = req.session as any;
      if (!session?.adminUser?.isAuthenticated) {
        return res.status(401).json({ success: false, error: "Admin authentication required" });
      }
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getRecentActivityLogs(limit);
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch activity logs" });
    }
  });

  // ============ ADMIN AUTHENTICATION ============

  app.post("/api/admin/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("Admin login attempt for username:", username);
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password are required" });
      }
      
      const admin = await storage.getAdminByUsername(username);
      console.log("Admin found:", admin ? `id=${admin.id}, active=${admin.isActive}` : "not found");
      
      if (!admin || !admin.isActive) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      
      const bcrypt = await import("bcryptjs");
      const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
      console.log("Password valid:", isValidPassword);
      
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateAdminLastLogin(admin.id);
      
      // Store admin session
      (req.session as any).adminId = admin.id;
      (req.session as any).isAdmin = true;
      
      res.json({ 
        success: true, 
        data: { 
          id: admin.id, 
          username: admin.username, 
          displayName: admin.displayName,
          email: admin.email 
        } 
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).adminId = null;
    (req.session as any).isAdmin = false;
    res.json({ success: true });
  });

  // Initial admin setup - only works if no admins exist
  app.post("/api/admin/setup", async (req, res) => {
    try {
      // Check if any admin exists
      const existingAdmin = await storage.getAdminByUsername("admin");
      if (existingAdmin) {
        return res.status(400).json({ success: false, error: "Admin already configured" });
      }
      
      const { username, password, displayName, email } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
      }
      
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(password, 10);
      
      const admin = await storage.createAdmin({
        username,
        passwordHash,
        displayName: displayName || "Administrator",
        email,
      });
      
      res.json({ 
        success: true, 
        message: "Admin account created successfully",
        data: { username: admin.username, displayName: admin.displayName }
      });
    } catch (error) {
      console.error("Admin setup error:", error);
      res.status(500).json({ success: false, error: "Failed to create admin account" });
    }
  });

  app.get("/api/admin/session", (req: any, res) => {
    if ((req.session as any)?.isAdmin && (req.session as any)?.adminId) {
      storage.getAdminById((req.session as any).adminId).then(admin => {
        if (admin) {
          res.json({ 
            success: true, 
            data: { 
              id: admin.id, 
              username: admin.username, 
              displayName: admin.displayName,
              email: admin.email,
              isAuthenticated: true,
              isSuperAdmin: admin.isSuperAdmin
            } 
          });
        } else {
          res.json({ success: false, data: { isAuthenticated: false } });
        }
      }).catch(() => {
        res.json({ success: false, data: { isAuthenticated: false } });
      });
    } else {
      res.json({ success: false, data: { isAuthenticated: false } });
    }
  });

  // Middleware for admin session authentication
  function isAdminSession(req: any, res: any, next: any) {
    if ((req.session as any)?.isAdmin && (req.session as any)?.adminId) {
      next();
    } else {
      res.status(401).json({ success: false, error: "Admin authentication required" });
    }
  }

  // ============ ADMIN API ============
  app.get("/api/admin/users", isAdminSession, async (req: any, res) => {
    try {
      const users = await storage.getAllUserProfiles();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id", isAdminSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role, verificationLevel, isDisabled } = req.body;
      
      const updateData: any = {};
      if (role !== undefined) updateData.role = role;
      if (verificationLevel !== undefined) updateData.verificationLevel = verificationLevel;
      if (isDisabled !== undefined) updateData.isDisabled = isDisabled;
      
      const user = await storage.updateUserProfile(id, updateData);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/toggle-status", isAdminSession, async (req: any, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getUserProfile(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      
      const user = await storage.setUserDisabled(id, !existing.isDisabled);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to toggle user status" });
    }
  });

  app.post("/api/admin/users/:id/message", isAdminSession, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ success: false, error: "Message content is required" });
      }
      
      const message = await storage.sendMessage({
        senderId: adminId,
        receiverId: id,
        content: `[Admin Message] ${content}`,
      });
      
      res.json({ success: true, data: message });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send message" });
    }
  });

  app.get("/api/admin/stats", isAdminSession, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/products", isAdminSession, async (req: any, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch products" });
    }
  });

  app.patch("/api/admin/products/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive, isFeatured } = req.body;
      
      const updateData: any = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      
      const product = await storage.updateProduct(id, updateData);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete product" });
    }
  });

  app.get("/api/admin/orders", isAdminSession, async (req: any, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update order" });
    }
  });

  app.get("/api/admin/disputes", isAdminSession, async (req: any, res) => {
    try {
      const disputes = await storage.getAllDisputes();
      res.json({ success: true, data: disputes });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch disputes" });
    }
  });

  app.patch("/api/admin/disputes/:id", isAdminSession, async (req: any, res) => {
    try {
      const adminId = req.user.id;
      const id = parseInt(req.params.id);
      const { status, resolution, resolutionNotes } = req.body;
      
      if (resolution) {
        const dispute = await storage.resolveDispute(id, resolution, adminId, resolutionNotes);
        if (!dispute) {
          return res.status(404).json({ success: false, error: "Dispute not found" });
        }
        res.json({ success: true, data: dispute });
      } else {
        const dispute = await storage.updateDispute(id, { status });
        if (!dispute) {
          return res.status(404).json({ success: false, error: "Dispute not found" });
        }
        res.json({ success: true, data: dispute });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update dispute" });
    }
  });

  app.get("/api/admin/advertisements", isAdminSession, async (req: any, res) => {
    try {
      const advertisements = await storage.getAllAdvertisements();
      res.json({ success: true, data: advertisements });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch advertisements" });
    }
  });

  app.patch("/api/admin/advertisements/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, startDate, endDate } = req.body;
      
      const updateData: any = {};
      if (status !== undefined) updateData.status = status;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      
      const ad = await storage.updateAdvertisement(id, updateData);
      if (!ad) {
        return res.status(404).json({ success: false, error: "Advertisement not found" });
      }
      res.json({ success: true, data: ad });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update advertisement" });
    }
  });

  app.delete("/api/admin/advertisements/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAdvertisement(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete advertisement" });
    }
  });

  app.get("/api/admin/categories", isAdminSession, async (req: any, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", isAdminSession, async (req: any, res) => {
    try {
      const { name, slug, icon, parentId } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ success: false, error: "Name and slug are required" });
      }
      
      const category = await storage.createCategory({ name, slug, icon, parentId });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create category" });
    }
  });

  app.patch("/api/admin/categories/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, slug, icon, parentId } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (icon !== undefined) updateData.icon = icon;
      if (parentId !== undefined) updateData.parentId = parentId;
      
      const category = await storage.updateCategory(id, updateData);
      if (!category) {
        return res.status(404).json({ success: false, error: "Category not found" });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete category" });
    }
  });

  // ============ ADMIN PASSWORD MANAGEMENT ============
  
  // Middleware for super admin only access
  const isSuperAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.adminId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    const admin = await storage.getAdminById(req.session.adminId);
    if (!admin || !admin.isSuperAdmin) {
      return res.status(403).json({ success: false, error: "Super admin access required" });
    }
    next();
  };

  // Change own password
  app.post("/api/admin/change-password", isAdminSession, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: "Current and new password required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      const admin = await storage.getAdminById(req.session.adminId);
      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }
      
      const bcrypt = await import("bcryptjs");
      const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: "Current password is incorrect" });
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateAdminPassword(admin.id, passwordHash);
      
      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ success: false, error: "Failed to change password" });
    }
  });

  // ============ ADMIN ACCOUNTS MANAGEMENT (Super Admin Only) ============
  
  // Get all admins
  app.get("/api/admin/accounts", isSuperAdmin, async (req: any, res) => {
    try {
      const admins = await storage.getAllAdmins();
      // Remove password hash from response
      const safeAdmins = admins.map(({ passwordHash, ...rest }) => rest);
      res.json(safeAdmins);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch admin accounts" });
    }
  });

  // Create new admin
  app.post("/api/admin/accounts", isSuperAdmin, async (req: any, res) => {
    try {
      const { username, password, displayName, email, isSuperAdmin: makeSuperAdmin } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "Username and password required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      const existing = await storage.getAdminByUsername(username);
      if (existing) {
        return res.status(409).json({ success: false, error: "Username already exists" });
      }
      
      if (email) {
        const existingEmail = await storage.getAdminByEmail(email);
        if (existingEmail) {
          return res.status(409).json({ success: false, error: "Email already in use" });
        }
      }
      
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = await storage.createAdmin({
        username,
        passwordHash,
        displayName,
        email,
        isSuperAdmin: makeSuperAdmin || false,
      });
      
      const { passwordHash: _, ...safeAdmin } = admin;
      res.status(201).json({ success: true, data: safeAdmin });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ success: false, error: "Failed to create admin" });
    }
  });

  // Update admin
  app.patch("/api/admin/accounts/:id", isSuperAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { displayName, email, isActive, isSuperAdmin: makeSuperAdmin, mustResetPassword } = req.body;
      
      // Prevent super admin from demoting themselves
      if (id === req.session.adminId && makeSuperAdmin === false) {
        return res.status(400).json({ success: false, error: "Cannot remove your own super admin status" });
      }
      
      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (email !== undefined) updateData.email = email;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (makeSuperAdmin !== undefined) updateData.isSuperAdmin = makeSuperAdmin;
      if (mustResetPassword !== undefined) updateData.mustResetPassword = mustResetPassword;
      
      const admin = await storage.updateAdmin(id, updateData);
      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }
      
      const { passwordHash, ...safeAdmin } = admin;
      res.json({ success: true, data: safeAdmin });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update admin" });
    }
  });

  // Reset admin password (by super admin)
  app.post("/api/admin/accounts/:id/reset-password", isSuperAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      const admin = await storage.getAdminById(id);
      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }
      
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateAdminPassword(id, passwordHash);
      
      // Force password reset on next login
      await storage.updateAdmin(id, { mustResetPassword: true });
      
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to reset password" });
    }
  });

  // Delete admin
  app.delete("/api/admin/accounts/:id", isSuperAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (id === req.session.adminId) {
        return res.status(400).json({ success: false, error: "Cannot delete your own account" });
      }
      
      const admin = await storage.getAdminById(id);
      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }
      
      await storage.deleteAdmin(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete admin" });
    }
  });

  // ============ FORGOT PASSWORD FLOW ============
  
  // Request password reset (public endpoint with rate limiting)
  app.post("/api/admin/forgot-password", authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, error: "Email required" });
      }
      
      // Always return success to prevent email enumeration
      const admin = await storage.getAdminByEmail(email);
      
      if (admin) {
        // Generate secure token
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        
        // Token expires in 15 minutes
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        await storage.createPasswordResetToken(admin.id, tokenHash, expiresAt);
        
        // Send email with reset link
        const resetUrl = `${req.protocol}://${req.get("host")}/admin/reset-password?token=${token}`;
        
        // Use SendGrid to send email
        try {
          const sgMail = await import("@sendgrid/mail");
          if (process.env.SENDGRID_API_KEY) {
            sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
            await sgMail.default.send({
              to: email,
              from: process.env.SENDGRID_FROM_EMAIL || "noreply@ghaniafrica.com",
              subject: "Ghani Africa Admin - Password Reset",
              html: `
                <h2>Password Reset Request</h2>
                <p>You requested a password reset for your Ghani Africa admin account.</p>
                <p>Click the link below to reset your password (expires in 15 minutes):</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #D97706; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
              `,
            });
          }
        } catch (emailError) {
          console.error("Failed to send password reset email:", emailError);
        }
      }
      
      // Always return success to prevent email enumeration
      res.json({ success: true, message: "If the email exists, a reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ success: false, error: "Failed to process request" });
    }
  });

  // Reset password with token
  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ success: false, error: "Token and new password required" });
      }
      
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters" });
      }
      
      // Hash the token to compare with stored hash
      const crypto = await import("crypto");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      
      const resetToken = await storage.getValidPasswordResetToken(tokenHash);
      
      if (!resetToken) {
        return res.status(400).json({ success: false, error: "Invalid or expired reset token" });
      }
      
      // Update password
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateAdminPassword(resetToken.adminId, passwordHash);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);
      
      // Clean up expired tokens
      await storage.deleteExpiredPasswordResetTokens();
      
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ success: false, error: "Failed to reset password" });
    }
  });

  // ============ RFQ (Request for Quotation) ============
  app.post("/api/rfq", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const parsed = insertRfqSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const rfq = await storage.createRfq(parsed.data);
      res.status(201).json({ success: true, data: rfq });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create RFQ" });
    }
  });

  app.get("/api/rfq", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const rfqs = await storage.getUserRfqs(userId);
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch RFQs" });
    }
  });

  app.get("/api/rfq/seller", isAuthenticated, async (req: any, res) => {
    try {
      const sellerId = req.user.id;
      const rfqs = await storage.getSellerRfqs(sellerId);
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch seller RFQs" });
    }
  });

  app.get("/api/rfq/open", isAuthenticated, async (req: any, res) => {
    try {
      const rfqs = await storage.getOpenRfqs();
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch open RFQs" });
    }
  });

  app.get("/api/rfq/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.getRfq(id);
      if (!rfq) {
        return res.status(404).json({ success: false, error: "RFQ not found" });
      }
      res.json(rfq);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch RFQ" });
    }
  });

  app.get("/api/rfq/:id/quotes", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotes = await storage.getRfqQuotes(id);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch quotes" });
    }
  });

  app.post("/api/rfq/:id/quote", isAuthenticated, async (req: any, res) => {
    try {
      const supplierId = req.user.id;
      const rfqId = parseInt(req.params.id);
      const { price, currency, moq, leadTime, message } = req.body;
      
      const quote = await storage.createRfqQuote({
        rfqId,
        supplierId,
        price,
        currency,
        moq,
        leadTime,
        message,
      });
      res.status(201).json({ success: true, data: quote });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to submit quote" });
    }
  });

  app.patch("/api/rfq/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const rfq = await storage.updateRfqStatus(id, status);
      if (!rfq) {
        return res.status(404).json({ success: false, error: "RFQ not found" });
      }
      res.json({ success: true, data: rfq });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update RFQ status" });
    }
  });

  app.patch("/api/rfq/quotes/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const quote = await storage.updateRfqQuoteStatus(id, status);
      if (!quote) {
        return res.status(404).json({ success: false, error: "Quote not found" });
      }
      res.json({ success: true, data: quote });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update quote status" });
    }
  });

  // ============ VERIFIED SUPPLIERS ============
  app.get("/api/suppliers/verified", async (req, res) => {
    try {
      const suppliers = await storage.getVerifiedSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch verified suppliers" });
    }
  });

  // ============ WISHLIST ============
  app.get("/api/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await storage.getWishlistItems(userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ success: false, error: "Product ID is required" });
      }
      
      const item = await storage.addToWishlist({ userId, productId });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/wishlist/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromWishlist(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to remove from wishlist" });
    }
  });

  app.delete("/api/wishlist/product/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId);
      await storage.removeFromWishlistByProduct(userId, productId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to remove from wishlist" });
    }
  });

  app.get("/api/wishlist/check/:productId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const productId = parseInt(req.params.productId);
      const inWishlist = await storage.isInWishlist(userId, productId);
      res.json({ inWishlist });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to check wishlist" });
    }
  });

  // ============ ADVERTISEMENTS ============
  app.get("/api/advertisements", async (req, res) => {
    try {
      const ads = await storage.getActiveAdvertisements();
      res.json(ads);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch advertisements" });
    }
  });

  app.get("/api/advertisements/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ads = await storage.getSellerAdvertisements(userId);
      res.json(ads);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch your advertisements" });
    }
  });

  app.post("/api/advertisements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertAdvertisementSchema.safeParse({ ...req.body, sellerId: userId });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      
      // Validate video URL is only allowed for premium/featured packages
      if (parsed.data.videoUrl && parsed.data.packageType !== "premium" && parsed.data.packageType !== "featured") {
        return res.status(400).json({ success: false, error: "Video ads are only available for Premium and Featured packages" });
      }
      
      const product = await storage.getProduct(parsed.data.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      if (product.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "You can only advertise your own products" });
      }
      
      const ad = await storage.createAdvertisement(parsed.data);
      res.status(201).json({ success: true, data: ad });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create advertisement" });
    }
  });

  app.patch("/api/advertisements/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getAdvertisement(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Advertisement not found" });
      }
      if (existing.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      const ad = await storage.updateAdvertisement(id, req.body);
      res.json({ success: true, data: ad });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update advertisement" });
    }
  });

  app.delete("/api/advertisements/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const existing = await storage.getAdvertisement(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Advertisement not found" });
      }
      if (existing.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized" });
      }
      await storage.deleteAdvertisement(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete advertisement" });
    }
  });

  app.post("/api/advertisements/:id/click", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementAdClicks(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to track click" });
    }
  });

  // ============ STRIPE PRODUCT CHECKOUT ============
  app.post("/api/checkout/create-session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { shippingAddress, destinationCountryCode, deliveryMethod, deliveryTier, pickupPointId } = req.body;

      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.city || !shippingAddress.country) {
        return res.status(400).json({ success: false, error: "Complete shipping address is required" });
      }

      if (deliveryMethod !== "pickup" && !shippingAddress.street) {
        return res.status(400).json({ success: false, error: "Street address is required for home delivery" });
      }

      if (deliveryMethod === "pickup" && !pickupPointId) {
        return res.status(400).json({ success: false, error: "Please select a pickup point for collection" });
      }

      const cartItems = await storage.getCartItems(userId);
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, error: "Cart is empty" });
      }

      const countryNameToCode: Record<string, string> = {
        "botswana": "BW", "cameroon": "CM", "dr congo": "CD", "egypt": "EG",
        "ethiopia": "ET", "ghana": "GH", "ivory coast": "CI", "kenya": "KE",
        "malawi": "MW", "morocco": "MA", "mozambique": "MZ", "namibia": "NA",
        "nigeria": "NG", "rwanda": "RW", "senegal": "SN", "south africa": "ZA",
        "tanzania": "TZ", "uganda": "UG", "zambia": "ZM", "zimbabwe": "ZW",
      };

      const stripe = await getUncachableStripeClient();

      const lineItems: any[] = [];
      let totalAmount = 0;
      let totalWeight = 0;

      const itemsBySeller: Record<string, typeof cartItems> = {};
      const originCountryCodes = new Set<string>();

      for (const item of cartItems) {
        if (!item.product) continue;
        const price = Number(item.product.price);
        const itemTotal = price * item.quantity;
        totalAmount += itemTotal;
        totalWeight += item.quantity;

        const sellerId = item.product.sellerId;
        if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
        itemsBySeller[sellerId].push(item);

        const productCountry = (item.product as any).country;
        if (productCountry) {
          const code = countryNameToCode[productCountry.toLowerCase()] || productCountry.toUpperCase().substring(0, 2);
          originCountryCodes.add(code);
        }

        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product.name,
              description: item.product.description?.substring(0, 200) || undefined,
              images: item.product.images && item.product.images.length > 0
                ? [item.product.images[0]]
                : undefined,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: item.quantity,
        });
      }

      let destCode = (destinationCountryCode || "").toUpperCase();
      if (!destCode || destCode.length > 2) {
        const destName = (shippingAddress.country || "").toLowerCase();
        destCode = countryNameToCode[destName] || destName.toUpperCase().substring(0, 2);
      }
      const primaryOriginCode = originCountryCodes.size > 0 ? Array.from(originCountryCodes)[0] : destCode;
      const isDomestic = originCountryCodes.size > 0 && Array.from(originCountryCodes).every(c => c === destCode);

      let vatAmount = 0;
      let importDutyAmount = 0;
      let exportDutyAmount = 0;
      let customsFeeAmount = 0;
      let shippingCost = 0;
      let tradeBreakdown: any = { tradeType: isDomestic ? "domestic" : "cross_border" };

      try {
        const [destTax, originTax, shippingZone] = await Promise.all([
          storage.getCountryTaxRate(destCode),
          storage.getCountryTaxRate(primaryOriginCode),
          storage.getShippingZone(primaryOriginCode, destCode),
        ]);

        if (isDomestic) {
          if (destTax) {
            vatAmount = totalAmount * (Number(destTax.vatRate) / 100);
          }
          if (shippingZone) {
            shippingCost = Number(shippingZone.baseShippingCost) + (totalWeight * Number(shippingZone.perKgRate));
          } else {
            shippingCost = 3.00 + (totalWeight * 0.40);
          }
        } else {
          if (destTax) {
            vatAmount = totalAmount * (Number(destTax.vatRate) / 100);
            importDutyAmount = totalAmount * (Number(destTax.importDutyRate) / 100);
            customsFeeAmount = Number(destTax.customsProcessingFee);
          }
          if (originTax) {
            exportDutyAmount = totalAmount * (Number(originTax.exportDutyRate) / 100);
          }
          if (shippingZone) {
            shippingCost = Number(shippingZone.baseShippingCost) + (totalWeight * Number(shippingZone.perKgRate));
          } else {
            shippingCost = 25.00 + (totalWeight * 3.00);
          }
        }

        tradeBreakdown = {
          tradeType: isDomestic ? "domestic" : "cross_border",
          originCountry: primaryOriginCode,
          destinationCountry: destCode,
          vatAmount: vatAmount.toFixed(2),
          importDutyAmount: importDutyAmount.toFixed(2),
          exportDutyAmount: exportDutyAmount.toFixed(2),
          customsFeeAmount: customsFeeAmount.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          vatLabel: destTax ? `VAT (${destTax.countryName} ${destTax.vatRate}%)` : "VAT",
          importDutyLabel: destTax ? `Import Duty (${destTax.countryName} ${destTax.importDutyRate}%)` : "Import Duty",
        };
      } catch (tradeError) {
        console.error("Trade cost calculation error (proceeding without):", tradeError);
      }

      if (vatAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: tradeBreakdown.vatLabel || 'VAT',
              description: `Destination country value-added tax`,
            },
            unit_amount: Math.round(vatAmount * 100),
          },
          quantity: 1,
        });
      }

      if (importDutyAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: tradeBreakdown.importDutyLabel || 'Import Duty',
              description: 'Import duty charged by destination country',
            },
            unit_amount: Math.round(importDutyAmount * 100),
          },
          quantity: 1,
        });
      }

      if (exportDutyAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Export Duty',
              description: 'Export duty charged by origin country',
            },
            unit_amount: Math.round(exportDutyAmount * 100),
          },
          quantity: 1,
        });
      }

      if (customsFeeAmount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Customs Processing Fee',
              description: 'Cross-border customs clearance and processing fee',
            },
            unit_amount: Math.round(customsFeeAmount * 100),
          },
          quantity: 1,
        });
      }

      const selectedDeliveryMethod = deliveryMethod || "home";
      const selectedDeliveryTier = deliveryTier || "standard";

      if (selectedDeliveryMethod === "pickup") {
        shippingCost = Math.max(shippingCost * 0.5, 1.00);
      }

      if (shippingCost > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedDeliveryMethod === "pickup" ? 'Pickup Point Shipping (50% off)' : (isDomestic ? 'Domestic Shipping' : 'International Shipping'),
              description: selectedDeliveryMethod === "pickup" ? 'Reduced shipping to pickup collection point' : (isDomestic ? 'Local delivery within country' : 'Cross-border shipping and handling'),
            },
            unit_amount: Math.round(shippingCost * 100),
          },
          quantity: 1,
        });
      }

      let tierPremiumAmount = 0;
      let corridorFeeAmount = 0;

      if (selectedDeliveryTier !== "standard" && shippingAddress.city) {
        try {
          const tiers = await storage.getDeliveryTiers({ countryCode: destCode, city: shippingAddress.city });
          const matchedTier = tiers.find((t: any) => t.tier === selectedDeliveryTier);
          if (matchedTier) {
            tierPremiumAmount = Number(matchedTier.baseFee);
            if (tierPremiumAmount > 0) {
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: selectedDeliveryTier === "instant" ? 'Instant Delivery Premium' : 'Express Delivery Premium',
                    description: selectedDeliveryTier === "instant" ? 'Priority delivery within 60-90 minutes' : 'Same-day delivery within 4-8 hours',
                  },
                  unit_amount: Math.round(tierPremiumAmount * 100),
                },
                quantity: 1,
              });
            }
          }
        } catch (tierError) {
          console.error("Delivery tier lookup error:", tierError);
        }
      }

      const firstProduct = cartItems.find(i => i.product)?.product;
      const originCity = (firstProduct as any)?.city || "";
      if (originCity && shippingAddress.city && originCity.toLowerCase() !== shippingAddress.city.toLowerCase()) {
        try {
          const corridors = await storage.getExpressCorridors({
            originCity,
            originCountryCode: primaryOriginCode,
            destCity: shippingAddress.city,
            destCountryCode: destCode,
          });
          if (corridors.length > 0) {
            corridorFeeAmount = Number(corridors[0].corridorFee);
            if (corridorFeeAmount > 0) {
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: `Express Corridor: ${corridors[0].name}`,
                    description: `Fast ${corridors[0].mode} delivery between cities`,
                  },
                  unit_amount: Math.round(corridorFeeAmount * 100),
                },
                quantity: 1,
              });
            }
          }
        } catch (corridorError) {
          console.error("Express corridor lookup error:", corridorError);
        }
      }

      const platformFeeRate = 0.05;
      const platformFee = Math.round(totalAmount * platformFeeRate * 100);

      if (platformFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Platform Service Fee (5%)',
              description: 'Ghani Africa marketplace service fee including buyer protection',
            },
            unit_amount: platformFee,
          },
          quantity: 1,
        });
      }

      const sellerIds = Object.keys(itemsBySeller);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
        metadata: {
          userId,
          sellerIds: sellerIds.join(','),
          shippingAddress: JSON.stringify(shippingAddress),
          platformFeeAmount: (platformFee / 100).toFixed(2),
          tradeBreakdown: JSON.stringify(tradeBreakdown),
          deliveryMethod: selectedDeliveryMethod,
          deliveryTier: selectedDeliveryTier,
          pickupPointId: pickupPointId ? String(pickupPointId) : '',
          tierPremium: tierPremiumAmount.toFixed(2),
          corridorFee: corridorFeeAmount.toFixed(2),
        },
        payment_intent_data: {
          metadata: {
            userId,
            type: 'marketplace_order',
          },
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ success: false, error: "Failed to create checkout session" });
    }
  });

  app.post("/api/checkout/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.body;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ success: false, error: "Valid session ID required" });
      }

      const existingOrder = await db.execute(
        sql`SELECT id FROM orders WHERE notes = ${'stripe_session:' + sessionId} LIMIT 1`
      );
      if (existingOrder.rows.length > 0) {
        return res.json({ success: true, message: "Orders already created", orders: [] });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ success: false, error: "Payment not completed" });
      }

      const metaUserId = session.metadata?.userId;
      if (metaUserId !== userId) {
        return res.status(403).json({ success: false, error: "Unauthorized" });
      }

      let shippingAddress: any = null;
      try {
        shippingAddress = session.metadata?.shippingAddress
          ? JSON.parse(session.metadata.shippingAddress)
          : null;
      } catch {
        shippingAddress = null;
      }

      let tradeBreakdown: any = null;
      try {
        tradeBreakdown = session.metadata?.tradeBreakdown
          ? JSON.parse(session.metadata.tradeBreakdown)
          : null;
      } catch {
        tradeBreakdown = null;
      }

      const cartItems = await storage.getCartItems(userId);
      if (!cartItems || cartItems.length === 0) {
        return res.json({ success: true, message: "Orders already created", orders: [] });
      }

      const itemsBySeller = cartItems.reduce((acc: Record<string, typeof cartItems>, item: any) => {
        if (!item.product) return acc;
        const sellerId = item.product.sellerId;
        if (!acc[sellerId]) acc[sellerId] = [];
        acc[sellerId].push(item);
        return acc;
      }, {} as Record<string, typeof cartItems>);

      const createdOrders: any[] = [];

      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const totalAmount = (items as any[]).reduce((sum: number, item: any) => {
          return sum + (item.product ? Number(item.product.price) * item.quantity : 0);
        }, 0);

        const orderItems = (items as any[]).map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product?.price || "0",
          totalPrice: String(Number(item.product?.price || 0) * item.quantity),
        }));

        const order = await storage.createOrder(
          {
            sellerId,
            buyerId: userId,
            totalAmount: String(totalAmount),
            shippingAddress,
            paymentMethod: 'stripe',
            paymentStatus: 'held',
            status: 'paid',
            notes: 'stripe_session:' + sessionId,
          },
          orderItems
        );
        createdOrders.push(order);

        try {
          const orderAmount = parseFloat(order.totalAmount);
          const fees = await feeService.calculateOrderFees(sellerId, orderAmount, true);
          await feeService.recordPlatformFee({
            orderId: order.id,
            sellerId,
            buyerId: userId,
            feeType: "commission",
            amount: fees.commission.amount,
            rate: fees.commission.rate,
            baseAmount: fees.commission.baseAmount,
            description: fees.commission.description,
            currency: order.currency || "USD",
          });
          if (fees.escrowFee) {
            await feeService.recordPlatformFee({
              orderId: order.id,
              sellerId,
              buyerId: userId,
              feeType: "escrow_fee",
              amount: fees.escrowFee.amount,
              rate: fees.escrowFee.rate,
              baseAmount: fees.escrowFee.baseAmount,
              description: fees.escrowFee.description,
              currency: order.currency || "USD",
            });
          }
        } catch (feeError) {
          console.error("Failed to record platform fees:", feeError);
        }

        try {
          const user = req.user as any;
          const buyerEmail = user?.email;
          const buyerName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.username || 'Buyer');

          const sellerItems = items as any[];
          const receiptItems = sellerItems.map((item: any) => ({
            name: item.product?.name || `Product #${item.productId}`,
            quantity: item.quantity,
            unitPrice: String(item.product?.price || "0"),
            totalPrice: String(Number(item.product?.price || 0) * item.quantity),
          }));

          const orderAmount = parseFloat(order.totalAmount);
          let commissionRate = "5%";
          let commissionDecimal = 0.05;
          try {
            const sellerFees = await feeService.calculateOrderFees(sellerId, orderAmount, true);
            commissionDecimal = Number(sellerFees.commission.rate);
            commissionRate = `${(commissionDecimal * 100).toFixed(1)}%`;
          } catch {}

          const platformFeeAmount = (orderAmount * 0.05).toFixed(2);
          const totalWithFee = (orderAmount + parseFloat(platformFeeAmount)).toFixed(2);
          const commissionAmount = (orderAmount * commissionDecimal).toFixed(2);
          const netPayout = (orderAmount - parseFloat(commissionAmount)).toFixed(2);

          if (buyerEmail) {
            sendBuyerTransactionReceipt(
              buyerEmail, order.id, receiptItems,
              order.totalAmount, platformFeeAmount, totalWithFee,
              'stripe', shippingAddress
            ).catch(e => console.error("Buyer receipt email failed:", e));
          }

          const sellerResult = await db.execute(sql`SELECT email FROM users WHERE id = ${sellerId} LIMIT 1`);
          const sellerEmail = sellerResult.rows[0]?.email as string | undefined;
          if (sellerEmail) {
            sendSellerNewOrderNotification(
              sellerEmail, order.id, order.totalAmount, buyerName,
              receiptItems, commissionRate, shippingAddress
            ).catch(e => console.error("Seller notification email failed:", e));

            sendSellerTransactionReceipt(
              sellerEmail, order.id, receiptItems,
              order.totalAmount, commissionAmount, commissionRate, netPayout
            ).catch(e => console.error("Seller receipt email failed:", e));
          }

          const existingInvoice = await storage.getInvoiceByOrder(order.id);
          if (existingInvoice) {
            storage.updateInvoiceStatus(existingInvoice.id, 'paid', new Date()).catch(e => console.error("Invoice update failed:", e));
          } else {
            const stripeInvoiceNumber = generateInvoiceNumber();
            const invoiceLineItems: any[] = receiptItems.map((item: any) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            }));

            let invoiceTotal = parseFloat(totalWithFee);

            if (tradeBreakdown) {
              const sellerCount = Object.keys(itemsBySeller).length || 1;
              const sellerShare = orderAmount / cartItems.reduce((sum: number, item: any) => sum + (item.product ? Number(item.product.price) * item.quantity : 0), 0) || (1 / sellerCount);

              const vatAmt = parseFloat(tradeBreakdown.vatAmount || "0") * sellerShare;
              const importAmt = parseFloat(tradeBreakdown.importDutyAmount || "0") * sellerShare;
              const exportAmt = parseFloat(tradeBreakdown.exportDutyAmount || "0") * sellerShare;
              const customsAmt = parseFloat(tradeBreakdown.customsFeeAmount || "0") * sellerShare;
              const shippingAmt = parseFloat(tradeBreakdown.shippingCost || "0") * sellerShare;

              if (vatAmt > 0) {
                invoiceLineItems.push({ name: tradeBreakdown.vatLabel || "VAT", quantity: 1, unitPrice: vatAmt.toFixed(2), totalPrice: vatAmt.toFixed(2) });
                invoiceTotal += vatAmt;
              }
              if (importAmt > 0) {
                invoiceLineItems.push({ name: tradeBreakdown.importDutyLabel || "Import Duty", quantity: 1, unitPrice: importAmt.toFixed(2), totalPrice: importAmt.toFixed(2) });
                invoiceTotal += importAmt;
              }
              if (exportAmt > 0) {
                invoiceLineItems.push({ name: "Export Duty", quantity: 1, unitPrice: exportAmt.toFixed(2), totalPrice: exportAmt.toFixed(2) });
                invoiceTotal += exportAmt;
              }
              if (customsAmt > 0) {
                invoiceLineItems.push({ name: "Customs Processing Fee", quantity: 1, unitPrice: customsAmt.toFixed(2), totalPrice: customsAmt.toFixed(2) });
                invoiceTotal += customsAmt;
              }
              if (shippingAmt > 0) {
                const shippingLabel = session.metadata?.deliveryMethod === "pickup"
                  ? "Pickup Point Shipping (50% off)"
                  : (tradeBreakdown.tradeType === "domestic" ? "Domestic Shipping" : "International Shipping");
                invoiceLineItems.push({ name: shippingLabel, quantity: 1, unitPrice: shippingAmt.toFixed(2), totalPrice: shippingAmt.toFixed(2) });
                invoiceTotal += shippingAmt;
              }
            }

            const sellerCount2 = Object.keys(itemsBySeller).length || 1;
            const totalCartAmount2 = cartItems.reduce((sum: number, item: any) => sum + (item.product ? Number(item.product.price) * item.quantity : 0), 0);
            const sellerShare2 = totalCartAmount2 > 0 ? orderAmount / totalCartAmount2 : (1 / sellerCount2);

            const tierPremiumMeta = parseFloat(session.metadata?.tierPremium || "0") * sellerShare2;
            if (tierPremiumMeta > 0) {
              const tierLabel = session.metadata?.deliveryTier === "instant" ? "Instant Delivery Premium" : "Express Delivery Premium";
              invoiceLineItems.push({ name: tierLabel, quantity: 1, unitPrice: tierPremiumMeta.toFixed(2), totalPrice: tierPremiumMeta.toFixed(2) });
              invoiceTotal += tierPremiumMeta;
            }

            const corridorFeeMeta = parseFloat(session.metadata?.corridorFee || "0") * sellerShare2;
            if (corridorFeeMeta > 0) {
              invoiceLineItems.push({ name: "Express Corridor Fee", quantity: 1, unitPrice: corridorFeeMeta.toFixed(2), totalPrice: corridorFeeMeta.toFixed(2) });
              invoiceTotal += corridorFeeMeta;
            }

            storage.createInvoice({
              invoiceNumber: stripeInvoiceNumber,
              orderId: order.id,
              sellerId,
              buyerId: userId,
              status: 'paid',
              subtotal: order.totalAmount,
              platformFee: platformFeeAmount,
              totalAmount: invoiceTotal.toFixed(2),
              currency: order.currency || 'USD',
              paymentMethod: 'stripe',
              paidAt: new Date(),
              lineItems: invoiceLineItems,
            }).catch(e => console.error("Invoice creation failed:", e));
          }
        } catch (emailError) {
          console.error("Failed to send transaction emails:", emailError);
        }

        logActivity({
          orderId: order.id,
          actorId: userId,
          actorType: "buyer",
          action: "order_placed",
          description: `Order #${order.id} placed via Stripe for ${order.totalAmount} ${order.currency || 'USD'}`,
        }).catch(e => console.error("Activity log failed:", e));

        logActivity({
          orderId: order.id,
          actorId: userId,
          actorType: "buyer",
          action: "payment_received",
          description: `Stripe payment received for order #${order.id}: ${order.totalAmount} ${order.currency || 'USD'}`,
        }).catch(e => console.error("Activity log failed:", e));

        notifyAdmin({
          type: "new_order",
          title: "New Stripe Order",
          message: `Order #${order.id} placed and paid via Stripe for ${order.totalAmount} ${order.currency || 'USD'}`,
          orderId: order.id,
          userId,
          severity: "info",
        }).catch(e => console.error("Admin notification failed:", e));
      }

      await storage.clearCart(userId);

      res.json({ success: true, orders: createdOrders });
    } catch (error) {
      console.error("Checkout complete error:", error);
      res.status(500).json({ success: false, error: "Failed to complete checkout" });
    }
  });

  // ============ MOBILE MONEY PAYMENTS ============
  app.post("/api/mobile-money/initiate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { provider, phoneNumber, shippingAddress, destinationCountryCode, deliveryMethod, deliveryTier, pickupPointId } = req.body;

      if (!provider || !phoneNumber) {
        return res.status(400).json({ success: false, error: "Provider and phone number are required" });
      }

      const validProviders = ["mpesa", "mtn", "airtel", "orange"];
      if (!validProviders.includes(provider)) {
        return res.status(400).json({ success: false, error: "Invalid mobile money provider" });
      }

      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.city || !shippingAddress.country) {
        return res.status(400).json({ success: false, error: "Complete shipping address is required" });
      }

      const cartItems = await storage.getCartItems(userId);
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, error: "Cart is empty" });
      }

      let totalAmount = 0;
      const itemsBySeller: Record<string, typeof cartItems> = {};
      for (const item of cartItems) {
        if (!item.product) continue;
        const price = Number(item.product.price);
        totalAmount += price * item.quantity;
        const sellerId = item.product.sellerId;
        if (!itemsBySeller[sellerId]) itemsBySeller[sellerId] = [];
        itemsBySeller[sellerId].push(item);
      }

      const platformFee = Math.round(totalAmount * 0.05 * 100) / 100;
      const grandTotal = totalAmount + platformFee;

      const transactionRef = `MM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const createdOrders: any[] = [];
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const sellerTotal = (items as any[]).reduce((sum: number, item: any) => {
          return sum + (item.product ? Number(item.product.price) * item.quantity : 0);
        }, 0);

        const orderItems = (items as any[]).map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product?.price || "0",
          totalPrice: String(Number(item.product?.price || 0) * item.quantity),
        }));

        const order = await storage.createOrder(
          {
            sellerId,
            buyerId: userId,
            totalAmount: String(sellerTotal),
            shippingAddress,
            paymentMethod: 'mobile_money',
            paymentStatus: 'pending',
            status: 'pending',
            notes: `mobile_money:${transactionRef}`,
          },
          orderItems
        );
        createdOrders.push(order);
      }

      const payment = await storage.createMobileMoneyPayment({
        orderId: createdOrders.length > 0 ? createdOrders[0].id : null,
        provider,
        phoneNumber,
        amount: String(grandTotal),
        currency: "USD",
        transactionRef,
        status: "pending",
        metadata: {
          orderIds: createdOrders.map((o: any) => o.id),
          shippingAddress,
          deliveryMethod: deliveryMethod || "home",
          deliveryTier: deliveryTier || "standard",
          pickupPointId: pickupPointId || null,
          platformFee: platformFee.toFixed(2),
        },
      });

      await storage.clearCart(userId);

      res.json({
        success: true,
        payment: {
          id: payment.id,
          transactionRef: payment.transactionRef,
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          phoneNumber: payment.phoneNumber,
        },
        orders: createdOrders.map((o: any) => ({ id: o.id, status: o.status })),
        message: `Payment request sent to your ${provider.toUpperCase()} number. Please check your phone to approve the payment.`,
      });
    } catch (error) {
      console.error("Mobile money initiation error:", error);
      res.status(500).json({ success: false, error: "Failed to initiate mobile money payment" });
    }
  });

  app.get("/api/mobile-money/status/:id", isAuthenticated, async (req: any, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      if (isNaN(paymentId)) {
        return res.status(400).json({ success: false, error: "Invalid payment ID" });
      }

      const payment = await storage.getMobileMoneyPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, error: "Payment not found" });
      }

      res.json({
        success: true,
        payment: {
          id: payment.id,
          transactionRef: payment.transactionRef,
          provider: payment.provider,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          phoneNumber: payment.phoneNumber,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Mobile money status error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch payment status" });
    }
  });

  app.post("/api/webhooks/mobile-money", async (req, res) => {
    try {
      const { transactionRef, externalRef, status, provider } = req.body;

      if (!transactionRef || !status) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const payment = await storage.getMobileMoneyPaymentByRef(transactionRef);
      if (!payment) {
        return res.status(404).json({ success: false, error: "Payment not found" });
      }

      const validStatuses = ["completed", "failed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }

      await storage.updateMobileMoneyPayment(payment.id, {
        status,
        externalRef: externalRef || payment.externalRef,
      });

      if (status === "completed") {
        const metadata = payment.metadata as any;
        const orderIds = metadata?.orderIds || [];
        for (const orderId of orderIds) {
          await storage.updateOrderStatus(orderId, "paid");
        }
      }

      res.json({ success: true, message: `Payment ${transactionRef} updated to ${status}` });
    } catch (error) {
      console.error("Mobile money webhook error:", error);
      res.status(500).json({ success: false, error: "Webhook processing failed" });
    }
  });

  // ============ STRIPE ADVERTISING PACKAGES ============
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get publishable key" });
    }
  });

  app.get("/api/advertising/packages", async (req, res) => {
    try {
      const { db } = await import("./db");
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = true AND metadata->>'type' = 'advertising'`
      );
      
      if (result.rows.length > 0) {
        const packagesWithPrices = await Promise.all(
          result.rows.map(async (product: any) => {
            const pricesResult = await db.execute(
              sql`SELECT * FROM stripe.prices WHERE product = ${product.id} AND active = true ORDER BY unit_amount ASC`
            );
            return {
              ...product,
              prices: pricesResult.rows,
            };
          })
        );
        return res.json(packagesWithPrices);
      }

      const stripe = await getUncachableStripeClient();
      const products = await stripe.products.list({ active: true, limit: 100 });
      const adProducts = products.data.filter(
        (p) => p.metadata?.type === "advertising"
      );

      const packagesWithPrices = await Promise.all(
        adProducts.map(async (product) => {
          const prices = await stripe.prices.list({
            product: product.id,
            active: true,
            limit: 10,
          });
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            metadata: product.metadata,
            active: product.active,
            prices: prices.data.map((p) => ({
              id: p.id,
              unit_amount: p.unit_amount,
              currency: p.currency,
              recurring: p.recurring,
              metadata: p.metadata,
            })),
          };
        })
      );
      
      res.json(packagesWithPrices);
    } catch (error) {
      console.error("Error fetching advertising packages:", error);
      res.status(500).json({ success: false, error: "Failed to fetch advertising packages" });
    }
  });

  app.post("/api/advertising/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { priceId, productId, packageType, videoUrl } = req.body;
      
      if (!priceId || !productId || !packageType) {
        return res.status(400).json({ success: false, error: "Price ID, Product ID, and Package Type are required" });
      }
      
      // Validate video URL is only allowed for premium/featured packages
      if (videoUrl && packageType !== "premium" && packageType !== "featured") {
        return res.status(400).json({ success: false, error: "Video ads are only available for Premium and Featured packages" });
      }
      
      const stripe = await getUncachableStripeClient();
      
      let subscription = await storage.getAdSubscription(userId);
      let customerId = subscription?.stripeCustomerId;
      
      if (!customerId) {
        const profile = await storage.getUserProfile(userId);
        const customer = await stripe.customers.create({
          metadata: { userId },
          email: profile?.phone || undefined,
        });
        customerId = customer.id;
        
        if (subscription) {
          await storage.updateAdSubscription(subscription.id, { stripeCustomerId: customerId });
        } else {
          subscription = await storage.createAdSubscription({
            sellerId: userId,
            stripeCustomerId: customerId,
            status: 'inactive',
          });
        }
      }
      
      // Build success URL with all parameters
      // Note: URLSearchParams handles encoding automatically, don't double-encode
      const successParams = new URLSearchParams({
        success: 'true',
        productId: productId.toString(),
        packageType: packageType,
      });
      if (videoUrl) {
        successParams.set('videoUrl', videoUrl);
      }
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/dashboard/advertising?${successParams.toString()}`,
        cancel_url: `${req.protocol}://${req.get('host')}/dashboard/advertising?cancelled=true`,
        metadata: {
          userId,
          productId: productId.toString(),
          packageType,
          videoUrl: videoUrl || '',
        },
      });
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ success: false, error: "Failed to create checkout session" });
    }
  });

  app.get("/api/advertising/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getAdSubscription(userId);
      res.json(subscription || null);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch subscription" });
    }
  });

  app.post("/api/advertising/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = await storage.getAdSubscription(userId);
      
      if (!subscription?.stripeCustomerId) {
        return res.status(400).json({ success: false, error: "No subscription found" });
      }
      
      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/dashboard/advertising`,
      });
      
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create portal session" });
    }
  });

  // ============ SEARCH PREFERENCE TRACKING ============
  app.post("/api/track/search", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { searchTerm, categoryId, country } = req.body;
      if (!searchTerm && !categoryId) {
        return res.status(400).json({ success: false, error: "searchTerm or categoryId required" });
      }
      await storage.trackSearchPreference({
        userId,
        searchTerm: searchTerm || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        productId: null,
        eventType: categoryId ? "category_browse" : "search",
        country: country || null,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to track search" });
    }
  });

  app.get("/api/recently-viewed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const recentProducts = await storage.getRecentlyViewedProducts(userId, Math.min(limit, 20));
      res.json({ success: true, data: recentProducts });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch recently viewed products" });
    }
  });

  app.post("/api/track/view", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId, categoryId, country } = req.body;
      if (!productId) {
        return res.status(400).json({ success: false, error: "productId required" });
      }
      await storage.trackSearchPreference({
        userId,
        searchTerm: null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        productId: parseInt(productId),
        eventType: "view",
        country: country || null,
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to track view" });
    }
  });

  // ============ EMAIL PREFERENCES & UNSUBSCRIBE ============
  app.get("/api/email-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let pref = await storage.getEmailPreference(userId);
      if (!pref) {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        pref = await storage.upsertEmailPreference({
          userId,
          promoOptIn: true,
          unsubscribeToken: token,
        });
      }
      res.json({ success: true, data: pref });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch email preferences" });
    }
  });

  app.patch("/api/email-preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { promoOptIn } = req.body;
      let pref = await storage.getEmailPreference(userId);
      if (!pref) {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        pref = await storage.upsertEmailPreference({
          userId,
          promoOptIn: promoOptIn ?? true,
          unsubscribeToken: token,
        });
      } else {
        pref = await storage.updateEmailPreference(userId, {
          promoOptIn: promoOptIn ?? true,
          unsubscribedAt: promoOptIn === false ? new Date() : null,
        });
      }
      res.json({ success: true, data: pref });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update email preferences" });
    }
  });

  app.get("/api/unsubscribe/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const pref = await storage.getEmailPreferenceByToken(token);
      if (!pref) {
        return res.status(404).send(`
          <html><body style="font-family:Arial;text-align:center;padding:50px;">
            <h2>Invalid unsubscribe link</h2>
            <p>This link is no longer valid.</p>
          </body></html>
        `);
      }
      await storage.updateEmailPreference(pref.userId, {
        promoOptIn: false,
        unsubscribedAt: new Date(),
      });
      res.send(`
        <html><body style="font-family:Arial;text-align:center;padding:50px;">
          <h2>Unsubscribed Successfully</h2>
          <p>You have been unsubscribed from promotional emails from Ghani Africa.</p>
          <p>You can re-subscribe anytime from your account settings.</p>
        </body></html>
      `);
    } catch (error) {
      res.status(500).send("Something went wrong. Please try again later.");
    }
  });

  // ============ PROMOTIONAL EMAILS (admin triggered) ============
  app.post("/api/admin/send-promotional-emails", isAdminSession, async (req: any, res) => {
    try {
      const { sendPromotionalEmails } = await import("./auth/emailService");
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const result = await sendPromotionalEmails(baseUrl, storage);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error sending promotional emails:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to send promotional emails" });
    }
  });

  app.get("/api/admin/promo-email-stats", isAdminSession, async (req: any, res) => {
    try {
      const stats = await storage.getPromoEmailStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch promo email stats" });
    }
  });

  // ============ EMAIL CAMPAIGNS ============
  app.get("/api/admin/email-campaigns", isAdminSession, async (req: any, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json({ success: true, data: campaigns });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/admin/email-campaigns", isAdminSession, async (req: any, res) => {
    try {
      const { subject, content, recipientType, customEmails } = req.body;
      if (!subject || !content) {
        return res.status(400).json({ success: false, error: "Subject and content are required" });
      }
      const campaign = await storage.createEmailCampaign({
        subject,
        content,
        recipientType: recipientType || "all",
        customEmails: customEmails || null,
        status: "draft",
        createdBy: req.session?.adminUsername || "admin",
      });
      res.json({ success: true, data: campaign });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to create campaign" });
    }
  });

  app.delete("/api/admin/email-campaigns/:id", isAdminSession, async (req: any, res) => {
    try {
      await storage.deleteEmailCampaign(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete campaign" });
    }
  });

  app.post("/api/admin/email-campaigns/:id/send", isAdminSession, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getEmailCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ success: false, error: "Campaign not found" });
      }
      if (campaign.status === "sending") {
        return res.status(400).json({ success: false, error: "Campaign is already being sent" });
      }

      await storage.updateEmailCampaign(campaignId, { status: "sending" });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      let recipients: { email: string; name: string | null }[] = [];

      if (campaign.recipientType === "custom" && campaign.customEmails) {
        recipients = campaign.customEmails.split(",").map(e => e.trim()).filter(Boolean).map(e => ({ email: e, name: null }));
      } else if (campaign.recipientType === "subscribers") {
        const subscribedUsers = await storage.getSubscribedUsers();
        recipients = subscribedUsers.map(u => ({ email: u.email, name: u.firstName }));
      } else {
        const allRecipients = await storage.getAllEmailRecipients();
        recipients = allRecipients.map(r => ({ email: r.email, name: r.name }));
      }

      let sent = 0;
      let failed = 0;

      const { getEmailWrapper } = await import("./auth/emailService");
      const { sendEmail } = await import("./email");

      for (const recipient of recipients) {
        try {
          const firstName = recipient.name || "there";
          const personalizedContent = campaign.content.replace(/\{\{name\}\}/g, firstName);
          
          const success = await sendEmail({
            to: recipient.email,
            subject: campaign.subject,
            html: getEmailWrapper(baseUrl, personalizedContent),
          });

          if (success) {
            sent++;
          } else {
            failed++;
          }
        } catch (err) {
          failed++;
        }
      }

      await storage.updateEmailCampaign(campaignId, {
        status: "sent",
        totalRecipients: recipients.length,
        sentCount: sent,
        failedCount: failed,
        sentAt: new Date(),
      });

      res.json({ success: true, sent, failed, total: recipients.length });
    } catch (error: any) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to send campaign" });
    }
  });

  // ============ ADMIN EMAIL CONTACTS ============
  app.get("/api/admin/email-contacts", isAdminSession, async (req: any, res) => {
    try {
      const contacts = await storage.getAdminEmailContacts();
      res.json({ success: true, data: contacts });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/admin/email-contacts", isAdminSession, async (req: any, res) => {
    try {
      const { email, name, company, tags } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required" });
      }
      const contact = await storage.createAdminEmailContact({
        email,
        name: name || null,
        company: company || null,
        tags: tags || null,
        addedBy: req.session?.adminUsername || "admin",
      });
      res.json({ success: true, data: contact });
    } catch (error: any) {
      if (error.message?.includes("unique") || error.code === "23505") {
        return res.status(400).json({ success: false, error: "This email already exists in contacts" });
      }
      res.status(500).json({ success: false, error: error.message || "Failed to add contact" });
    }
  });

  app.post("/api/admin/email-contacts/bulk", isAdminSession, async (req: any, res) => {
    try {
      const { emails } = req.body;
      if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ success: false, error: "Emails array is required" });
      }
      let added = 0;
      let skipped = 0;
      for (const item of emails) {
        try {
          await storage.createAdminEmailContact({
            email: item.email,
            name: item.name || null,
            company: item.company || null,
            tags: item.tags || null,
            addedBy: req.session?.adminUsername || "admin",
          });
          added++;
        } catch {
          skipped++;
        }
      }
      res.json({ success: true, added, skipped });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message || "Failed to bulk add contacts" });
    }
  });

  app.delete("/api/admin/email-contacts/:id", isAdminSession, async (req: any, res) => {
    try {
      await storage.deleteAdminEmailContact(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete contact" });
    }
  });

  app.get("/api/admin/email-recipients", isAdminSession, async (req: any, res) => {
    try {
      const recipients = await storage.getAllEmailRecipients();
      res.json({ success: true, data: recipients, total: recipients.length });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch recipients" });
    }
  });

  // ============ MANUFACTURER OUTREACH ============
  app.get("/api/admin/outreach", isAdminSession, async (req: any, res) => {
    try {
      const filters: { status?: string; country?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.country) filters.country = req.query.country as string;
      const contacts = await storage.getManufacturerOutreachContacts(filters);
      res.json({ success: true, data: contacts });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch outreach contacts" });
    }
  });

  app.get("/api/admin/outreach/stats", isAdminSession, async (req: any, res) => {
    try {
      const stats = await storage.getManufacturerOutreachStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  });

  app.post("/api/admin/outreach", isAdminSession, async (req: any, res) => {
    try {
      const { email, businessName, contactPerson, country, industry, notes } = req.body;
      if (!email) return res.status(400).json({ success: false, error: "Email is required" });
      const existing = await storage.getManufacturerOutreachByEmail(email.toLowerCase().trim());
      if (existing) return res.status(409).json({ success: false, error: "This email already exists in outreach list" });
      const contact = await storage.createManufacturerOutreach({
        email: email.toLowerCase().trim(),
        businessName: businessName || null,
        contactPerson: contactPerson || null,
        country: country || null,
        industry: industry || null,
        notes: notes || null,
        addedBy: req.session.adminId || 'admin',
        status: 'pending',
      });
      res.json({ success: true, data: contact });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to add contact" });
    }
  });

  app.post("/api/admin/outreach/bulk", isAdminSession, async (req: any, res) => {
    try {
      const { contacts } = req.body;
      if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
        return res.status(400).json({ success: false, error: "Contacts array is required" });
      }
      const data = contacts.map((c: any) => ({
        email: (c.email || '').toLowerCase().trim(),
        businessName: c.businessName || null,
        contactPerson: c.contactPerson || null,
        country: c.country || null,
        industry: c.industry || null,
        notes: c.notes || null,
        addedBy: req.session.adminId || 'admin',
        status: 'pending' as const,
      })).filter((c: any) => c.email && c.email.includes('@'));

      const result = await storage.bulkCreateManufacturerOutreach(data);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to bulk import contacts" });
    }
  });

  app.patch("/api/admin/outreach/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const allowedFields = ['email', 'businessName', 'contactPerson', 'country', 'industry', 'notes', 'status'];
      const updateData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updateData[key] = req.body[key];
      }
      const updated = await storage.updateManufacturerOutreach(id, updateData);
      if (!updated) return res.status(404).json({ success: false, error: "Contact not found" });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update contact" });
    }
  });

  app.delete("/api/admin/outreach/:id", isAdminSession, async (req: any, res) => {
    try {
      await storage.deleteManufacturerOutreach(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete contact" });
    }
  });

  app.post("/api/admin/outreach/:id/invite", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getManufacturerOutreach(id);
      if (!contact) return res.status(404).json({ success: false, error: "Contact not found" });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const { sendManufacturerInviteEmail } = await import("./auth/emailService");
      await sendManufacturerInviteEmail(contact.email, contact.contactPerson, contact.businessName, baseUrl);
      await storage.updateManufacturerOutreach(id, {
        status: 'invited',
        invitedAt: new Date(),
      });
      res.json({ success: true, message: "Invitation email sent" });
    } catch (error: any) {
      console.error("Failed to send invite:", error);
      res.status(500).json({ success: false, error: "Failed to send invitation email" });
    }
  });

  app.post("/api/admin/outreach/invite-all", isAdminSession, async (req: any, res) => {
    try {
      const pending = await storage.getManufacturerOutreachContacts({ status: 'pending' });
      if (pending.length === 0) return res.json({ success: true, sent: 0, message: "No pending contacts to invite" });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const { sendManufacturerInviteEmail } = await import("./auth/emailService");
      let sent = 0;
      let failed = 0;
      for (const contact of pending) {
        try {
          await sendManufacturerInviteEmail(contact.email, contact.contactPerson, contact.businessName, baseUrl);
          await storage.updateManufacturerOutreach(contact.id, {
            status: 'invited',
            invitedAt: new Date(),
          });
          sent++;
        } catch (e) {
          failed++;
          console.error(`Failed to send invite to ${contact.email}:`, e);
        }
      }
      res.json({ success: true, sent, failed, total: pending.length });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to send invitations" });
    }
  });

  app.post("/api/admin/outreach/:id/follow-up", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getManufacturerOutreach(id);
      if (!contact) return res.status(404).json({ success: false, error: "Contact not found" });
      if (contact.status === 'signed_up') return res.status(400).json({ success: false, error: "Contact has already signed up" });
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const { sendManufacturerFollowUpEmail } = await import("./auth/emailService");
      const followUpNum = (contact.followUpCount || 0) + 1;
      await sendManufacturerFollowUpEmail(contact.email, contact.contactPerson, contact.businessName, followUpNum, baseUrl);
      await storage.updateManufacturerOutreach(id, {
        status: 'reminded',
        reminderSentAt: new Date(),
        followUpCount: followUpNum,
      });
      res.json({ success: true, message: `Follow-up #${followUpNum} sent` });
    } catch (error: any) {
      console.error("Failed to send follow-up:", error);
      res.status(500).json({ success: false, error: "Failed to send follow-up email" });
    }
  });

  // Auto follow-up scheduler — sends weekly reminders (checks every 6 hours)
  async function checkOutreachFollowUps() {
    try {
      const pendingFollowUps = await storage.getPendingFollowUps(7, 8);
      if (pendingFollowUps.length === 0) {
        console.log("[Outreach Weekly Reminder] No follow-ups needed");
        return;
      }
      const baseUrl = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'https://ghaniafrica.com';
      const { sendManufacturerFollowUpEmail } = await import("./auth/emailService");
      let sent = 0;
      for (const contact of pendingFollowUps) {
        try {
          const followUpNum = (contact.followUpCount || 0) + 1;
          await sendManufacturerFollowUpEmail(contact.email, contact.contactPerson, contact.businessName, followUpNum, baseUrl);
          await storage.updateManufacturerOutreach(contact.id, {
            status: 'reminded',
            reminderSentAt: new Date(),
            followUpCount: followUpNum,
          });
          sent++;
        } catch (e) {
          console.error(`[Outreach Weekly Reminder] Failed for ${contact.email}:`, e);
        }
      }
      console.log(`[Outreach Weekly Reminder] Complete: ${sent} weekly reminders sent`);
    } catch (error) {
      console.error("[Outreach Weekly Reminder] Error:", error);
    }
  }
  setInterval(checkOutreachFollowUps, 6 * 60 * 60 * 1000);
  setTimeout(checkOutreachFollowUps, 45000);

  // ============ TRADE EXPO ADS ============
  const EXPO_PACKAGES = {
    basic: { name: "Basic Expo Ad", price: 4900, durationDays: 7, description: "7-day banner placement" },
    premium: { name: "Premium Expo Ad", price: 12900, durationDays: 14, description: "14-day priority banner placement" },
    featured: { name: "Featured Expo Ad", price: 24900, durationDays: 30, description: "30-day featured banner with highlight" },
  };

  app.get("/api/trade-expo-ads/packages", (_req, res) => {
    res.json({ success: true, data: EXPO_PACKAGES });
  });

  app.get("/api/trade-expo-ads/active", async (_req, res) => {
    try {
      const ads = await storage.getActiveTradeExpoAds();
      res.json({ success: true, data: ads });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch active trade expo ads" });
    }
  });

  app.post("/api/trade-expo-ads/checkout", async (req, res) => {
    try {
      const { organizerName, organizerEmail, eventName, eventDescription, location, eventDate, countryCode, websiteUrl, packageType } = req.body;

      if (!organizerName || !organizerEmail || !eventName || !location || !eventDate || !countryCode || !websiteUrl || !packageType) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }

      const pkg = EXPO_PACKAGES[packageType as keyof typeof EXPO_PACKAGES];
      if (!pkg) {
        return res.status(400).json({ success: false, error: "Invalid package type" });
      }

      const ad = await storage.createTradeExpoAd({
        organizerName,
        organizerEmail,
        eventName,
        eventDescription: eventDescription || null,
        location,
        eventDate,
        countryCode,
        websiteUrl,
        packageType,
        priceAmount: pkg.price,
        durationDays: pkg.durationDays,
        status: "pending",
        startDate: null,
        endDate: null,
        stripeSessionId: null,
        stripePaymentIntentId: null,
      });

      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: organizerEmail,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.name} - ${eventName}`,
              description: `${pkg.description} on Ghani Africa homepage banner`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/trade-expo-advertise?success=true&adId=${ad.id}`,
        cancel_url: `${req.protocol}://${req.get('host')}/trade-expo-advertise?cancelled=true`,
        metadata: {
          type: 'trade_expo_ad',
          adId: ad.id.toString(),
          packageType,
        },
      });

      await storage.updateTradeExpoAd(ad.id, { stripeSessionId: session.id });

      res.json({ success: true, url: session.url });
    } catch (error) {
      console.error("Trade expo checkout error:", error);
      res.status(500).json({ success: false, error: "Failed to create checkout session" });
    }
  });

  // Admin endpoints for trade expo ads
  app.get("/api/admin/trade-expo-ads", isAdminSession, async (_req, res) => {
    try {
      const ads = await storage.getAllTradeExpoAds();
      res.json({ success: true, data: ads });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch trade expo ads" });
    }
  });

  app.patch("/api/admin/trade-expo-ads/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (status === 'active') {
        const ad = await storage.getTradeExpoAd(id);
        if (!ad) return res.status(404).json({ success: false, error: "Ad not found" });
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + ad.durationDays);
        await storage.updateTradeExpoAd(id, { status: 'active', startDate, endDate });
      } else {
        await storage.updateTradeExpoAd(id, { status });
      }

      const updated = await storage.getTradeExpoAd(id);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update trade expo ad" });
    }
  });

  app.delete("/api/admin/trade-expo-ads/:id", isAdminSession, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTradeExpoAd(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete trade expo ad" });
    }
  });

  // ============ CONTACT INQUIRIES ============
  app.post("/api/contact", apiLimiter, async (req: any, res) => {
    try {
      const schema = insertContactInquirySchema.extend({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email"),
        subject: z.string().min(3, "Subject must be at least 3 characters"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      });
      const parsed = schema.parse(req.body);

      const userId = req.user?.id || null;
      const inquiry = await storage.createContactInquiry({ ...parsed, userId });

      try {
        const adminEmails = await storage.getAdminEmailContacts();
        const toEmail = adminEmails.length > 0 ? adminEmails[0].email : null;

        if (toEmail) {
          await sendEmail({
            to: toEmail,
            subject: `New Contact Inquiry: ${parsed.subject}`,
            html: `${emailHeader()}
                <h2 style="color: #1a1a2e; margin-bottom: 16px;">New Contact Inquiry</h2>
                <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                  <p><strong>From:</strong> ${parsed.name}</p>
                  <p><strong>Email:</strong> ${parsed.email}</p>
                  ${(parsed as any).phone ? `<p><strong>Phone:</strong> ${(parsed as any).phone}</p>` : ''}
                  <p><strong>Subject:</strong> ${parsed.subject}</p>
                </div>
                <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
                  <p style="white-space: pre-wrap;">${parsed.message}</p>
                </div>
                <p style="margin-top: 16px; color: #666; font-size: 14px;">
                  Reply to this inquiry from the Admin Panel → Inquiries tab.
                </p>
            ${emailFooter()}`,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send inquiry email notification:", emailErr);
      }

      res.json({ success: true, data: inquiry });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, error: error.errors[0]?.message || "Validation error" });
      }
      console.error("Failed to create contact inquiry:", error);
      res.status(500).json({ success: false, error: "Failed to submit inquiry" });
    }
  });

  app.get("/api/my-inquiries", async (req: any, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, error: "Please log in to view your inquiries" });
      }
      const inquiries = await storage.getContactInquiriesByUser(req.user.id);
      res.json({ success: true, data: inquiries });
    } catch (error) {
      console.error("Failed to fetch user inquiries:", error);
      res.status(500).json({ success: false, error: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/admin/inquiries", isAdminSession, async (req: any, res) => {
    try {
      const { status } = req.query;
      const inquiries = await storage.getContactInquiries({ status: status as string });
      const newCount = await storage.getContactInquiryCount("new");
      res.json({ success: true, data: inquiries, newCount });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch inquiries" });
    }
  });

  app.get("/api/admin/inquiries/:id", isAdminSession, async (req: any, res) => {
    try {
      const inquiry = await storage.getContactInquiry(parseInt(req.params.id));
      if (!inquiry) return res.status(404).json({ success: false, error: "Inquiry not found" });
      res.json({ success: true, data: inquiry });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch inquiry" });
    }
  });

  app.patch("/api/admin/inquiries/:id/status", isAdminSession, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["new", "in_progress", "resolved", "closed"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }
      const inquiry = await storage.updateContactInquiryStatus(parseInt(req.params.id), status);
      if (!inquiry) return res.status(404).json({ success: false, error: "Inquiry not found" });
      res.json({ success: true, data: inquiry });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update inquiry status" });
    }
  });

  app.post("/api/admin/inquiries/:id/reply", isAdminSession, async (req: any, res) => {
    try {
      const { reply } = req.body;
      if (!reply || reply.trim().length < 5) {
        return res.status(400).json({ success: false, error: "Reply must be at least 5 characters" });
      }
      const adminId = (req.session as any).adminId;
      const inquiry = await storage.replyToContactInquiry(parseInt(req.params.id), reply.trim(), adminId);
      if (!inquiry) return res.status(404).json({ success: false, error: "Inquiry not found" });

      try {
        await sendEmail({
          to: inquiry.email,
          subject: `Re: ${inquiry.subject} - Ghani Africa Support`,
          html: `${emailHeader()}
              <h2 style="color: #1a1a2e; margin-bottom: 16px;">Response to Your Inquiry</h2>
              <p>Dear ${inquiry.name},</p>
              <p>Thank you for reaching out to Ghani Africa. Here is our response to your inquiry:</p>
              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px; padding: 16px; margin: 16px 0;">
                <p style="font-weight: 600; margin-bottom: 8px;">Your inquiry:</p>
                <p style="color: #666;">${inquiry.subject}</p>
              </div>
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px; padding: 16px; margin: 16px 0;">
                <p style="font-weight: 600; margin-bottom: 8px;">Our response:</p>
                <p style="white-space: pre-wrap;">${reply.trim()}</p>
              </div>
              <p style="margin-top: 16px;">If you have further questions, feel free to submit another inquiry or reply to this email.</p>
              <p>Best regards,<br/>Ghani Africa Support Team</p>
          ${emailFooter()}`,
        });
      } catch (emailErr) {
        console.error("Failed to send reply email:", emailErr);
      }

      res.json({ success: true, data: inquiry });
    } catch (error) {
      console.error("Failed to reply to inquiry:", error);
      res.status(500).json({ success: false, error: "Failed to send reply" });
    }
  });

  // ============ TRADE & TAXATION ============

  app.get("/api/trade/tax-rates", async (req: any, res) => {
    try {
      const taxRates = await storage.getCountryTaxRates();
      res.json({ success: true, data: taxRates });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch tax rates" });
    }
  });

  app.get("/api/trade/tax-rates/:countryCode", async (req: any, res) => {
    try {
      const taxRate = await storage.getCountryTaxRate(req.params.countryCode);
      if (!taxRate) return res.status(404).json({ success: false, error: "Country tax rate not found" });
      res.json({ success: true, data: taxRate });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch tax rate" });
    }
  });

  app.get("/api/trade/shipping-zones", async (req: any, res) => {
    try {
      const zones = await storage.getShippingZones();
      res.json({ success: true, data: zones });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch shipping zones" });
    }
  });

  app.get("/api/trade/estimate", async (req: any, res) => {
    try {
      const { origin, destination, subtotal, weight_kg, delivery_tier, origin_city, destination_city, delivery_method } = req.query;
      if (!origin || !destination || !subtotal) {
        return res.status(400).json({ success: false, error: "origin, destination, and subtotal are required" });
      }

      const originCode = (origin as string).toUpperCase();
      const destCode = (destination as string).toUpperCase();
      const orderSubtotal = parseFloat(subtotal as string);
      const packageWeight = parseFloat((weight_kg as string) || "1");
      const isDomestic = originCode === destCode;
      const selectedTier = (delivery_tier as string) || "standard";
      const originCityName = origin_city as string;
      const destCityName = destination_city as string;
      const deliveryMethod = (delivery_method as string) || "home";

      const [originTax, destTax, shippingZone] = await Promise.all([
        storage.getCountryTaxRate(originCode),
        storage.getCountryTaxRate(destCode),
        storage.getShippingZone(originCode, destCode),
      ]);

      let vatAmount = 0;
      let importDuty = 0;
      let exportDuty = 0;
      let customsFee = 0;
      let shippingCost = 0;
      let estimatedDaysMin = 1;
      let estimatedDaysMax = 3;
      let tierPremium = 0;
      let corridorFee = 0;
      let estimatedMinutes: { min: number; max: number } | null = null;
      let corridorInfo: any = null;

      if (isDomestic) {
        if (destTax) {
          vatAmount = orderSubtotal * (Number(destTax.vatRate) / 100);
        }
        if (shippingZone) {
          shippingCost = Number(shippingZone.baseShippingCost) + (packageWeight * Number(shippingZone.perKgRate));
          estimatedDaysMin = shippingZone.estimatedDaysMin || 1;
          estimatedDaysMax = shippingZone.estimatedDaysMax || 3;
        } else {
          shippingCost = 3.00 + (packageWeight * 0.40);
        }
      } else {
        if (destTax) {
          vatAmount = orderSubtotal * (Number(destTax.vatRate) / 100);
          importDuty = orderSubtotal * (Number(destTax.importDutyRate) / 100);
          customsFee = Number(destTax.customsProcessingFee);
        }
        if (originTax) {
          exportDuty = orderSubtotal * (Number(originTax.exportDutyRate) / 100);
        }
        if (shippingZone) {
          shippingCost = Number(shippingZone.baseShippingCost) + (packageWeight * Number(shippingZone.perKgRate));
          estimatedDaysMin = shippingZone.estimatedDaysMin || 3;
          estimatedDaysMax = shippingZone.estimatedDaysMax || 14;
        } else {
          shippingCost = 25.00 + (packageWeight * 3.00);
          estimatedDaysMin = 7;
          estimatedDaysMax = 21;
        }
      }

      if (deliveryMethod === "pickup") {
        shippingCost = Math.max(shippingCost * 0.5, 1.00);
      }

      if (destCityName && selectedTier !== "standard") {
        const tiers = await storage.getDeliveryTiers({ countryCode: destCode, city: destCityName });
        const matchedTier = tiers.find(t => t.tier === selectedTier);
        if (matchedTier) {
          tierPremium = Number(matchedTier.baseFee);
          estimatedMinutes = {
            min: matchedTier.minDeliveryMinutes,
            max: matchedTier.maxDeliveryMinutes,
          };
          if (selectedTier === "express") {
            estimatedDaysMin = 0;
            estimatedDaysMax = 1;
          } else if (selectedTier === "instant") {
            estimatedDaysMin = 0;
            estimatedDaysMax = 0;
          }
        }
      }

      if (originCityName && destCityName && originCityName.toLowerCase() !== destCityName.toLowerCase()) {
        const corridors = await storage.getExpressCorridors({
          originCity: originCityName,
          originCountryCode: originCode,
          destCity: destCityName,
          destCountryCode: destCode,
        });
        if (corridors.length > 0) {
          const corridor = corridors[0];
          corridorFee = Number(corridor.corridorFee);
          corridorInfo = {
            name: corridor.name,
            mode: corridor.mode,
            fee: corridorFee.toFixed(2),
            estimatedDays: `${corridor.minDays}-${corridor.maxDays} days`,
          };
          estimatedDaysMin = corridor.minDays;
          estimatedDaysMax = corridor.maxDays;
        }
      }

      const totalTaxAndDuties = vatAmount + importDuty + exportDuty + customsFee;
      const totalShipping = shippingCost + tierPremium + corridorFee;
      const grandTotal = orderSubtotal + totalTaxAndDuties + totalShipping;

      let afcftaInfo = null;
      if (!isDomestic) {
        const AFCFTA_RATES: Record<string, number> = {
          "KE": 0.05, "NG": 0.08, "GH": 0.05, "TZ": 0.05, "UG": 0.05,
          "RW": 0.04, "ET": 0.07, "ZA": 0.06, "EG": 0.08, "CM": 0.06,
          "SN": 0.05, "CI": 0.05, "CD": 0.07, "MZ": 0.05, "ZM": 0.05,
          "MW": 0.04, "BW": 0.04, "NA": 0.04, "ZW": 0.06, "MA": 0.07,
        };
        const standardRate = destTax ? Number(destTax.importDutyRate) / 100 : 0.15;
        const preferentialRate = AFCFTA_RATES[destCode] || 0.05;
        const standardAmount = orderSubtotal * standardRate;
        const preferentialAmount = orderSubtotal * preferentialRate;
        const savingsAmount = standardAmount - preferentialAmount;
        const savingsPercent = standardRate > 0 ? Math.round((1 - preferentialRate / standardRate) * 100) : 0;

        if (savingsAmount > 0) {
          afcftaInfo = {
            eligible: true,
            standardDutyRate: `${(standardRate * 100).toFixed(1)}%`,
            standardDutyAmount: standardAmount.toFixed(2),
            preferentialRate: `${(preferentialRate * 100).toFixed(1)}%`,
            preferentialAmount: preferentialAmount.toFixed(2),
            savings: savingsAmount.toFixed(2),
            savingsPercent,
          };
        }
      }

      res.json({
        success: true,
        data: {
          tradeType: isDomestic ? "domestic" : "cross_border",
          deliveryMethod,
          deliveryTier: selectedTier,
          origin: {
            countryCode: originCode,
            countryName: originTax?.countryName || originCode,
            currency: originTax?.currency || "USD",
          },
          destination: {
            countryCode: destCode,
            countryName: destTax?.countryName || destCode,
            currency: destTax?.currency || "USD",
          },
          subtotal: orderSubtotal.toFixed(2),
          breakdown: {
            vat: { rate: destTax ? `${destTax.vatRate}%` : "0%", amount: vatAmount.toFixed(2), label: `VAT (${destTax?.countryName || destCode})` },
            importDuty: isDomestic ? null : { rate: destTax ? `${destTax.importDutyRate}%` : "0%", amount: importDuty.toFixed(2), label: `Import Duty (${destTax?.countryName || destCode})` },
            exportDuty: isDomestic || exportDuty === 0 ? null : { rate: originTax ? `${originTax.exportDutyRate}%` : "0%", amount: exportDuty.toFixed(2), label: `Export Duty (${originTax?.countryName || originCode})` },
            customsProcessing: isDomestic ? null : { amount: customsFee.toFixed(2), label: "Customs Processing Fee" },
            shipping: {
              amount: shippingCost.toFixed(2),
              label: deliveryMethod === "pickup" ? "Pickup Point Shipping (50% off)" : (isDomestic ? "Domestic Shipping" : "International Shipping"),
              estimatedDays: estimatedMinutes
                ? (estimatedMinutes.min < 60 ? `${estimatedMinutes.min}-${estimatedMinutes.max} minutes` : `${Math.round(estimatedMinutes.min / 60)}-${Math.round(estimatedMinutes.max / 60)} hours`)
                : `${estimatedDaysMin}-${estimatedDaysMax} business days`,
              zoneName: shippingZone?.name || (isDomestic ? "Standard Domestic" : "Standard International"),
            },
            tierPremium: tierPremium > 0 ? {
              amount: tierPremium.toFixed(2),
              label: selectedTier === "instant" ? "Instant Delivery Premium" : "Express Delivery Premium",
              tier: selectedTier,
            } : null,
            expressCorridor: corridorInfo,
          },
          afcfta: afcftaInfo,
          totalTaxAndDuties: totalTaxAndDuties.toFixed(2),
          totalShipping: totalShipping.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
        },
      });
    } catch (error) {
      console.error("Trade estimate error:", error);
      res.status(500).json({ success: false, error: "Failed to calculate trade estimate" });
    }
  });

  app.post("/api/admin/trade/tax-rates", isAdminSession, async (req: any, res) => {
    try {
      const result = await storage.upsertCountryTaxRate(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update tax rate" });
    }
  });

  app.post("/api/admin/trade/shipping-zones", isAdminSession, async (req: any, res) => {
    try {
      const result = await storage.upsertShippingZone(req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update shipping zone" });
    }
  });

  // ============ AfCFTA TRADE COMPLIANCE ============
  const AFCFTA_PREFERENTIAL_RATES: Record<string, number> = {
    "KE": 0.05, "NG": 0.08, "GH": 0.05, "TZ": 0.05, "UG": 0.05,
    "RW": 0.04, "ET": 0.07, "ZA": 0.06, "EG": 0.08, "CM": 0.06,
    "SN": 0.05, "CI": 0.05, "CD": 0.07, "MZ": 0.05, "ZM": 0.05,
    "MW": 0.04, "BW": 0.04, "NA": 0.04, "ZW": 0.06, "MA": 0.07,
  };

  app.get("/api/afcfta/duty-calculator", async (req, res) => {
    try {
      const { origin, destination, subtotal, productId } = req.query;
      if (!origin || !destination || !subtotal) {
        return res.status(400).json({ success: false, error: "origin, destination, and subtotal are required" });
      }

      const originCode = (origin as string).toUpperCase();
      const destCode = (destination as string).toUpperCase();
      const orderSubtotal = parseFloat(subtotal as string);
      const isDomestic = originCode === destCode;

      if (isDomestic) {
        return res.json({ success: true, data: { applicable: false, reason: "AfCFTA applies to cross-border trade only" } });
      }

      const destTax = await storage.getCountryTaxRate(destCode);
      const standardImportDutyRate = destTax ? Number(destTax.importDutyRate) / 100 : 0.15;
      const afcftaRate = AFCFTA_PREFERENTIAL_RATES[destCode] || 0.05;
      const standardDuty = orderSubtotal * standardImportDutyRate;
      const afcftaDuty = orderSubtotal * afcftaRate;
      const savings = standardDuty - afcftaDuty;
      const savingsPercent = standardImportDutyRate > 0 ? Math.round((1 - afcftaRate / standardImportDutyRate) * 100) : 0;

      let isEligible = false;
      if (productId) {
        const product = await storage.getProduct(parseInt(productId as string));
        isEligible = product?.afcftaEligible || false;
      }

      res.json({
        success: true,
        data: {
          applicable: true,
          isEligible,
          origin: originCode,
          destination: destCode,
          subtotal: orderSubtotal.toFixed(2),
          standardDuty: {
            rate: `${(standardImportDutyRate * 100).toFixed(1)}%`,
            amount: standardDuty.toFixed(2),
          },
          afcftaDuty: {
            rate: `${(afcftaRate * 100).toFixed(1)}%`,
            amount: afcftaDuty.toFixed(2),
          },
          savings: {
            amount: savings.toFixed(2),
            percent: savingsPercent,
          },
        },
      });
    } catch (error) {
      console.error("AfCFTA duty calculator error:", error);
      res.status(500).json({ success: false, error: "Failed to calculate AfCFTA duties" });
    }
  });

  app.post("/api/afcfta/certificate-request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertAfcftaCertificateSchema.safeParse({
        ...req.body,
        sellerId: userId,
      });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: parsed.error.message });
      }
      const certData = parsed.data as any;
      const product = await storage.getProduct(certData.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: "Product not found" });
      }
      if (product.sellerId !== userId) {
        return res.status(403).json({ success: false, error: "Not authorized - you can only request certificates for your own products" });
      }
      const certificate = await storage.createAfcftaCertificate(certData);
      res.status(201).json({ success: true, data: certificate });
    } catch (error) {
      console.error("AfCFTA certificate request error:", error);
      res.status(500).json({ success: false, error: "Failed to submit certificate request" });
    }
  });

  app.get("/api/afcfta/certificates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId } = req.query;
      if (productId) {
        const certs = await storage.getAfcftaCertificatesByProduct(parseInt(productId as string));
        return res.json(certs);
      }
      const certs = await storage.getAfcftaCertificatesBySeller(userId);
      res.json(certs);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/afcfta/certificates/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const certs = await storage.getAfcftaCertificatesByProduct(productId);
      res.json(certs.filter(c => c.status === "approved"));
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch certificates" });
    }
  });

  app.patch("/api/admin/afcfta/certificates/:id", isAdminSession, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, adminNotes, certificateUrl } = req.body;
      const updateData: any = {};
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (certificateUrl !== undefined) updateData.certificateUrl = certificateUrl;
      if (status === "approved" || status === "rejected") {
        updateData.reviewedAt = new Date();
      }
      const cert = await storage.updateAfcftaCertificate(id, updateData);
      if (!cert) {
        return res.status(404).json({ success: false, error: "Certificate request not found" });
      }
      if (status === "approved") {
        const product = await storage.getProduct(cert.productId);
        if (product) {
          await storage.updateProduct(cert.productId, { afcftaEligible: true });
        }
      }
      res.json({ success: true, data: cert });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update certificate" });
    }
  });

  app.get("/api/admin/afcfta/certificates", isAdminSession, async (req: any, res) => {
    try {
      const { status } = req.query;
      const certs = await storage.getAllAfcftaCertificates(status as string);
      res.json(certs);
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch certificates" });
    }
  });

  // ============ STALE SHIPMENT MONITORING ============
  const STALE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // Check every 6 hours
  const STALE_THRESHOLD_HOURS = 24;
  const AUTO_DISPUTE_THRESHOLD_HOURS = 5 * 24; // 5 days

  async function checkStaleShipments() {
    try {
      console.log("[Stale Shipment Monitor] Running check...");

      const staleShipments = await storage.getStaleShipments(STALE_THRESHOLD_HOURS);
      let reminders = 0;
      let disputes = 0;

      for (const shipment of staleShipments) {
        const events = await storage.getTrackingEvents(shipment.id);
        const lastEvent = events[0];
        const hoursSinceUpdate = lastEvent?.timestamp
          ? (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60)
          : 999;

        const seller = await getUserById(shipment.sellerId);
        const buyer = await getUserById(shipment.buyerId);

        if (hoursSinceUpdate >= AUTO_DISPUTE_THRESHOLD_HOURS) {
          // Auto-create dispute
          const existingDispute = await storage.getDisputeByOrder(shipment.orderId);
          if (!existingDispute) {
            const autoRefundAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await storage.createDispute({
              orderId: shipment.orderId,
              initiatorId: 'system',
              respondentId: shipment.sellerId,
              reason: 'no_shipping_update',
              description: `Automatic dispute: No shipping update for ${Math.round(hoursSinceUpdate)} hours. Tracking: ${shipment.trackingNumber}`,
              status: 'open',
              autoRefundAt,
            });

            const escrow = await storage.getEscrow(shipment.orderId);
            if (escrow && escrow.status === 'held') {
              await storage.updateEscrow(shipment.orderId, { status: 'disputed' });
            }

            if (seller?.email) {
              await sendAutoDisputeNotification(seller.email, shipment.orderId, 'seller');
            }
            if (buyer?.email) {
              await sendAutoDisputeNotification(buyer.email, shipment.orderId, 'buyer');
            }

            disputes++;
            console.log(`[Stale Shipment Monitor] Auto-dispute created for order #${shipment.orderId}`);
          }
        } else {
          // Send reminder to seller, alert to buyer
          if (seller?.email && shipment.trackingNumber) {
            await sendStaleShipmentReminder(seller.email, shipment.orderId, shipment.trackingNumber, hoursSinceUpdate);
          }
          if (buyer?.email && shipment.trackingNumber && hoursSinceUpdate >= 48) {
            await sendBuyerStaleAlert(buyer.email, shipment.orderId, shipment.trackingNumber, hoursSinceUpdate);
          }
          reminders++;
        }
      }

      console.log(`[Stale Shipment Monitor] Complete: ${staleShipments.length} stale, ${reminders} reminders, ${disputes} auto-disputes`);
    } catch (error) {
      console.error("[Stale Shipment Monitor] Error:", error);
    }
  }

  // ============ AUTO-REFUND DISPUTE MONITOR ============
  async function checkDisputeAutoRefunds() {
    try {
      console.log("[Auto-Refund Monitor] Running check...");
      const expiredDisputes = await storage.getUnresolvedDisputesPastDeadline();
      let refunded = 0;

      for (const dispute of expiredDisputes) {
        const escrow = await storage.getEscrow(dispute.orderId);
        if (escrow && (escrow.status === 'held' || escrow.status === 'disputed')) {
          await storage.updateEscrow(dispute.orderId, { status: 'refunded' });

          const buyerWallet = await storage.getWallet(escrow.buyerId);
          if (buyerWallet) {
            await storage.updateWalletBalance(escrow.buyerId, Number(escrow.amount), 'credit');
            await storage.createWalletTransaction({
              walletId: buyerWallet.id,
              type: 'credit',
              amount: escrow.amount,
              currency: escrow.currency,
              description: `Auto-refund: Dispute #${dispute.id} not resolved within 7 days`,
              referenceType: 'escrow',
              referenceId: String(escrow.id),
              status: 'completed',
            });
          }

          await storage.resolveDispute(dispute.id, 'REFUND_BUYER', 'system', 'Automatic refund: Dispute was not resolved within the 7-day buyer protection window');

          const buyer = await getUserById(escrow.buyerId);
          if (buyer?.email) {
            await sendAutoDisputeNotification(buyer.email, dispute.orderId, 'buyer');
            sendDisputeAutoRefundEmail(buyer.email, dispute.orderId, dispute.id, String(escrow.amount), escrow.currency).catch(console.error);
          }

          refunded++;
          console.log(`[Auto-Refund Monitor] Auto-refunded order #${dispute.orderId}, dispute #${dispute.id}`);
        } else {
          await storage.resolveDispute(dispute.id, 'CANCELLED', 'system', 'Auto-closed: No escrow funds to refund');
        }
      }

      console.log(`[Auto-Refund Monitor] Complete: ${expiredDisputes.length} expired, ${refunded} refunded`);
    } catch (error) {
      console.error("[Auto-Refund Monitor] Error:", error);
    }
  }

  // ============ GROUP BUYS ============
  app.post("/api/group-buys", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { productId, targetQty, expiresInDays } = req.body;

      if (!productId || !targetQty) {
        return res.status(400).json({ error: "productId and targetQty are required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const wholesalePricing = Array.isArray(product.wholesalePricing) ? product.wholesalePricing as { minQty: number; maxQty: number | null; unitPrice: number }[] : [];
      if (wholesalePricing.length === 0) {
        return res.status(400).json({ error: "Product does not have wholesale pricing" });
      }

      const applicableTier = wholesalePricing.find(t => targetQty >= t.minQty && (t.maxQty === null || targetQty <= t.maxQty))
        || wholesalePricing[wholesalePricing.length - 1];
      const pricePerUnit = applicableTier ? String(applicableTier.unitPrice) : product.price;

      const days = Math.min(Math.max(expiresInDays || 7, 1), 30);
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const groupBuy = await storage.createGroupBuy({
        productId,
        organizerId: userId,
        title: req.body.title || `Group Buy: ${product.name}`,
        targetQty,
        pricePerUnit,
        originalPrice: product.price,
        currency: product.currency || "USD",
        status: "open",
        expiresAt,
      });

      res.status(201).json(groupBuy);
    } catch (error) {
      console.error("Error creating group buy:", error);
      res.status(500).json({ error: "Failed to create group buy" });
    }
  });

  app.get("/api/group-buys", async (req: any, res) => {
    try {
      const { productId } = req.query;
      if (productId) {
        const groupBuys = await storage.getGroupBuysByProduct(parseInt(productId as string));
        return res.json(groupBuys);
      }
      const groupBuys = await storage.getActiveGroupBuys();
      res.json(groupBuys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group buys" });
    }
  });

  app.get("/api/group-buys/my", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupBuys = await storage.getUserGroupBuys(userId);
      res.json(groupBuys);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user group buys" });
    }
  });

  app.get("/api/group-buys/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const groupBuy = await storage.getGroupBuy(id);
      if (!groupBuy) {
        return res.status(404).json({ error: "Group buy not found" });
      }
      res.json(groupBuy);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group buy" });
    }
  });

  app.post("/api/group-buys/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupBuyId = parseInt(req.params.id);
      const { quantity } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({ error: "Quantity must be at least 1" });
      }

      const groupBuy = await storage.getGroupBuy(groupBuyId);
      if (!groupBuy) {
        return res.status(404).json({ error: "Group buy not found" });
      }

      if (groupBuy.status !== "open") {
        return res.status(400).json({ error: "This group buy is no longer open" });
      }

      if (new Date(groupBuy.expiresAt) < new Date()) {
        await storage.updateGroupBuyStatus(groupBuyId, "closed");
        return res.status(400).json({ error: "This group buy has expired" });
      }

      const existingParticipant = groupBuy.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return res.status(400).json({ error: "You have already joined this group buy" });
      }

      const participant = await storage.joinGroupBuy({
        groupBuyId,
        userId,
        quantity,
      });

      const newCurrentQty = groupBuy.currentQty + quantity;
      await storage.updateGroupBuyCurrentQty(groupBuyId, newCurrentQty);

      if (newCurrentQty >= groupBuy.targetQty) {
        await storage.updateGroupBuyStatus(groupBuyId, "filled");
      }

      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining group buy:", error);
      res.status(500).json({ error: "Failed to join group buy" });
    }
  });

  app.post("/api/group-buys/:id/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const groupBuyId = parseInt(req.params.id);

      const groupBuy = await storage.getGroupBuy(groupBuyId);
      if (!groupBuy) {
        return res.status(404).json({ error: "Group buy not found" });
      }

      if (groupBuy.organizerId !== userId) {
        return res.status(403).json({ error: "Only the organizer can cancel a group buy" });
      }

      if (groupBuy.status !== "open") {
        return res.status(400).json({ error: "Can only cancel open group buys" });
      }

      const updated = await storage.updateGroupBuyStatus(groupBuyId, "cancelled");
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel group buy" });
    }
  });

  // ============ PICKUP POINTS ============
  app.get("/api/pickup-points", async (req: any, res) => {
    try {
      const { countryCode, city } = req.query;
      const points = await storage.getPickupPoints({
        countryCode: countryCode as string,
        city: city as string,
      });
      res.json(points);
    } catch (error) {
      console.error("Error fetching pickup points:", error);
      res.status(500).json({ error: "Failed to fetch pickup points" });
    }
  });

  app.get("/api/pickup-points/:id", async (req: any, res) => {
    try {
      const point = await storage.getPickupPoint(parseInt(req.params.id));
      if (!point) return res.status(404).json({ error: "Pickup point not found" });
      res.json(point);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pickup point" });
    }
  });

  // ============ DELIVERY TIERS ============
  app.get("/api/delivery-tiers", async (req: any, res) => {
    try {
      const { countryCode, city } = req.query;
      const tiers = await storage.getDeliveryTiers({
        countryCode: countryCode as string,
        city: city as string,
      });
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching delivery tiers:", error);
      res.status(500).json({ error: "Failed to fetch delivery tiers" });
    }
  });

  // ============ EXPRESS CORRIDORS ============
  app.get("/api/express-corridors", async (req: any, res) => {
    try {
      const { originCity, originCountryCode, destCity, destCountryCode } = req.query;
      const corridors = await storage.getExpressCorridors({
        originCity: originCity as string,
        originCountryCode: originCountryCode as string,
        destCity: destCity as string,
        destCountryCode: destCountryCode as string,
      });
      res.json(corridors);
    } catch (error) {
      console.error("Error fetching express corridors:", error);
      res.status(500).json({ error: "Failed to fetch express corridors" });
    }
  });

  const BROWSE_REMINDER_INTERVAL = 6 * 60 * 60 * 1000;
  const checkBrowseReminders = async () => {
    try {
      console.log("[Browse Reminder] Running check...");
      const { sendBrowseReminderEmails } = await import("./auth/emailService");
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const host = process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.replit.app` : "localhost:5000";
      const baseUrl = `${protocol}://${host}`;
      const result = await sendBrowseReminderEmails(baseUrl, storage);
      console.log(`[Browse Reminder] Complete: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`);
    } catch (error) {
      console.error("[Browse Reminder] Error:", error);
    }
  };

  // ============ MARKETING AUTOMATION ENGINE ============
  const MARKETING_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
  const runMarketingEngine = async () => {
    try {
      const { runDueAutomations, processScheduledPosts, seedDefaultAutomations } = await import("./marketingEngine");
      await seedDefaultAutomations();
      await runDueAutomations();
      await processScheduledPosts();
    } catch (error) {
      console.error("[Marketing Engine] Error:", error);
    }
  };

  // ============ REFERRAL SYSTEM ============
  app.get("/api/referrals/my-code", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const existing = await storage.getReferralsByUser(userId);
      const activeReferral = existing.find(r => r.status === "pending" && !r.referredUserId);

      if (activeReferral) {
        return res.json({ success: true, code: activeReferral.referralCode });
      }

      const { generateReferralCode } = await import("./marketingEngine");
      const code = await generateReferralCode(userId);
      await storage.createReferral({
        referrerId: userId,
        referralCode: code,
        status: "pending",
      });

      res.json({ success: true, code });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get referral code" });
    }
  });

  app.get("/api/referrals/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const stats = await storage.getUserReferralStats(userId);
      const referrals = await storage.getReferralsByUser(userId);
      res.json({ success: true, stats, referrals });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get referral stats" });
    }
  });

  app.post("/api/referrals/track", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { code } = req.body;
      if (!code || typeof code !== "string") return res.status(400).json({ error: "Referral code required" });

      const referral = await storage.getReferralByCode(code);
      if (!referral) return res.status(404).json({ error: "Invalid referral code" });

      if (referral.referrerId === userId) return res.status(400).json({ error: "Cannot use your own referral code" });

      if (!referral.referredUserId && !referral.referredEmail) {
        const user = await storage.getUser(userId);
        await storage.updateReferral(referral.id, {
          referredUserId: userId,
          referredEmail: user?.email || null,
          status: "signed_up",
          convertedAt: new Date(),
        });
      }

      res.json({ success: true, message: "Referral tracked" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to track referral" });
    }
  });

  // ============ SOCIAL MEDIA CONTENT GENERATOR ============
  app.get("/api/admin/marketing/social-content", isAdminSession, async (req: any, res) => {
    try {
      const { generateSocialContent } = await import("./marketingEngine");
      const type = (req.query.type as string) || "all";
      const content = await generateSocialContent(type);
      res.json({ success: true, data: content });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  app.get("/api/admin/marketing/whatsapp-templates", isAdminSession, async (req: any, res) => {
    try {
      const { generateWhatsAppBroadcastTemplates } = await import("./marketingEngine");
      const templates = await generateWhatsAppBroadcastTemplates();
      res.json({ success: true, data: templates });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate templates" });
    }
  });

  // Social Posts CRUD
  app.get("/api/admin/marketing/social-posts", isAdminSession, async (req: any, res) => {
    try {
      const { platform, status } = req.query;
      const posts = await storage.getSocialPosts({
        platform: platform as string,
        status: status as string,
        limit: 100,
      });
      res.json({ success: true, data: posts });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch social posts" });
    }
  });

  app.post("/api/admin/marketing/social-posts", isAdminSession, async (req: any, res) => {
    try {
      const post = await storage.createSocialPost(req.body);
      res.json({ success: true, data: post });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create social post" });
    }
  });

  app.post("/api/admin/marketing/social-posts/generate-and-save", isAdminSession, async (req: any, res) => {
    try {
      const { generateSocialContent } = await import("./marketingEngine");
      const type = req.body.type || "all";
      const content = await generateSocialContent(type);

      let saved = 0;
      for (const post of content) {
        await storage.createSocialPost({
          ...post,
          status: "draft",
          shareUrl: req.body.baseUrl || "",
        });
        saved++;
      }

      res.json({ success: true, saved, total: content.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate and save content" });
    }
  });

  app.delete("/api/admin/marketing/social-posts/:id", isAdminSession, async (req: any, res) => {
    try {
      await storage.deleteSocialPost(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete social post" });
    }
  });

  // Marketing Automations CRUD
  app.get("/api/admin/marketing/automations", isAdminSession, async (req: any, res) => {
    try {
      const automations = await storage.getMarketingAutomations();
      res.json({ success: true, data: automations });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to fetch automations" });
    }
  });

  app.post("/api/admin/marketing/automations", isAdminSession, async (req: any, res) => {
    try {
      const automation = await storage.createMarketingAutomation(req.body);
      res.json({ success: true, data: automation });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create automation" });
    }
  });

  app.patch("/api/admin/marketing/automations/:id", isAdminSession, async (req: any, res) => {
    try {
      const automation = await storage.updateMarketingAutomation(parseInt(req.params.id), req.body);
      res.json({ success: true, data: automation });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to update automation" });
    }
  });

  app.delete("/api/admin/marketing/automations/:id", isAdminSession, async (req: any, res) => {
    try {
      await storage.deleteMarketingAutomation(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete automation" });
    }
  });

  app.post("/api/admin/marketing/automations/:id/run-now", isAdminSession, async (req: any, res) => {
    try {
      const { runDueAutomations } = await import("./marketingEngine");
      const automation = await storage.getMarketingAutomation(parseInt(req.params.id));
      if (!automation) return res.status(404).json({ error: "Automation not found" });

      await storage.updateMarketingAutomation(automation.id, { nextRunAt: new Date() });
      await runDueAutomations();

      res.json({ success: true, message: `Automation "${automation.name}" executed` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to run automation" });
    }
  });

  app.post("/api/admin/marketing/send-digest", isAdminSession, async (req: any, res) => {
    try {
      const { runAutomatedEmailDigest } = await import("./marketingEngine");
      const result = await runAutomatedEmailDigest();
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to send digest" });
    }
  });

  // ============ MARKETING STATS ============
  app.get("/api/admin/marketing/stats", isAdminSession, async (req: any, res) => {
    try {
      const automations = await storage.getMarketingAutomations();
      const socialPosts = await storage.getSocialPosts({ limit: 1000 });
      const promoStats = await storage.getPromoEmailStats();

      const totalEmailsSent = automations.reduce((sum, a) => sum + (a.totalSent || 0), 0);
      const activeAutomations = automations.filter(a => a.isActive).length;
      const totalSocialPosts = socialPosts.length;
      const postedPosts = socialPosts.filter(p => p.status === "posted").length;

      res.json({
        success: true,
        data: {
          totalEmailsSent: totalEmailsSent + promoStats.total,
          emailsLast24h: promoStats.last24h,
          emailsLast7d: promoStats.last7d,
          activeAutomations,
          totalAutomations: automations.length,
          totalSocialPosts,
          postedPosts,
          scheduledPosts: socialPosts.filter(p => p.status === "scheduled").length,
          draftPosts: socialPosts.filter(p => p.status === "draft").length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get marketing stats" });
    }
  });

  // ============ BNPL (BUY NOW PAY LATER) ============
  app.get("/api/bnpl/plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const plans = await storage.getBnplPlansByBuyer(userId);
      res.json({ success: true, data: plans });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bnpl/plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const plan = await storage.getBnplPlan(parseInt(req.params.id));
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      if (plan.buyerId !== userId) return res.status(403).json({ error: "Access denied" });
      const payments = await storage.getBnplPaymentsByPlan(plan.id);
      res.json({ success: true, data: { plan, payments } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bnpl/apply", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { totalAmount, installments, orderId } = req.body;
      if (!totalAmount || !installments) return res.status(400).json({ error: "Missing required fields" });

      const interestRate = installments <= 3 ? 3.0 : installments <= 6 ? 4.5 : 6.0;
      const totalWithInterest = parseFloat(totalAmount) * (1 + interestRate / 100);
      const installmentAmount = (totalWithInterest / installments).toFixed(2);

      const plan = await storage.createBnplPlan({
        buyerId: userId,
        orderId: orderId || null,
        totalAmount: totalAmount.toString(),
        installments,
        installmentAmount,
        interestRate: interestRate.toString(),
        status: "active",
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      for (let i = 1; i <= installments; i++) {
        const dueDate = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000);
        await storage.createBnplPayment({
          planId: plan.id,
          installmentNumber: i,
          amount: installmentAmount,
          status: "pending",
          dueDate,
        });
      }

      res.json({ success: true, data: plan });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/bnpl/payments/:id/pay", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const allPlans = await storage.getBnplPlansByBuyer(userId);
      const payments = await Promise.all(allPlans.map(p => storage.getBnplPaymentsByPlan(p.id)));
      const allPayments = payments.flat();
      const targetPayment = allPayments.find(p => p.id === parseInt(req.params.id));
      if (!targetPayment) return res.status(403).json({ error: "Payment not found or access denied" });

      const payment = await storage.updateBnplPayment(parseInt(req.params.id), {
        status: "paid",
        paidAt: new Date(),
      });
      if (!payment) return res.status(404).json({ error: "Payment not found" });

      const plan = await storage.getBnplPlan(payment.planId);
      if (plan) {
        const newPaid = (plan.paidInstallments || 0) + 1;
        const nextDate = newPaid >= plan.installments ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await storage.updateBnplPlan(plan.id, {
          paidInstallments: newPaid,
          status: newPaid >= plan.installments ? "completed" : "active",
          nextPaymentDate: nextDate,
        });
      }

      res.json({ success: true, data: payment });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/bnpl/eligibility", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const profile = await storage.getUserProfile(userId);
      const activePlans = (await storage.getBnplPlansByBuyer(userId)).filter(p => p.status === "active");
      const isEligible = profile && activePlans.length < 3;
      const maxAmount = activePlans.length === 0 ? 500 : activePlans.length === 1 ? 300 : 100;
      res.json({ success: true, data: { eligible: isEligible, maxAmount, activePlans: activePlans.length, reason: !isEligible ? "Maximum active plans reached" : null } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ TRADE DOCUMENTS ============
  app.get("/api/trade-documents/order/:orderId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const order = await storage.getOrder(parseInt(req.params.orderId));
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.buyerId !== userId && order.sellerId !== userId) return res.status(403).json({ error: "Access denied" });
      const docs = await storage.getTradeDocumentsByOrder(parseInt(req.params.orderId));
      res.json({ success: true, data: docs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trade-documents/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { orderId, type } = req.body;
      if (!orderId || !type) return res.status(400).json({ error: "Order ID and document type required" });

      const order = await storage.getOrder(parseInt(orderId));
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.buyerId !== userId && order.sellerId !== userId) return res.status(403).json({ error: "Access denied" });

      const items = await storage.getOrderItems(parseInt(orderId));
      const docNumber = `${type.toUpperCase().replace(/_/g, '')}-${Date.now()}-${orderId}`;

      const feeMap: Record<string, string> = { commercial_invoice: "3.00", packing_list: "2.00", certificate_of_origin: "5.00", proforma_invoice: "2.50" };

      const doc = await storage.createTradeDocument({
        orderId: parseInt(orderId),
        type,
        documentNumber: docNumber,
        data: { order, items, generatedAt: new Date().toISOString(), type },
        generatedBy: userId,
        fee: feeMap[type] || "3.00",
        status: "generated",
      });

      res.json({ success: true, data: doc });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trade-documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const doc = await storage.getTradeDocument(parseInt(req.params.id));
      if (!doc) return res.status(404).json({ error: "Document not found" });
      res.json({ success: true, data: doc });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ STOREFRONTS ============
  app.get("/api/storefronts/:slug", async (req: any, res) => {
    try {
      const storefront = await storage.getStorefrontBySlug(req.params.slug);
      if (!storefront || !storefront.isPublished) return res.status(404).json({ error: "Storefront not found" });
      const profile = await storage.getUserProfile(storefront.sellerId);
      const products = await storage.getProducts();
      const sellerProducts = products.filter(p => p.sellerId === storefront.sellerId);
      res.json({ success: true, data: { storefront, profile, products: sellerProducts } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/my-storefront", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const storefront = await storage.getStorefrontBySeller(userId);
      res.json({ success: true, data: storefront || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/storefronts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { name, description, theme } = req.body;
      if (!name) return res.status(400).json({ error: "Store name required" });

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existing = await storage.getStorefrontBySlug(slug);
      if (existing) return res.status(400).json({ error: "Store name already taken" });

      const storefront = await storage.createStorefront({
        sellerId: userId,
        name,
        slug,
        description: description || "",
        theme: theme || { primaryColor: "#D4A574", secondaryColor: "#2D5016", layout: "grid" },
        isPublished: false,
      });

      res.json({ success: true, data: storefront });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/storefronts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const existing = await storage.getStorefrontBySeller(userId);
      if (!existing || existing.id !== parseInt(req.params.id)) return res.status(403).json({ error: "Access denied" });
      const storefront = await storage.updateStorefront(parseInt(req.params.id), req.body);
      if (!storefront) return res.status(404).json({ error: "Storefront not found" });
      res.json({ success: true, data: storefront });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ COMMODITY PRICES ============
  app.get("/api/commodities", async (_req: any, res) => {
    try {
      const prices = await storage.getLatestCommodityPrices();
      res.json({ success: true, data: prices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/price-alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const alerts = await storage.getPriceAlertsByUser(userId);
      res.json({ success: true, data: alerts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/price-alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { commodity, targetPrice, direction } = req.body;
      if (!commodity || !targetPrice || !direction) return res.status(400).json({ error: "Missing required fields" });

      const alert = await storage.createPriceAlert({ userId, commodity, targetPrice: targetPrice.toString(), direction });
      res.json({ success: true, data: alert });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/price-alerts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const userAlerts = await storage.getPriceAlertsByUser(userId);
      if (!userAlerts.find(a => a.id === parseInt(req.params.id))) return res.status(403).json({ error: "Access denied" });
      await storage.deletePriceAlert(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ VERIFIED BUYER PROGRAM ============
  app.get("/api/buyer-verification", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const verification = await storage.getBuyerVerification(userId);
      res.json({ success: true, data: verification || null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/buyer-verification/apply", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const existing = await storage.getBuyerVerification(userId);
      if (existing) return res.status(400).json({ error: "Verification already submitted" });

      const { businessName, businessRegNumber, taxId, verificationLevel } = req.body;
      const feeMap: Record<string, string> = { basic: "5.00", verified: "10.00", premium: "15.00" };

      const verification = await storage.createBuyerVerification({
        buyerId: userId,
        businessName,
        businessRegNumber,
        taxId,
        verificationLevel: verificationLevel || "basic",
        status: "pending",
        fee: feeMap[verificationLevel || "basic"] || "10.00",
      });

      res.json({ success: true, data: verification });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/buyer-verifications", isAdminSession, async (_req: any, res) => {
    try {
      const verifications = await storage.getBuyerVerifications();
      res.json({ success: true, data: verifications });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/buyer-verifications/:id", isAdminSession, async (req: any, res) => {
    try {
      const { status, reviewedBy } = req.body;
      const verification = await storage.updateBuyerVerification(parseInt(req.params.id), {
        status,
        reviewedBy: reviewedBy || "admin",
        reviewedAt: new Date(),
        paidAt: status === "approved" ? new Date() : undefined,
      });
      res.json({ success: true, data: verification });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ BUSINESS COMMUNITY FORUM ============
  app.get("/api/forum/categories", async (_req: any, res) => {
    try {
      const categories = await storage.getForumCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/forum/posts", async (req: any, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : undefined;
      const posts = await storage.getForumPosts(categoryId);
      res.json({ success: true, data: posts });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/forum/posts/:id", async (req: any, res) => {
    try {
      const post = await storage.getForumPost(parseInt(req.params.id));
      if (!post) return res.status(404).json({ error: "Post not found" });
      await storage.updateForumPost(post.id, { views: (post.views || 0) + 1 });
      const replies = await storage.getForumReplies(post.id);
      res.json({ success: true, data: { post, replies } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { categoryId, title, content } = req.body;
      if (!categoryId || !title || !content) return res.status(400).json({ error: "Missing required fields" });

      const post = await storage.createForumPost({ categoryId: parseInt(categoryId), authorId: userId, title, content });
      res.json({ success: true, data: post });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/forum/posts/:id/replies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { content } = req.body;
      if (!content) return res.status(400).json({ error: "Content required" });

      const reply = await storage.createForumReply({ postId: parseInt(req.params.id), authorId: userId, content });
      await storage.getForumPost(parseInt(req.params.id)).then(post => {
        if (post) storage.updateForumPost(post.id, { replyCount: (post.replyCount || 0) + 1 });
      });
      res.json({ success: true, data: reply });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ LOGISTICS PARTNERS ============
  app.get("/api/logistics-partners", async (req: any, res) => {
    try {
      const country = req.query.country as string;
      const partners = country ? await storage.getLogisticsPartnersByCountry(country) : await storage.getLogisticsPartners();
      res.json({ success: true, data: partners });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/logistics-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const { orderId, partnerId, weight } = req.body;
      if (!orderId || !partnerId) return res.status(400).json({ error: "Missing required fields" });

      const partners = await storage.getLogisticsPartners();
      const partner = partners.find(p => p.id === parseInt(partnerId));
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      const weightKg = parseFloat(weight || "1");
      const cost = parseFloat(partner.baseRate || "5") + weightKg * parseFloat(partner.ratePerKg || "2.5");
      const commission = cost * parseFloat(partner.commissionRate || "8") / 100;
      const trackingNumber = `GA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const booking = await storage.createLogisticsBooking({
        orderId: parseInt(orderId),
        partnerId: parseInt(partnerId),
        trackingNumber,
        weight: weightKg.toString(),
        cost: cost.toFixed(2),
        commissionEarned: commission.toFixed(2),
        status: "pending",
      });

      res.json({ success: true, data: booking });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ TRADE EVENTS ============
  app.get("/api/trade-events", async (_req: any, res) => {
    try {
      const events = await storage.getActiveTradeEvents();
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trade-events/all", async (_req: any, res) => {
    try {
      const events = await storage.getTradeEvents();
      res.json({ success: true, data: events });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trade-events/promote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { eventId, productId, promotionType } = req.body;
      if (!eventId || !productId) return res.status(400).json({ error: "Missing required fields" });

      const promo = await storage.createEventPromotion({
        eventId: parseInt(eventId),
        sellerId: userId,
        productId: parseInt(productId),
        promotionType: promotionType || "featured",
        fee: "25.00",
        status: "pending",
      });

      res.json({ success: true, data: promo });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trade-events/:id/promotions", async (req: any, res) => {
    try {
      const promos = await storage.getEventPromotions(parseInt(req.params.id));
      res.json({ success: true, data: promos });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ AGRICULTURAL EXCHANGE ============
  app.get("/api/agri-exchange", async (_req: any, res) => {
    try {
      const listings = await storage.getAgriListings();
      res.json({ success: true, data: listings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/agri-exchange/:id", async (req: any, res) => {
    try {
      const listing = await storage.getAgriListing(parseInt(req.params.id));
      if (!listing) return res.status(404).json({ error: "Listing not found" });
      const bids = await storage.getAgriBids(listing.id);
      res.json({ success: true, data: { listing, bids } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agri-exchange", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { cropType, variety, quantity, unit, pricePerUnit, qualityGrade, harvestDate, location, certifications, minOrderQty, isAuction, auctionEndDate } = req.body;
      if (!cropType || !quantity || !unit || !pricePerUnit) return res.status(400).json({ error: "Missing required fields" });

      const listing = await storage.createAgriListing({
        sellerId: userId,
        cropType,
        variety,
        quantity: quantity.toString(),
        unit,
        pricePerUnit: pricePerUnit.toString(),
        qualityGrade: qualityGrade || "B",
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        location,
        certifications,
        minOrderQty: (minOrderQty || 1).toString(),
        isAuction: isAuction || false,
        auctionEndDate: auctionEndDate ? new Date(auctionEndDate) : null,
        status: "active",
      });

      res.json({ success: true, data: listing });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agri-exchange/:id/bid", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const listing = await storage.getAgriListing(parseInt(req.params.id));
      if (!listing) return res.status(404).json({ error: "Listing not found" });

      const { amount, quantity, message } = req.body;
      if (!amount) return res.status(400).json({ error: "Bid amount required" });

      const bid = await storage.createAgriBid({
        listingId: listing.id,
        bidderId: userId,
        amount: amount.toString(),
        quantity: quantity?.toString(),
        message,
        status: "pending",
      });

      if (listing.isAuction && (!listing.currentBid || parseFloat(amount) > parseFloat(listing.currentBid))) {
        await storage.updateAgriListing(listing.id, {
          currentBid: amount.toString(),
          highestBidderId: userId,
        });
      }

      res.json({ success: true, data: bid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============ LIVE VIDEO SHOPPING ============
  app.get("/api/live-sessions", async (_req: any, res) => {
    try {
      const sessions = await storage.getLiveSessions();
      res.json({ success: true, data: sessions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/live-sessions/:id", async (req: any, res) => {
    try {
      const session = await storage.getLiveSession(parseInt(req.params.id));
      if (!session) return res.status(404).json({ error: "Session not found" });
      const sessionProducts = await storage.getLiveSessionProducts(session.id);
      res.json({ success: true, data: { session, products: sessionProducts } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/live-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { title, description, scheduledAt, fee } = req.body;
      if (!title) return res.status(400).json({ error: "Title required" });

      const session = await storage.createLiveSession({
        sellerId: userId,
        title,
        description,
        status: "scheduled",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        fee: fee || "10.00",
      });

      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/live-sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const existing = await storage.getLiveSession(parseInt(req.params.id));
      if (!existing) return res.status(404).json({ error: "Session not found" });
      if (existing.sellerId !== userId) return res.status(403).json({ error: "Access denied" });
      const session = await storage.updateLiveSession(parseInt(req.params.id), req.body);
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/live-sessions/:id/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.session?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const existing = await storage.getLiveSession(parseInt(req.params.id));
      if (!existing) return res.status(404).json({ error: "Session not found" });
      if (existing.sellerId !== userId) return res.status(403).json({ error: "Access denied" });
      const { productId, specialPrice, stock } = req.body;
      if (!productId) return res.status(400).json({ error: "Product ID required" });

      const product = await storage.createLiveSessionProduct({
        sessionId: parseInt(req.params.id),
        productId: parseInt(productId),
        specialPrice: specialPrice?.toString(),
        stock: stock || 0,
      });

      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Run initial checks after 30 seconds, then every 6 hours
  setTimeout(() => {
    checkStaleShipments();
    checkDisputeAutoRefunds();
    checkBrowseReminders();
    runMarketingEngine();
    setInterval(checkStaleShipments, STALE_CHECK_INTERVAL);
    setInterval(checkDisputeAutoRefunds, STALE_CHECK_INTERVAL);
    setInterval(checkBrowseReminders, BROWSE_REMINDER_INTERVAL);
    setInterval(runMarketingEngine, MARKETING_CHECK_INTERVAL);
  }, 30000);

  return httpServer;
}
