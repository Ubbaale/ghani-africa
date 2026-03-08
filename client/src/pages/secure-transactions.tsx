import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { GradientLogo } from "@/components/gradient-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { LanguageSelector } from "@/components/language-selector";
import { useCurrency } from "@/lib/currency-context";
import { EscrowTracker } from "@/components/escrow-tracker";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  Clock,
  DollarSign,
  Lock,
  CheckCircle,
  AlertTriangle,
  Package,
  Truck,
  RefreshCw,
  Eye,
  Timer,
  Loader2,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Wallet,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface ProtectedOrder {
  orderId: number;
  orderStatus: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  escrow: {
    status: string;
    milestones: string[];
    amount: string;
    releaseCondition: string;
  };
  shipment: {
    trackingNumber: string;
    status: string;
    courierName: string;
    estimatedDelivery: string;
  } | null;
  seller: {
    id: string;
    name: string;
    trustScore: number;
    trustLevel: string;
  };
  protection: {
    tier: string;
    coverageAmount: string;
    autoReleaseDays: number;
    disputeWindowDays: number;
    autoReleaseDate: string;
    disputeWindowEnd: string;
  };
  role: string;
}

interface DashboardData {
  orders: ProtectedOrder[];
  stats: {
    totalProtected: number;
    totalCoverage: string;
    activeEscrows: number;
    completedTransactions: number;
    disputeCount: number;
  };
}

function CountdownTimer({ targetDate, label }: { targetDate: string; label: string }) {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (diff <= 0) {
    return (
      <span className="text-xs text-muted-foreground">Expired</span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Timer className="h-3 w-3 text-amber-500" />
      <span className="text-xs font-mono">
        {days > 0 ? `${days}d ${hours}h` : `${hours}h`}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function EscrowFlowVisualization() {
  const steps = [
    { icon: CreditCard, label: "Buyer Pays", description: "Payment secured in escrow", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-950/50" },
    { icon: Lock, label: "Funds Held", description: "Protected by Ghani Africa", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-950/50" },
    { icon: Truck, label: "Seller Ships", description: "Tracking provided to buyer", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-950/50" },
    { icon: Package, label: "Buyer Receives", description: "Quality verified by buyer", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-950/50" },
    { icon: Wallet, label: "Funds Released", description: "Seller receives payment", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-950/50" },
  ];

  return (
    <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          How Your Money is Protected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 md:flex-col md:items-center md:text-center flex-1">
                <div className={`w-10 h-10 rounded-full ${step.bg} flex items-center justify-center flex-shrink-0`}>
                  <step.icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <div className="md:mt-2">
                  <p className="text-xs font-semibold">{step.label}</p>
                  <p className="text-[10px] text-muted-foreground hidden md:block">{step.description}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0 hidden md:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            100% Money-Back Guarantee
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <Clock className="h-3.5 w-3.5" />
            7-Day Auto-Refund Protection
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <Shield className="h-3.5 w-3.5" />
            Dispute Mediation Available
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProtectedOrderCard({ order }: { order: ProtectedOrder }) {
  const { formatPrice } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HELD": return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
      case "RELEASED": return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
      case "REFUNDED": return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400";
      case "DISPUTED": return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "HELD": return "Funds Secured";
      case "RELEASED": return "Completed";
      case "REFUNDED": return "Refunded";
      case "DISPUTED": return "In Dispute";
      case "PENDING": return "Processing";
      default: return status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`protected-order-${order.orderId}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">Order #{order.orderId}</span>
              <Badge className={`text-[10px] ${getStatusColor(order.escrow.status)}`}>
                {getStatusLabel(order.escrow.status)}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {order.protection.tier}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {order.role === 'buyer' ? 'From' : 'To'}: {order.seller.name} · Trust: {order.seller.trustScore}/100
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{formatPrice(Number(order.escrow.amount))}</p>
            <p className="text-[10px] text-muted-foreground">Coverage: {formatPrice(Number(order.protection.coverageAmount))}</p>
          </div>
        </div>

        <EscrowTracker orderId={order.orderId} orderStatus={order.orderStatus} compact />

        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          {order.escrow.status === 'HELD' && (
            <>
              <CountdownTimer targetDate={order.protection.autoReleaseDate} label="auto-release" />
              <CountdownTimer targetDate={order.protection.disputeWindowEnd} label="dispute window" />
            </>
          )}
          {order.shipment && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Truck className="h-3 w-3" />
              <span>{order.shipment.courierName || 'Shipping'}</span>
              {order.shipment.trackingNumber && (
                <span className="font-mono text-[10px]">#{order.shipment.trackingNumber.slice(0, 8)}</span>
              )}
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Link href={`/orders/${order.orderId}/track`}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" data-testid={`button-track-${order.orderId}`}>
                <Eye className="h-3 w-3" />
                Track
              </Button>
            </Link>
            {order.escrow.status === 'HELD' && order.role === 'buyer' && (
              <Link href={`/orders`}>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-amber-600 border-amber-300 hover:bg-amber-50" data-testid={`button-dispute-${order.orderId}`}>
                  <AlertTriangle className="h-3 w-3" />
                  Dispute
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecureTransactions() {
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/secure-transactions/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/secure-transactions/dashboard", { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const { formatPrice } = useCurrency();

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">Sign in to view your protected transactions</p>
          <Link href="/auth">
            <Button data-testid="button-sign-in">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const activeOrders = data?.orders.filter(o => o.escrow.status === 'HELD' || o.escrow.status === 'PENDING') || [];
  const completedOrders = data?.orders.filter(o => o.escrow.status === 'RELEASED') || [];
  const disputedOrders = data?.orders.filter(o => o.escrow.status === 'DISPUTED' || o.escrow.status === 'REFUNDED') || [];

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
            <h1 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Secure Transactions
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="col-span-1">
            <CardContent className="p-3 text-center">
              <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
              <p className="text-lg font-bold">{data?.stats.totalProtected || 0}</p>
              <p className="text-[10px] text-muted-foreground">Protected Orders</p>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold">{formatPrice(Number(data?.stats.totalCoverage || 0))}</p>
              <p className="text-[10px] text-muted-foreground">Total Coverage</p>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="p-3 text-center">
              <Lock className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-lg font-bold">{data?.stats.activeEscrows || 0}</p>
              <p className="text-[10px] text-muted-foreground">Active Escrows</p>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold">{data?.stats.completedTransactions || 0}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-3 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
              <p className="text-lg font-bold">{data?.stats.disputeCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">Disputes</p>
            </CardContent>
          </Card>
        </div>

        <EscrowFlowVisualization />

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="text-xs gap-1" data-testid="tab-active">
              <Lock className="h-3 w-3" />
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs gap-1" data-testid="tab-completed">
              <CheckCircle className="h-3 w-3" />
              Completed ({completedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="disputes" className="text-xs gap-1" data-testid="tab-disputes">
              <AlertTriangle className="h-3 w-3" />
              Disputes ({disputedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-600" />
                  <h3 className="font-semibold mb-1">No Active Escrows</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    All your transactions are completed or you haven't made any protected purchases yet.
                  </p>
                  <Link href="/browse">
                    <Button variant="outline" size="sm" data-testid="button-browse">Shop Now</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map(order => <ProtectedOrderCard key={order.orderId} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold mb-1">No Completed Transactions</h3>
                  <p className="text-sm text-muted-foreground">Completed protected transactions will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map(order => <ProtectedOrderCard key={order.orderId} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="disputes" className="space-y-3">
            {disputedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-semibold mb-1">No Disputes</h3>
                  <p className="text-sm text-muted-foreground">No disputed or refunded transactions.</p>
                </CardContent>
              </Card>
            ) : (
              disputedOrders.map(order => <ProtectedOrderCard key={order.orderId} order={order} />)
            )}
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  Standard Protection
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Escrow payment protection</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> 30-day dispute window</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Quality guarantee</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> On-time delivery tracking</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Premium Protection
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-blue-600" /> Everything in Standard</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-blue-600" /> Extended coverage (up to 150%)</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-blue-600" /> Priority dispute resolution</li>
                  <li className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-blue-600" /> Dedicated support</li>
                </ul>
              </div>
              <div className="flex flex-col justify-center items-center text-center">
                <p className="text-sm font-medium mb-2">All transactions on Ghani Africa are protected</p>
                <Link href="/trade-assurance">
                  <Button size="sm" className="gap-1" data-testid="button-learn-more">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
