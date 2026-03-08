import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CountryFlag } from "@/components/country-flag";
import { SellerReviewsSummary, SellerRatingBadge } from "@/components/seller-reviews";
import { TrustScore, TrustScoreBadge } from "@/components/trust-score";
import type { Product, UserProfile, BusinessDocument } from "@shared/schema";
import {
  MapPin,
  MessageCircle,
  Package,
  Star,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Store as StoreIcon,
  Grid,
  Shield,
  Award,
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  Factory,
  Users,
  Globe,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Boxes,
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp, SiLinkedin } from "react-icons/si";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COUNTRY_CODES: Record<string, string> = {
  "Algeria": "DZ", "Angola": "AO", "Benin": "BJ", "Botswana": "BW", "Burkina Faso": "BF",
  "Burundi": "BI", "Cabo Verde": "CV", "Cameroon": "CM", "Central African Republic": "CF",
  "Chad": "TD", "Comoros": "KM", "Congo": "CG", "DR Congo": "CD", "Djibouti": "DJ",
  "Egypt": "EG", "Equatorial Guinea": "GQ", "Eritrea": "ER", "Eswatini": "SZ", "Ethiopia": "ET",
  "Gabon": "GA", "Gambia": "GM", "Ghana": "GH", "Guinea": "GN", "Guinea-Bissau": "GW",
  "Ivory Coast": "CI", "Kenya": "KE", "Lesotho": "LS", "Liberia": "LR", "Libya": "LY",
  "Madagascar": "MG", "Malawi": "MW", "Mali": "ML", "Mauritania": "MR", "Mauritius": "MU",
  "Morocco": "MA", "Mozambique": "MZ", "Namibia": "NA", "Niger": "NE", "Nigeria": "NG",
  "Rwanda": "RW", "Sao Tome and Principe": "ST", "Senegal": "SN", "Seychelles": "SC",
  "Sierra Leone": "SL", "Somalia": "SO", "South Africa": "ZA", "South Sudan": "SS",
  "Sudan": "SD", "Tanzania": "TZ", "Togo": "TG", "Tunisia": "TN", "Uganda": "UG",
  "Zambia": "ZM", "Zimbabwe": "ZW",
};

function getCountryCode(country: string): string {
  return COUNTRY_CODES[country] || "KE";
}

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrency();
  const price = formatPrice(Number(product.price), true, product.currency || "USD");
  
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="overflow-visible hover-elevate cursor-pointer transition-all" data-testid={`card-product-${product.id}`}>
        <div className="aspect-square relative overflow-hidden rounded-t-md protected-image-container" onContextMenu={(e: any) => e.preventDefault()}>
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {product.isFeatured && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-lg font-bold text-foreground">{price}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{product.city}, {product.country}</span>
          </div>
          {product.moq && product.moq > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Min. order: {product.moq} units
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ShareDialog({ store, storeUrl }: { store: UserProfile; storeUrl: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Store link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openShare = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  const storeName = store.businessName || "Store";
  const shareText = `Check out ${storeName}'s store on Ghani Africa - Africa's Digital Marketplace`;
  const encodedUrl = encodeURIComponent(storeUrl);
  const encodedText = encodeURIComponent(shareText);

  const embedCode = `<iframe src="${storeUrl}?embed=true" width="100%" height="600" frameborder="0" title="${storeName} - Ghani Africa Store"></iframe>`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-share-store">
          <Share2 className="w-4 h-4 mr-2" />
          Share Store
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this store</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="embed">Embed Code</TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={storeUrl}
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                data-testid="input-store-url"
              />
              <Button size="sm" onClick={copyLink} data-testid="button-copy-link">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
                data-testid="button-share-facebook"
              >
                <SiFacebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`)}
                data-testid="button-share-twitter"
              >
                <SiX className="w-4 h-4 mr-2" />
                X
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openShare(`https://wa.me/?text=${encodedText}%20${encodedUrl}`)}
                data-testid="button-share-whatsapp"
              >
                <SiWhatsapp className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)}
                data-testid="button-share-linkedin"
              >
                <SiLinkedin className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="embed" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy the code below to embed this store on your website:
            </p>
            <textarea
              readOnly
              value={embedCode}
              className="w-full h-24 px-3 py-2 text-xs font-mono border rounded-md bg-muted"
              data-testid="textarea-embed-code"
            />
            <Button size="sm" onClick={async () => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                await navigator.clipboard.writeText(embedCode);
                toast({ title: "Embed code copied!" });
              }
            }} data-testid="button-copy-embed">
              <Copy className="w-4 h-4 mr-2" />
              Copy Embed Code
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FactoryPhotosCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative" data-testid="factory-photos-carousel">
      <div className="aspect-video rounded-md overflow-hidden bg-muted">
        <img
          src={images[current]}
          alt={`Factory photo ${current + 1}`}
          className="w-full h-full object-cover"
          data-testid={`factory-photo-${current}`}
        />
      </div>
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm"
            onClick={() => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
            data-testid="button-factory-photo-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm"
            onClick={() => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
            data-testid="button-factory-photo-next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white' : 'bg-white/50'}`}
                onClick={() => setCurrent(i)}
                data-testid={`button-factory-dot-${i}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FactoryProfileSection({ store }: { store: UserProfile }) {
  const hasFactoryImages = store.factoryImages && store.factoryImages.length > 0;
  const hasCertifications = store.certifications && store.certifications.length > 0;
  const hasMainProducts = store.mainProducts && store.mainProducts.length > 0;
  const hasExportMarkets = store.exportMarkets && store.exportMarkets.length > 0;

  return (
    <Card className="p-6 mb-6" data-testid="section-factory-profile">
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
        <Factory className="w-5 h-5" />
        Factory Profile
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {hasFactoryImages && (
            <FactoryPhotosCarousel images={store.factoryImages!} />
          )}

          <div className="grid grid-cols-2 gap-3">
            {store.yearEstablished && (
              <div className="p-3 border rounded-md" data-testid="text-year-established">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Established
                </p>
                <p className="font-semibold mt-1">{store.yearEstablished}</p>
              </div>
            )}
            {store.totalEmployees && (
              <div className="p-3 border rounded-md" data-testid="text-total-employees">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Employees
                </p>
                <p className="font-semibold mt-1">{store.totalEmployees.toLocaleString()}</p>
              </div>
            )}
            {store.factorySize && (
              <div className="p-3 border rounded-md" data-testid="text-factory-size">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Factory Size
                </p>
                <p className="font-semibold mt-1">{store.factorySize}</p>
              </div>
            )}
            {store.productionCapacity && (
              <div className="p-3 border rounded-md" data-testid="text-production-capacity">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Boxes className="w-3 h-3" />
                  Capacity
                </p>
                <p className="font-semibold mt-1">{store.productionCapacity}</p>
              </div>
            )}
          </div>

          {store.factoryAddress && (
            <div className="p-3 border rounded-md" data-testid="text-factory-address">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" />
                Factory Address
              </p>
              <p className="text-sm">{store.factoryAddress}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {hasCertifications && (
            <div data-testid="list-certifications">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4" />
                Certifications
              </p>
              <div className="flex flex-wrap gap-2">
                {store.certifications!.map((cert, i) => (
                  <Badge key={i} variant="secondary" data-testid={`badge-certification-${i}`}>
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasMainProducts && (
            <div data-testid="list-main-products">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <Package className="w-4 h-4" />
                Main Products
              </p>
              <div className="flex flex-wrap gap-2">
                {store.mainProducts!.map((prod, i) => (
                  <Badge key={i} variant="outline" data-testid={`badge-main-product-${i}`}>
                    {prod}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {hasExportMarkets && (
            <div data-testid="list-export-markets">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4" />
                Export Markets
              </p>
              <div className="flex flex-wrap gap-2">
                {store.exportMarkets!.map((market, i) => (
                  <Badge key={i} variant="outline" data-testid={`badge-export-market-${i}`}>
                    {market}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {store.qualityControl && (
            <div data-testid="text-quality-control">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-4 h-4" />
                Quality Control
              </p>
              <p className="text-sm text-muted-foreground">{store.qualityControl}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function StorePage() {
  const [, params] = useRoute("/store/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery<{ 
    store: UserProfile; 
    products: Product[]; 
    documents: BusinessDocument[];
    subscription?: { hasVerifiedBadge: boolean; isHighlyRecommended: boolean; tier: string };
  }>({
    queryKey: ["/api/stores", slug],
    enabled: !!slug,
  });

  useEffect(() => {
    if (data?.store?.storeSlug && slug !== data.store.storeSlug) {
      navigate(`/store/${data.store.storeSlug}`, { replace: true });
    }
  }, [data, slug, navigate]);

  const storeUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/store/${data?.store?.storeSlug || slug}` 
    : `/store/${data?.store?.storeSlug || slug}`;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <Skeleton className="h-48 w-full mb-4 rounded-lg" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-square" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <Card className="p-8 text-center">
          <StoreIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This store doesn't exist or is no longer available.
          </p>
          <Link href="/browse">
            <Button data-testid="button-browse-marketplace">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { store, products, documents, subscription } = data;

  const verifiedDocuments = documents.filter(d => d.isVerified);
  const otherDocuments = documents.filter(d => !d.isVerified);
  
  // Format member join date
  const memberSince = store.createdAt 
    ? new Date(store.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden">
        {store.storeHeroImage ? (
          <img
            src={store.storeHeroImage}
            alt={`${store.businessName || "Store"} store`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/10" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto p-4 max-w-7xl">
            <Link href="/browse">
              <Button variant="outline" size="sm" className="mb-4 bg-background/50 backdrop-blur-sm" data-testid="button-back-browse">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl -mt-16 relative z-10">
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                <StoreIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-store-name">
                  {store.businessName || "Store"}
                </h1>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <CountryFlag code={getCountryCode(store.country)} size="sm" />
                  <span>{store.city}, {store.country}</span>
                </div>
                {store.businessDescription && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                    {store.businessDescription}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {subscription?.hasVerifiedBadge && (
                    <Badge className="bg-green-600 text-white border-green-700">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified Seller
                    </Badge>
                  )}
                  {subscription?.isHighlyRecommended && (
                    <Badge className="bg-amber-500 text-white border-amber-600">
                      <Award className="w-3 h-3 mr-1" />
                      Highly Recommended
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    {store.verificationLevel || "Unverified"}
                  </Badge>
                  <Badge variant="outline">
                    <Package className="w-3 h-3 mr-1" />
                    {products.length} Products
                  </Badge>
                  {store.role && (
                    <Badge variant="outline">
                      {store.role}
                    </Badge>
                  )}
                  {memberSince && (
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      Member since {memberSince}
                    </Badge>
                  )}
                  <TrustScoreBadge sellerId={store.id} />
                </div>
                <SellerRatingBadge rating={store.rating || '0'} count={store.ratingsCount || 0} />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ShareDialog store={store} storeUrl={storeUrl} />
              {store.whatsappNumber && (
                <a
                  href={`https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in your products on Ghani Africa. ${storeUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-whatsapp-store"
                >
                  <Button variant="default" size="sm" className="bg-green-600 border-green-700">
                    <SiWhatsapp className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              )}
              <Link href={`/messages?to=${store.id}`}>
                <Button variant="default" size="sm" data-testid="button-contact-seller">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {documents.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" />
              Business Credentials & Certifications
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifiedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-3 border rounded-md bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  data-testid={`store-doc-verified-${doc.id}`}
                >
                  <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                    {doc.type === "award" ? (
                      <Award className="w-5 h-5 text-green-700 dark:text-green-300" />
                    ) : doc.type === "certificate" || doc.type === "standard" ? (
                      <Shield className="w-5 h-5 text-green-700 dark:text-green-300" />
                    ) : (
                      <FileText className="w-5 h-5 text-green-700 dark:text-green-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <Badge className="bg-green-600 text-white shrink-0">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    {doc.issuingAuthority && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />
                        {doc.issuingAuthority}
                      </p>
                    )}
                    {doc.expiryDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Valid until: {new Date(doc.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                    {doc.documentUrl && (
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Document
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {otherDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-3 border rounded-md"
                  data-testid={`store-doc-${doc.id}`}
                >
                  <div className="p-2 rounded-md bg-muted">
                    {doc.type === "award" ? (
                      <Award className="w-5 h-5" />
                    ) : doc.type === "certificate" || doc.type === "standard" ? (
                      <Shield className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {doc.type}
                    </Badge>
                    {doc.issuingAuthority && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="w-3 h-3" />
                        {doc.issuingAuthority}
                      </p>
                    )}
                    {doc.documentUrl && (
                      <a
                        href={doc.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Document
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {(store.factorySize || store.productionCapacity || store.yearEstablished || store.totalEmployees || store.factoryAddress || (store.factoryImages && store.factoryImages.length > 0) || (store.certifications && store.certifications.length > 0) || (store.mainProducts && store.mainProducts.length > 0) || (store.exportMarkets && store.exportMarkets.length > 0) || store.qualityControl) && (
          <FactoryProfileSection store={store} />
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <TrustScore sellerId={store.id} />
          <SellerReviewsSummary sellerId={store.id} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Grid className="w-5 h-5" />
            Products ({products.length})
          </h2>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products yet</h3>
            <p className="text-muted-foreground">
              This seller hasn't listed any products yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
