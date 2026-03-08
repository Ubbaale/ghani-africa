import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, ShoppingCart, ArrowLeft } from "lucide-react";

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold" data-testid="text-cancel-title">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              Your payment was cancelled and no charges were made. Your cart items are still saved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/cart">
              <Button data-testid="button-return-to-cart">
                <ShoppingCart className="w-4 h-4 mr-2" /> Return to Cart
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" data-testid="button-continue-browsing">
                <ArrowLeft className="w-4 h-4 mr-2" /> Continue Browsing
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
