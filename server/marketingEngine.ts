import { storage } from "./storage";
import { sendEmail, emailHeader, emailFooter } from "./email";
import { db } from "./db";
import { products, userProfiles, orders, reviews } from "@shared/schema";
import { desc, sql, eq, gte, and } from "drizzle-orm";
import { users } from "@shared/models/auth";

function getBaseUrl(): string {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.replit.app` : "localhost:5000";
  return `${protocol}://${host}`;
}

const AFRICAN_TRADE_TIPS = [
  "Did you know? The AfCFTA creates the largest free trade area by number of countries, connecting 1.3 billion people across 54 nations.",
  "Trade tip: Products with AfCFTA certificates can enjoy reduced tariffs across member states. Check if your products qualify!",
  "Growing your business? Group buying on Ghani Africa helps you reach wholesale prices even with smaller orders.",
  "Shipping across Africa? Use our pickup points in 15+ major cities for faster, cheaper deliveries.",
  "Verified sellers on Ghani Africa get 3x more orders. Complete your factory profile to stand out!",
  "Did you know? Mobile money payments are the fastest-growing payment method in Africa, used by 500M+ people.",
  "Trade tip: Adding wholesale pricing tiers to your products attracts bulk buyers and increases average order value.",
  "Want to expand to new markets? AfCFTA preferential tariffs can reduce your cross-border costs by up to 90%.",
  "Photo reviews drive 4x more sales. Encourage your buyers to share photos of your products!",
  "Offer sample orders to let new customers try before committing to bulk purchases. It builds trust!",
];

const PLATFORM_HASHTAGS = "#GhaniAfrica #AfricanTrade #MadeInAfrica #AfCFTA #AfricanBusiness #BuyAfrican #TradeInAfrica #AfricanMarketplace #PanAfricanCommerce #AfricaRising";

export async function generateSocialContent(type: string = "product_promo"): Promise<Array<{platform: string; content: string; hashtags: string; contentType: string; title: string}>> {
  const baseUrl = getBaseUrl();
  const posts: Array<{platform: string; content: string; hashtags: string; contentType: string; title: string}> = [];

  if (type === "product_promo" || type === "all") {
    const trendingProducts = await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.views))
      .limit(5);

    for (const product of trendingProducts) {
      const price = product.price ? `$${parseFloat(product.price).toFixed(2)}` : "";
      const productUrl = `${baseUrl}/products/${product.id}`;

      posts.push({
        platform: "facebook",
        contentType: "product_promo",
        title: `Trending: ${product.name}`,
        content: `🔥 Trending on Ghani Africa!\n\n${product.name}\n${price ? `💰 From ${price}` : ""}\n${product.description?.substring(0, 150) || ""}\n\n👉 Shop now: ${productUrl}\n\n🌍 Africa's leading marketplace for quality products and trusted sellers.`,
        hashtags: "#GhaniAfrica #AfricanProducts #ShopAfrica #TrendingNow #AfricanBusiness",
      });

      posts.push({
        platform: "twitter",
        contentType: "product_promo",
        title: `Hot: ${product.name}`,
        content: `🔥 ${product.name} ${price ? `- ${price}` : ""}\n\nShop Africa's best on @GhaniAfrica\n\n${productUrl}`,
        hashtags: "#GhaniAfrica #MadeInAfrica #AfricanTrade",
      });

      posts.push({
        platform: "whatsapp",
        contentType: "product_promo",
        title: `Share: ${product.name}`,
        content: `🛍️ Check out this product on Ghani Africa!\n\n*${product.name}*\n${price ? `Price: ${price}` : ""}\n${product.description?.substring(0, 100) || ""}\n\n👉 ${productUrl}\n\nJoin Africa's #1 marketplace: ${baseUrl}`,
        hashtags: "",
      });

      posts.push({
        platform: "instagram",
        contentType: "product_promo",
        title: `Featured: ${product.name}`,
        content: `🌍 Discover amazing African products!\n\n${product.name}\n${price ? `💰 ${price}` : ""}\n\n${product.description?.substring(0, 200) || ""}\n\n🛒 Link in bio or visit ghani-africa.com\n\n.`,
        hashtags: "#GhaniAfrica #AfricanProducts #ShopAfrica #MadeInAfrica #AfricanFashion #AfricanCraft #SupportAfrican #BuyBlack #AfricanExcellence",
      });

      posts.push({
        platform: "linkedin",
        contentType: "product_promo",
        title: `Business Spotlight: ${product.name}`,
        content: `🌍 African Trade Spotlight\n\n${product.name}\n\n${product.description?.substring(0, 300) || ""}\n\nGhani Africa connects African manufacturers, traders and buyers across 54 countries. From agriculture to textiles, technology to crafts.\n\n${price ? `Starting from ${price}` : ""}\n\nExplore: ${productUrl}\n\n#AfricanBusiness #B2BCommerce #AfCFTA`,
        hashtags: "#AfricanBusiness #B2BCommerce #AfCFTA #GhaniAfrica #TradeInAfrica",
      });

      posts.push({
        platform: "tiktok",
        contentType: "product_promo",
        title: `${product.name} on Ghani Africa`,
        content: `POV: You just discovered Africa's best marketplace 🌍✨\n\n${product.name}\n${price ? `Only ${price}!` : ""}\n\nLink in bio 👆\n\n#GhaniAfrica #AfricanProducts #ShopAfrica #FYP #Viral #MadeInAfrica`,
        hashtags: "#GhaniAfrica #FYP #Viral #MadeInAfrica #AfricanProducts",
      });
    }
  }

  if (type === "platform_promo" || type === "all") {
    const totalProductCount = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
    const totalSellers = await db.select({ count: sql<number>`count(*)` }).from(userProfiles).where(eq(userProfiles.role, "trader"));
    const productCount = Number(totalProductCount[0]?.count || 0);
    const sellerCount = Number(totalSellers[0]?.count || 0);

    posts.push({
      platform: "facebook",
      contentType: "platform_promo",
      title: "Join Africa's #1 Trade Hub",
      content: `🌍 Ghani Africa - Where African Business Thrives!\n\n✅ ${productCount}+ products from verified African sellers\n✅ ${sellerCount}+ trusted suppliers & manufacturers\n✅ Secure escrow payments\n✅ Mobile money accepted (M-Pesa, MTN, Airtel, Orange)\n✅ AfCFTA compliant trade tools\n✅ Wholesale & bulk pricing\n✅ Group buying for better deals\n\n🚀 Whether you're buying or selling, Ghani Africa is your gateway to African commerce.\n\n👉 Join free: ${baseUrl}\n\n${PLATFORM_HASHTAGS}`,
      hashtags: PLATFORM_HASHTAGS,
    });

    posts.push({
      platform: "twitter",
      contentType: "platform_promo",
      title: "Africa's Trade Hub",
      content: `🌍 Join ${sellerCount}+ African sellers on @GhaniAfrica\n\n✅ Secure payments\n✅ Mobile money\n✅ AfCFTA tools\n✅ Wholesale pricing\n\nAfrica's #1 marketplace 🚀\n\n${baseUrl}`,
      hashtags: "#GhaniAfrica #AfricanTrade #AfCFTA",
    });

    posts.push({
      platform: "whatsapp",
      contentType: "platform_promo",
      title: "Invite to Ghani Africa",
      content: `🌍 *Ghani Africa - Africa's #1 Marketplace*\n\nAre you a business owner, manufacturer, or trader in Africa?\n\nJoin Ghani Africa to:\n✅ Sell your products across 54 African countries\n✅ Get verified seller badge\n✅ Accept mobile money & card payments\n✅ Access wholesale buyers\n✅ Use AfCFTA trade tools\n\n🆓 Registration is FREE!\n\n👉 Join now: ${baseUrl}\n\n_Forward this to business owners who could benefit!_`,
      hashtags: "",
    });

    posts.push({
      platform: "linkedin",
      contentType: "platform_promo",
      title: "African B2B Marketplace",
      content: `🌍 Introducing Ghani Africa: The Future of African Trade\n\nAs the AfCFTA opens up a $3.4 trillion consumer market, businesses need a reliable platform to trade across borders.\n\nGhani Africa provides:\n🔹 ${productCount}+ products across all categories\n🔹 Verified supplier profiles with factory details\n🔹 Secure escrow & Trade Assurance\n🔹 AfCFTA compliance tools & duty calculator\n🔹 Multi-currency support (50+ African currencies)\n🔹 Mobile money integration\n🔹 11-language support\n\nWhether you're a manufacturer looking for distributors, a retailer sourcing products, or an exporter entering new African markets — Ghani Africa connects you.\n\nJoin Africa's fastest-growing B2B marketplace: ${baseUrl}\n\n#AfricanBusiness #B2BCommerce #AfCFTA #TradeInAfrica`,
      hashtags: "#AfricanBusiness #B2BCommerce #AfCFTA #TradeInAfrica",
    });
  }

  if (type === "trade_tip" || type === "all") {
    const tip = AFRICAN_TRADE_TIPS[Math.floor(Math.random() * AFRICAN_TRADE_TIPS.length)];

    posts.push({
      platform: "facebook",
      contentType: "trade_tip",
      title: "African Trade Tip",
      content: `💡 African Trade Tip of the Day\n\n${tip}\n\n🌍 Ghani Africa - Empowering African Commerce\n\n👉 ${baseUrl}`,
      hashtags: "#GhaniAfrica #AfricanTrade #TradeTip #AfCFTA #BusinessTips",
    });

    posts.push({
      platform: "twitter",
      contentType: "trade_tip",
      title: "Trade Tip",
      content: `💡 ${tip}\n\n@GhaniAfrica 🌍`,
      hashtags: "#AfricanTrade #TradeTip",
    });
  }

  return posts;
}

export async function generateWhatsAppBroadcastTemplates(): Promise<Array<{name: string; message: string; targetAudience: string}>> {
  const baseUrl = getBaseUrl();
  const trendingProducts = await db.select().from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.views))
    .limit(3);

  const productList = trendingProducts.map(p => `• *${p.name}* - $${parseFloat(p.price || "0").toFixed(2)}`).join("\n");

  return [
    {
      name: "Business Owner Invitation",
      targetAudience: "Business owners, traders, manufacturers",
      message: `🌍 *Grow Your Business Across Africa!*\n\nHello! I wanted to share this amazing platform with you.\n\n*Ghani Africa* is Africa's #1 digital marketplace where you can:\n\n✅ Sell to customers in 54 African countries\n✅ Accept Mobile Money & card payments\n✅ Get a verified seller badge\n✅ Access wholesale buyers\n✅ Use AfCFTA trade tools for reduced tariffs\n\n🆓 FREE to register!\n\n👉 Join now: ${baseUrl}\n\n_Share this with other business owners!_`,
    },
    {
      name: "Weekly Trending Products",
      targetAudience: "Buyers, consumers, resellers",
      message: `🔥 *This Week's Trending Products on Ghani Africa*\n\n${productList || "Check out our latest products!"}\n\n🛒 Browse all products: ${baseUrl}/browse\n\n💡 *Why Ghani Africa?*\n✅ Verified African sellers\n✅ Secure payments with buyer protection\n✅ Africa-wide delivery\n\n👉 Shop now: ${baseUrl}`,
    },
    {
      name: "Group Buy Alert",
      targetAudience: "Price-conscious buyers, cooperatives",
      message: `🤝 *Save Money with Group Buying on Ghani Africa!*\n\nDid you know you can join other buyers to get wholesale prices? Even if you only need a small quantity!\n\n*How it works:*\n1️⃣ Find a product you like\n2️⃣ Start or join a Group Buy\n3️⃣ When enough people join, everyone gets the wholesale price!\n\n💰 Save up to 40% on bulk prices!\n\n👉 Browse Group Buys: ${baseUrl}/group-buys\n\n_Share this with friends who want to save!_`,
    },
    {
      name: "Seller Success Story",
      targetAudience: "Potential sellers, manufacturers",
      message: `🌟 *Success Story from Ghani Africa*\n\nAfrican businesses are growing with Ghani Africa!\n\nOur verified sellers are:\n✅ Reaching customers across all of Africa\n✅ Getting verified supplier badges\n✅ Receiving orders from international buyers\n✅ Using AfCFTA tools for tax-free trade\n\n🚀 Start selling today - it's FREE!\n\n👉 Register: ${baseUrl}\n\n_Forward to any business owner who wants to grow!_`,
    },
    {
      name: "Referral Reward",
      targetAudience: "Existing users",
      message: `🎁 *Earn Rewards with Ghani Africa Referrals!*\n\nInvite friends and business contacts to join Ghani Africa and earn rewards!\n\n*How it works:*\n1️⃣ Get your unique referral link from your profile\n2️⃣ Share it with friends, family, and business contacts\n3️⃣ When they sign up and make a purchase, you earn rewards!\n\n💰 Earn for every successful referral!\n\n👉 Get your link: ${baseUrl}/referrals\n\n_The more you share, the more you earn!_`,
    },
  ];
}

export async function runAutomatedEmailDigest(): Promise<{ sent: number; failed: number }> {
  const baseUrl = getBaseUrl();
  let sent = 0;
  let failed = 0;

  try {
    const trendingProducts = await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.views))
      .limit(6);

    const newProducts = await db.select().from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .limit(6);

    if (trendingProducts.length === 0 && newProducts.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
    }).from(users).where(sql`${users.email} IS NOT NULL`);

    const buildProductRow = (p: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <a href="${baseUrl}/products/${p.id}" style="color: #c97f44; text-decoration: none; font-weight: bold;">${p.name}</a>
          <div style="color: #666; font-size: 13px; margin-top: 4px;">${p.description?.substring(0, 80) || ""}...</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #1a1a1a;">
          ${p.price ? `$${parseFloat(p.price).toFixed(2)}` : "Contact Seller"}
        </td>
      </tr>
    `;

    for (const user of allUsers) {
      if (!user.email) continue;

      try {
        const firstName = user.firstName || "there";
        const html = `
          ${emailHeader()}
          <h1 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 22px; color: #1a1a1a;">Your Weekly African Trade Digest</h1>
          <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 15px; color: #333;">Hello ${firstName}, here's what's happening on Ghani Africa this week.</p>

          ${trendingProducts.length > 0 ? `
            <h2 style="margin: 20px 0 12px 0; font-family: 'Georgia', serif; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #c97f44; padding-bottom: 6px;">🔥 Trending Products</h2>
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
              ${trendingProducts.map(buildProductRow).join("")}
            </table>
          ` : ""}

          ${newProducts.length > 0 ? `
            <h2 style="margin: 24px 0 12px 0; font-family: 'Georgia', serif; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #c97f44; padding-bottom: 6px;">🆕 New Arrivals</h2>
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
              ${newProducts.map(buildProductRow).join("")}
            </table>
          ` : ""}

          <div style="text-align: center; margin: 24px 0;">
            <a href="${baseUrl}/browse" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold;">Browse All Products</a>
          </div>

          <div style="background: #f0f7f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #1a1a1a;">💡 Trade Tip</h3>
            <p style="margin: 0; font-size: 14px; color: #333;">${AFRICAN_TRADE_TIPS[Math.floor(Math.random() * AFRICAN_TRADE_TIPS.length)]}</p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; color: #666;">Share Ghani Africa with your network:</p>
            <a href="https://wa.me/?text=${encodeURIComponent(`Check out Ghani Africa - Africa's #1 marketplace: ${baseUrl}`)}" style="color: #25D366; text-decoration: none; margin: 0 8px; font-weight: bold;">WhatsApp</a> |
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}" style="color: #1877F2; text-decoration: none; margin: 0 8px; font-weight: bold;">Facebook</a> |
            <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(`Discover Africa's #1 marketplace: ${baseUrl} #GhaniAfrica #AfricanTrade`)}" style="color: #1DA1F2; text-decoration: none; margin: 0 8px; font-weight: bold;">Twitter</a>
          </div>

          ${emailFooter()}
        `;

        await sendEmail({
          to: user.email,
          subject: `${firstName}, your weekly African trade digest is here`,
          html,
        });
        sent++;
      } catch (e: any) {
        console.error(`[Marketing] Failed to send digest to ${user.email}:`, e.message);
        failed++;
      }
    }
  } catch (error: any) {
    console.error("[Marketing] Email digest error:", error.message);
  }

  return { sent, failed };
}

export async function runNewProductAlerts(): Promise<{ sent: number; failed: number }> {
  const baseUrl = getBaseUrl();
  let sent = 0;
  let failed = 0;

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newProducts = await db.select().from(products)
      .where(and(eq(products.isActive, true), gte(products.createdAt, oneDayAgo)))
      .orderBy(desc(products.createdAt))
      .limit(10);

    if (newProducts.length === 0) return { sent: 0, failed: 0 };

    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
    }).from(users).where(sql`${users.email} IS NOT NULL`);

    for (const user of allUsers) {
      if (!user.email) continue;
      try {
        const firstName = user.firstName || "there";
        const productCards = newProducts.map(p => `
          <div style="display: inline-block; width: 48%; vertical-align: top; margin: 4px 1%; padding: 12px; border: 1px solid #eee; border-radius: 8px; box-sizing: border-box;">
            <a href="${baseUrl}/products/${p.id}" style="color: #c97f44; text-decoration: none; font-weight: bold; font-size: 14px;">${p.name}</a>
            <div style="color: #333; font-weight: bold; margin-top: 4px;">${p.price ? `$${parseFloat(p.price).toFixed(2)}` : "Contact Seller"}</div>
          </div>
        `).join("");

        const html = `
          ${emailHeader()}
          <h1 style="margin: 0 0 8px 0; font-family: 'Georgia', serif; font-size: 22px; color: #1a1a1a;">🆕 New Products Just Listed!</h1>
          <p style="margin: 0 0 20px 0; font-size: 15px; color: #333;">Hello ${firstName}, ${newProducts.length} new product${newProducts.length > 1 ? "s were" : " was"} just listed on Ghani Africa.</p>
          <div style="margin: 16px 0;">${productCards}</div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${baseUrl}/browse?sort=newest" style="background-color: #c97f44; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">See All New Products</a>
          </div>
          ${emailFooter()}
        `;

        await sendEmail({ to: user.email, subject: `${newProducts.length} new products on Ghani Africa`, html });
        sent++;
      } catch (e: any) {
        failed++;
      }
    }
  } catch (error: any) {
    console.error("[Marketing] New product alert error:", error.message);
  }
  return { sent, failed };
}

export async function generateReferralCode(userId: string): Promise<string> {
  const profile = await storage.getUserProfile(userId);
  const baseName = (profile?.businessName || profile?.storeSlug || userId).replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GA-${baseName}-${random}`;
}

export async function processScheduledPosts(): Promise<number> {
  const duePosts = await storage.getScheduledPosts();
  let processed = 0;

  for (const post of duePosts) {
    try {
      await storage.updateSocialPost(post.id, {
        status: "posted",
        postedAt: new Date(),
      });
      processed++;
    } catch (error: any) {
      console.error(`[Marketing] Failed to process scheduled post ${post.id}:`, error.message);
      await storage.updateSocialPost(post.id, { status: "failed" });
    }
  }
  return processed;
}

export async function runDueAutomations(): Promise<void> {
  try {
    const dueAutomations = await storage.getDueAutomations();

    for (const automation of dueAutomations) {
      console.log(`[Marketing] Running automation: ${automation.name} (${automation.type})`);

      let result = { sent: 0, failed: 0 };

      try {
        switch (automation.type) {
          case "email_digest":
          case "weekly_deals":
            result = await runAutomatedEmailDigest();
            break;
          case "new_product_alert":
            result = await runNewProductAlerts();
            break;
          case "social_auto_post": {
            const posts = await generateSocialContent("all");
            for (const post of posts.slice(0, 5)) {
              await storage.createSocialPost({
                ...post,
                status: "posted",
                shareUrl: getBaseUrl(),
              });
            }
            result.sent = Math.min(posts.length, 5);
            break;
          }
          case "trending_products": {
            result = await runAutomatedEmailDigest();
            break;
          }
        }

        const now = new Date();
        const nextRun = new Date(now.getTime() + (automation.intervalHours || 168) * 60 * 60 * 1000);

        await storage.updateMarketingAutomation(automation.id, {
          lastRunAt: now,
          nextRunAt: nextRun,
          totalSent: (automation.totalSent || 0) + result.sent,
        });

        console.log(`[Marketing] Automation "${automation.name}" complete: ${result.sent} sent, ${result.failed} failed. Next run: ${nextRun.toISOString()}`);
      } catch (error: any) {
        console.error(`[Marketing] Automation "${automation.name}" failed:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("[Marketing] Error checking automations:", error.message);
  }
}

export async function seedDefaultAutomations(): Promise<void> {
  const existing = await storage.getMarketingAutomations();
  if (existing.length > 0) return;

  const defaults = [
    {
      name: "Weekly Trade Digest",
      type: "email_digest",
      isActive: true,
      intervalHours: 168,
      nextRunAt: new Date(Date.now() + 168 * 60 * 60 * 1000),
      config: { description: "Sends weekly email digest with trending products, new arrivals, and trade tips to all users" },
    },
    {
      name: "New Product Alerts",
      type: "new_product_alert",
      isActive: true,
      intervalHours: 24,
      nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      config: { description: "Sends daily alerts about newly listed products to interested users" },
    },
    {
      name: "Auto Social Media Content",
      type: "social_auto_post",
      isActive: true,
      intervalHours: 72,
      nextRunAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      config: { description: "Auto-generates social media posts for all platforms every 3 days" },
    },
    {
      name: "Trending Products Email",
      type: "trending_products",
      isActive: false,
      intervalHours: 48,
      nextRunAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      config: { description: "Sends trending product highlights every 2 days" },
    },
  ];

  for (const auto of defaults) {
    try {
      await storage.createMarketingAutomation(auto as any);
      console.log(`[Marketing] Created default automation: ${auto.name}`);
    } catch (e: any) {
      console.error(`[Marketing] Failed to seed automation ${auto.name}:`, e.message);
    }
  }
}
