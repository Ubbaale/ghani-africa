import { getUncachableStripeClient } from "./stripeClient";
import { db } from "./db";
import { subscriptionTiers } from "@shared/schema";
import { eq } from "drizzle-orm";

interface TierConfig {
  name: string;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

const SUBSCRIPTION_TIERS: TierConfig[] = [
  { name: "basic", displayName: "Verified Seller", monthlyPrice: 1900, yearlyPrice: 19000 },
  { name: "professional", displayName: "Highly Recommended", monthlyPrice: 4900, yearlyPrice: 49000 },
  { name: "enterprise", displayName: "Enterprise", monthlyPrice: 14900, yearlyPrice: 149000 },
];

const ADVERTISING_PRODUCTS = [
  {
    name: "Basic Ad Package",
    description: "Product image only, standard placement - 7 days",
    price: 2900,
    metadata: { type: "advertising", package: "basic", duration_days: "7" },
  },
  {
    name: "Premium Ad Package",
    description: "Video ads up to 60 seconds, priority placement - 14 days",
    price: 7900,
    metadata: { type: "advertising", package: "premium", duration_days: "14" },
  },
  {
    name: "Featured Ad Package",
    description: "Video ads with auto-play, homepage spotlight - 30 days",
    price: 14900,
    metadata: { type: "advertising", package: "featured", duration_days: "30" },
  },
];

export async function setupStripeProducts() {
  console.log("Setting up Stripe products and prices...");

  try {
    const stripe = await getUncachableStripeClient();

    const existingProducts = await stripe.products.list({ limit: 100, active: true });

    for (const tier of SUBSCRIPTION_TIERS) {
      const existingProduct = existingProducts.data.find(
        (p) => p.metadata?.tier_name === tier.name && p.metadata?.type === "subscription"
      );

      let productId: string;

      if (existingProduct) {
        console.log(`  Subscription product for '${tier.name}' already exists: ${existingProduct.id}`);
        productId = existingProduct.id;
      } else {
        const product = await stripe.products.create({
          name: `Ghani Africa - ${tier.displayName}`,
          description: `${tier.displayName} subscription plan for Ghani Africa marketplace`,
          metadata: { type: "subscription", tier_name: tier.name },
        });
        productId = product.id;
        console.log(`  Created subscription product for '${tier.name}': ${product.id}`);
      }

      const existingPrices = await stripe.prices.list({ product: productId, active: true, limit: 10 });

      let monthlyPriceId = existingPrices.data.find(
        (p) => p.recurring?.interval === "month"
      )?.id;

      let yearlyPriceId = existingPrices.data.find(
        (p) => p.recurring?.interval === "year"
      )?.id;

      if (!monthlyPriceId) {
        const monthlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: tier.monthlyPrice,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: { tier_name: tier.name, interval: "monthly" },
        });
        monthlyPriceId = monthlyPrice.id;
        console.log(`  Created monthly price for '${tier.name}': ${monthlyPrice.id}`);
      } else {
        console.log(`  Monthly price for '${tier.name}' already exists: ${monthlyPriceId}`);
      }

      if (!yearlyPriceId) {
        const yearlyPrice = await stripe.prices.create({
          product: productId,
          unit_amount: tier.yearlyPrice,
          currency: "usd",
          recurring: { interval: "year" },
          metadata: { tier_name: tier.name, interval: "yearly" },
        });
        yearlyPriceId = yearlyPrice.id;
        console.log(`  Created yearly price for '${tier.name}': ${yearlyPrice.id}`);
      } else {
        console.log(`  Yearly price for '${tier.name}' already exists: ${yearlyPriceId}`);
      }

      await db
        .update(subscriptionTiers)
        .set({
          stripePriceIdMonthly: monthlyPriceId,
          stripePriceIdYearly: yearlyPriceId,
        })
        .where(eq(subscriptionTiers.name, tier.name));
      console.log(`  Updated database tier '${tier.name}' with Stripe price IDs`);
    }

    for (const adProduct of ADVERTISING_PRODUCTS) {
      const existingAd = existingProducts.data.find(
        (p) =>
          p.metadata?.type === "advertising" &&
          p.metadata?.package === adProduct.metadata.package
      );

      if (existingAd) {
        console.log(`  Ad product '${adProduct.name}' already exists: ${existingAd.id}`);
        const existingAdPrices = await stripe.prices.list({ product: existingAd.id, active: true, limit: 5 });
        if (existingAdPrices.data.length > 0) {
          console.log(`  Ad price already exists: ${existingAdPrices.data[0].id}`);
          continue;
        }
      }

      let adProductId: string;
      if (existingAd) {
        adProductId = existingAd.id;
      } else {
        const product = await stripe.products.create({
          name: adProduct.name,
          description: adProduct.description,
          metadata: adProduct.metadata,
        });
        adProductId = product.id;
        console.log(`  Created ad product '${adProduct.name}': ${product.id}`);
      }

      const price = await stripe.prices.create({
        product: adProductId,
        unit_amount: adProduct.price,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { ...adProduct.metadata },
      });
      console.log(`  Created ad price for '${adProduct.name}': ${price.id}`);
    }

    console.log("Stripe products and prices setup complete!");
    return true;
  } catch (error: any) {
    console.error("Error setting up Stripe products:", error.message);
    return false;
  }
}
