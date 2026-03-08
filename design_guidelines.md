# Ghani Africa Design Guidelines

## Design Approach
**Mobile-First, African**: Following the wireframe specifications for a low-bandwidth friendly, location-aware marketplace with multi-language support. The design embodies African warmth and authenticity through earth tones and cultural accents.

## Color Scheme
**African Theme: Deep Green Primary, Gold Secondary, Earth Tones**:

### Primary Colors
- Primary: Deep Green (HSL 152 65% 28%) - Trade & Growth, buttons, links
- Primary Foreground: White - Text on primary buttons
- Secondary: Gold/Amber (HSL 45 85% 50%) - Trust & Value, highlights
- Secondary Foreground: Dark Brown (HSL 30 50% 12%) - WCAG AA compliant contrast

### African Accent Colors (Tailwind: `africa-*`)
- Earth: Warm brown (HSL 25 45% 35%) - Grounding, authenticity
- Terracotta: Orange-red (HSL 18 70% 45%) - Warmth, energy
- Sand: Soft beige (HSL 38 40% 85%) - Light backgrounds, subtle warmth
- Ochre: Golden brown (HSL 35 75% 55%) - Highlighting, warmth
- Kente Red: Deep red (HSL 0 75% 50%) - African accent
- Kente Black: Rich black (HSL 0 0% 12%) - Contrast, strength

### Base Colors
- Background: Warm off-white (HSL 30 20% 98%) - Subtle warmth
- Foreground: Warm dark brown (HSL 25 15% 12%) - Rich, readable text
- Card: Warm cream (HSL 35 25% 97%) - Subtle distinction
- Muted: Warm gray (HSL 30 12% 92%) - Subdued elements
- Accent: Light gold tint (HSL 45 75% 90%) - Highlighted areas
- Border: Warm light gray (HSL 30 15% 85%) - Subtle boundaries
- Destructive: Red (alerts)

**Accessibility Note**: All color combinations meet WCAG 2.1 AA contrast requirements (minimum 4.5:1 ratio).

## Navigation Pattern
**Mobile-First Bottom Tab Bar**:
- Home | Orders | Chat | Wallet | Profile
- Persistent Search at top
- Floating "Post Item" button for business users

## Typography
**Font Families** (Google Fonts):
- Primary: Inter (400, 500, 600, 700) - UI elements, navigation, body text
- Accent: Poppins (600, 700) - Headlines, CTAs

**Hierarchy**:
- Hero Headline: text-4xl/text-5xl, font-bold (Poppins)
- Section Titles: text-2xl/text-3xl, font-semibold (Poppins)
- Product Titles: text-lg, font-semibold (Inter)
- Body: text-base, font-normal (Inter)
- Captions/Meta: text-sm, font-medium (Inter)

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Card gaps: gap-3, gap-4, gap-6
- Container: max-w-7xl with px-4 md:px-6

## Core Screens (per Wireframes)

### Welcome Screen
- Logo centered
- "Trade Across Africa" tagline
- Create Account / Login buttons
- Language Selector (globe icon)

### Home / Marketplace
**Consumer View**:
- Search bar prominent at top
- Location indicator with pin icon
- Category grid (horizontal scroll on mobile)
- Nearby Suppliers section
- Trending Products section
- Bottom navigation bar

**Business/Seller View**:
- Today's Stats (Sales, Orders, Rating)
- Post New Product floating button
- My Products list
- Pending Orders list

### Product Listing Flow
**Add Product Form**:
- Product Name, Category dropdown
- Price with Currency selector
- MOQ (Minimum Order Quantity)
- Quantity Available
- Photo upload (multiple)
- Description textarea
- Shipping Options checkboxes
- Publish button

### Product Details
- Image carousel
- Product name with star rating
- Price and MOQ display
- Supplier info with Verified badge
- Location with flag
- Chat Seller / Buy Now buttons
- Description and Reviews tabs

### Chat
- Chat list with recent conversations
- Chat window with message bubbles
- Image attachment support
- Send button

### Checkout
- Order Summary
- Delivery Location
- Shipping Cost
- Payment Method (Mobile Money, Card)
- Pay Securely button

### Order Tracking
- Order number and status
- Map view with pickup to delivery
- ETA display

### Wallet
- Balance display
- Add Funds / Withdraw buttons
- Transaction history

### Profile
- Profile photo
- Name and Role
- Trust Level with Verified badge
- Edit Profile
- Switch Role
- Business Verification

## Trust Enhancements
- Verified badges on sellers
- Escrow progress indicators
- Location confidence indicators
- Delivery performance scores
- Star ratings everywhere

## Multi-Language Support
Support for major African languages:
- English (Default)
- French
- Arabic
- Swahili
- Portuguese
- Hausa
- Amharic
- Zulu

Language selector in header/welcome screen with globe icon.

## Component Library

### Buttons
- Primary: Deep green bg, white text, rounded-md
- Secondary: Gold/amber bg, white text
- Ghost: Transparent with text color
- Icon buttons: rounded-full

### Cards
- Subtle border, rounded-lg, p-4
- Hover: subtle elevation

### Badges
- Rounded-full, px-2 py-1, text-xs
- Verified: Green with checkmark
- New: Gold/amber

### Navigation
- Bottom tabs: Icon + Label, active state highlighted
- Floating action button: Primary color, shadow

## Key Principles
1. **Mobile-First**: Android primary, touch-friendly (44px min targets)
2. **Low-Bandwidth Friendly**: Optimized images, lazy loading
3. **Trust Indicators**: Verification visible everywhere
4. **Location-Aware**: Default to user location
5. **Multi-Language Ready**: All text through translation system
