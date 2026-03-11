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
  ShieldCheck,
  CheckCircle,
  Lock,
  CreditCard,
  Truck,
  RefreshCw,
  MessageCircle,
  Award,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  Wallet,
  UserCheck,
  Eye,
  Star,
  Scale,
  FileText,
  RotateCcw,
  Handshake,
  BadgeCheck,
  Users,
  ThumbsUp,
  XCircle,
} from "lucide-react";

const TRUST_STATS = [
  { value: "100%", label: "Payment Protection", icon: Shield },
  { value: "7 Days", label: "Auto-Refund Window", icon: Clock },
  { value: "50K+", label: "Protected Transactions", icon: ShieldCheck },
  { value: "99.2%", label: "Dispute Resolution Rate", icon: Scale },
];

const ESCROW_STEPS = [
  {
    icon: CreditCard,
    title: "Buyer Places Order",
    description: "When you make a purchase, your payment is immediately secured in our protected escrow account. The seller is notified but cannot access your funds yet.",
    color: "bg-blue-100 dark:bg-blue-950/50",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Lock,
    title: "Funds Held Securely",
    description: "Your money is held in a separate, protected account managed by Ghani Africa. Neither the seller nor any third party can touch your funds during this stage.",
    color: "bg-emerald-100 dark:bg-emerald-950/50",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Truck,
    title: "Seller Ships Order",
    description: "The seller prepares and ships your order. You receive real-time tracking updates with milestone notifications from pickup through to delivery.",
    color: "bg-purple-100 dark:bg-purple-950/50",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Package,
    title: "Buyer Confirms Receipt",
    description: "Once your order arrives, you inspect the goods and confirm delivery. Proof of delivery includes OTP verification, photos, and recipient signatures.",
    color: "bg-amber-100 dark:bg-amber-950/50",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Wallet,
    title: "Seller Receives Payment",
    description: "Only after you confirm that the order meets your expectations are the funds released to the seller. This completes the protected transaction cycle.",
    color: "bg-green-100 dark:bg-green-950/50",
    textColor: "text-green-600 dark:text-green-400",
  },
];

const DISPUTE_STEPS = [
  {
    step: 1,
    title: "Open a Dispute",
    description: "If your order doesn't match the listing, arrives damaged, or never arrives, you can open a dispute directly from your order details within 30 days of purchase.",
    icon: AlertTriangle,
  },
  {
    step: 2,
    title: "Provide Evidence",
    description: "Upload photos, videos, or documents showing the issue. The more evidence you provide, the faster we can resolve your case. Both parties can submit their side.",
    icon: FileText,
  },
  {
    step: 3,
    title: "Mediation Review",
    description: "Our dedicated dispute resolution team reviews all evidence from both the buyer and seller. We aim to reach a fair outcome within 48 hours of receiving complete information.",
    icon: Scale,
  },
  {
    step: 4,
    title: "Resolution & Refund",
    description: "Based on the evidence, we issue a resolution. If the dispute is found in your favor, a full or partial refund is processed to your wallet immediately. If unresolved after 7 days, you receive an automatic refund.",
    icon: RefreshCw,
  },
];

const VERIFIED_SELLER_LEVELS = [
  {
    level: "Basic Seller",
    icon: Users,
    color: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-400",
    borderColor: "border-gray-200 dark:border-gray-700",
    requirements: ["Email verified", "Phone number confirmed", "At least 1 listing"],
    buyerBenefit: "Standard escrow protection on all purchases",
  },
  {
    level: "Verified Seller",
    icon: BadgeCheck,
    color: "bg-blue-100 dark:bg-blue-950/50",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-700",
    requirements: ["Identity document verified", "Business registration uploaded", "10+ completed orders", "Trust score above 70"],
    buyerBenefit: "Enhanced protection with up to $15,000 coverage per transaction",
  },
  {
    level: "Trusted Seller",
    icon: Award,
    color: "bg-amber-100 dark:bg-amber-950/50",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-700",
    requirements: ["All verified requirements met", "50+ completed orders", "Trust score above 90", "Less than 2% dispute rate", "6+ months on platform"],
    buyerBenefit: "Premium protection with custom coverage limits and priority support",
  },
];

const RETURN_POLICY_ITEMS = [
  { scenario: "Product not as described", action: "Full refund or replacement", covered: true },
  { scenario: "Product not received", action: "Full refund after investigation", covered: true },
  { scenario: "Defective or damaged items", action: "Full refund or replacement", covered: true },
  { scenario: "Shipping damage (in transit)", action: "Full refund or replacement", covered: true },
  { scenario: "Counterfeit products", action: "Full refund + seller investigation", covered: true },
  { scenario: "Significant late delivery (14+ days)", action: "Partial or full refund", covered: true },
  { scenario: "Wrong item sent", action: "Full refund or correct item shipped", covered: true },
  { scenario: "Change of mind (no defect)", action: "Seller's discretion", covered: false },
  { scenario: "Minor color/size variations within listing specs", action: "Not eligible for return", covered: false },
  { scenario: "Items damaged by buyer after delivery", action: "Not eligible for return", covered: false },
];

const GUARANTEES = [
  {
    icon: Lock,
    title: "Secure Escrow Payments",
    description: "Every payment is held in a protected escrow account until you confirm receipt and satisfaction with your order.",
  },
  {
    icon: RefreshCw,
    title: "7-Day Auto-Refund",
    description: "If a dispute isn't resolved within 7 days, your funds are automatically returned to your wallet. No exceptions.",
  },
  {
    icon: Eye,
    title: "Real-Time Order Tracking",
    description: "Track every shipment from pickup to delivery with milestone updates, proof of delivery photos, and OTP verification.",
  },
  {
    icon: Scale,
    title: "Fair Dispute Resolution",
    description: "Our dedicated team reviews evidence from both parties and aims to resolve disputes within 48 hours.",
  },
  {
    icon: UserCheck,
    title: "Verified Sellers",
    description: "Multi-level seller verification with identity checks, business registration, and ongoing trust scoring.",
  },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    description: "Access our help center, AI assistant, or contact our support team anytime you need assistance with an order.",
  },
];

function AnimatedEscrowDiagram() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ESCROW_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-3 md:gap-0">
        {ESCROW_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1 w-full md:w-auto">
            <div
              className={`flex items-center gap-3 md:flex-col md:items-center md:text-center flex-1 p-3 md:p-4 rounded-xl transition-all duration-500 cursor-pointer ${
                idx <= activeStep
                  ? "bg-white dark:bg-card shadow-lg scale-105 border border-emerald-200 dark:border-emerald-800"
                  : "bg-muted/30 opacity-60"
              }`}
              onClick={() => setActiveStep(idx)}
              data-testid={`escrow-diagram-step-${idx}`}
            >
              <div className={`w-12 h-12 rounded-full ${idx <= activeStep ? step.color : "bg-muted"} flex items-center justify-center flex-shrink-0 transition-all duration-500 ${idx === activeStep ? "ring-4 ring-emerald-200 dark:ring-emerald-800" : ""}`}>
                <step.icon className={`h-5 w-5 ${idx <= activeStep ? step.textColor : "text-muted-foreground"} transition-colors duration-500`} />
              </div>
              <div className="md:mt-2">
                <p className={`text-sm font-semibold ${idx <= activeStep ? "" : "text-muted-foreground"}`}>{step.title}</p>
              </div>
            </div>
            {idx < ESCROW_STEPS.length - 1 && (
              <div className="hidden md:flex items-center px-1">
                <div className={`w-8 h-0.5 transition-colors duration-500 ${idx < activeStep ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />
                <ArrowRight className={`h-3 w-3 transition-colors duration-500 ${idx < activeStep ? "text-emerald-400" : "text-muted-foreground/30"}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 transition-all duration-500">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${ESCROW_STEPS[activeStep].color} flex items-center justify-center flex-shrink-0`}>
            {(() => {
              const Icon = ESCROW_STEPS[activeStep].icon;
              return <Icon className={`h-5 w-5 ${ESCROW_STEPS[activeStep].textColor}`} />;
            })()}
          </div>
          <div>
            <p className="font-semibold text-sm">Step {activeStep + 1}: {ESCROW_STEPS[activeStep].title}</p>
            <p className="text-sm text-muted-foreground mt-1">{ESCROW_STEPS[activeStep].description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuyerProtection() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Buyer Protection
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="bg-gradient-to-br from-emerald-600/10 via-emerald-500/5 to-blue-600/10 py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <Badge variant="secondary" className="gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            Ghani Africa Buyer Guarantee
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold" data-testid="text-hero-title">
            Shop with <span className="text-emerald-600 dark:text-emerald-400">Complete Confidence</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-hero-description">
            Every purchase on Ghani Africa is backed by our comprehensive buyer protection program.
            Your money, your order, and your experience are fully protected.
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
            {TRUST_STATS.map((stat, idx) => (
              <div key={idx} className="text-center" data-testid={`stat-${idx}`}>
                <stat.icon className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-16">

          <section className="space-y-6" data-testid="section-escrow">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Escrow Protection
              </Badge>
              <h2 className="text-3xl font-bold">How Escrow Protects Your Money</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our secure escrow system ensures your payment is never released until you confirm you've received exactly what you ordered. Click each step to learn more.
              </p>
            </div>
            <AnimatedEscrowDiagram />
          </section>

          <section className="space-y-6" data-testid="section-guarantees">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="gap-1">
                <Handshake className="h-3 w-3" />
                Our Guarantees
              </Badge>
              <h2 className="text-3xl font-bold">Trade Assurance Guarantee</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every transaction on Ghani Africa comes with built-in protections. No extra cost, no signup required.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {GUARANTEES.map((guarantee, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow" data-testid={`guarantee-card-${idx}`}>
                  <CardContent className="p-6 space-y-3">
                    <div className="p-3 w-fit rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                      <guarantee.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold">{guarantee.title}</h3>
                    <p className="text-sm text-muted-foreground">{guarantee.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-6" data-testid="section-disputes">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="gap-1">
                <Scale className="h-3 w-3" />
                Dispute Resolution
              </Badge>
              <h2 className="text-3xl font-bold">Dispute Resolution Process</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                If something goes wrong with your order, our structured dispute process ensures a fair and timely resolution.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {DISPUTE_STEPS.map((item, idx) => (
                <Card key={idx} data-testid={`dispute-step-${idx}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{item.step}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{item.title}</h3>
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Automatic Protection</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      If your shipment has no tracking updates for 5 consecutive days, our system automatically opens a dispute
                      on your behalf and freezes the escrow funds. If the dispute remains unresolved for 7 days,
                      you receive a full automatic refund. No action needed from you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6" data-testid="section-verified-sellers">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                Seller Verification
              </Badge>
              <h2 className="text-3xl font-bold">Verified Seller Program</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our multi-level verification system helps you identify trustworthy sellers. Higher verification levels mean more protection for you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {VERIFIED_SELLER_LEVELS.map((level, idx) => (
                <Card key={idx} className={`${level.borderColor}`} data-testid={`seller-level-${idx}`}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${level.color}`}>
                        <level.icon className={`h-6 w-6 ${level.textColor}`} />
                      </div>
                      <h3 className="font-bold text-lg">{level.level}</h3>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Requirements</p>
                      <ul className="space-y-1.5">
                        {level.requirements.map((req, ridx) => (
                          <li key={ridx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Your Protection</p>
                      <p className="text-sm">{level.buyerBenefit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link href="/buyer-verification">
                <Button variant="outline" className="gap-2" data-testid="button-check-verification">
                  <UserCheck className="h-4 w-4" />
                  Check Seller Verification Status
                </Button>
              </Link>
            </div>
          </section>

          <section className="space-y-6" data-testid="section-return-policy">
            <div className="text-center space-y-4">
              <Badge variant="outline" className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Return Policy
              </Badge>
              <h2 className="text-3xl font-bold">Return & Refund Policy</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Clear rules about what's covered and what's not, so you always know your rights before purchasing.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-3">
                  {RETURN_POLICY_ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-lg ${
                        item.covered ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-muted"
                      }`}
                      data-testid={`return-policy-${idx}`}
                    >
                      {item.covered ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${item.covered ? "" : "text-muted-foreground"}`}>
                          {item.scenario}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.action}</p>
                      </div>
                      <Badge
                        variant={item.covered ? "default" : "secondary"}
                        className={`text-xs flex-shrink-0 ${item.covered ? "bg-emerald-600" : ""}`}
                      >
                        {item.covered ? "Covered" : "Not Covered"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section data-testid="section-cta">
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Ready to Shop with Confidence?</h3>
                    <p className="text-muted-foreground">
                      Every purchase on Ghani Africa is automatically protected. Browse thousands of products
                      from verified African sellers with the peace of mind that your money is safe.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        No extra fees for buyer protection
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Automatic escrow on every transaction
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Dedicated dispute resolution team
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        7-day automatic refund guarantee
                      </li>
                    </ul>
                  </div>
                  <div className="text-center md:text-right space-y-3">
                    <Link href="/browse">
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-browse-products">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Browse Protected Products
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">All products are covered by our buyer protection program</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="text-center space-y-4" data-testid="section-links">
            <h3 className="text-xl font-semibold">Learn More About Our Platform</h3>
            <p className="text-muted-foreground">
              Explore our other trust and safety resources
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/trade-assurance">
                <Button variant="outline" data-testid="button-trade-assurance">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Trade Assurance
                </Button>
              </Link>
              <Link href="/trust-safety">
                <Button variant="outline" data-testid="button-trust-safety">
                  <Shield className="mr-2 h-4 w-4" />
                  Trust & Safety
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" data-testid="button-help">
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
