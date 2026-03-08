import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageSelector } from "@/components/language-selector";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Lock,
  CreditCard,
  Truck,
  RefreshCw,
  MessageCircle,
  Award,
  Clock,
  ShieldCheck,
  Package,
  AlertTriangle,
  ArrowRight,
  Wallet,
  UserCheck,
  Eye,
  DollarSign,
  Star,
  Zap,
  Crown,
  XCircle,
} from "lucide-react";

const PROTECTION_FEATURES = [
  {
    icon: Lock,
    title: "Secure Escrow Payments",
    description: "Your payment is held safely until you confirm receipt of goods. No funds released without your approval.",
  },
  {
    icon: Package,
    title: "Quality Verification",
    description: "Verify products before confirming delivery. Report any issues for immediate resolution.",
  },
  {
    icon: RefreshCw,
    title: "Automatic Refunds",
    description: "7-day auto-refund if disputes are not resolved. No need to chase sellers for your money.",
  },
  {
    icon: MessageCircle,
    title: "Dispute Mediation",
    description: "Dedicated team mediates between buyers and sellers with evidence-based resolution.",
  },
  {
    icon: Shield,
    title: "Verified Suppliers",
    description: "Trust scores, identity verification, and trade history visible for every seller.",
  },
  {
    icon: Eye,
    title: "Real-Time Tracking",
    description: "Track shipments with proof of delivery including OTP verification, photos, and signatures.",
  },
];

const ESCROW_FLOW_STEPS = [
  { icon: CreditCard, label: "Buyer Pays", detail: "Payment secured in Ghani Africa escrow", color: "from-blue-500 to-blue-600", bg: "bg-blue-100 dark:bg-blue-950/50", text: "text-blue-600 dark:text-blue-400" },
  { icon: Lock, label: "Funds Held", detail: "Protected until delivery confirmed", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400" },
  { icon: Truck, label: "Seller Ships", detail: "Real-time tracking provided", color: "from-purple-500 to-purple-600", bg: "bg-purple-100 dark:bg-purple-950/50", text: "text-purple-600 dark:text-purple-400" },
  { icon: Package, label: "Buyer Receives", detail: "Quality verified with proof of delivery", color: "from-amber-500 to-amber-600", bg: "bg-amber-100 dark:bg-amber-950/50", text: "text-amber-600 dark:text-amber-400" },
  { icon: Wallet, label: "Funds Released", detail: "Seller receives payment safely", color: "from-green-500 to-green-600", bg: "bg-green-100 dark:bg-green-950/50", text: "text-green-600 dark:text-green-400" },
];

const COVERAGE = [
  { item: "Product not as described", covered: true },
  { item: "Product not received", covered: true },
  { item: "Quality issues", covered: true },
  { item: "Shipping damage", covered: true },
  { item: "Counterfeit products", covered: true },
  { item: "Late delivery (significant)", covered: true },
  { item: "Seller fraud", covered: true },
  { item: "Change of mind", covered: false },
  { item: "Minor color variations", covered: false },
  { item: "Used/worn items", covered: false },
];

const PROTECTION_TIERS = [
  {
    name: "Standard",
    icon: Shield,
    color: "border-gray-200 dark:border-gray-700",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    coverage: "Up to $5,000",
    features: [
      "Escrow payment protection",
      "30-day dispute window",
      "Quality guarantee",
      "On-time delivery tracking",
      "Standard dispute resolution",
    ],
    notIncluded: ["Extended coverage", "Priority support", "Inspection service"],
  },
  {
    name: "Premium",
    icon: ShieldCheck,
    color: "border-blue-300 dark:border-blue-700 ring-2 ring-blue-100 dark:ring-blue-900/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    coverage: "Up to $15,000",
    popular: true,
    features: [
      "Escrow payment protection",
      "30-day dispute window",
      "Quality guarantee",
      "On-time delivery tracking",
      "Priority dispute resolution",
      "Extended coverage (up to 150%)",
      "Dedicated support agent",
    ],
    notIncluded: ["Third-party inspection"],
  },
  {
    name: "Enterprise",
    icon: Crown,
    color: "border-amber-300 dark:border-amber-700",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    coverage: "Custom limits",
    features: [
      "Escrow payment protection",
      "Extended dispute window (60 days)",
      "Quality guarantee + inspection",
      "Full logistics tracking",
      "Priority dispute resolution",
      "Custom coverage limits",
      "Dedicated account manager",
      "Third-party inspection coordination",
    ],
    notIncluded: [],
  },
];

function AnimatedEscrowFlow() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ESCROW_FLOW_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">
        {ESCROW_FLOW_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1 w-full md:w-auto">
            <div
              className={`flex items-center gap-3 md:flex-col md:items-center md:text-center flex-1 p-3 md:p-4 rounded-xl transition-all duration-500 cursor-pointer ${
                idx <= activeStep
                  ? "bg-white dark:bg-card shadow-lg scale-105 border border-emerald-200 dark:border-emerald-800"
                  : "bg-muted/30 opacity-60"
              }`}
              onClick={() => setActiveStep(idx)}
              data-testid={`escrow-step-${idx}`}
            >
              <div className={`w-12 h-12 rounded-full ${idx <= activeStep ? step.bg : "bg-muted"} flex items-center justify-center flex-shrink-0 transition-all duration-500 ${idx === activeStep ? "ring-4 ring-emerald-200 dark:ring-emerald-800" : ""}`}>
                <step.icon className={`h-5 w-5 ${idx <= activeStep ? step.text : "text-muted-foreground"} transition-colors duration-500`} />
              </div>
              <div className="md:mt-2">
                <p className={`text-sm font-semibold ${idx <= activeStep ? "" : "text-muted-foreground"}`}>{step.label}</p>
                <p className={`text-[11px] ${idx <= activeStep ? "text-muted-foreground" : "text-muted-foreground/50"} hidden md:block`}>{step.detail}</p>
              </div>
              {idx <= activeStep && idx === activeStep && (
                <div className="hidden md:block mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              )}
            </div>
            {idx < ESCROW_FLOW_STEPS.length - 1 && (
              <div className="hidden md:flex items-center px-1">
                <div className={`w-8 h-0.5 transition-colors duration-500 ${idx < activeStep ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />
                <ArrowRight className={`h-3 w-3 transition-colors duration-500 ${idx < activeStep ? "text-emerald-400" : "text-muted-foreground/30"}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${ESCROW_FLOW_STEPS[activeStep].bg} flex items-center justify-center`}>
            {(() => { const Icon = ESCROW_FLOW_STEPS[activeStep].icon; return <Icon className={`h-5 w-5 ${ESCROW_FLOW_STEPS[activeStep].text}`} />; })()}
          </div>
          <div>
            <p className="font-semibold text-sm">Step {activeStep + 1}: {ESCROW_FLOW_STEPS[activeStep].label}</p>
            <p className="text-xs text-muted-foreground">{ESCROW_FLOW_STEPS[activeStep].detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TradeAssurance() {
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
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Trade Assurance
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="bg-gradient-to-br from-emerald-600/10 via-emerald-500/5 to-blue-600/10 py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <Badge variant="secondary" className="gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Buyer Protection Program
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold">
            Trade with <span className="text-emerald-600 dark:text-emerald-400">Confidence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every transaction on Ghani Africa is protected with secure escrow payments,
            automatic refunds, and real-time tracking across Africa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/browse">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 gap-2" data-testid="button-start-shopping">
                <ShieldCheck className="h-4 w-4" />
                Start Shopping Securely
              </Button>
            </Link>
            <Link href="/secure-transactions">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-my-transactions">
                <Eye className="h-4 w-4" />
                My Protected Transactions
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-emerald-600" /> 100% Payment Protection</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-emerald-600" /> 7-Day Auto-Refund</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-emerald-600" /> Trusted by Thousands</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-16">

          <section className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">How Your Money is Protected</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Click each step to see how our escrow system keeps your payment safe from start to finish
              </p>
            </div>
            <AnimatedEscrowFlow />
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">What's Protected</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive coverage for safe cross-border trade across Africa
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROTECTION_FEATURES.map((feature, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-3">
                    <div className="p-3 w-fit rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                      <feature.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Protection Tiers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every purchase is protected. Higher trust scores unlock premium protection automatically.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PROTECTION_TIERS.map((tier, idx) => (
                <Card key={idx} className={`relative ${tier.color} transition-shadow hover:shadow-lg`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white gap-1">
                        <Zap className="h-3 w-3" /> Most Common
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <tier.icon className="h-6 w-6 text-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{tier.name}</h3>
                        <Badge className={tier.badge}>{tier.coverage}</Badge>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {tier.features.map((feature, fidx) => (
                        <li key={fidx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {tier.notIncluded.map((feature, fidx) => (
                        <li key={`not-${fidx}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Coverage Details</h2>
              <p className="text-muted-foreground">
                Know exactly what's covered before you buy
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-3">
                  {COVERAGE.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        item.covered ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted"
                      }`}
                    >
                      {item.covered ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={item.covered ? "" : "text-muted-foreground"}>
                        {item.item}
                      </span>
                      <Badge
                        variant={item.covered ? "default" : "secondary"}
                        className={`ml-auto text-xs ${item.covered ? "bg-emerald-600" : ""}`}
                      >
                        {item.covered ? "Covered" : "Not Covered"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-8">
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">For Sellers: Get Trade Assurance Badge</h3>
                    <p className="text-muted-foreground">
                      Build trust with buyers by becoming a verified supplier.
                      Trade Assurance sellers see higher conversion rates and customer loyalty.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Display verified seller badge on all products
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Higher coverage limits for your buyers
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Lower commission rates
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Priority placement in search results
                      </li>
                    </ul>
                  </div>
                  <div className="text-center md:text-right space-y-3">
                    <Link href="/dashboard/subscription">
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-become-verified">
                        <Award className="mr-2 h-4 w-4" />
                        Become Verified
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">Free store creation. Subscription optional.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Questions About Trade Assurance?</h3>
            <p className="text-muted-foreground">
              Visit our Help Center or Trust & Safety page for more details
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/help">
                <Button variant="outline" data-testid="button-visit-help">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Help Center
                </Button>
              </Link>
              <Link href="/trust-safety">
                <Button variant="outline" data-testid="button-trust-safety">
                  <Shield className="mr-2 h-4 w-4" />
                  Trust & Safety
                </Button>
              </Link>
              <Link href="/secure-transactions">
                <Button variant="outline" data-testid="button-dashboard">
                  <Eye className="mr-2 h-4 w-4" />
                  My Transactions
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
