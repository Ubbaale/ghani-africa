# Ghani Africa - African Digital Marketplace

## Overview
Ghani Africa is an African digital marketplace connecting businesses, traders, manufacturers, and consumers across Africa. It facilitates cross-border and local trade with features like product listings, shopping carts, in-app messaging, verified user profiles, and comprehensive order management. The platform aims to be the leading e-commerce solution for African trade, focusing on local economies and ease of use. It is a full-stack TypeScript application using a React frontend and an Express.js backend. The project includes features such as a secure transaction platform with escrow and trade assurance, a product quotation system (RFQ), a robust subscription model, and advanced cross-border/domestic trade tools including AfCFTA compliance. It also incorporates a comprehensive invoice and transaction transparency system, advertising capabilities, pickup points with speed delivery options, and various competitive features inspired by leading global marketplaces.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack React Query for server state, Tailwind CSS with custom African themes, and Vite for building.
- **Backend**: Express.js with TypeScript, RESTful API, Replit Auth with OpenID Connect for authentication, and `express-session` with PostgreSQL for session management.
- **Data Layer**: PostgreSQL database, Drizzle ORM with `drizzle-zod` for schema validation, and `drizzle-kit` for migrations.
- **Key Data Models**: Encompasses users, products, orders, payments, logistics, disputes, reviews, subscriptions, and specialized systems for dropshipping, advertising, and manufacturer outreach.

### UI/UX Decisions
- **Theming**: Dynamic African flag themes, session-based with random selection and dark mode support.
- **Localization**: Automatic currency localization based on user's location, with manual selection for over 20 African currencies. Multi-language support for 11 languages, including RTL for Arabic, with persistence via localStorage.
- **UI Components**: `shadcn/ui` built on Radix UI primitives.

### Feature Specifications
- **Invoice & Transaction Transparency**: Auto-generated invoices, detailed activity logs, admin notifications (in-app and email), and dedicated portals for buyers, sellers, and admins to track transactions.
- **Secure Transaction Platform**: Dashboards for protected orders, escrow status, dispute management, and Trade Assurance Badges with tiered protection levels.
- **Product Quotation System**: Alibaba-style Request for Quotation (RFQ) directly from product pages, enabling buyers to request quotes and sellers to respond.
- **Payment & Checkout**: Integrated with Stripe for secure card payments, including platform commission. Mobile Money payment infrastructure for African providers (M-Pesa, MTN, Airtel, Orange) with API integration pending.
- **Stripe Payment Gates for Premium Services**: All premium services require Stripe payment before activation. Endpoints: `/api/service-checkout/storefront` ($15), `/api/service-checkout/live-session` ($10), `/api/service-checkout/trade-document` ($2-$5 by type), `/api/service-checkout/event-promotion` ($25). Legacy free-create endpoints return 402. Webhook fulfillment in `webhookHandlers.ts` activates records on payment. Tables have `paymentStatus` and `stripePaymentId` columns.
- **Subscription Model**: Tiered monthly subscriptions (e.g., Verified Seller) offering reduced commissions and enhanced features, managed via Stripe webhooks.
- **Cross-Border & Domestic Trade**: Automatic trade detection, comprehensive country tax rates, predefined shipping zones, and real-time trade cost estimation at checkout. AfCFTA trade compliance tools include eligibility badges, duty calculators, and certificate flows.
- **Advertising System**: Basic, Premium, and Featured advertising packages with varying durations, placements, and video ad support.
- **Pickup Points & Speed Delivery**: Integration with 25+ pickup points and tiered delivery options (Standard, Express, Instant) across major African cities, including express corridors for inter-city routes.
- **Product Image System**: Server-side image uploads with auto-resizing, watermarking, download protection, and validation. Images are stored in Replit Object Storage.
- **AI Features**: GPT-4 Vision for image search to find similar products and geolocation for detecting the nearest African country.
- **Manufacturer Outreach**: Admin panel for managing manufacturer contacts, bulk CSV import, automated SendGrid invitation and follow-up emails, and a tracking dashboard.
- **Competitive Features (Alibaba-Alternative)**:
    - **Bulk/Tiered Pricing**: Quantity-based wholesale pricing for products.
    - **Sample Orders**: Ability to order product samples.
    - **WhatsApp Integration**: Direct chat with sellers via WhatsApp.
    - **Photo Reviews**: Reviews with image upload capabilities.
    - **Supplier Factory Profiles**: Detailed profiles showcasing factory size, capacity, certifications, and more.
    - **Group Buying / Cooperative Purchasing**: System for buyers to form groups to reach wholesale pricing tiers.
- **Platform Discoverability & Navigation**:
    - **Services Hub Page**: Central directory at `/services` with all platform features organized into 6 categories (Trade Tools, Finance, Market Data, Community, Logistics, Seller Tools).
    - **Seller Success Guide**: Step-by-step onboarding guide at `/seller-guide` with progress tracking, tool links, and tips.
    - **Buyer Protection / Trust Center**: Comprehensive trust page at `/buyer-protection` explaining escrow, trade assurance, dispute resolution, and verified seller tiers.
    - **Quick-Access Toolbar**: Dashboard feature toolbar with role-based shortcuts (sellers see Storefront/Live Shopping/Events; buyers see BNPL/Verification/Commodities).
    - **Bottom Navigation**: Services link replaces Messages in mobile bottom nav for feature discoverability.
    - **Home Page**: "Explore Our Platform" section with 12 feature cards; enhanced footer with Buyers/Sellers/Platform columns linking to all features.
- **Enhanced Offline PWA**: Service worker for image and API response caching, an offline action queue for non-GET requests, and an offline indicator.
- **Admin Authentication**: Separate, session-based admin authentication with roles and secure password management.
- **Scalability**: Database optimization, in-memory caching, API rate limiting, asynchronous job queues, and pagination.
- **Revenue-Generating Features (10 New Competitive Modules)**:
    - **Buy Now Pay Later (BNPL)**: Trade finance with 3/6/12 month installments (3-6% interest), eligibility checks, max 3 active plans. Tables: `bnpl_plans`, `bnpl_payments`. Route: `/bnpl`.
    - **Trade Document Generator**: Auto-generate commercial invoices ($3), packing lists ($2), certificates of origin ($5), proforma invoices ($2.50). Table: `trade_documents`. Route: `/trade-documents`.
    - **Storefront Builder**: Branded seller storefronts with 6 African-themed color palettes, $15/month fee. Table: `storefronts`. Routes: `/storefront-builder`, `/storefront/:slug`.
    - **Commodity Price Tracker**: Real-time prices for 20 African commodities (agriculture + minerals) with price alerts. Tables: `commodity_prices`, `price_alerts`. Route: `/commodity-prices`.
    - **Verified Buyer Program**: 3-tier buyer verification (Basic $5, Verified $10, Premium $15) with admin approval. Table: `buyer_verifications`. Route: `/buyer-verification`.
    - **Business Community Forum**: Full forum with 8 seeded categories, posts, replies, pinning, locking. Tables: `forum_categories`, `forum_posts`, `forum_replies`. Route: `/community`.
    - **Logistics Partner Dashboard**: 8 seeded African logistics partners with booking, tracking, and commission tracking. Tables: `logistics_partners`, `logistics_bookings`. Route: `/logistics`.
    - **Seasonal & Cultural Events Calendar**: African trade events, harvest seasons, festivals with product promotion ($25/promotion). Tables: `trade_events`, `event_promotions`. Route: `/trade-events`.
    - **Agricultural Exchange**: Crop listings with quality grading (A/B/C), auction system, bidding. Tables: `agri_listings`, `agri_bids`. Route: `/agri-exchange`.
    - **Live Video Shopping**: Session scheduling, go-live management, featured products with special pricing, $10/session fee. Tables: `live_sessions`, `live_session_products`. Route: `/live-shopping`.

## External Dependencies

### Database
- **PostgreSQL**

### Authentication
- **Replit Auth** (OpenID Connect provider)

### Libraries
- **@tanstack/react-query**
- **@radix-ui/***
- **wouter**
- **embla-carousel-react**
- **react-day-picker**
- **recharts**
- **lucide-react**
- **drizzle-orm**
- **express-session**
- **connect-pg-simple**
- **passport**
- **openid-client**
- **zod**

### Build Tools
- **Vite**
- **esbuild**
- **tsx**

### Services
- **Stripe** (Subscription billing, advertisement payments)
- **SendGrid** (Email notifications)
- **Google Analytics 4**
- **Facebook Pixel**
- **GPT-4 Vision**

### Native Mobile App (Expo/EAS)
- **Location**: `mobile/` directory
- **Architecture**: Expo + React Native WebView wrapping the deployed web app
- **Features**: Push notifications (Expo Notifications), native WhatsApp/phone/email handling, offline detection, Android back button support, Stripe checkout passthrough, pull-to-refresh
- **Build System**: EAS Build (cloud-based)
- **App IDs**: iOS `com.ghaniafrica.marketplace`, Android `com.ghaniafrica.marketplace`
- **Guide**: See `mobile/BUILD_AND_PUBLISH.md` for full build and store submission instructions