import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { GradientLogo } from "@/components/gradient-logo";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, Clock, CheckCircle, Truck, XCircle, MapPin, Navigation, Star, Loader2, FileText, ChevronDown, ChevronUp, Activity, Receipt, Shield, AlertTriangle, DollarSign, Box } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import type { Order, Review, ActivityLog, Invoice } from "@shared/schema";
import { EscrowTracker } from "@/components/escrow-tracker";
import { useCurrency } from "@/lib/currency-context";

export default function Orders() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const { data: existingReviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/reviews/my-orders"],
    queryFn: async () => {
      const allReviews: Review[] = [];
      for (const order of orders) {
        if (order.status === 'delivered' || order.status === 'completed') {
          try {
            const res = await fetch(`/api/reviews/order/${order.id}`, { credentials: "include" });
            if (res.ok) {
              const data = await res.json();
              if (data.success) allReviews.push(...data.data);
            }
          } catch {}
        }
      }
      return allReviews;
    },
    enabled: !!user && orders.length > 0,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { orderId: number; revieweeId: string; rating: number; title: string; reviewText: string }) => {
      const res = await apiRequest("POST", "/api/reviews", {
        orderId: data.orderId,
        revieweeId: data.revieweeId,
        role: "buyer_reviewing_seller",
        rating: data.rating,
        title: data.title,
        reviewText: data.reviewText,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Review submitted", description: "Thank you for your feedback!" });
      setReviewDialogOpen(false);
      setRating(0);
      setReviewTitle("");
      setReviewText("");
      setReviewOrder(null);
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/my-orders"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit review", variant: "destructive" });
    },
  });

  const hasReviewedOrder = (orderId: number) => {
    return existingReviews.some(r => r.orderId === orderId && r.reviewerId === user?.id);
  };

  const openReviewDialog = (order: Order) => {
    setReviewOrder(order);
    setRating(0);
    setHoverRating(0);
    setReviewTitle("");
    setReviewText("");
    setReviewDialogOpen(true);
  };

  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "order_placed": return <Box className="h-3.5 w-3.5 text-blue-500" />;
      case "payment_received": return <DollarSign className="h-3.5 w-3.5 text-green-500" />;
      case "invoice_issued": return <FileText className="h-3.5 w-3.5 text-purple-500" />;
      case "order_shipped": return <Truck className="h-3.5 w-3.5 text-blue-500" />;
      case "order_delivered": return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case "escrow_held": return <Shield className="h-3.5 w-3.5 text-yellow-500" />;
      case "escrow_released": return <Shield className="h-3.5 w-3.5 text-green-500" />;
      case "dispute_opened": return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      case "dispute_resolved": return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="gap-1">
        {getStatusIcon(status)}
        {t(`orders.${status}`)}
      </Badge>
    );
  };

  const filterOrders = (status?: string) => {
    if (!status || status === "all") return orders;
    return orders.filter((o) => o.status === status);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("orders.title")}</h2>
        <p className="text-muted-foreground text-center">Please log in to view your orders</p>
        <Link href="/dashboard">
          <a className="text-primary hover:underline">{t("welcome.login")}</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold">{t("orders.title")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="all" data-testid="tab-orders-all">All</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-orders-pending">{t("orders.pending")}</TabsTrigger>
            <TabsTrigger value="confirmed" data-testid="tab-orders-confirmed">{t("orders.confirmed")}</TabsTrigger>
            <TabsTrigger value="shipped" data-testid="tab-orders-shipped">{t("orders.shipped")}</TabsTrigger>
            <TabsTrigger value="delivered" data-testid="tab-orders-delivered">{t("orders.delivered")}</TabsTrigger>
          </TabsList>

          {["all", "pending", "confirmed", "shipped", "delivered"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filterOrders(status === "all" ? undefined : status).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">{t("common.noResults")}</p>
                  </CardContent>
                </Card>
              ) : (
                filterOrders(status === "all" ? undefined : status).map((order) => (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <CardTitle className="text-base">Order #{order.id}</CardTitle>
                        {getStatusBadge(order.status || "pending")}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <EscrowTracker orderId={order.id} orderStatus={order.status || "pending"} compact />
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{order.shippingAddress ? JSON.stringify(order.shippingAddress).slice(0, 50) : "No address"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ""}
                          </span>
                          <span className="font-semibold text-lg">
                            {formatPrice(parseFloat(order.totalAmount))}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Link href={`/orders/${order.id}/track`}>
                            <Button variant="outline" size="sm" className="flex-1" data-testid={`button-track-order-${order.id}`}>
                              <Navigation className="h-4 w-4 mr-1" /> Track
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            data-testid={`button-details-order-${order.id}`}
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            {expandedOrder === order.id ? "Hide" : "Details"}
                            {expandedOrder === order.id ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                          </Button>
                          {(order.status === 'delivered' || order.status === 'completed') && !hasReviewedOrder(order.id) && (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => openReviewDialog(order)}
                              data-testid={`button-review-order-${order.id}`}
                            >
                              <Star className="h-4 w-4 mr-1" /> Leave Review
                            </Button>
                          )}
                          {hasReviewedOrder(order.id) && (
                            <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" /> Reviewed
                            </Badge>
                          )}
                        </div>

                        {expandedOrder === order.id && (
                          <OrderDetails orderId={order.id} getActivityIcon={getActivityIcon} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-review">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              Share your feedback about Order #{reviewOrder?.id}. Your review helps other buyers make informed decisions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-1" data-testid="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                    data-testid={`star-${star}`}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rating === 1 ? "Poor" : rating === 2 ? "Below Average" : rating === 3 ? "Average" : rating === 4 ? "Good" : "Excellent"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Title (optional)</label>
              <Input
                placeholder="Summarize your experience..."
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                data-testid="input-review-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Your Review</label>
              <Textarea
                placeholder="Tell other buyers about your experience with this seller..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                data-testid="input-review-text"
              />
            </div>
            <Button
              className="w-full"
              disabled={rating === 0 || submitReviewMutation.isPending}
              onClick={() => {
                if (reviewOrder) {
                  submitReviewMutation.mutate({
                    orderId: reviewOrder.id,
                    revieweeId: reviewOrder.sellerId,
                    rating,
                    title: reviewTitle,
                    reviewText,
                  });
                }
              }}
              data-testid="button-submit-review"
            >
              {submitReviewMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetails({ orderId, getActivityIcon }: { orderId: number; getActivityIcon: (action: string) => JSX.Element }) {
  const { formatPrice } = useCurrency();
  const { data: activityData } = useQuery<{ success: boolean; data: ActivityLog[] }>({
    queryKey: ["/api/activity/order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/activity/order/${orderId}`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: invoiceData } = useQuery<{ success: boolean; data: Invoice }>({
    queryKey: ["/api/invoices/order", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/order/${orderId}`, { credentials: "include" });
      return res.json();
    },
  });

  const activities = activityData?.data || [];
  const invoice = invoiceData?.data;

  return (
    <div className="mt-4 space-y-4 border-t pt-4" data-testid={`order-details-${orderId}`}>
      {invoice && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2" data-testid={`invoice-section-${orderId}`}>
          <div className="flex items-center gap-2 font-medium text-sm">
            <Receipt className="h-4 w-4 text-primary" />
            Invoice #{invoice.invoiceNumber}
            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="ml-auto text-xs">
              {invoice.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Subtotal: <span className="text-foreground font-medium">{formatPrice(parseFloat(invoice.subtotal))}</span></div>
            <div>Platform Fee: <span className="text-foreground font-medium">{formatPrice(parseFloat(invoice.platformFee))}</span></div>
            <div>Total: <span className="text-foreground font-semibold">{formatPrice(parseFloat(invoice.totalAmount))}</span></div>
            <div>Payment: <span className="text-foreground">{invoice.paymentMethod || 'N/A'}</span></div>
          </div>
          {invoice.lineItems && (
            <div className="text-xs space-y-1 mt-1">
              <div className="font-medium text-muted-foreground">Items:</div>
              {(invoice.lineItems as any[]).map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                  <span>{item.name} x{item.quantity}</span>
                  <span>{formatPrice(parseFloat(item.totalPrice))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-1" data-testid={`activity-timeline-${orderId}`}>
        <div className="flex items-center gap-2 font-medium text-sm mb-2">
          <Activity className="h-4 w-4 text-primary" />
          Transaction Timeline
        </div>
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground pl-6">No activity recorded yet.</p>
        ) : (
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border" />
            {activities.map((log) => (
              <div key={log.id} className="relative flex gap-3 items-start" data-testid={`activity-log-${log.id}`}>
                <div className="absolute -left-6 mt-0.5 bg-background p-0.5 rounded-full border">
                  {getActivityIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{log.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{log.actorType}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
