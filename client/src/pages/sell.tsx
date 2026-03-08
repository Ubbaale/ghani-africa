import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import {
  ArrowLeft,
  Store,
  CheckCircle,
  TrendingUp,
  Globe,
  Users,
  Shield,
  CreditCard,
  Headphones,
  Package,
  ArrowRight,
  Zap,
  Award,
  BarChart3,
  Truck,
  MessageCircle,
  Star,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Globe,
    title: "Access 54 African Markets",
    description: "Reach buyers across all African countries from a single platform.",
  },
  {
    icon: Shield,
    title: "Secure Transactions",
    description: "Escrow payments protect both buyers and sellers. Get paid with confidence.",
  },
  {
    icon: Users,
    title: "Growing Customer Base",
    description: "Join thousands of buyers actively looking for African products and services.",
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description: "Track sales, views, and customer behavior with detailed dashboards.",
  },
  {
    icon: Truck,
    title: "Logistics Support",
    description: "Integrated shipping solutions for local and cross-border delivery.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description: "Our team is here to help you succeed with 24/7 seller support.",
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    commission: "8%",
    features: [
      "Unlimited product listings",
      "Basic store profile",
      "Standard support",
      "Access to all buyers",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Verified Seller",
    price: "$19",
    period: "/month",
    commission: "5%",
    features: [
      "Everything in Free",
      "Verified seller badge",
      "2 featured product slots",
      "Priority support",
      "Lower commission rate",
    ],
    cta: "Get Verified",
    popular: true,
  },
  {
    name: "Highly Recommended",
    price: "$49",
    period: "/month",
    commission: "3%",
    features: [
      "Everything in Verified",
      "Highly Recommended badge",
      "5 featured product slots",
      "Advanced analytics",
      "Priority search placement",
    ],
    cta: "Upgrade Now",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/month",
    commission: "1.5%",
    features: [
      "Everything in Recommended",
      "20 featured product slots",
      "Dedicated account manager",
      "API access",
      "Custom solutions",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const STEPS = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up in minutes. Choose 'Trader' or 'Manufacturer' as your account type.",
  },
  {
    step: 2,
    title: "Set Up Your Store",
    description: "Add your business details, logo, and description to build your brand.",
  },
  {
    step: 3,
    title: "List Your Products",
    description: "Upload products with photos, descriptions, and pricing. No limits on free tier!",
  },
  {
    step: 4,
    title: "Start Selling",
    description: "Receive orders, communicate with buyers, and grow your business.",
  },
];

export default function Sell() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Start Selling
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <Badge variant="secondary" className="gap-2">
            <Zap className="h-4 w-4" />
            Free to Start
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">
            Grow Your Business <span className="text-primary">Across Africa</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join Ghani Africa's marketplace and connect with millions of buyers. 
            No monthly fees to start - only pay when you make a sale.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" data-testid="button-go-to-dashboard">
                  Go to Seller Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" data-testid="button-start-selling">
                    Start Selling Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" data-testid="button-login-seller">
                    I Already Have an Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Why Sell on Ghani Africa?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The African marketplace designed to help your business thrive
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((benefit, idx) => (
                <Card key={idx} className="hover-elevate">
                  <CardContent className="p-6 space-y-3">
                    <div className="p-3 w-fit rounded-lg bg-primary/10">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">How to Get Started</h2>
              <p className="text-muted-foreground">
                Start selling in 4 simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {STEPS.map((step, idx) => (
                <div key={idx} className="relative">
                  <Card className="h-full">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-xl font-bold">
                        {step.step}
                      </div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                  {idx < STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-5 w-5 text-muted-foreground z-10" />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Start free and upgrade as you grow. Only pay a commission when you make a sale.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PRICING_TIERS.map((tier, idx) => (
                <Card 
                  key={idx} 
                  className={tier.popular ? "ring-2 ring-primary relative" : ""}
                  data-testid={`card-tier-${tier.name.toLowerCase().replace(" ", "-")}`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle>{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {tier.commission} commission
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href={user ? "/dashboard/subscription" : "/register"}>
                      <Button 
                        className="w-full" 
                        variant={tier.popular ? "default" : "outline"}
                        data-testid={`button-tier-${tier.name.toLowerCase().replace(" ", "-")}`}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <Card className="bg-gradient-to-r from-primary/10 to-amber-500/10">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <Award className="h-16 w-16 mx-auto text-primary" />
                <h3 className="text-2xl md:text-3xl font-bold">
                  Ready to Start Your African Business Journey?
                </h3>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Join thousands of successful sellers on Ghani Africa. 
                  Create your free store today and start reaching customers across the continent.
                </p>
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" data-testid="button-final-dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/register">
                    <Button size="lg" data-testid="button-final-register">
                      Create Your Free Store
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Have Questions?</h3>
            <p className="text-muted-foreground">
              Our seller support team is ready to help you get started
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/help">
                <Button variant="outline" data-testid="button-seller-help">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Help Center
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
