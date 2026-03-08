import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Advertisement } from "@shared/schema";
import { VideoUploader } from "@/components/VideoUploader";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Eye,
  MousePointer,
  Calendar,
  Package,
  CheckCircle,
  Star,
  Zap,
  Crown,
  Loader2,
  ExternalLink,
  CreditCard,
  Video,
  DollarSign,
  Clock,
  Target,
  Play,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCurrency } from "@/lib/currency-context";

interface AdvertisementWithProduct extends Advertisement {
  product: Product;
}

interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: string;
    interval_count: number;
  };
}

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: StripePrice[];
}

const AD_PACKAGES = [
  {
    id: "basic",
    name: "Basic",
    price: 29,
    duration: 7,
    description: "Show your product on the home page",
    features: ["Homepage visibility", "7-day duration", "Basic analytics", "Product image only"],
    icon: Star,
    color: "text-muted-foreground",
  },
  {
    id: "premium",
    name: "Premium",
    price: 79,
    duration: 14,
    description: "Enhanced visibility with video support",
    features: ["Priority homepage placement", "14-day duration", "60-second video ad", "Detailed analytics", "Category page visibility"],
    icon: Zap,
    color: "text-amber-500",
    popular: true,
  },
  {
    id: "featured",
    name: "Featured",
    price: 149,
    duration: 30,
    description: "Maximum exposure with auto-play video",
    features: ["Top homepage placement", "30-day duration", "60-second video ad", "Auto-play on homepage", "Full analytics suite", "All category pages", "Search results boost"],
    icon: Crown,
    color: "text-primary",
  },
];

export default function Advertising() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");

  const searchParams = new URLSearchParams(window.location.search);
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");
  const productIdParam = searchParams.get("productId");
  const packageTypeParam = searchParams.get("packageType");
  // URLSearchParams.get() automatically decodes, no need for manual decoding
  const videoUrlParam = searchParams.get("videoUrl");

  useEffect(() => {
    if (success === "true") {
      toast({
        title: "Payment Successful",
        description: "Your advertising subscription is now active!",
      });
      if (productIdParam && packageTypeParam) {
        createAdMutation.mutate({
          productId: parseInt(productIdParam),
          packageType: packageTypeParam,
          videoUrl: videoUrlParam || undefined,
        });
      }
      window.history.replaceState({}, "", "/dashboard/advertising");
    }
    if (cancelled === "true") {
      toast({
        title: "Payment Cancelled",
        description: "No charges were made to your account.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/dashboard/advertising");
    }
  }, [success, cancelled]);

  const { data: myProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    enabled: !!user,
  });

  const { data: myAds, isLoading: adsLoading, refetch: refetchAds } = useQuery<AdvertisementWithProduct[]>({
    queryKey: ["/api/advertisements/my"],
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/advertising/subscription"],
    enabled: !!user,
  });

  const { data: packages } = useQuery<StripeProduct[]>({
    queryKey: ["/api/advertising/packages"],
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: { productId: number; packageType: string; videoUrl?: string }) => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + (data.packageType === "featured" ? 30 : data.packageType === "premium" ? 14 : 7));
      
      const response = await apiRequest("POST", "/api/advertisements", {
        productId: data.productId,
        packageType: data.packageType,
        videoUrl: data.videoUrl || null,
        status: "active",
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Advertisement created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements/my"] });
      setSelectedProduct("");
      setSelectedPackage("");
      setVideoUrl("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create advertisement", variant: "destructive" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { priceId: string; productId: number; packageType: string; videoUrl?: string }) => {
      const response = await apiRequest("POST", "/api/advertising/checkout", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to initiate checkout", variant: "destructive" });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/advertising/portal", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal", variant: "destructive" });
    },
  });

  const handlePromote = () => {
    if (!selectedProduct || !selectedPackage) {
      toast({ title: "Error", description: "Please select a product and package", variant: "destructive" });
      return;
    }

    const packageInfo = packages?.find(p => (p.metadata?.package_type || p.metadata?.package) === selectedPackage);
    if (packageInfo && packageInfo.prices.length > 0) {
      checkoutMutation.mutate({
        priceId: packageInfo.prices[0].id,
        productId: parseInt(selectedProduct),
        packageType: selectedPackage,
        videoUrl: canUploadVideo ? videoUrl || undefined : undefined,
      });
    } else {
      createAdMutation.mutate({
        productId: parseInt(selectedProduct),
        packageType: selectedPackage,
        videoUrl: canUploadVideo ? videoUrl || undefined : undefined,
      });
    }
  };

  const selectedPackageData = AD_PACKAGES.find(p => p.id === selectedPackage);
  const canUploadVideo = selectedPackage === "premium" || selectedPackage === "featured";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
            <CardTitle>Advertise Your Products</CardTitle>
            <CardDescription>
              Sign in to promote your products and reach more customers across Africa
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <a href="/login">
              <Button data-testid="button-login-advertising">Sign In to Get Started</Button>
            </a>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const activeAds = myAds?.filter(ad => ad.status === "active") || [];
  const eligibleProducts = myProducts?.filter(p => 
    !activeAds.some(ad => ad.productId === p.id)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <GradientLogo size="sm" />
            <div className="flex-1">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Advertising
              </h1>
              <p className="text-sm text-muted-foreground">Promote your products on the front page</p>
            </div>
            {subscription && typeof subscription === 'object' && 'status' in subscription && (subscription as { status: string }).status === "active" ? (
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                data-testid="button-manage-billing"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            How Advertising Works
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-medium text-sm">Select Product</h3>
                <p className="text-xs text-muted-foreground">Choose which of your products you want to promote</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-medium text-sm">Choose Package</h3>
                <p className="text-xs text-muted-foreground">Pick a plan based on your budget and visibility needs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-medium text-sm">Add Video (Optional)</h3>
                <p className="text-xs text-muted-foreground">Premium packages let you upload a 60-second video ad</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="font-medium text-sm">Pay & Go Live</h3>
                <p className="text-xs text-muted-foreground">Complete payment and your ad appears on the homepage</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Create New Advertisement
          </h2>
          
          {eligibleProducts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {myProducts?.length === 0 
                    ? "You don't have any products to advertise yet."
                    : "All your products are already being advertised."}
                </p>
                <Link href="/dashboard">
                  <Button data-testid="button-add-product">
                    {myProducts?.length === 0 ? "Add Your First Product" : "Manage Products"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Product to Advertise</label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger data-testid="select-product">
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleProducts.map(product => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {formatPrice(Number(product.price), true, product.currency || "USD")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Choose Package</label>
                  <div className="grid gap-4 md:grid-cols-3">
                    {AD_PACKAGES.map(pkg => (
                      <Card
                        key={pkg.id}
                        className={`cursor-pointer transition-all ${
                          selectedPackage === pkg.id 
                            ? "ring-2 ring-primary border-primary" 
                            : "hover-elevate"
                        }`}
                        onClick={() => setSelectedPackage(pkg.id)}
                        data-testid={`card-package-${pkg.id}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <pkg.icon className={`w-6 h-6 ${pkg.color}`} />
                            {pkg.popular && (
                              <Badge variant="default">Popular</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-bold">${pkg.price}</span>
                            <span className="text-sm text-muted-foreground">/ {pkg.duration} days</span>
                          </div>
                          <CardDescription className="text-xs mt-1">{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-1">
                            {pkg.features.map((feature, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {canUploadVideo && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-5 h-5 text-primary" />
                      <label className="text-sm font-medium">Upload Promotional Video (Optional)</label>
                    </div>
                    <VideoUploader
                      onVideoUploaded={setVideoUrl}
                      maxDurationSeconds={60}
                      existingVideoUrl={videoUrl || null}
                    />
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePromote}
                  disabled={!selectedProduct || !selectedPackage || checkoutMutation.isPending || createAdMutation.isPending}
                  data-testid="button-promote"
                >
                  {(checkoutMutation.isPending || createAdMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Promote Product
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Your Active Advertisements
          </h2>

          {adsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeAds.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  You don't have any active advertisements yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeAds.map(ad => (
                <Card key={ad.id} data-testid={`card-ad-${ad.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{ad.product.name}</CardTitle>
                        <CardDescription className="text-xs capitalize">
                          {ad.packageType} Package
                        </CardDescription>
                      </div>
                      <Badge variant={ad.status === "active" ? "default" : "secondary"}>
                        {ad.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                      {ad.videoUrl ? (
                        <>
                          <video
                            src={ad.videoUrl}
                            className="w-full h-full object-cover"
                            controls
                            muted
                            data-testid={`video-ad-${ad.id}`}
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant="secondary" className="text-xs">
                              <Play className="w-3 h-3 mr-1" />
                              Video Ad
                            </Badge>
                          </div>
                        </>
                      ) : ad.product.images?.[0] ? (
                        <img
                          src={ad.product.images[0]}
                          alt={ad.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>{ad.impressions || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MousePointer className="w-4 h-4" />
                        <span>{ad.clicks || 0} clicks</span>
                      </div>
                    </div>
                    
                    {ad.endDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Ends: {new Date(ad.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/products/${ad.productId}`} className="w-full">
                      <Button variant="outline" className="w-full" size="sm" data-testid={`button-view-ad-${ad.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Product
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
