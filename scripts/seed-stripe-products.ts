import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error("ERROR: STRIPE_SECRET_KEY environment variable is required");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const AD_PACKAGES = [
  {
    name: "Basic Advertising",
    description: "Show your product on the homepage for 7 days. Great for testing the waters.",
    metadata: {
      type: "advertising",
      package_type: "basic",
      duration_days: "7",
    },
    price: 999, // $9.99
    interval: "month" as const,
  },
  {
    name: "Premium Advertising",
    description: "Priority homepage placement for 14 days with detailed analytics and category page visibility.",
    metadata: {
      type: "advertising",
      package_type: "premium",
      duration_days: "14",
    },
    price: 2499, // $24.99
    interval: "month" as const,
  },
  {
    name: "Featured Advertising",
    description: "Maximum exposure with top homepage placement for 30 days. Includes all category pages and search boost.",
    metadata: {
      type: "advertising",
      package_type: "featured",
      duration_days: "30",
    },
    price: 4999, // $49.99
    interval: "month" as const,
  },
];

async function seedStripeProducts() {
  console.log("Starting Stripe product seeding...\n");

  for (const pkg of AD_PACKAGES) {
    try {
      console.log(`Creating product: ${pkg.name}`);
      
      const existingProducts = await stripe.products.search({
        query: `name:'${pkg.name}'`,
      });

      let product: Stripe.Product;

      if (existingProducts.data.length > 0) {
        console.log(`  Product already exists, updating...`);
        product = await stripe.products.update(existingProducts.data[0].id, {
          description: pkg.description,
          metadata: pkg.metadata,
          active: true,
        });
      } else {
        product = await stripe.products.create({
          name: pkg.name,
          description: pkg.description,
          metadata: pkg.metadata,
        });
      }

      console.log(`  Product ID: ${product.id}`);

      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      if (existingPrices.data.length === 0) {
        console.log(`  Creating price: $${(pkg.price / 100).toFixed(2)}/${pkg.interval}`);
        
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: pkg.price,
          currency: "usd",
          recurring: {
            interval: pkg.interval,
          },
          metadata: pkg.metadata,
        });

        console.log(`  Price ID: ${price.id}`);
      } else {
        console.log(`  Price already exists: ${existingPrices.data[0].id}`);
      }

      console.log(`  Done!\n`);
    } catch (error) {
      console.error(`  Error creating ${pkg.name}:`, error);
    }
  }

  console.log("Stripe product seeding completed!");
}

seedStripeProducts().catch(console.error);
