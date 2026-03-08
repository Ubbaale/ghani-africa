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
- **Enhanced Offline PWA**: Service worker for image and API response caching, an offline action queue for non-GET requests, and an offline indicator.
- **Admin Authentication**: Separate, session-based admin authentication with roles and secure password management.
- **Scalability**: Database optimization, in-memory caching, API rate limiting, asynchronous job queues, and pagination.

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