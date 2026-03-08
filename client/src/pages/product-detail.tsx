import { useAuth } from "@/hooks/use-auth";
import { Link, useParams, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency-context";
import type { Product, UserProfile, BusinessDocument, GroupBuy } from "@shared/schema";
import { SellerBadges } from "@/components/seller-badges";
import {
  ArrowLeft,
  MapPin,
  ShoppingCart,
  MessageCircle,
  Package,
  Star,
  Shield,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Award,
  FileText,
  ExternalLink,
  Building2,
  Store as StoreIcon,
  Layers,
  Globe,
  BadgeCheck,
  Loader2,
  Users,
  Download,
  WifiOff,
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp, SiLinkedin } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useOffline } from "@/hooks/use-offline";
import { TradeAssuranceBadge } from "@/components/trade-assurance-badge";
import { SellerReviewsSummary, ReviewSubmissionForm } from "@/components/seller-reviews";
import { MetaTags } from "@/components/seo/meta-tags";
import { trackProductView, trackAddToCart } from "@/components/analytics/google-analytics";
import { fbTrackViewContent, fbTrackAddToCart } from "@/components/analytics/facebook-pixel";

type ProductWithSeller = Product & { seller: UserProfile | null };

function ProductSharePopover({ product }: { product: ProductWithSeller }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const productUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/products/${product.id}`
    : `/products/${product.id}`;
  const shareText = `Check out ${product.name} on Ghani Africa - Africa's Digital Marketplace`;
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedText = encodeURIComponent(shareText);

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openShare = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-share">
          <Share2 className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <p className="font-medium text-sm">Share this product</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={productUrl}
              className="flex-1 px-2 py-1 text-xs border rounded-md bg-muted"
            />
            <Button size="sm" variant="ghost" onClick={copyLink} data-testid="button-copy-product-link">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
              data-testid="button-share-facebook"
            >
              <SiFacebook className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`)}
              data-testid="button-share-twitter"
            >
              <SiX className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://wa.me/?text=${encodedText}%20${encodedUrl}`)}
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}
              data-testid="button-share-linkedin"
            >
              <SiLinkedin className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function VerificationBadge({ level }: { level: string }) {
  const { t } = useI18n();
  
  const getBadgeColor = () => {
    switch (level?.toLowerCase()) {
      case "verified":
      case "gold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "premium":
      case "platinum":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`gap-1 ${getBadgeColor()}`}>
          <ShieldCheck className="w-3 h-3" />
          {level || "Basic"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("product.verifiedByPAIDM")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { saveProductOffline, isProductSaved } = useOffline();
  const [savedOffline, setSavedOffline] = useState(false);

  const { data: product, isLoading } = useQuery<ProductWithSeller>({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return response.json();
    },
  });

  const { data: relatedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "related", product?.categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/products?categoryId=${product?.categoryId}&limit=4`);
      if (!response.ok) return [];
      const products = await response.json();
      return products.filter((p: Product) => p.id !== product?.id).slice(0, 4);
    },
    enabled: !!product?.categoryId,
  });

  const { data: sellerDocuments = [] } = useQuery<BusinessDocument[]>({
    queryKey: ["/api/business-documents/public", product?.sellerId],
    queryFn: async () => {
      const response = await fetch(`/api/business-documents/public/${product?.sellerId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!product?.sellerId,
  });

  useEffect(() => {
    if (product) {
      const price = parseFloat(product.price);
      trackProductView(product.id, product.name, price);
      fbTrackViewContent(product.id, product.name, price);
      try {
        const key = "ghani_browsing_history";
        const stored = localStorage.getItem(key);
        const history: number[] = stored ? JSON.parse(stored) : [];
        const filtered = history.filter(hid => hid !== product.id);
        filtered.unshift(product.id);
        localStorage.setItem(key, JSON.stringify(filtered.slice(0, 20)));
      } catch {}
      if (user) {
        fetch("/api/track/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            categoryId: product.categoryId,
            country: product.country,
          }),
        }).catch(() => {});
      }
    }
  }, [product, user]);

  useEffect(() => {
    if (product) {
      setSavedOffline(isProductSaved(product.id));
    }
  }, [product, isProductSaved]);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/cart", { productId: parseInt(id!), quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: t("product.addToCart"), description: `${quantity} item(s) added to your cart` });
      if (product) {
        const price = parseFloat(product.price);
        trackAddToCart(product.id, product.name, price);
        fbTrackAddToCart(product.id, product.name, price * quantity);
      }
    },
    onError: () => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      toast({ title: "Error", description: "Failed to add to cart", variant: "destructive" });
    },
  });

  const [sampleQty, setSampleQty] = useState(1);

  const sampleOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/orders/sample", {
        productId: parseInt(id!),
        quantity: sampleQty,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Sample Order Placed",
        description: `Your sample order for ${sampleQty} unit(s) has been placed successfully.`,
      });
    },
    onError: () => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to place sample order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqQuantity, setRfqQuantity] = useState("");
  const [rfqUnit, setRfqUnit] = useState("pieces");
  const [rfqTargetPrice, setRfqTargetPrice] = useState("");
  const [rfqDetails, setRfqDetails] = useState("");

  const [certRequestOpen, setCertRequestOpen] = useState(false);
  const [certOriginCountry, setCertOriginCountry] = useState("");
  const [certDestCountry, setCertDestCountry] = useState("");
  const [certHsCode, setCertHsCode] = useState("");
  const [certNotes, setCertNotes] = useState("");

  const rfqMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/rfq", {
        productId: product?.id,
        sellerId: product?.sellerId,
        productName: product?.name,
        quantity: parseInt(rfqQuantity),
        unit: rfqUnit,
        targetPrice: rfqTargetPrice || undefined,
        details: rfqDetails || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Quotation Request Sent", description: "The seller will receive your request and respond with a quote." });
      setRfqOpen(false);
      setRfqQuantity("");
      setRfqUnit("pieces");
      setRfqTargetPrice("");
      setRfqDetails("");
    },
    onError: () => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      toast({ title: "Error", description: "Failed to send quotation request. Please try again.", variant: "destructive" });
    },
  });

  const certRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/afcfta/certificate-request", {
        productId: product?.id,
        originCountry: certOriginCountry || product?.country,
        destinationCountry: certDestCountry || undefined,
        hsCode: certHsCode || undefined,
        requestNotes: certNotes || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Certificate Request Submitted", description: "Your AfCFTA origin certificate request has been sent to admin for review." });
      setCertRequestOpen(false);
      setCertOriginCountry("");
      setCertDestCountry("");
      setCertHsCode("");
      setCertNotes("");
    },
    onError: () => {
      if (!user) {
        window.location.href = "/login";
        return;
      }
      toast({ title: "Error", description: "Failed to submit certificate request. Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("product.notFound")}</h2>
          <Link href="/browse">
            <Button data-testid="button-browse">{t("product.browseProducts")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MetaTags
        title={product.name}
        description={product.description || `Buy ${product.name} on Ghani Africa marketplace`}
        image={images[0]}
        url={`${window.location.origin}/products/${product.id}`}
        type="product"
        price={parseFloat(product.price)}
        currency="USD"
      />
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <GradientLogo size="sm" />
            </div>
            
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="icon" data-testid="button-wishlist">
                <Heart className="w-5 h-5" />
              </Button>
              <ProductSharePopover product={product} />
              {user && (
                <Link href="/cart">
                  <Button variant="ghost" size="icon" data-testid="button-cart">
                    <ShoppingCart className="w-5 h-5" />
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div>
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-3 protected-image-container" onContextMenu={(e: any) => e.preventDefault()}>
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    data-testid="img-product-main"
                  />
                  {images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                        onClick={handlePrevImage}
                        data-testid="button-prev-image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                        onClick={handleNextImage}
                        data-testid="button-next-image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedImage(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              selectedImage === i ? "bg-primary" : "bg-white/50"
                            }`}
                            data-testid={`button-dot-${i}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === i ? "border-primary" : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${i}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4">
              <h1 className="text-xl md:text-2xl font-bold mb-2" data-testid="text-product-name">{product.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{product.city}, {product.country}</span>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-2xl md:text-3xl font-bold text-primary" data-testid="text-product-price">
                {formatPrice(Number(product.price), true, product.currency || "USD")}
              </p>
              {product.moq && product.moq > 1 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t("product.moq")}: {product.moq} units
                </p>
              )}
            </div>

            {product.afcftaEligible && (
              <div className="mb-5 flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md" data-testid="badge-afcfta-eligible">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">AfCFTA Eligible</p>
                    <Badge variant="outline" className="text-[10px] border-green-300 dark:border-green-700 text-green-700 dark:text-green-400">
                      <BadgeCheck className="w-3 h-3 mr-0.5" />
                      Preferential Tariff
                    </Badge>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                    This product qualifies for reduced import duties under the African Continental Free Trade Area agreement. Save on cross-border purchases.
                  </p>
                </div>
              </div>
            )}

            {(() => {
              const tiers = Array.isArray(product.wholesalePricing) ? product.wholesalePricing as { minQty: number; maxQty: number | null; unitPrice: number }[] : [];
              if (tiers.length === 0) return null;
              const activeTier = tiers.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty));
              const basePrice = Number(product.price);
              return (
                <Card className="mb-5" data-testid="card-tiered-pricing">
                  <CardContent className="p-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                      <Layers className="w-4 h-4 text-primary" />
                      Bulk Pricing - Save More on Larger Orders
                    </h3>
                    <div className="space-y-1.5">
                      {tiers.map((tier, idx) => {
                        const isActive = activeTier === tier;
                        const savings = basePrice > 0 ? Math.round((1 - tier.unitPrice / basePrice) * 100) : 0;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2.5 rounded-md border transition-colors ${
                              isActive
                                ? "bg-primary/10 border-primary"
                                : "bg-muted/30 border-border"
                            }`}
                            data-testid={`tier-display-${idx}`}
                          >
                            <div className="flex items-center gap-2">
                              {isActive && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                              <span className={`text-sm ${isActive ? "font-semibold" : ""}`}>
                                {tier.maxQty ? `${tier.minQty} - ${tier.maxQty}` : `${tier.minQty}+`} units
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${isActive ? "text-primary" : ""}`}>
                                {formatPrice(tier.unitPrice, true, product.currency || "USD")}
                              </span>
                              {savings > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {savings}% off
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {activeTier && (
                      <p className="text-xs text-primary font-medium mt-2" data-testid="text-active-tier">
                        Your quantity ({quantity}) qualifies for {formatPrice(activeTier.unitPrice, true, product.currency || "USD")}/unit
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {(() => {
              const hasTiers = Array.isArray(product.wholesalePricing) && (product.wholesalePricing as any[]).length > 0;
              if (!hasTiers) return null;
              return (
                <Card className="mb-5" data-testid="card-group-buy">
                  <CardContent className="p-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      Group Buying - Save Together
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Pool orders with other buyers to unlock wholesale pricing. Share the link and save more!
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/group-buy/new?productId=${product.id}`}>
                        <Button variant="outline" className="gap-2" data-testid="button-start-group-buy">
                          <Users className="w-4 h-4" />
                          Start Group Buy
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {product.sampleAvailable && (
              <Card className="mb-5" data-testid="card-sample-order">
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                    <Package className="w-4 h-4 text-primary" />
                    Order Sample
                  </h3>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Sample Price</p>
                      <p className="text-lg font-bold text-primary" data-testid="text-sample-price">
                        {formatPrice(
                          Number(product.samplePrice || product.price),
                          true,
                          product.currency || "USD"
                        )}
                        <span className="text-xs font-normal text-muted-foreground ml-1">/ unit</span>
                      </p>
                    </div>
                    <Badge variant="secondary" data-testid="badge-sample-max">
                      Max {product.sampleMaxQty || 5} units
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSampleQty(Math.max(1, sampleQty - 1))}
                        disabled={sampleQty <= 1}
                        data-testid="button-sample-decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Input
                        type="number"
                        value={sampleQty}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(product.sampleMaxQty || 5, parseInt(e.target.value) || 1));
                          setSampleQty(val);
                        }}
                        className="w-14 text-center border-0"
                        min={1}
                        max={product.sampleMaxQty || 5}
                        data-testid="input-sample-qty"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSampleQty(Math.min(product.sampleMaxQty || 5, sampleQty + 1))}
                        disabled={sampleQty >= (product.sampleMaxQty || 5)}
                        data-testid="button-sample-increase"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => sampleOrderMutation.mutate()}
                      disabled={sampleOrderMutation.isPending}
                      data-testid="button-order-sample"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      {sampleOrderMutation.isPending
                        ? "Placing Order..."
                        : `Order Sample - ${formatPrice(
                            Number(product.samplePrice || product.price) * sampleQty,
                            true,
                            product.currency || "USD"
                          )}`}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sample orders have no minimum order quantity requirement
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="mb-5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Link href={`/store/${product.seller?.storeSlug || product.sellerId}`}>
                    <Avatar className="w-12 h-12 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all" data-testid="link-seller-avatar">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {product.seller?.businessName?.[0] || "S"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/store/${product.seller?.storeSlug || product.sellerId}`}>
                      <p className="font-medium truncate cursor-pointer text-primary hover:underline" data-testid="link-seller-name">
                        {product.seller?.businessName || "Seller"}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <VerificationBadge level={product.seller?.verificationLevel || "Basic"} />
                      {product.sellerId && <SellerBadges sellerId={product.sellerId} compact />}
                      {product.seller?.rating && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
                          {product.seller.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.seller?.whatsappNumber && (
                      <a
                        href={`https://wa.me/${product.seller.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in "${product.name}" listed on Ghani Africa. ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="link-whatsapp-seller"
                      >
                        <Button variant="default" size="sm" className="bg-green-600 border-green-700">
                          <SiWhatsapp className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                      </a>
                    )}
                    {user && product.seller && user.id !== product.sellerId && (
                      <Link href={`/messages?seller=${product.sellerId}`}>
                        <Button variant="outline" size="sm" data-testid="button-contact-seller">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">{t("product.contactSeller")}</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Link href={`/store/${product.seller?.storeSlug || product.sellerId}`}>
                    <Button variant="outline" className="w-full" data-testid="button-visit-store">
                      <StoreIcon className="w-4 h-4 mr-2" />
                      Visit Store - See All Products
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {product.seller?.businessDescription && (
              <Card className="mb-5" data-testid="card-seller-about">
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <Building2 className="w-4 h-4 text-primary" />
                    About {product.seller?.businessName || "the Seller"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-seller-about">
                    {product.seller.businessDescription}
                  </p>
                </CardContent>
              </Card>
            )}

            {sellerDocuments.length > 0 && (
              <Card className="mb-5" data-testid="card-seller-certifications">
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    Certifications & Standards
                  </h3>
                  <div className="space-y-2">
                    {sellerDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-start gap-3 p-2.5 rounded-md border ${
                          doc.isVerified
                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                            : "bg-muted/30 border-border"
                        }`}
                        data-testid={`certification-${doc.id}`}
                      >
                        <div className={`p-1.5 rounded-md ${
                          doc.isVerified
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-muted"
                        }`}>
                          {doc.type === "award" ? (
                            <Award className={`w-4 h-4 ${doc.isVerified ? "text-green-700 dark:text-green-300" : "text-muted-foreground"}`} />
                          ) : doc.type === "certificate" || doc.type === "standard" ? (
                            <Shield className={`w-4 h-4 ${doc.isVerified ? "text-green-700 dark:text-green-300" : "text-muted-foreground"}`} />
                          ) : (
                            <FileText className={`w-4 h-4 ${doc.isVerified ? "text-green-700 dark:text-green-300" : "text-muted-foreground"}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{doc.name}</p>
                            {doc.isVerified && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-green-300 text-green-700 dark:text-green-400 flex-shrink-0">
                                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          {doc.issuingAuthority && (
                            <p className="text-xs text-muted-foreground">
                              Issued by {doc.issuingAuthority}
                              {doc.documentNumber ? ` • ${doc.documentNumber}` : ""}
                            </p>
                          )}
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                          )}
                        </div>
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                            data-testid={`link-view-cert-${doc.id}`}
                          >
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {product.sellerId && (
              <div className="mb-5">
                <TradeAssuranceBadge sellerId={product.sellerId} />
              </div>
            )}

            {user && product.sellerId === user.id && (
              <Card className="mb-5" data-testid="card-afcfta-certificate">
                <CardContent className="p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    AfCFTA Origin Certificate
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Request an AfCFTA Certificate of Origin for this product to qualify for preferential tariff rates across African markets.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setCertOriginCountry(product.country);
                      setCertRequestOpen(true);
                    }}
                    data-testid="button-request-afcfta-cert"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Request Origin Certificate
                  </Button>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="description" className="mb-5">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="description" data-testid="tab-description">{t("product.description")}</TabsTrigger>
                <TabsTrigger value="shipping" data-testid="tab-shipping">{t("product.shipping")}</TabsTrigger>
                <TabsTrigger value="reviews" data-testid="tab-reviews">{t("product.reviews")}</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-3">
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-product-description">
                  {product.description || "No description available."}
                </p>
              </TabsContent>
              <TabsContent value="shipping" className="mt-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Truck className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t("product.shippingAvailable")}</p>
                      <p className="text-xs text-muted-foreground">{t("product.panAfricanDelivery")}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-3">
                {product.seller && (
                  <SellerReviewsSummary sellerId={product.sellerId} />
                )}
              </TabsContent>
            </Tabs>

            <div className="hidden md:flex items-center gap-4 mb-5">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                  disabled={quantity <= (product.moq || 1)}
                  data-testid="button-decrease-qty"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.moq || 1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center border-0"
                  min={product.moq || 1}
                  data-testid="input-quantity"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  data-testid="button-increase-qty"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {product.stock ? `${product.stock} ${t("product.inStock")}` : t("product.stockAvailable")}
              </p>
            </div>

            <div className="hidden md:flex gap-3 mb-3">
              <Button
                className="flex-1"
                size="lg"
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {addToCartMutation.isPending ? t("common.loading") : t("product.addToCart")}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  addToCartMutation.mutate();
                  navigate("/cart");
                }}
                data-testid="button-buy-now"
              >
                {t("product.buyNow")}
              </Button>
            </div>
            <div className="hidden md:block mb-6">
              <Button
                variant="outline"
                size="lg"
                className="w-full border-primary text-primary"
                onClick={() => setRfqOpen(true)}
                data-testid="button-request-quotation"
              >
                <FileText className="w-5 h-5 mr-2" />
                Request Quotation
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className={`w-full mt-2 ${savedOffline ? "text-green-600" : "text-muted-foreground"}`}
                onClick={() => {
                  if (product) {
                    saveProductOffline(product.id);
                    setSavedOffline(true);
                    toast({ title: "Saved for offline", description: "This product is now available offline" });
                  }
                }}
                data-testid="button-save-offline"
              >
                {savedOffline ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved for Offline
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Save for Offline
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">{t("product.buyerProtection")}</p>
                  <p className="text-xs text-muted-foreground">{t("product.secureEscrow")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">{t("product.escrowProtected")}</p>
                  <p className="text-xs text-muted-foreground">{t("product.verifiedByPAIDM")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold mb-4">{t("product.relatedProducts")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedProducts.map((relProduct) => (
                <Link key={relProduct.id} href={`/product/${relProduct.id}`}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-related-${relProduct.id}`}>
                    <div className="aspect-square bg-muted protected-image-container" onContextMenu={(e: any) => e.preventDefault()}>
                      {relProduct.images?.[0] ? (
                        <img src={relProduct.images[0]} alt={relProduct.name} className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{relProduct.name}</p>
                      <p className="text-primary font-bold text-sm">{formatPrice(Number(relProduct.price), true, relProduct.currency || "USD")}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-background border-t p-3 md:hidden z-40">
        <div className="flex flex-col gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                disabled={quantity <= (product.moq || 1)}
                data-testid="button-mobile-decrease-qty"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                data-testid="button-mobile-increase-qty"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="flex-1"
              onClick={() => addToCartMutation.mutate()}
              disabled={addToCartMutation.isPending}
              data-testid="button-mobile-add-to-cart"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {t("product.addToCart")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                addToCartMutation.mutate();
                navigate("/cart");
              }}
              data-testid="button-mobile-buy-now"
            >
              {t("product.buyNow")}
            </Button>
          </div>
          {product.sampleAvailable && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => sampleOrderMutation.mutate()}
              disabled={sampleOrderMutation.isPending}
              data-testid="button-mobile-order-sample"
            >
              <Package className="w-4 h-4 mr-2" />
              {sampleOrderMutation.isPending
                ? "Placing..."
                : `Order Sample - ${formatPrice(Number(product.samplePrice || product.price), true, product.currency || "USD")}`}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary text-primary"
            onClick={() => setRfqOpen(true)}
            data-testid="button-mobile-request-quotation"
          >
            <FileText className="w-4 h-4 mr-2" />
            Request Quotation
          </Button>
        </div>
      </div>

      <Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Request Quotation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                Listed price: {formatPrice(Number(product.price), true, product.currency || "USD")}
                {product.moq && product.moq > 1 ? ` · MOQ: ${product.moq} units` : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rfq-quantity">Quantity *</Label>
                <Input
                  id="rfq-quantity"
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  value={rfqQuantity}
                  onChange={(e) => setRfqQuantity(e.target.value)}
                  data-testid="input-rfq-quantity"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rfq-unit">Unit</Label>
                <Select value={rfqUnit} onValueChange={setRfqUnit}>
                  <SelectTrigger id="rfq-unit" data-testid="select-rfq-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="tons">Tons</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="cartons">Cartons</SelectItem>
                    <SelectItem value="pallets">Pallets</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rfq-target-price">Target Price per Unit (optional)</Label>
              <Input
                id="rfq-target-price"
                type="number"
                step="0.01"
                min={0}
                placeholder="Your target price"
                value={rfqTargetPrice}
                onChange={(e) => setRfqTargetPrice(e.target.value)}
                data-testid="input-rfq-target-price"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rfq-details">Additional Details (optional)</Label>
              <Textarea
                id="rfq-details"
                placeholder="Specifications, quality requirements, delivery timeline..."
                className="min-h-[80px]"
                value={rfqDetails}
                onChange={(e) => setRfqDetails(e.target.value)}
                data-testid="input-rfq-details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRfqOpen(false)} data-testid="button-rfq-cancel">
              Cancel
            </Button>
            <Button
              onClick={() => rfqMutation.mutate()}
              disabled={rfqMutation.isPending || !rfqQuantity || parseInt(rfqQuantity) < 1}
              data-testid="button-rfq-submit"
            >
              {rfqMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={certRequestOpen} onOpenChange={setCertRequestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              AfCFTA Origin Certificate Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                Origin: {product.country}
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-xs text-green-700 dark:text-green-400">
                An AfCFTA Certificate of Origin verifies that your product qualifies for preferential tariff rates under the African Continental Free Trade Area agreement. Once approved, buyers will see reduced duty estimates.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cert-origin">Origin Country *</Label>
                <Input
                  id="cert-origin"
                  placeholder="e.g. Kenya"
                  value={certOriginCountry}
                  onChange={(e) => setCertOriginCountry(e.target.value)}
                  data-testid="input-cert-origin"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cert-dest">Destination Country (optional)</Label>
                <Input
                  id="cert-dest"
                  placeholder="e.g. Nigeria"
                  value={certDestCountry}
                  onChange={(e) => setCertDestCountry(e.target.value)}
                  data-testid="input-cert-dest"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cert-hs">HS Code (optional)</Label>
              <Input
                id="cert-hs"
                placeholder="e.g. 6109.10"
                value={certHsCode}
                onChange={(e) => setCertHsCode(e.target.value)}
                data-testid="input-cert-hs-code"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cert-notes">Additional Notes (optional)</Label>
              <Textarea
                id="cert-notes"
                placeholder="Materials sourcing details, manufacturing process..."
                className="min-h-[80px]"
                value={certNotes}
                onChange={(e) => setCertNotes(e.target.value)}
                data-testid="input-cert-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertRequestOpen(false)} data-testid="button-cert-cancel">
              Cancel
            </Button>
            <Button
              onClick={() => certRequestMutation.mutate()}
              disabled={certRequestMutation.isPending || !certOriginCountry.trim()}
              data-testid="button-cert-submit"
            >
              {certRequestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
