import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Clock,
  Shield,
  CheckCircle,
  Circle,
  AlertTriangle,
  FileCheck,
  Warehouse,
  Globe,
  PackageCheck,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Lock,
  Timer,
  RefreshCw,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { SHIPPING_MILESTONES, getMilestoneIndex, getMilestoneProgress } from "@shared/shipping";
import { useCurrency } from "@/lib/currency-context";
import { EscrowTracker } from "@/components/escrow-tracker";

const milestoneIcons: Record<string, any> = {
  order_confirmed: CheckCircle,
  packaging: Package,
  shipped: Truck,
  in_transit: Globe,
  customs_clearance: FileCheck,
  local_hub: Warehouse,
  out_for_delivery: Truck,
  delivered: PackageCheck,
};

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [otpCode, setOtpCode] = useState("");
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimReason, setClaimReason] = useState("");
  const [claimEvidence, setClaimEvidence] = useState("");

  const orderId = parseInt(id || "0");

  const { data, isLoading, error } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/logistics/order", orderId, "tracking"],
    queryFn: async () => {
      const res = await fetch(`/api/logistics/order/${orderId}/tracking`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tracking");
      return res.json();
    },
    enabled: orderId > 0,
    refetchInterval: 30000,
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/logistics/buyer/confirm-delivery", {
        shipment_id: trackingData?.shipment?.id,
        otp: otpCode || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/order", orderId, "tracking"] });
      toast({ title: "Delivery confirmed! Payment has been released to the seller." });
      setOtpCode("");
    },
    onError: () => toast({ title: "Failed to confirm delivery. Check your OTP code.", variant: "destructive" }),
  });

  const fileClaimMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/disputes", {
        orderId,
        reason: claimReason,
        description: claimEvidence,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/order", orderId, "tracking"] });
      toast({ title: "Protection claim submitted successfully. Our team will review it within 48 hours." });
      setShowClaimForm(false);
      setClaimReason("");
      setClaimEvidence("");
    },
    onError: () => toast({ title: "Failed to submit claim. Please try again.", variant: "destructive" }),
  });

  const trackingData = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tracking Not Available</h2>
            <p className="text-muted-foreground mb-4">We couldn't find tracking information for this order.</p>
            <Link href="/orders">
              <Button data-testid="link-back-orders"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { order, shipment, events, escrow, proofOfDelivery, isStale, hoursSinceLastUpdate } = trackingData;
  const currentMilestoneIdx = shipment ? getMilestoneIndex(shipment.status) : 0;
  const progress = shipment ? getMilestoneProgress(shipment.status) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="sm" data-testid="link-back-orders">
              <ArrowLeft className="h-4 w-4 mr-1" /> Orders
            </Button>
          </Link>
          <GradientLogo size="sm" />
          <div className="flex-1">
            <h1 className="text-lg font-bold" data-testid="text-order-tracking-title">Order #{order.id} Tracking</h1>
          </div>
          {shipment?.trackingNumber && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tracking:</span>
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded" data-testid="text-tracking-number">{shipment.trackingNumber}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(shipment.trackingNumber);
                  toast({ title: "Tracking number copied!" });
                }}
                data-testid="button-copy-tracking"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!trackingData.hasShipment ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Shipment Not Yet Created</h2>
              <p className="text-muted-foreground mb-2">
                The seller hasn't created a shipment for this order yet.
                Your payment is safely held in escrow until delivery is confirmed.
              </p>
              <Badge variant="outline" className="text-sm">
                Order Status: {order.status}
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <>
            {isStale && (
              <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-700 dark:text-orange-400">No Recent Updates</h3>
                      <p className="text-sm text-orange-600 dark:text-orange-300">
                        This shipment hasn't been updated in {hoursSinceLastUpdate} hours.
                        The seller has been notified. If you don't see an update soon, you can open a dispute.
                      </p>
                      <Link href={`/orders`}>
                        <Button variant="outline" size="sm" className="mt-2 border-orange-500 text-orange-700" data-testid="button-open-dispute">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Open Dispute
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipment Progress
                </CardTitle>
                <CardDescription>
                  {shipment.courierName && `Courier: ${shipment.courierName} | `}
                  Priority: {shipment.priority || "Standard"}
                  {shipment.estimatedDelivery && ` | ETA: ${new Date(shipment.estimatedDelivery).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                      data-testid="progress-bar"
                    />
                  </div>
                </div>

                <div className="space-y-0">
                  {SHIPPING_MILESTONES.map((milestone, idx) => {
                    const Icon = milestoneIcons[milestone.key] || Circle;
                    const isCompleted = idx <= currentMilestoneIdx;
                    const isCurrent = idx === currentMilestoneIdx;
                    const matchingEvent = events?.find((e: any) => e.status === milestone.key);

                    return (
                      <div key={milestone.key} className="flex items-start gap-4" data-testid={`milestone-${milestone.key}`}>
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 border-2 ${
                            isCompleted ? "bg-primary border-primary text-primary-foreground" :
                            isCurrent ? "border-primary text-primary bg-primary/10" :
                            "border-muted-foreground/30 text-muted-foreground/30"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < SHIPPING_MILESTONES.length - 1 && (
                            <div className={`w-0.5 h-8 ${isCompleted ? "bg-primary" : "bg-muted-foreground/20"}`} />
                          )}
                        </div>
                        <div className={`pb-6 ${isCompleted ? "" : "opacity-50"}`}>
                          <p className={`font-medium text-sm ${isCurrent ? "text-primary" : ""}`}>
                            {milestone.label}
                            {isCurrent && <Badge variant="secondary" className="ml-2 text-[10px]">Current</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">{milestone.description}</p>
                          {matchingEvent?.timestamp && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(matchingEvent.timestamp).toLocaleString()}
                              {matchingEvent.location && ` - ${matchingEvent.location}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {escrow && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Shield className="h-5 w-5" />
                    Buyer Protection - Escrow
                  </CardTitle>
                  <CardDescription>Your payment is securely held until delivery is confirmed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Held</p>
                      <p className="text-lg font-bold" data-testid="text-escrow-amount">
                        {formatPrice(Number(escrow.amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Escrow Status</p>
                      <Badge variant={escrow.status === "held" ? "secondary" : escrow.status === "released" ? "default" : "outline"} data-testid="text-escrow-status">
                        {escrow.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Release Condition</p>
                      <p className="text-sm font-medium">{escrow.releaseCondition === "delivery_confirmed" ? "Delivery Confirmed" : escrow.releaseCondition}</p>
                    </div>
                  </div>
                  <EscrowTracker orderId={orderId} orderStatus={shipment?.status || "pending"} />
                </CardContent>
              </Card>
            )}

            {shipment.status === "delivered" && !proofOfDelivery?.verified && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-blue-600" />
                    Confirm Delivery
                  </CardTitle>
                  <CardDescription>
                    Your package has arrived. Please confirm delivery to release payment to the seller.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">OTP Code (if provided by courier)</label>
                      <Input
                        placeholder="Enter 6-digit OTP (optional)"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        data-testid="input-otp"
                      />
                    </div>
                    <Button
                      onClick={() => confirmDeliveryMutation.mutate()}
                      disabled={confirmDeliveryMutation.isPending}
                      data-testid="button-confirm-delivery"
                    >
                      {confirmDeliveryMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Confirm Delivery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {proofOfDelivery?.verified && (
              <Card className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-bold text-green-700 dark:text-green-400">Delivery Confirmed</h3>
                      <p className="text-sm text-green-600 dark:text-green-300">
                        {proofOfDelivery.recipientName && `Received by: ${proofOfDelivery.recipientName} | `}
                        {proofOfDelivery.verifiedAt && `Verified: ${new Date(proofOfDelivery.verifiedAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {events && events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tracking Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3" data-testid={`event-${idx}`}>
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                          {idx < events.length - 1 && <div className="w-0.5 h-full bg-muted-foreground/20 min-h-[20px]" />}
                        </div>
                        <div className="pb-3">
                          <p className="font-medium text-sm">{event.description || event.status}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {event.timestamp && <span>{new Date(event.timestamp).toLocaleString()}</span>}
                            {event.location && (
                              <>
                                <span>-</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shipment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="font-medium">{(shipment.pickupAddress as any)?.city}, {(shipment.pickupAddress as any)?.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="font-medium">{(shipment.deliveryAddress as any)?.city}, {(shipment.deliveryAddress as any)?.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Location</p>
                    <p className="font-medium">{shipment.currentLocation || "Not updated yet"}</p>
                  </div>
                  {shipment.shippingCost && (
                    <div>
                      <p className="text-muted-foreground">Shipping Cost</p>
                      <p className="font-medium">{formatPrice(Number(shipment.shippingCost))}</p>
                    </div>
                  )}
                  {shipment.packageInfo && (
                    <div>
                      <p className="text-muted-foreground">Package</p>
                      <p className="font-medium">
                        {(shipment.packageInfo as any)?.weight_kg && `${(shipment.packageInfo as any).weight_kg}kg`}
                        {(shipment.packageInfo as any)?.type && ` - ${(shipment.packageInfo as any).type}`}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{new Date(shipment.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" data-testid="card-protection-summary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Order Protection Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-background/40 rounded-lg">
                    <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Escrow Status</p>
                      <p className="text-xs font-semibold capitalize">{escrow?.status || 'Protected'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-background/40 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Amount Protected</p>
                      <p className="text-xs font-semibold">{formatPrice(Number(escrow?.amount || order.totalAmount))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-background/40 rounded-lg">
                    <Timer className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Dispute Window</p>
                      <p className="text-xs font-semibold">30 days from delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white/60 dark:bg-background/40 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Auto-Refund</p>
                      <p className="text-xs font-semibold">7 days if unresolved</p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Quality guaranteed</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Proof of delivery required</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Mediated dispute resolution</span>
                </div>
                <Separator />
                {!showClaimForm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    onClick={() => setShowClaimForm(true)}
                    data-testid="button-file-claim"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> File a Protection Claim
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 bg-white/80 dark:bg-background/60 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Submit Protection Claim</p>
                    <select
                      className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                      value={claimReason}
                      onChange={(e) => setClaimReason(e.target.value)}
                      data-testid="select-claim-reason"
                    >
                      <option value="">Select reason...</option>
                      <option value="item_not_received">Item not received</option>
                      <option value="item_damaged">Item damaged/defective</option>
                      <option value="item_not_as_described">Item not as described</option>
                      <option value="wrong_item">Wrong item received</option>
                      <option value="quality_issue">Quality issue</option>
                    </select>
                    <Textarea
                      placeholder="Describe the issue with your order. Include any relevant details about what went wrong."
                      value={claimEvidence}
                      onChange={(e) => setClaimEvidence(e.target.value)}
                      rows={3}
                      className="text-sm"
                      data-testid="textarea-claim-evidence"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => fileClaimMutation.mutate()}
                        disabled={!claimReason || !claimEvidence || fileClaimMutation.isPending}
                        data-testid="button-submit-claim"
                      >
                        {fileClaimMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                        Submit Claim
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setShowClaimForm(false); setClaimReason(""); setClaimEvidence(""); }}
                        data-testid="button-cancel-claim"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Link href="/secure-transactions">
                <Button variant="outline" size="sm" data-testid="link-secure-transactions">
                  <ShieldCheck className="h-4 w-4 mr-1" /> My Protected Transactions
                </Button>
              </Link>
              <Link href="/track">
                <Button variant="outline" size="sm" data-testid="link-public-tracking">
                  <ExternalLink className="h-4 w-4 mr-1" /> Public Tracking Page
                </Button>
              </Link>
              <Link href="/trade-assurance">
                <Button variant="outline" size="sm" data-testid="link-trade-assurance">
                  <Shield className="h-4 w-4 mr-1" /> Trade Assurance Info
                </Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
