import { db } from "./db";
import { feeConfig, subscriptionTiers } from "@shared/schema";

export async function seedFeeConfiguration() {
  console.log("Seeding fee configuration...");

  const feeConfigs = [
    {
      feeType: "commission",
      rate: "5.00",
      flatFee: "0.00",
      minFee: "0.50",
      maxFee: null,
      description: "Platform commission on each sale (varies by subscription tier)",
    },
    {
      feeType: "escrow_fee",
      rate: "2.00",
      flatFee: "0.00",
      minFee: "0.25",
      maxFee: "50.00",
      description: "Escrow protection fee for secure transactions",
    },
    {
      feeType: "dropship_fee",
      rate: "3.00",
      flatFee: "0.00",
      minFee: "0.50",
      maxFee: null,
      description: "Dropship fulfillment processing fee",
    },
    {
      feeType: "fx_spread",
      rate: "1.50",
      flatFee: "0.00",
      minFee: "0.10",
      maxFee: null,
      description: "Currency conversion spread for cross-border payments",
    },
  ];

  for (const config of feeConfigs) {
    try {
      await db
        .insert(feeConfig)
        .values(config)
        .onConflictDoUpdate({
          target: feeConfig.feeType,
          set: {
            rate: config.rate,
            flatFee: config.flatFee,
            minFee: config.minFee,
            maxFee: config.maxFee,
            description: config.description,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      console.log(`  Fee config '${config.feeType}' created/updated`);
    } catch (error) {
      console.error(`  Error creating fee config '${config.feeType}':`, error);
    }
  }

  console.log("Seeding subscription tiers...");

  const tiers = [
    {
      name: "free",
      displayName: "Free",
      monthlyPrice: "0.00",
      yearlyPrice: "0.00",
      productLimit: -1, // Unlimited products for all
      featuredSlots: 0,
      commissionRate: "8.00",
      hasVerifiedBadge: false,
      isHighlyRecommended: false,
      features: [
        "Unlimited product listings",
        "Free store creation",
        "Basic store page",
        "Standard support",
        "8% commission per sale",
      ],
      sortOrder: 0,
    },
    {
      name: "basic",
      displayName: "Verified Seller",
      monthlyPrice: "19.00",
      yearlyPrice: "190.00",
      productLimit: -1, // Unlimited products for all
      featuredSlots: 2,
      commissionRate: "5.00",
      hasVerifiedBadge: true,
      isHighlyRecommended: false,
      features: [
        "Verified seller badge",
        "Unlimited product listings",
        "2 featured product slots",
        "Priority support",
        "5% commission per sale",
        "Basic analytics",
      ],
      sortOrder: 1,
    },
    {
      name: "professional",
      displayName: "Highly Recommended",
      monthlyPrice: "49.00",
      yearlyPrice: "490.00",
      productLimit: -1, // Unlimited products for all
      featuredSlots: 5,
      commissionRate: "3.00",
      hasVerifiedBadge: true,
      isHighlyRecommended: true,
      features: [
        "Verified seller badge",
        "Highly Recommended status",
        "Unlimited product listings",
        "5 featured product slots",
        "Priority support",
        "3% commission per sale",
        "Advanced analytics",
        "Custom store branding",
      ],
      sortOrder: 2,
    },
    {
      name: "enterprise",
      displayName: "Enterprise",
      monthlyPrice: "149.00",
      yearlyPrice: "1490.00",
      productLimit: -1, // Unlimited products for all
      featuredSlots: 20,
      commissionRate: "1.50",
      hasVerifiedBadge: true,
      isHighlyRecommended: true,
      features: [
        "Verified seller badge",
        "Highly Recommended status",
        "Unlimited product listings",
        "20 featured product slots",
        "Dedicated account manager",
        "1.5% commission per sale",
        "Full analytics suite",
        "API access",
        "Priority verification",
        "Custom integrations",
      ],
      sortOrder: 3,
    },
  ];

  for (const tier of tiers) {
    try {
      await db
        .insert(subscriptionTiers)
        .values(tier)
        .onConflictDoUpdate({
          target: subscriptionTiers.name,
          set: {
            displayName: tier.displayName,
            monthlyPrice: tier.monthlyPrice,
            yearlyPrice: tier.yearlyPrice,
            productLimit: tier.productLimit,
            featuredSlots: tier.featuredSlots,
            commissionRate: tier.commissionRate,
            hasVerifiedBadge: tier.hasVerifiedBadge,
            isHighlyRecommended: tier.isHighlyRecommended,
            features: tier.features,
            sortOrder: tier.sortOrder,
            isActive: true,
          },
        });
      console.log(`  Subscription tier '${tier.name}' created/updated`);
    } catch (error) {
      console.error(`  Error creating tier '${tier.name}':`, error);
    }
  }

  console.log("Fee configuration seeding complete.");
}
