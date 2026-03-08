import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useToast } from "@/hooks/use-toast";
import type { CartItem, Product } from "@shared/schema";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Minus,
  Plus,
  Trash2,
  Shield,
  CreditCard,
  Lock,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useEffect } from "react";
import { useCurrency } from "@/lib/currency-context";

type CartItemWithProduct = CartItem & { product: Product | null };

export default function Cart() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest("PATCH", `/api/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update quantity", variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Item removed from cart" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove item", variant: "destructive" });
    },
  });

  const handleProceedToCheckout = () => {
    navigate("/checkout");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product ? Number(item.product.price) * item.quantity : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <GradientLogo size="sm" />
            </div>
            <h1 className="font-semibold">Shopping Cart</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-muted rounded-md" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our marketplace to find great products
            </p>
            <Link href="/browse">
              <Button data-testid="button-browse">Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                        {item.product?.images && item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="font-medium hover:text-primary" data-testid={`text-cart-item-name-${item.id}`}>
                            {item.product?.name || "Product"}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-primary" data-testid={`text-cart-item-price-${item.id}`}>
                          {item.product ? formatPrice(Number(item.product.price), true, item.product.currency || "USD") : "$0.00"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.product?.city}, {item.product?.country}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          data-testid={`button-remove-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                            disabled={item.quantity <= 1}
                            data-testid={`button-decrease-qty-${item.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                            data-testid={`button-increase-qty-${item.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="text-subtotal">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-sm text-muted-foreground">Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span data-testid="text-total">{formatPrice(subtotal)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleProceedToCheckout}
                    disabled={cartItems.length === 0}
                    data-testid="button-checkout"
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </Button>

                  <div className="w-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2" data-testid="security-panel">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Buyer Protection Guarantee</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-500">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        <span>Escrow payment — seller paid only after you confirm</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-500">
                        <RefreshCw className="w-3 h-3 flex-shrink-0" />
                        <span>Auto-refund if dispute unresolved within 7 days</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-500">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>Real-time shipment tracking with proof of delivery</span>
                      </div>
                    </div>
                    <Link href="/trust-safety">
                      <a className="text-xs text-green-700 dark:text-green-400 hover:underline font-medium" data-testid="link-learn-more-protection">
                        Learn more about your protection →
                      </a>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
