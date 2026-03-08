import { useAuth } from "@/hooks/use-auth";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  CreditCard,
  Crown,
  Check,
  Package,
  Percent,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertCircle,
  Clock,
  CalendarDays,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  Star,
} from "lucide-react";

interface SubscriptionTier {
  id: number;
  name: string;
  displayName: string;
  monthlyPrice: string;
  yearlyPrice: string;
  commissionRate: string;
  productLimit: number;
  featuredSlots: number;
  features: string[];
  isActive: boolean;
  hasVerifiedBadge: boolean;
  isHighlyRecommended: boolean;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
}

interface SubscriptionVerification {
  subscription: {
    id: number;
    sellerId: string;
    tier: string;
    tierName: string;
    status: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    hasVerifiedBadge: boolean;
    isHighlyRecommended: boolean;
    featuredSlots: number;
    commissionRate: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  status: {
    isActive: boolean;
    isPastDue: boolean;
    isCancelled: boolean;
    isExpiringSoon: boolean;
    isExpired: boolean;
    daysRemaining: number | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    currentPeriodStart: string | null;
  };
  badges: {
    hasVerifiedBadge: boolean;
    isHighlyRecommended: boolean;
  };
  benefits: {
    commissionRate: string;
    featuredSlots: number;
    productLimit: number;
    tierName: string;
  };
}

interface ProductLimitResult {
  allowed: boolean;
  currentCount?: number;
  limit?: number;
  reason?: string;
}

interface FeeCalculation {
  commission: {
    feeType: string;
    rate: string;
    amount: string;
    baseAmount: string;
    description: string;
  };
  escrowFee?: {
    feeType: string;
    rate: string;
    amount: string;
    baseAmount: string;
    description: string;
  };
  total: string;
}

const TIER_ICONS: Record<string, typeof Crown> = {
  free: Package,
  basic: Zap,
  professional: TrendingUp,
  enterprise: Crown,
};

const TIER_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  professional: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  enterprise: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

export default function SubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const isSuccess = searchParams.get("success") === "true";
  const isCancelled = searchParams.get("cancelled") === "true";
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccessBanner(true);
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/verify"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      const timer = setTimeout(() => setShowSuccessBanner(false), 15000);
      return () => clearTimeout(timer);
    }
    if (isCancelled) {
      setShowCancelBanner(true);
      const timer = setTimeout(() => setShowCancelBanner(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isCancelled]);

  const { data: verification, isLoading: verifyLoading } = useQuery<SubscriptionVerification>({
    queryKey: ["/api/subscription/verify"],
    enabled: !!user,
    refetchInterval: isSuccess ? 3000 : false,
  });

  const { data: tiers, isLoading: tiersLoading } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/subscription/tiers"],
    enabled: !!user,
  });

  const { data: productLimit } = useQuery<ProductLimitResult>({
    queryKey: ["/api/subscription/can-add-product"],
    enabled: !!user,
  });

  const { data: feePreview } = useQuery<FeeCalculation>({
    queryKey: ["/api/fees/calculate?amount=100"],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (tierName: string) => {
      const response = await apiRequest("POST", "/api/subscription/checkout", { tierName, interval: "monthly" });
      return await response.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/portal");
      return await response.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    },
  });

  if (authLoading || verifyLoading || tiersLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[400px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Please sign in to manage your subscription</p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sub = verification?.subscription;
  const status = verification?.status;
  const badges = verification?.badges;
  const benefits = verification?.benefits;
  const currentTierName = sub?.tierName || sub?.tier || "free";
  const currentDisplayName = benefits?.tierName || "Free";
  const CurrentTierIcon = TIER_ICONS[currentTierName] || Package;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Seller Subscription</h1>
          <p className="text-muted-foreground">Manage your plan and view your fees</p>
        </div>
      </div>

      <div className="space-y-8">
        {showSuccessBanner && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20" data-testid="banner-success">
            <CardContent className="flex items-start gap-4 py-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">
                  Payment Successful! Your plan is being activated...
                </h3>
                <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                  Your <strong>{currentDisplayName}</strong> plan is now active. Your profile has been updated with your new benefits.
                  {badges?.hasVerifiedBadge && " Your Verified Seller badge is now visible to buyers."}
                  {badges?.isHighlyRecommended && " Your Highly Recommended status is now active."}
                </p>
                {benefits && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      <Percent className="w-3 h-3 mr-1" />
                      {parseFloat(benefits.commissionRate)}% Commission
                    </Badge>
                    {benefits.featuredSlots > 0 && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        <Star className="w-3 h-3 mr-1" />
                        {benefits.featuredSlots} Featured Slots
                      </Badge>
                    )}
                    {badges?.hasVerifiedBadge && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        Verified Seller
                      </Badge>
                    )}
                    {badges?.isHighlyRecommended && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        <Award className="w-3 h-3 mr-1" />
                        Highly Recommended
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSuccessBanner(false)}
                data-testid="button-dismiss-success"
              >
                <XCircle className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {showCancelBanner && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20" data-testid="banner-cancelled">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-400">
                Checkout was cancelled. No changes were made to your subscription. You can try again anytime.
              </p>
              <Button variant="ghost" size="icon" onClick={() => setShowCancelBanner(false)}>
                <XCircle className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {status?.isPastDue && (
          <Card className="border-red-500 bg-red-50 dark:bg-red-950/20" data-testid="banner-past-due">
            <CardContent className="flex items-start gap-4 py-4">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 dark:text-red-400">Payment Issue</h4>
                <p className="text-sm text-red-700 dark:text-red-500 mt-1">
                  Your last payment failed. Please update your payment method to keep your plan benefits.
                  If not resolved, your account will be downgraded to the Free plan.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => portalMutation.mutate()} data-testid="button-fix-payment">
                Fix Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {status?.isExpiringSoon && status.cancelAtPeriodEnd && (
          <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20" data-testid="banner-expiring">
            <CardContent className="flex items-start gap-4 py-4">
              <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 dark:text-amber-400">Subscription Expiring Soon</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  Your <strong>{currentDisplayName}</strong> plan will expire in <strong>{status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''}</strong> on {formatDate(status.currentPeriodEnd)}.
                  After that, you'll be downgraded to the Free plan with 8% commission.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => portalMutation.mutate()} data-testid="button-resubscribe">
                Resubscribe
              </Button>
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-current-plan">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${TIER_COLORS[currentTierName]}`}>
                <CurrentTierIcon className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {currentDisplayName} Plan
                  {status?.isActive && !status?.cancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-green-600 border-green-600" data-testid="badge-active">Active</Badge>
                  )}
                  {status?.isActive && status?.cancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600" data-testid="badge-cancelling">Cancelling</Badge>
                  )}
                  {status?.isPastDue && (
                    <Badge variant="outline" className="text-red-600 border-red-600" data-testid="badge-past-due">Past Due</Badge>
                  )}
                  {status?.isCancelled && currentTierName !== 'free' && (
                    <Badge variant="outline" className="text-red-600 border-red-600" data-testid="badge-cancelled">Cancelled</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {parseFloat(benefits?.commissionRate || "8")}% commission per sale
                </CardDescription>
              </div>
            </div>
            {sub?.stripeSubscriptionId && (
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-billing"
              >
                {portalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="w-4 h-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {badges && (badges.hasVerifiedBadge || badges.isHighlyRecommended) && (
              <div className="flex flex-wrap gap-3" data-testid="section-badges">
                {badges.hasVerifiedBadge && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <BadgeCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-400">Verified Seller</p>
                      <p className="text-xs text-green-600 dark:text-green-500">Displayed on your store and products</p>
                    </div>
                  </div>
                )}
                {badges.isHighlyRecommended && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Highly Recommended</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">Priority visibility in search results</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {status?.currentPeriodEnd && currentTierName !== 'free' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-testid="section-billing-dates">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Billing Started</p>
                    <p className="text-sm font-medium">{formatDate(status.currentPeriodStart)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {status.cancelAtPeriodEnd ? "Expires On" : "Next Renewal"}
                    </p>
                    <p className="text-sm font-medium">{formatDate(status.currentPeriodEnd)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Days Remaining</p>
                    <p className={`text-sm font-medium ${status.isExpiringSoon ? "text-amber-600" : ""}`}>
                      {status.daysRemaining !== null ? `${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {benefits && currentTierName !== 'free' && (
              <div className="border rounded-lg p-4 space-y-3" data-testid="section-plan-benefits">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Your Plan Benefits
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{parseFloat(benefits.commissionRate)}% commission rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{benefits.featuredSlots} featured product slot{benefits.featuredSlots !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Unlimited products</span>
                  </div>
                </div>
              </div>
            )}

            {productLimit && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Products Listed</span>
                  <span className="font-medium">
                    {productLimit.currentCount || 0} / {productLimit.limit === 10000 || (productLimit.limit ?? -1) < 0 ? "Unlimited" : productLimit.limit}
                  </span>
                </div>
                <Progress
                  value={((productLimit.limit ?? -1) < 0 || productLimit.limit === 10000) ? 5 : ((productLimit.currentCount || 0) / (productLimit.limit || 10)) * 100}
                  className="h-2"
                />
              </div>
            )}

            {feePreview && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Fee Breakdown (per $100 sale)
                </h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission ({feePreview.commission.rate}%)</span>
                    <span>-${feePreview.commission.amount}</span>
                  </div>
                  {feePreview.escrowFee && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Escrow Fee ({feePreview.escrowFee.rate}%)</span>
                      <span>-${feePreview.escrowFee.amount}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>You Receive</span>
                    <span className="text-green-600">${(100 - parseFloat(feePreview.total)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers?.map((tier) => {
              const TierIcon = TIER_ICONS[tier.name] || Package;
              const isCurrentTier = tier.name === currentTierName;
              const monthlyPrice = parseFloat(tier.monthlyPrice);

              return (
                <Card
                  key={tier.id}
                  className={`relative ${isCurrentTier ? "border-primary shadow-md" : ""}`}
                  data-testid={`card-tier-${tier.name.toLowerCase()}`}
                >
                  {isCurrentTier && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto p-3 rounded-lg w-fit ${TIER_COLORS[tier.name]}`}>
                      <TierIcon className="w-6 h-6" />
                    </div>
                    <CardTitle className="mt-3">{tier.displayName}</CardTitle>
                    <div className="mt-2">
                      {monthlyPrice === 0 ? (
                        <span className="text-3xl font-bold">Free</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">${monthlyPrice}</span>
                          <span className="text-muted-foreground">/month</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <span>{parseFloat(tier.commissionRate)}% commission</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>Unlimited products</span>
                      </div>
                      {tier.featuredSlots > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          <span>{tier.featuredSlots} featured slot{tier.featuredSlots !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {tier.hasVerifiedBadge && (
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-green-600" />
                          <span>Verified Seller badge</span>
                        </div>
                      )}
                      {tier.isHighlyRecommended && (
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-600" />
                          <span>Highly Recommended</span>
                        </div>
                      )}
                    </div>
                    {tier.features && tier.features.length > 0 && (
                      <div className="space-y-2">
                        {tier.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {isCurrentTier ? (
                      <Button variant="outline" className="w-full" disabled>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : monthlyPrice > (parseFloat(tiers?.find(t => t.name === currentTierName)?.monthlyPrice || "0")) ? (
                      <Button
                        className="w-full"
                        onClick={() => checkoutMutation.mutate(tier.name)}
                        disabled={checkoutMutation.isPending}
                        data-testid={`button-upgrade-${tier.name.toLowerCase()}`}
                      >
                        {checkoutMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Upgrade
                      </Button>
                    ) : (
                      <Button variant="ghost" className="w-full" disabled>
                        <span className="text-muted-foreground">Lower tier</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Platform Fees
            </CardTitle>
            <CardDescription>
              Understand how fees work on Ghani Africa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Commission Fees</h4>
                <p className="text-sm text-muted-foreground">
                  A percentage of each sale based on your subscription tier.
                  Higher tiers enjoy lower commission rates, meaning more profit for you.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Escrow Protection (2%)</h4>
                <p className="text-sm text-muted-foreground">
                  When using escrow for secure transactions, a small fee covers the
                  protection service, ensuring safe payments for both buyers and sellers.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Dropshipping Fees (3%)</h4>
                <p className="text-sm text-muted-foreground">
                  For dropship orders, a fee applies to cover the coordination
                  between suppliers and resellers on the platform.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Currency Conversion (1.5%)</h4>
                <p className="text-sm text-muted-foreground">
                  When transactions involve currency exchange across African currencies,
                  a small spread applies to cover conversion costs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
