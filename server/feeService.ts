import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  feeConfig,
  platformFees,
  products,
  sellerSubscriptions,
  subscriptionTiers,
  type FeeConfig,
  type SellerSubscription,
  type SubscriptionTier,
} from "@shared/schema";

export interface FeeCalculation {
  feeType: string;
  amount: string;
  rate: string;
  baseAmount: string;
  description: string;
}

export interface OrderFees {
  commission: FeeCalculation;
  escrowFee?: FeeCalculation;
  total: string;
}

const DEFAULT_FEE_RATES = {
  commission: 5.0, // 5% default commission
  escrow_fee: 2.0, // 2% escrow fee
  dropship_fee: 3.0, // 3% dropship fee
  fx_spread: 1.5, // 1.5% currency conversion spread
};

const SUBSCRIPTION_COMMISSION_RATES: Record<string, number> = {
  free: 8.0,
  basic: 5.0,
  professional: 3.0,
  enterprise: 1.5,
};

export class FeeService {
  async getFeeConfig(feeType: string): Promise<FeeConfig | null> {
    const [config] = await db
      .select()
      .from(feeConfig)
      .where(and(eq(feeConfig.feeType, feeType), eq(feeConfig.isActive, true)));
    return config || null;
  }

  async getSellerSubscription(sellerId: string): Promise<SellerSubscription | null> {
    const [sub] = await db
      .select()
      .from(sellerSubscriptions)
      .where(eq(sellerSubscriptions.sellerId, sellerId));
    return sub || null;
  }

  async getOrCreateSellerSubscription(sellerId: string): Promise<SellerSubscription> {
    let sub = await this.getSellerSubscription(sellerId);
    if (!sub) {
      const [newSub] = await db
        .insert(sellerSubscriptions)
        .values({
          sellerId,
          tier: "free",
          status: "active",
          productLimit: -1, // Unlimited products for all users
          featuredSlots: 0,
          commissionRate: "8.00",
          hasVerifiedBadge: false,
          isHighlyRecommended: false,
        })
        .returning();
      sub = newSub;
    }
    return sub;
  }

  async getCommissionRate(sellerId: string): Promise<number> {
    const subscription = await this.getOrCreateSellerSubscription(sellerId);
    return parseFloat(subscription.commissionRate || "5.00");
  }

  calculateFee(
    baseAmount: number,
    rate: number,
    flatFee: number = 0,
    minFee: number = 0,
    maxFee?: number
  ): number {
    let fee = (baseAmount * rate) / 100 + flatFee;
    fee = Math.max(fee, minFee);
    if (maxFee !== undefined && maxFee > 0) {
      fee = Math.min(fee, maxFee);
    }
    return Math.round(fee * 100) / 100;
  }

  async calculateOrderFees(
    sellerId: string,
    orderAmount: number,
    useEscrow: boolean = true
  ): Promise<OrderFees> {
    const commissionRate = await this.getCommissionRate(sellerId);
    const commissionAmount = this.calculateFee(orderAmount, commissionRate);

    const commission: FeeCalculation = {
      feeType: "commission",
      amount: commissionAmount.toFixed(2),
      rate: commissionRate.toFixed(2),
      baseAmount: orderAmount.toFixed(2),
      description: `Platform commission (${commissionRate}%)`,
    };

    let escrowFee: FeeCalculation | undefined;
    let total = commissionAmount;

    if (useEscrow) {
      const escrowConfig = await this.getFeeConfig("escrow_fee");
      const escrowRate = escrowConfig
        ? parseFloat(escrowConfig.rate)
        : DEFAULT_FEE_RATES.escrow_fee;
      const escrowAmount = this.calculateFee(orderAmount, escrowRate);

      escrowFee = {
        feeType: "escrow_fee",
        amount: escrowAmount.toFixed(2),
        rate: escrowRate.toFixed(2),
        baseAmount: orderAmount.toFixed(2),
        description: `Escrow protection fee (${escrowRate}%)`,
      };
      total += escrowAmount;
    }

    return {
      commission,
      escrowFee,
      total: total.toFixed(2),
    };
  }

  async calculateDropshipFee(
    resellerId: string,
    wholesaleAmount: number
  ): Promise<FeeCalculation> {
    const config = await this.getFeeConfig("dropship_fee");
    const rate = config ? parseFloat(config.rate) : DEFAULT_FEE_RATES.dropship_fee;
    const amount = this.calculateFee(wholesaleAmount, rate);

    return {
      feeType: "dropship_fee",
      amount: amount.toFixed(2),
      rate: rate.toFixed(2),
      baseAmount: wholesaleAmount.toFixed(2),
      description: `Dropship processing fee (${rate}%)`,
    };
  }

  async calculateFxSpread(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<FeeCalculation> {
    if (fromCurrency === toCurrency) {
      return {
        feeType: "fx_spread",
        amount: "0.00",
        rate: "0.00",
        baseAmount: amount.toFixed(2),
        description: "No currency conversion needed",
      };
    }

    const config = await this.getFeeConfig("fx_spread");
    const rate = config ? parseFloat(config.rate) : DEFAULT_FEE_RATES.fx_spread;
    const feeAmount = this.calculateFee(amount, rate);

    return {
      feeType: "fx_spread",
      amount: feeAmount.toFixed(2),
      rate: rate.toFixed(2),
      baseAmount: amount.toFixed(2),
      description: `Currency conversion spread (${rate}%)`,
    };
  }

  async recordPlatformFee(data: {
    orderId?: number;
    escrowId?: number;
    dropshipFulfillmentId?: number;
    sellerId: string;
    buyerId?: string;
    feeType: string;
    amount: string;
    currency?: string;
    rate?: string;
    baseAmount?: string;
    description?: string;
  }) {
    const [fee] = await db
      .insert(platformFees)
      .values({
        orderId: data.orderId,
        escrowId: data.escrowId,
        dropshipFulfillmentId: data.dropshipFulfillmentId,
        sellerId: data.sellerId,
        buyerId: data.buyerId,
        feeType: data.feeType,
        amount: data.amount,
        currency: data.currency || "USD",
        rate: data.rate,
        baseAmount: data.baseAmount,
        description: data.description,
        status: "pending",
      })
      .returning();
    return fee;
  }

  async collectFee(feeId: number) {
    const [fee] = await db
      .update(platformFees)
      .set({
        status: "collected",
        collectedAt: new Date(),
      })
      .where(eq(platformFees.id, feeId))
      .returning();
    return fee;
  }

  async getSellerFees(sellerId: string, limit: number = 50) {
    return db
      .select()
      .from(platformFees)
      .where(eq(platformFees.sellerId, sellerId))
      .orderBy(desc(platformFees.createdAt))
      .limit(limit);
  }

  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.isActive, true))
      .orderBy(subscriptionTiers.sortOrder);
  }

  async upgradeSubscription(
    sellerId: string,
    tierName: string,
    stripeSubscriptionId?: string,
    stripePriceId?: string,
    stripeCustomerId?: string
  ) {
    const tier = await this.getTierByName(tierName);
    if (!tier) {
      throw new Error(`Subscription tier '${tierName}' not found`);
    }

    const subscription = await this.getOrCreateSellerSubscription(sellerId);

    const [updated] = await db
      .update(sellerSubscriptions)
      .set({
        tier: tierName,
        stripeSubscriptionId,
        stripePriceId,
        stripeCustomerId,
        productLimit: tier.productLimit,
        featuredSlots: tier.featuredSlots,
        commissionRate: tier.commissionRate,
        hasVerifiedBadge: tier.hasVerifiedBadge,
        isHighlyRecommended: tier.isHighlyRecommended,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(sellerSubscriptions.id, subscription.id))
      .returning();

    return updated;
  }

  async getTierByName(name: string): Promise<SubscriptionTier | null> {
    const [tier] = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.name, name));
    return tier || null;
  }

  async canAddProduct(sellerId: string): Promise<{ allowed: boolean; reason?: string; currentCount?: number; limit?: number }> {
    // All users can add unlimited products - store creation is free for everyone
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.sellerId, sellerId), eq(products.isActive, true)));
    const currentCount = Number(result?.count || 0);

    return { allowed: true, currentCount, limit: -1 }; // -1 means unlimited
  }
}

export const feeService = new FeeService();
