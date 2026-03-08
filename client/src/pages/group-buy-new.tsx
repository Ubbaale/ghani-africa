import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import type { Product, UserProfile } from "@shared/schema";
import {
  ArrowLeft,
  Users,
  Package,
} from "lucide-react";
import { useState } from "react";

type ProductWithSeller = Product & { seller: UserProfile | null };

export default function GroupBuyNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const productId = params.get("productId");

  const [targetQty, setTargetQty] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");

  const { data: product, isLoading } = useQuery<ProductWithSeller>({
    queryKey: ["/api/products", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return response.json();
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/group-buys", {
        productId: parseInt(productId!),
        targetQty: parseInt(targetQty),
        expiresInDays: parseInt(expiresInDays),
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/group-buys"] });
      toast({ title: "Group Buy Created", description: "Share the link to invite others to join!" });
      navigate(`/group-buy/${data.id}`);
    },
    onError: (err: any) => {
      if (!user) {
        navigate("/login");
        return;
      }
      toast({ title: "Error", description: err?.message || "Failed to create group buy", variant: "destructive" });
    },
  });

  const wholesalePricing = product && Array.isArray(product.wholesalePricing)
    ? product.wholesalePricing as { minQty: number; maxQty: number | null; unitPrice: number }[]
    : [];

  const parsedTargetQty = parseInt(targetQty) || 0;
  const applicableTier = wholesalePricing.find(t => parsedTargetQty >= t.minQty && (t.maxQty === null || parsedTargetQty <= t.maxQty))
    || (parsedTargetQty > 0 ? wholesalePricing[wholesalePricing.length - 1] : null);
  const groupPrice = applicableTier ? applicableTier.unitPrice : null;
  const basePrice = product ? Number(product.price) : 0;
  const savingsPercent = groupPrice && basePrice > 0 ? Math.round((1 - groupPrice / basePrice) * 100) : 0;

  if (!productId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Product Selected</h2>
          <Link href="/browse">
            <Button data-testid="button-browse">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <GradientLogo size="sm" />
          <span className="text-sm font-medium">Start a Group Buy</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-md" />
            <div className="h-40 bg-muted rounded-md" />
          </div>
        ) : product ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" data-testid="text-product-name">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Regular price: {formatPrice(basePrice, true, product.currency || "USD")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {wholesalePricing.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Available Wholesale Tiers</h3>
                  <div className="space-y-1.5">
                    {wholesalePricing.map((tier, idx) => {
                      const isApplicable = applicableTier === tier;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-md border ${
                            isApplicable ? "bg-primary/10 border-primary" : "bg-muted/30 border-border"
                          }`}
                        >
                          <span className="text-sm">
                            {tier.maxQty ? `${tier.minQty} - ${tier.maxQty}` : `${tier.minQty}+`} units
                          </span>
                          <span className={`text-sm font-semibold ${isApplicable ? "text-primary" : ""}`}>
                            {formatPrice(tier.unitPrice, true, product.currency || "USD")}/unit
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card data-testid="card-create-group-buy">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Group Buy Settings
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="target-qty">Target Quantity (total units needed)</Label>
                  <Input
                    id="target-qty"
                    type="number"
                    min={wholesalePricing.length > 0 ? wholesalePricing[0].minQty : 2}
                    placeholder={`e.g. ${wholesalePricing.length > 0 ? wholesalePricing[0].minQty : 50}`}
                    value={targetQty}
                    onChange={(e) => setTargetQty(e.target.value)}
                    data-testid="input-target-qty"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expires-in">Duration</Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger id="expires-in" data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="21">21 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {groupPrice && parsedTargetQty > 0 && (
                  <div className="p-3 bg-muted rounded-md space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Group Price</span>
                      <span className="font-semibold text-primary" data-testid="text-estimated-group-price">
                        {formatPrice(groupPrice, true, product.currency || "USD")}/unit
                      </span>
                    </div>
                    {savingsPercent > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Savings</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {savingsPercent}% off regular price
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    createMutation.mutate();
                  }}
                  disabled={createMutation.isPending || !targetQty || parsedTargetQty < 1}
                  data-testid="button-create-group-buy"
                >
                  <Users className="w-4 h-4" />
                  {createMutation.isPending ? "Creating..." : "Create Group Buy"}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          </div>
        )}
      </div>
    </div>
  );
}
