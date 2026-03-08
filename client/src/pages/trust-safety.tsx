import { GradientLogo } from "@/components/gradient-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Shield,
  Lock,
  CreditCard,
  RefreshCw,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock,
  Truck,
  MessageCircle,
  ArrowLeft,
  FileText,
  Eye,
  Users,
  Scale,
  Wallet,
} from "lucide-react";

export default function TrustSafety() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <GradientLogo size="sm" />
          <h1 className="text-xl font-bold">Trust & Safety Center</h1>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-8 pb-12">
        <section className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2" data-testid="text-hero-title">Your Safety is Our Priority</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ghani Africa is built with multiple layers of protection to ensure safe, fair, and
            transparent trade for everyone on our platform. Here's how we protect buyers, sellers, and
            manufacturers across Africa.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Buyer Protection
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ProtectionCard
              icon={<Lock className="h-6 w-6 text-green-600" />}
              title="Escrow Payment Protection"
              description="Your money is held safely in escrow when you place an order. The seller only receives payment after you confirm delivery. This prevents fraud and ensures you get what you paid for."
              badge="Active on All Orders"
              testId="card-escrow"
            />
            <ProtectionCard
              icon={<RefreshCw className="h-6 w-6 text-blue-600" />}
              title="7-Day Automatic Refund"
              description="If a dispute is opened and the seller doesn't resolve it within 7 days, your money is automatically refunded to your wallet. No waiting, no hassle."
              badge="Automatic"
              testId="card-auto-refund"
            />
            <ProtectionCard
              icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
              title="Automatic Dispute Creation"
              description="If your shipment has no tracking updates for 5 days, the system automatically opens a dispute on your behalf and freezes the escrow funds to protect your purchase."
              badge="24/7 Monitoring"
              testId="card-auto-dispute"
            />
            <ProtectionCard
              icon={<Eye className="h-6 w-6 text-purple-600" />}
              title="Proof of Delivery Verification"
              description="Every delivery requires proof including OTP verification codes, delivery photos, and recipient signatures. This creates an indisputable record that your package was received."
              badge="Multi-Factor Verification"
              testId="card-pod"
            />
            <ProtectionCard
              icon={<Star className="h-6 w-6 text-yellow-600" />}
              title="Seller Ratings & Reviews"
              description="Read reviews from verified buyers before making a purchase. Every review is tied to a confirmed order, so you can trust the feedback is genuine."
              badge="Verified Purchase Reviews"
              testId="card-reviews"
            />
            <ProtectionCard
              icon={<Truck className="h-6 w-6 text-indigo-600" />}
              title="Real-Time Shipment Tracking"
              description="Track your order every step of the way with milestone updates from pickup to delivery. Get notified if there are any delays or issues."
              badge="Live Tracking"
              testId="card-tracking"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Seller & Manufacturer Protection
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ProtectionCard
              icon={<Wallet className="h-6 w-6 text-green-600" />}
              title="Guaranteed Payment"
              description="Once you deliver the order and it's confirmed, the escrow funds are automatically released to your wallet. No risk of non-payment."
              badge="Payment Guaranteed"
              testId="card-seller-payment"
            />
            <ProtectionCard
              icon={<CheckCircle className="h-6 w-6 text-green-600" />}
              title="Verified Seller Badges"
              description="Get verified through our identity verification process or subscription plans. Verified badges build trust with buyers and increase your sales."
              badge="Trust Badges"
              testId="card-seller-badges"
            />
            <ProtectionCard
              icon={<Scale className="h-6 w-6 text-blue-600" />}
              title="Fair Dispute Resolution"
              description="Every dispute goes through admin review. Sellers have the opportunity to respond with evidence before any decision is made. We protect both sides fairly."
              badge="Admin Mediated"
              testId="card-dispute-resolution"
            />
            <ProtectionCard
              icon={<FileText className="h-6 w-6 text-purple-600" />}
              title="Business Credentials Display"
              description="Showcase your business registrations, certifications, quality standards, and awards on your store page. Verified documents get special badges."
              badge="Trust Building"
              testId="card-credentials"
            />
            <ProtectionCard
              icon={<Star className="h-6 w-6 text-yellow-600" />}
              title="Buyer Rating System"
              description="Rate your buyers after each transaction. Build a record of reliable buyers and make informed decisions about future orders."
              badge="Two-Way Reviews"
              testId="card-buyer-ratings"
            />
            <ProtectionCard
              icon={<MessageCircle className="h-6 w-6 text-teal-600" />}
              title="Direct Communication"
              description="Communicate directly with buyers through our secure messaging system. Resolve questions and build relationships without sharing personal contact details."
              badge="Secure Messaging"
              testId="card-messaging"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Platform-Wide Safety
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ProtectionCard
              icon={<Lock className="h-6 w-6 text-red-600" />}
              title="Rate Limiting & Anti-Abuse"
              description="We actively monitor and limit suspicious activity including brute-force login attempts, spam listings, and rapid-fire API requests."
              badge="Always Active"
              testId="card-rate-limiting"
            />
            <ProtectionCard
              icon={<Clock className="h-6 w-6 text-orange-600" />}
              title="Stale Shipment Monitoring"
              description="Our system continuously monitors shipment progress. If a shipment goes without updates for 24+ hours, we send reminders. After 5 days of inactivity, we automatically create a dispute."
              badge="Automated"
              testId="card-stale-monitoring"
            />
            <ProtectionCard
              icon={<Users className="h-6 w-6 text-blue-600" />}
              title="Identity Verification"
              description="Sellers can verify their identity through document uploads reviewed by our admin team. Multiple verification levels (basic, verified, trusted) help you identify reliable partners."
              badge="Multi-Level"
              testId="card-identity"
            />
            <ProtectionCard
              icon={<Truck className="h-6 w-6 text-indigo-600" />}
              title="Vetted Courier Network"
              description="All couriers go through an application and approval process before they can handle deliveries. We verify their fleet, insurance, and service capabilities."
              badge="Approved Shippers Only"
              testId="card-couriers"
            />
          </div>
        </section>

        <section className="bg-muted/50 rounded-lg p-6 text-center">
          <h3 className="font-semibold mb-2">How Escrow Works</h3>
          <div className="flex flex-wrap justify-center items-center gap-3 text-sm mb-4">
            <Step number={1} label="Buyer Pays" />
            <Arrow />
            <Step number={2} label="Funds Held in Escrow" />
            <Arrow />
            <Step number={3} label="Seller Ships" />
            <Arrow />
            <Step number={4} label="Buyer Confirms" />
            <Arrow />
            <Step number={5} label="Seller Gets Paid" />
          </div>
          <p className="text-sm text-muted-foreground">
            If the buyer doesn't confirm delivery, the seller can provide proof of delivery. If there's a dispute, our admin team mediates.
            If unresolved after 7 days, the buyer is automatically refunded.
          </p>
        </section>

        <section className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            Have questions about your protection? We're here to help.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/help">
              <Button variant="outline" data-testid="button-help">
                Visit Help Center
              </Button>
            </Link>
            <Link href="/browse">
              <Button data-testid="button-shop">
                Start Shopping Safely
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProtectionCard({ icon, title, description, badge, testId }: {
  icon: JSX.Element;
  title: string;
  description: string;
  badge: string;
  testId: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1">{icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-sm">{title}</h4>
              <Badge variant="outline" className="text-xs">{badge}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-muted-foreground text-lg hidden sm:inline">&rarr;</span>;
}
