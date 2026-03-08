import { Router } from "express";
import { isAuthenticated } from "./replit_integrations/auth";
import { feeService } from "./feeService";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { subscriptionTiers, feeConfig, sellerSubscriptions } from "@shared/schema";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

const router = Router();

router.get("/api/subscription/tiers", async (req, res) => {
  try {
    const tiers = await feeService.getSubscriptionTiers();
    res.json(tiers);
  } catch (error: any) {
    console.error("Error fetching tiers:", error);
    res.status(500).json({ error: "Failed to fetch subscription tiers" });
  }
});

router.get("/api/subscription/my", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const subscription = await feeService.getOrCreateSellerSubscription(userId);
    res.json(subscription);
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.get("/api/subscription", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const subscription = await feeService.getOrCreateSellerSubscription(userId);
    const tier = await feeService.getTierByName(subscription.tier);
    res.json({ ...subscription, tier });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.get("/api/subscription/can-add-product", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const result = await feeService.canAddProduct(userId);
    res.json(result);
  } catch (error: any) {
    console.error("Error checking product limit:", error);
    res.status(500).json({ error: "Failed to check product limit" });
  }
});

router.post("/api/subscription/checkout", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const { tierName, interval = "monthly" } = req.body;

    const tier = await feeService.getTierByName(tierName);
    if (!tier) {
      return res.status(404).json({ error: "Subscription tier not found" });
    }

    const priceId = interval === "yearly" 
      ? tier.stripePriceIdYearly 
      : tier.stripePriceIdMonthly;

    if (!priceId) {
      return res.status(400).json({ error: "Price not configured for this tier" });
    }

    const stripe = await getUncachableStripeClient();
    const subscription = await feeService.getOrCreateSellerSubscription(userId);

    let customerId = subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId, sellerId: userId },
      });
      customerId = customer.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/dashboard/subscription?success=true`,
      cancel_url: `${baseUrl}/dashboard/subscription?cancelled=true`,
      metadata: { userId, tierName },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error("Error creating checkout:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/api/subscription/verify", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const subscription = await feeService.getOrCreateSellerSubscription(userId);
    const tier = await feeService.getTierByName(subscription.tier);

    const now = new Date();
    const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const daysRemaining = periodEnd ? Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0;
    const isExpired = daysRemaining !== null && daysRemaining <= 0;

    res.json({
      subscription: {
        ...subscription,
        tierName: subscription.tier,
        tierDetails: tier,
      },
      status: {
        isActive: subscription.status === 'active' || subscription.status === 'trialing',
        isPastDue: subscription.status === 'past_due',
        isCancelled: subscription.status === 'cancelled',
        isExpiringSoon,
        isExpired,
        daysRemaining,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
      },
      badges: {
        hasVerifiedBadge: subscription.hasVerifiedBadge || false,
        isHighlyRecommended: subscription.isHighlyRecommended || false,
      },
      benefits: {
        commissionRate: subscription.commissionRate || '8.00',
        featuredSlots: subscription.featuredSlots || 0,
        productLimit: subscription.productLimit || -1,
        tierName: tier?.displayName || 'Free',
      },
    });
  } catch (error: any) {
    console.error("Error verifying subscription:", error);
    res.status(500).json({ error: "Failed to verify subscription" });
  }
});

router.get("/api/seller/:sellerId/badges", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const subscription = await feeService.getSellerSubscription(sellerId);

    if (!subscription) {
      return res.json({
        hasVerifiedBadge: false,
        isHighlyRecommended: false,
        tier: 'free',
        memberSince: null,
      });
    }

    res.json({
      hasVerifiedBadge: subscription.hasVerifiedBadge || false,
      isHighlyRecommended: subscription.isHighlyRecommended || false,
      tier: subscription.tier,
      memberSince: subscription.createdAt,
    });
  } catch (error: any) {
    console.error("Error fetching seller badges:", error);
    res.status(500).json({ error: "Failed to fetch seller badges" });
  }
});

router.post("/api/subscription/portal", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const subscription = await feeService.getSellerSubscription(userId);

    if (!subscription?.stripeCustomerId) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/subscription`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.get("/api/fees/my", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const fees = await feeService.getSellerFees(userId, limit);
    res.json(fees);
  } catch (error: any) {
    console.error("Error fetching fees:", error);
    res.status(500).json({ error: "Failed to fetch fees" });
  }
});

router.get("/api/fees/calculate", isAuthenticated, async (req, res) => {
  try {
    const userId = (req.user as any).claims.sub;
    const amount = parseFloat(req.query.amount as string) || 0;
    const useEscrow = req.query.escrow !== "false";

    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const fees = await feeService.calculateOrderFees(userId, amount, useEscrow);
    res.json(fees);
  } catch (error: any) {
    console.error("Error calculating fees:", error);
    res.status(500).json({ error: "Failed to calculate fees" });
  }
});

router.get("/api/config/fees", async (req, res) => {
  try {
    const configs = await db
      .select()
      .from(feeConfig)
      .where(eq(feeConfig.isActive, true));
    res.json(configs);
  } catch (error: any) {
    console.error("Error fetching fee config:", error);
    res.status(500).json({ error: "Failed to fetch fee configuration" });
  }
});

router.get("/api/stripe/publishable-key", async (req, res) => {
  try {
    const key = await getStripePublishableKey();
    res.json({ publishableKey: key });
  } catch (error: any) {
    console.error("Error fetching Stripe key:", error);
    res.status(500).json({ error: "Payment system not configured" });
  }
});

export default router;
