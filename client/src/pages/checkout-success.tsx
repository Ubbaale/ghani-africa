import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, ShieldCheck, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CheckoutSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"completing" | "success" | "error">("completing");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!sessionId || calledRef.current) return;
    calledRef.current = true;

    async function completeOrder() {
      try {
        await apiRequest("POST", "/api/checkout/complete", { sessionId });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        setStatus("success");
      } catch (err) {
        console.error("Failed to complete checkout:", err);
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        setStatus("error");
      }
    }

    completeOrder();
  }, [sessionId]);

  if (status === "completing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h1 className="text-xl font-bold" data-testid="text-completing">Completing your order...</h1>
            <p className="text-muted-foreground text-sm">
              Please wait while we finalize your purchase.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold" data-testid="text-error-title">Order Processing Issue</h1>
            <p className="text-muted-foreground text-sm">
              Your payment was received but we had trouble finalizing the order. Please check your orders page — if you don't see your order, try refreshing this page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => { calledRef.current = false; setStatus("completing"); window.location.reload(); }} data-testid="button-retry">
                Try Again
              </Button>
              <Link href="/orders">
                <Button variant="outline" data-testid="button-check-orders">
                  <Package className="w-4 h-4 mr-2" /> Check My Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold" data-testid="text-success-title">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your order has been placed and payment has been secured in escrow.
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              Your Purchase is Protected
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-600 dark:text-emerald-500">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                Payment secured in escrow — seller paid after you confirm delivery
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                You will receive tracking information once the seller ships
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 flex-shrink-0" />
                File a dispute within 30 days if there's any issue
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/orders">
              <Button data-testid="button-view-orders">
                <Package className="w-4 h-4 mr-2" /> View My Orders
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" data-testid="button-continue-shopping">
                Continue Shopping <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
