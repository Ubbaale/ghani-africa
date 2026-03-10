import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Star, ShoppingCart, Package } from "lucide-react";

export default function StorefrontView() {
  const [, params] = useRoute("/storefront/:slug");
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/storefronts", slug],
    queryFn: () => fetch(`/api/storefronts/${slug}`).then(r => r.json()),
    enabled: !!slug,
  });

  if (isLoading) return <div className="container mx-auto p-6"><div className="animate-pulse space-y-4"><div className="h-48 bg-gray-200 rounded-lg" /><div className="h-64 bg-gray-200 rounded-lg" /></div></div>;
  if (error || !data?.success) return <div className="container mx-auto p-6 text-center"><Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" /><h2 className="text-xl font-bold">Store Not Found</h2><p className="text-muted-foreground">This storefront doesn't exist or isn't published yet</p></div>;

  const { storefront, profile, products } = data.data;
  const theme = (storefront.theme || {}) as any;

  return (
    <div className="min-h-screen" data-testid="storefront-view-page">
      <div className="h-48 relative" style={{ backgroundColor: theme.primary || "#D4A574" }}>
        {storefront.banner ? (
          <img src={storefront.banner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <Store className="h-16 w-16 mx-auto mb-2 opacity-80" />
              <h1 className="text-3xl font-bold" data-testid="text-store-name">{storefront.name}</h1>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-10">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: theme.secondary || "#2D5016" }}>
                {storefront.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{storefront.name}</h2>
                {profile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    {profile.country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.city}, {profile.country}</span>}
                    {profile.verificationLevel !== "basic" && <Badge variant="secondary" className="text-xs">Verified Seller</Badge>}
                  </div>
                )}
                <p className="text-sm mt-2">{storefront.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: theme.primary }}>{products?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Products</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" /> Products
        </h3>

        {!products || products.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No products listed yet</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-product-${product.id}`}>
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {product.images && product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ShoppingCart className="h-8 w-8" /></div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold" style={{ color: theme.primary }}>${parseFloat(product.price).toFixed(2)}</span>
                      {product.moq > 1 && <span className="text-xs text-muted-foreground">MOQ: {product.moq}</span>}
                    </div>
                    {product.country && <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{product.country}</div>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
