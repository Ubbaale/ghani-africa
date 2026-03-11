import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  Calendar,
  Users,
  Search,
  TrendingUp,
  Wheat,
  CreditCard,
  Wallet,
  Lock,
  Truck,
  Package,
  MapPin,
  Store,
  Video,
  Megaphone,
  ShoppingBag,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Gift,
  HelpCircle,
  Globe,
  Compass,
  BarChart3,
  Layers,
} from "lucide-react";

interface ServiceItem {
  title: string;
  description: string;
  href: string;
  icon: any;
  badge?: "new" | "premium" | null;
}

interface ServiceCategory {
  name: string;
  description: string;
  icon: any;
  items: ServiceItem[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: "Trade Tools",
    description: "Everything you need for successful cross-border trade",
    icon: Globe,
    items: [
      { title: "Request for Quotation", description: "Get quotes from verified suppliers across Africa", href: "/rfq", icon: Search },
      { title: "Trade Assurance", description: "Protected transactions with money-back guarantee", href: "/trade-assurance", icon: Shield },
      { title: "Trade Documents", description: "Generate invoices, packing lists, and certificates of origin", href: "/trade-documents", icon: FileText, badge: "new" },
      { title: "Trade Events", description: "Seasonal calendar, trade fairs, and promotion opportunities", href: "/trade-events", icon: Calendar, badge: "new" },
      { title: "Find Suppliers", description: "Browse verified suppliers and manufacturers", href: "/suppliers", icon: Users },
      { title: "Trust & Safety", description: "Learn how we keep the marketplace safe", href: "/trust-safety", icon: Lock },
    ],
  },
  {
    name: "Finance",
    description: "Payment solutions and financial tools for traders",
    icon: CreditCard,
    items: [
      { title: "Buy Now, Pay Later", description: "Split purchases into easy monthly installments", href: "/bnpl", icon: CreditCard, badge: "new" },
      { title: "Wallet", description: "Manage your funds, deposits, and withdrawals", href: "/wallet", icon: Wallet },
      { title: "Secure Transactions", description: "Escrow-protected payments for peace of mind", href: "/secure-transactions", icon: Lock },
      { title: "Group Buy", description: "Pool orders with other buyers for bulk discounts", href: "/group-buy/new", icon: ShoppingBag },
    ],
  },
  {
    name: "Market Data",
    description: "Real-time prices and agricultural exchange",
    icon: BarChart3,
    items: [
      { title: "Commodity Prices", description: "Track real-time prices for African commodities and raw materials", href: "/commodity-prices", icon: TrendingUp, badge: "new" },
      { title: "Agricultural Exchange", description: "Buy and sell agricultural commodities with quality grading", href: "/agri-exchange", icon: Wheat, badge: "new" },
    ],
  },
  {
    name: "Community",
    description: "Connect, learn, and grow with fellow traders",
    icon: MessageSquare,
    items: [
      { title: "Business Forum", description: "Discuss trade tips, ask questions, and share knowledge", href: "/community", icon: MessageSquare, badge: "new" },
      { title: "Referral Program", description: "Earn rewards by inviting other traders to the platform", href: "/referrals", icon: Gift },
      { title: "Buyer Verification", description: "Get verified to unlock wholesale pricing and seller trust", href: "/buyer-verification", icon: ShieldCheck, badge: "new" },
    ],
  },
  {
    name: "Logistics",
    description: "Shipping, tracking, and delivery across Africa",
    icon: Truck,
    items: [
      { title: "Logistics Partners", description: "Browse trusted shipping partners across 20+ African countries", href: "/logistics", icon: Truck, badge: "new" },
      { title: "Track Orders", description: "Real-time tracking for all your shipments", href: "/orders", icon: Package },
      { title: "Public Tracking", description: "Track any shipment with a tracking number", href: "/track", icon: MapPin },
      { title: "Become a Shipper", description: "Join our logistics network and earn from deliveries", href: "/shipper", icon: Truck },
    ],
  },
  {
    name: "Seller Tools",
    description: "Grow your business with powerful selling tools",
    icon: Layers,
    items: [
      { title: "Storefront Builder", description: "Create a branded online store with custom themes", href: "/storefront-builder", icon: Store, badge: "premium" },
      { title: "Live Video Shopping", description: "Showcase products live and sell in real-time", href: "/live-shopping", icon: Video, badge: "new" },
      { title: "Advertising", description: "Promote your products to reach more buyers", href: "/dashboard/advertising", icon: Megaphone },
      { title: "Start Selling", description: "List your first product and reach millions of buyers", href: "/sell", icon: ShoppingBag },
      { title: "Dropshipping", description: "Sell products without managing inventory", href: "/dropship", icon: Package },
      { title: "Seller Shipping", description: "Manage shipping settings and fulfillment", href: "/dashboard/shipping", icon: Truck },
      { title: "Verified Seller", description: "Build trust with a verified seller badge", href: "/buyer-verification", icon: UserCheck },
    ],
  },
];

const BADGE_STYLES: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  premium: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export default function ServicesPage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl" data-testid="services-page">
      <div className="flex items-center gap-3 mb-2">
        <Compass className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-services-title">Explore Services</h1>
          <p className="text-muted-foreground">Discover all the tools and features available on Ghani Africa</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 my-6">
        {SERVICE_CATEGORIES.map((category) => (
          <a
            key={category.name}
            href={`#${category.name.toLowerCase().replace(/\s+/g, "-")}`}
            className="flex flex-col items-center gap-1.5 p-3 rounded-md hover-elevate text-center"
            data-testid={`link-category-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <category.icon className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">{category.name}</span>
          </a>
        ))}
      </div>

      <div className="space-y-10">
        {SERVICE_CATEGORIES.map((category) => (
          <section
            key={category.name}
            id={category.name.toLowerCase().replace(/\s+/g, "-")}
            data-testid={`section-${category.name.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <category.icon className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{category.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{category.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card
                    className="hover-elevate cursor-pointer h-full"
                    data-testid={`card-service-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-sm">{item.title}</h3>
                          {item.badge && (
                            <Badge className={`text-[10px] px-1.5 py-0 ${BADGE_STYLES[item.badge]}`}>
                              {item.badge === "new" ? "New" : "Premium"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Card className="mt-10">
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-semibold mb-1">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Link href="/help">
            <span className="text-primary text-sm font-medium cursor-pointer" data-testid="link-help-center">
              Visit Help Center
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
