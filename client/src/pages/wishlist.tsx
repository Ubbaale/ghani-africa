import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, WishlistItem } from "@shared/schema";
import { Heart, Package, MapPin, Trash2, ShoppingCart, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/lib/currency-context";

type WishlistItemWithProduct = WishlistItem & { product: Product | null };

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const { data: wishlistItems, isLoading } = useQuery<WishlistItemWithProduct[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("DELETE", `/api/wishlist/product/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Removed from wishlist",
        description: "Product removed from your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove from wishlist",
        variant: "destructive",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("POST", "/api/cart", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Product added to your cart",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to cart",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h1>
        <p className="text-muted-foreground mb-6 text-center">
          Save your favorite products and access them anytime
        </p>
        <Link href="/login">
          <Button data-testid="button-signin-wishlist">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/browse">
            <Button variant="ghost" size="icon" data-testid="button-back-browse">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-current" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground">
              {wishlistItems?.length || 0} saved products
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="aspect-square rounded-t-md" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {wishlistItems.map((item) => {
              if (!item.product) return null;
              const product = item.product;
              
              return (
                <Card key={item.id} className="group" data-testid={`card-wishlist-item-${product.id}`}>
                  <CardContent className="p-0">
                    <Link href={`/products/${product.id}`}>
                      <div className="aspect-square bg-muted relative overflow-hidden rounded-t-md cursor-pointer protected-image-container" onContextMenu={(e: any) => e.preventDefault()}>
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-medium text-sm line-clamp-2 hover:text-primary cursor-pointer">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold mt-1">
                        {formatPrice(Number(product.price), true, product.currency || "USD")}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <MapPin className="w-3 h-3" />
                        <span>{product.city}, {product.country}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => addToCartMutation.mutate(product.id)}
                          disabled={addToCartMutation.isPending}
                          data-testid={`button-add-cart-${product.id}`}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Add to Cart
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => removeMutation.mutate(product.id)}
                          disabled={removeMutation.isPending}
                          data-testid={`button-remove-wishlist-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Heart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Browse products and click the heart icon to save them here for later
            </p>
            <Link href="/browse">
              <Button data-testid="button-start-browsing">Start Browsing</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
