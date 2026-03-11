import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { feeService } from './feeService';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { sellerSubscriptions, subscriptionTiers, advertisements, userProfiles, tradeExpoAds, storefronts, liveSessions, tradeDocuments, eventPromotions } from '@shared/schema';
import { users } from '@shared/models/auth';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const stripe = await getUncachableStripeClient();
      const event = (stripe as any).webhooks.constructEvent(payload, signature, await getWebhookSecret());

      console.log(`Processing Stripe event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await WebhookHandlers.handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.updated':
          await WebhookHandlers.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await WebhookHandlers.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await WebhookHandlers.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await WebhookHandlers.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          break;
      }
    } catch (handlerError: any) {
      console.error(`Error in custom webhook handler:`, handlerError.message);
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const userId = session.metadata?.userId;
    const tierName = session.metadata?.tierName;
    const packageType = session.metadata?.packageType;

    console.log(`Checkout completed: userId=${userId}, tierName=${tierName}, packageType=${packageType}, mode=${session.mode}`);

    if (session.mode === 'subscription' && userId && tierName) {
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

      if (subscriptionId) {
        const stripe = await getUncachableStripeClient();
        const stripeSub: any = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = stripeSub.items?.data?.[0]?.price?.id;

        await feeService.upgradeSubscription(
          userId,
          tierName,
          subscriptionId,
          priceId,
          customerId
        );

        const periodStart = stripeSub.current_period_start || stripeSub.currentPeriodStart;
        const periodEnd = stripeSub.current_period_end || stripeSub.currentPeriodEnd;

        if (periodStart && periodEnd) {
          await db.update(sellerSubscriptions)
            .set({
              currentPeriodStart: new Date(periodStart * 1000),
              currentPeriodEnd: new Date(periodEnd * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
              status: 'active',
            })
            .where(eq(sellerSubscriptions.sellerId, userId));
        }

        console.log(`Subscription activated: ${userId} -> ${tierName}`);

        try {
          await WebhookHandlers.sendSubscriptionEmail(userId, 'activated', tierName);
        } catch (emailError: any) {
          console.error('Failed to send activation email:', emailError.message);
        }
      }
    }

    if (session.mode === 'payment' && userId && packageType) {
      const productId = session.metadata?.productId;
      if (productId) {
        const durationDays = packageType === 'featured' ? 30 : packageType === 'premium' ? 14 : 7;
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await db.update(advertisements)
          .set({
            status: 'active',
            startDate,
            endDate,
            stripeSubscriptionId: session.id,
          })
          .where(and(
            eq(advertisements.sellerId, userId),
            eq(advertisements.productId, parseInt(productId)),
            eq(advertisements.status, 'pending')
          ));

        console.log(`Ad activated: product ${productId} for ${durationDays} days`);
      }
    }

    // Storefront payment
    if (session.mode === 'payment' && session.metadata?.type === 'storefront') {
      const storefrontId = session.metadata?.storefrontId;
      if (storefrontId) {
        await db.update(storefronts)
          .set({
            paymentStatus: 'paid',
            stripePaymentId: session.payment_intent as string || session.id,
          })
          .where(eq(storefronts.id, parseInt(storefrontId)));
        console.log(`Storefront payment completed: storefront ${storefrontId}`);
      }
    }

    // Live session payment
    if (session.mode === 'payment' && session.metadata?.type === 'live_session') {
      const sessionId = session.metadata?.sessionId;
      if (sessionId) {
        await db.update(liveSessions)
          .set({
            paymentStatus: 'paid',
            stripePaymentId: session.payment_intent as string || session.id,
          })
          .where(eq(liveSessions.id, parseInt(sessionId)));
        console.log(`Live session payment completed: session ${sessionId}`);
      }
    }

    // Trade document payment
    if (session.mode === 'payment' && session.metadata?.type === 'trade_document') {
      const documentId = session.metadata?.documentId;
      if (documentId) {
        await db.update(tradeDocuments)
          .set({
            status: 'generated',
            paymentStatus: 'paid',
            stripePaymentId: session.payment_intent as string || session.id,
          })
          .where(eq(tradeDocuments.id, parseInt(documentId)));
        console.log(`Trade document payment completed: document ${documentId}`);
      }
    }

    // Event promotion payment
    if (session.mode === 'payment' && session.metadata?.type === 'event_promotion') {
      const promotionId = session.metadata?.promotionId;
      if (promotionId) {
        await db.update(eventPromotions)
          .set({
            status: 'active',
            paymentStatus: 'paid',
            stripePaymentId: session.payment_intent as string || session.id,
          })
          .where(eq(eventPromotions.id, parseInt(promotionId)));
        console.log(`Event promotion payment completed: promotion ${promotionId}`);
      }
    }

    // Trade Expo Ad payment
    if (session.mode === 'payment' && session.metadata?.type === 'trade_expo_ad') {
      const adId = session.metadata?.adId;
      if (adId) {
        const ad = await db.select().from(tradeExpoAds).where(eq(tradeExpoAds.id, parseInt(adId)));
        if (ad.length > 0) {
          const expoAd = ad[0];
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + expoAd.durationDays * 24 * 60 * 60 * 1000);

          await db.update(tradeExpoAds)
            .set({
              status: 'active',
              startDate,
              endDate,
              stripePaymentIntentId: session.payment_intent as string || null,
            })
            .where(eq(tradeExpoAds.id, parseInt(adId)));

          console.log(`Trade expo ad activated: ${expoAd.eventName} for ${expoAd.durationDays} days`);
        }
      }
    }
  }

  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

    const [sellerSub] = await db.select()
      .from(sellerSubscriptions)
      .where(eq(sellerSubscriptions.stripeSubscriptionId, subscription.id));

    if (!sellerSub) {
      if (customerId) {
        const [byCustomer] = await db.select()
          .from(sellerSubscriptions)
          .where(eq(sellerSubscriptions.stripeCustomerId, customerId));
        if (byCustomer) {
          await WebhookHandlers.updateSubscriptionFromStripe(byCustomer.sellerId, subscription);
          return;
        }
      }
      console.log(`No seller subscription found for Stripe subscription ${subscription.id}`);
      return;
    }

    await WebhookHandlers.updateSubscriptionFromStripe(sellerSub.sellerId, subscription);
  }

  static async updateSubscriptionFromStripe(sellerId: string, subscription: any): Promise<void> {
    const status = subscription.status === 'active' ? 'active'
      : subscription.status === 'past_due' ? 'past_due'
      : subscription.status === 'canceled' ? 'cancelled'
      : subscription.status === 'trialing' ? 'trialing'
      : 'cancelled';

    const priceId = subscription.items?.data?.[0]?.price?.id;
    let tierName = 'free';

    if (priceId) {
      const tiers = await db.select().from(subscriptionTiers);
      const matchedTier = tiers.find(t =>
        t.stripePriceIdMonthly === priceId || t.stripePriceIdYearly === priceId
      );
      if (matchedTier) {
        tierName = matchedTier.name;
      }
    }

    const periodStart = subscription.current_period_start || subscription.currentPeriodStart;
    const periodEnd = subscription.current_period_end || subscription.currentPeriodEnd;

    if (status === 'active' || status === 'trialing') {
      const tier = await feeService.getTierByName(tierName);
      if (tier) {
        await db.update(sellerSubscriptions)
          .set({
            tier: tierName,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status,
            productLimit: tier.productLimit,
            featuredSlots: tier.featuredSlots,
            commissionRate: tier.commissionRate,
            hasVerifiedBadge: tier.hasVerifiedBadge,
            isHighlyRecommended: tier.isHighlyRecommended,
            currentPeriodStart: periodStart ? new Date(periodStart * 1000) : undefined,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
            updatedAt: new Date(),
          })
          .where(eq(sellerSubscriptions.sellerId, sellerId));
      }
    } else {
      await db.update(sellerSubscriptions)
        .set({
          status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
          updatedAt: new Date(),
        })
        .where(eq(sellerSubscriptions.sellerId, sellerId));
    }

    console.log(`Subscription updated for ${sellerId}: status=${status}, tier=${tierName}`);
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const [sellerSub] = await db.select()
      .from(sellerSubscriptions)
      .where(eq(sellerSubscriptions.stripeSubscriptionId, subscription.id));

    if (!sellerSub) {
      console.log(`No seller subscription found for deleted Stripe subscription ${subscription.id}`);
      return;
    }

    await db.update(sellerSubscriptions)
      .set({
        tier: 'free',
        status: 'cancelled',
        stripeSubscriptionId: null,
        stripePriceId: null,
        productLimit: -1,
        featuredSlots: 0,
        commissionRate: '8.00',
        hasVerifiedBadge: false,
        isHighlyRecommended: false,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(sellerSubscriptions.sellerId, sellerSub.sellerId));

    console.log(`Subscription cancelled for ${sellerSub.sellerId}, downgraded to free`);

    try {
      await WebhookHandlers.sendSubscriptionEmail(sellerSub.sellerId, 'cancelled', 'free');
    } catch (emailError: any) {
      console.error('Failed to send cancellation email:', emailError.message);
    }
  }

  static async handleInvoicePaymentSucceeded(invoice: any): Promise<void> {
    if (invoice.billing_reason === 'subscription_cycle') {
      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

      if (subscriptionId) {
        const [sellerSub] = await db.select()
          .from(sellerSubscriptions)
          .where(eq(sellerSubscriptions.stripeSubscriptionId, subscriptionId));

        if (sellerSub) {
          console.log(`Renewal payment succeeded for ${sellerSub.sellerId}`);
          try {
            await WebhookHandlers.sendSubscriptionEmail(sellerSub.sellerId, 'renewed', sellerSub.tier);
          } catch (emailError: any) {
            console.error('Failed to send renewal email:', emailError.message);
          }
        }
      }
    }
  }

  static async handleInvoicePaymentFailed(invoice: any): Promise<void> {
    const subscriptionId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;

    if (subscriptionId) {
      const [sellerSub] = await db.select()
        .from(sellerSubscriptions)
        .where(eq(sellerSubscriptions.stripeSubscriptionId, subscriptionId));

      if (sellerSub) {
        await db.update(sellerSubscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(sellerSubscriptions.sellerId, sellerSub.sellerId));

        console.log(`Payment failed for ${sellerSub.sellerId}, status set to past_due`);

        try {
          await WebhookHandlers.sendSubscriptionEmail(sellerSub.sellerId, 'payment_failed', sellerSub.tier);
        } catch (emailError: any) {
          console.error('Failed to send payment failure email:', emailError.message);
        }
      }
    }
  }

  static async sendSubscriptionEmail(sellerId: string, eventType: string, tierName: string): Promise<void> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, sellerId));

    if (!user?.email) return;

    const [profile] = await db.select()
      .from(userProfiles)
      .where(eq(userProfiles.id, sellerId));

    const { sendSubscriptionEventEmail } = await import('./auth/emailService');
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const tier = await feeService.getTierByName(tierName);
    const displayName = tier?.displayName || tierName;

    await sendSubscriptionEventEmail(
      user.email,
      profile?.businessName || user.firstName || 'Seller',
      eventType,
      displayName,
      tier ? {
        commissionRate: tier.commissionRate,
        featuredSlots: tier.featuredSlots?.toString() || '0',
        hasVerifiedBadge: tier.hasVerifiedBadge || false,
        isHighlyRecommended: tier.isHighlyRecommended || false,
      } : undefined,
      baseUrl
    );
  }
}

async function getWebhookSecret(): Promise<string> {
  try {
    const sync = await getStripeSync();
    if (sync.webhookSecret) return sync.webhookSecret;
  } catch (e) {}
  try {
    const stripe = await getUncachableStripeClient();
    const webhookEndpoints = await stripe.webhookEndpoints.list({ limit: 10 });
    return (webhookEndpoints as any).data?.[0]?.secret || '';
  } catch (e) {}
  return '';
}
