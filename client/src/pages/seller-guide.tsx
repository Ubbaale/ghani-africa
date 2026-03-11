import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { UserProfile, Product } from "@shared/schema";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Package,
  Store,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  Circle,
  Play,
  Lightbulb,
  TrendingUp,
  Star,
  Globe,
  DollarSign,
  Users,
  BarChart3,
  BookOpen,
  Target,
  Award,
  Truck,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

interface GuideStep {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  tips: string[];
  actionLabel: string;
  actionLink: string;
  videoTitle: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: "profile",
    number: 1,
    title: "Complete Your Profile",
    description: "Set up your seller account with business details, contact information, and your location. A complete profile builds trust with buyers and helps you get discovered.",
    icon: User,
    tips: [
      "Choose 'Trader' or 'Manufacturer' as your account type to unlock seller features",
      "Add a professional profile photo and business description",
      "Include your phone number so buyers can reach you quickly",
      "Set your country and city for local discovery",
    ],
    actionLabel: "Go to Profile Settings",
    actionLink: "/dashboard",
    videoTitle: "How to set up your seller profile",
  },
  {
    id: "product",
    number: 2,
    title: "List Your First Product",
    description: "Add products with high-quality photos, detailed descriptions, and competitive pricing. The more details you provide, the more likely buyers are to purchase.",
    icon: Package,
    tips: [
      "Use clear, well-lit photos from multiple angles",
      "Write detailed descriptions including materials, dimensions, and origin",
      "Set competitive pricing and consider offering wholesale tiers",
      "Add a minimum order quantity (MOQ) for bulk sales",
      "Enable sample availability to attract serious buyers",
    ],
    actionLabel: "Add Your First Product",
    actionLink: "/dashboard",
    videoTitle: "How to create a winning product listing",
  },
  {
    id: "storefront",
    number: 3,
    title: "Set Up Your Storefront",
    description: "Create a branded storefront that showcases all your products in one place. Your storefront is your digital shop window across Africa.",
    icon: Store,
    tips: [
      "Choose a memorable store name that reflects your brand",
      "Write a compelling store description that tells your story",
      "Select a theme that matches your brand identity",
      "Publish your storefront to make it visible to buyers",
    ],
    actionLabel: "Create Your Storefront",
    actionLink: "/storefront-builder",
    videoTitle: "How to build your branded storefront",
  },
  {
    id: "verification",
    number: 4,
    title: "Get Verified",
    description: "Upload business documents and get verified to earn trust badges. Verified sellers get more visibility and higher conversion rates.",
    icon: ShieldCheck,
    tips: [
      "Upload your business registration certificate",
      "Add tax identification documents for legitimacy",
      "Complete buyer verification for additional trust badges",
      "Higher verification levels unlock premium features",
    ],
    actionLabel: "Start Verification",
    actionLink: "/buyer-verification",
    videoTitle: "How verification boosts your sales",
  },
  {
    id: "selling",
    number: 5,
    title: "Start Selling",
    description: "You're ready to receive orders! Optimize your listings, respond to inquiries quickly, and use platform tools to grow your business across Africa.",
    icon: Rocket,
    tips: [
      "Respond to buyer messages within 24 hours for best results",
      "Use the RFQ system to bid on buyer requests",
      "Join the community forum to network with other sellers",
      "Consider upgrading to Verified Seller for lower commissions",
      "Use advertising tools to boost your product visibility",
    ],
    actionLabel: "View Your Dashboard",
    actionLink: "/dashboard",
    videoTitle: "Tips for growing your sales",
  },
];

const SUCCESS_METRICS = [
  { label: "Active Sellers", value: "12,500+", icon: Users },
  { label: "Countries Covered", value: "54", icon: Globe },
  { label: "Monthly Orders", value: "85,000+", icon: TrendingUp },
  { label: "Avg. Seller Rating", value: "4.7", icon: Star },
];

const SELLER_TOOLS = [
  { title: "Storefront Builder", description: "Create your branded online store", link: "/storefront-builder", icon: Store },
  { title: "Live Shopping", description: "Sell products in real-time video streams", link: "/live-shopping", icon: Play },
  { title: "Trade Events", description: "Showcase products at virtual trade expos", link: "/trade-events", icon: Target },
  { title: "Advertising", description: "Promote your products to reach more buyers", link: "/dashboard", icon: BarChart3 },
  { title: "Logistics Partners", description: "Set up shipping and delivery options", link: "/logistics", icon: Truck },
  { title: "Dropshipping", description: "Offer products for resellers to sell", link: "/dropship", icon: Package },
  { title: "RFQ Marketplace", description: "Bid on buyer requests for quotes", link: "/rfq", icon: DollarSign },
  { title: "Community Forum", description: "Network and learn from other sellers", link: "/community", icon: MessageCircle },
];

export default function SellerGuide() {
  const { user } = useAuth();
  const [expandedStep, setExpandedStep] = useState<string | null>("profile");

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: myProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/products?sellerId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: storefront } = useQuery({
    queryKey: ["/api/my-storefront"],
    enabled: !!user,
  });

  const isSeller = profile?.role === "trader" || profile?.role === "manufacturer";
  const hasProducts = myProducts.length > 0;
  const hasStorefront = !!(storefront as any)?.data;
  const isVerified = profile?.verificationLevel && profile.verificationLevel !== "unverified";

  const stepCompletion: Record<string, boolean> = {
    profile: !!isSeller && !!profile?.businessName,
    product: hasProducts,
    storefront: hasStorefront,
    verification: !!isVerified,
    selling: hasProducts && isSeller,
  };

  const completedCount = Object.values(stepCompletion).filter(Boolean).length;
  const progressPercent = (completedCount / GUIDE_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Seller Success Guide
            </h1>
          </div>
          {user && (
            <Link href="/dashboard">
              <Button variant="outline" data-testid="button-go-dashboard">
                My Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 py-12">
        <div className="container mx-auto px-4 text-center space-y-4">
          <Badge variant="secondary" className="gap-2" data-testid="badge-guide-label">
            <Award className="h-4 w-4" />
            Getting Started
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-guide-heading">
            Your Path to <span className="text-primary">Selling Success</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow these 5 steps to set up your seller account and start reaching buyers across Africa. 
            Complete each step to unlock the full potential of the platform.
          </p>

          {user && (
            <div className="max-w-md mx-auto pt-4">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-sm font-medium" data-testid="text-progress-label">
                  Your Progress
                </span>
                <span className="text-sm text-muted-foreground" data-testid="text-progress-count">
                  {completedCount} of {GUIDE_STEPS.length} steps complete
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" data-testid="progress-bar" />
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <section className="space-y-4" data-testid="section-steps">
            <h2 className="text-2xl font-bold">Step-by-Step Setup</h2>
            <p className="text-muted-foreground">
              Follow each step to get your seller account fully configured and ready for sales.
            </p>

            <div className="space-y-4">
              {GUIDE_STEPS.map((step) => {
                const isComplete = user ? stepCompletion[step.id] : false;
                const isExpanded = expandedStep === step.id;

                return (
                  <Card
                    key={step.id}
                    className={isComplete ? "border-green-200 dark:border-green-900" : ""}
                    data-testid={`card-step-${step.id}`}
                  >
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      data-testid={`button-toggle-step-${step.id}`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        isComplete
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-primary/10"
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <span className="text-sm font-bold text-primary">{step.number}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{step.title}</h3>
                          {isComplete && (
                            <Badge variant="secondary" className="text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30">
                              Complete
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{step.description}</p>
                      </div>
                      <step.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>

                    {isExpanded && (
                      <CardContent className="pt-0 pb-4 space-y-4">
                        <div className="border-t pt-4">
                          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-medium">Pro Tips</span>
                            </div>
                            <ul className="space-y-2">
                              {step.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Circle className="w-1.5 h-1.5 mt-2 flex-shrink-0 fill-current" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Card className="mt-4 bg-muted/50">
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <Play className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{step.videoTitle}</p>
                                <p className="text-xs text-muted-foreground">Video tutorial coming soon</p>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="mt-4">
                            <Link href={step.actionLink}>
                              <Button data-testid={`button-action-${step.id}`}>
                                {step.actionLabel}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-6" data-testid="section-metrics">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Join a Thriving Marketplace</h2>
              <p className="text-muted-foreground">
                Thousands of sellers are already growing their businesses on Ghani Africa
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUCCESS_METRICS.map((metric, idx) => (
                <Card key={idx} data-testid={`card-metric-${idx}`}>
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <metric.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold" data-testid={`text-metric-value-${idx}`}>{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6" data-testid="section-tools">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Seller Tools & Resources</h2>
              <p className="text-muted-foreground">
                Everything you need to manage and grow your business
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SELLER_TOOLS.map((tool, idx) => (
                <Link key={idx} href={tool.link}>
                  <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-tool-${idx}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                        <tool.icon className="w-4 h-4 text-primary" />
                      </div>
                      <h4 className="font-medium text-sm">{tool.title}</h4>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section data-testid="section-cta">
            <Card className="bg-gradient-to-r from-primary/10 to-amber-500/10">
              <CardContent className="p-8 md:p-12 text-center space-y-4">
                <Rocket className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold">Ready to Start Selling?</h3>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  {user
                    ? "Head to your dashboard to complete your setup and start listing products."
                    : "Create your free account today and join thousands of successful sellers across Africa."}
                </p>
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" data-testid="button-cta-dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/register">
                      <Button size="lg" data-testid="button-cta-register">
                        Create Free Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/sell">
                      <Button size="lg" variant="outline" data-testid="button-cta-learn-more">
                        Learn About Selling
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="text-center space-y-4" data-testid="section-help">
            <h3 className="text-xl font-semibold">Need Help Getting Started?</h3>
            <p className="text-muted-foreground">
              Our seller support team is available to guide you through the process
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/help">
                <Button variant="outline" data-testid="button-help-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Help Center
                </Button>
              </Link>
              <Link href="/community">
                <Button variant="outline" data-testid="button-community">
                  <Users className="mr-2 h-4 w-4" />
                  Seller Community
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
