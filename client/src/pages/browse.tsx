import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { Product, Category, UserProfile } from "@shared/schema";
import {
  Search,
  MapPin,
  ShoppingCart,
  MessageCircle,
  Package,
  Filter,
  ArrowLeft,
  Camera,
  X,
  Loader2,
  Navigation,
  Store,
  CheckCircle,
  Award,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { TradeAssuranceProductBadge } from "@/components/trade-assurance-badge";
import { CountryFlag } from "@/components/country-flag";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WishlistButton } from "@/components/wishlist-button";
import { CurrencySelector } from "@/components/currency-selector";
import { useCurrency } from "@/lib/currency-context";
import { trackSearch } from "@/components/analytics/google-analytics";
import { fbTrackSearch } from "@/components/analytics/facebook-pixel";

const AFRICAN_COUNTRIES = [
  { name: "Algeria", code: "DZ" },
  { name: "Angola", code: "AO" },
  { name: "Benin", code: "BJ" },
  { name: "Botswana", code: "BW" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Burundi", code: "BI" },
  { name: "Cabo Verde", code: "CV" },
  { name: "Cameroon", code: "CM" },
  { name: "Central African Republic", code: "CF" },
  { name: "Chad", code: "TD" },
  { name: "Comoros", code: "KM" },
  { name: "Congo", code: "CG" },
  { name: "DR Congo", code: "CD" },
  { name: "Djibouti", code: "DJ" },
  { name: "Egypt", code: "EG" },
  { name: "Equatorial Guinea", code: "GQ" },
  { name: "Eritrea", code: "ER" },
  { name: "Eswatini", code: "SZ" },
  { name: "Ethiopia", code: "ET" },
  { name: "Gabon", code: "GA" },
  { name: "Gambia", code: "GM" },
  { name: "Ghana", code: "GH" },
  { name: "Guinea", code: "GN" },
  { name: "Guinea-Bissau", code: "GW" },
  { name: "Ivory Coast", code: "CI" },
  { name: "Kenya", code: "KE" },
  { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" },
  { name: "Libya", code: "LY" },
  { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" },
  { name: "Mali", code: "ML" },
  { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" },
  { name: "Morocco", code: "MA" },
  { name: "Mozambique", code: "MZ" },
  { name: "Namibia", code: "NA" },
  { name: "Niger", code: "NE" },
  { name: "Nigeria", code: "NG" },
  { name: "Rwanda", code: "RW" },
  { name: "Sao Tome and Principe", code: "ST" },
  { name: "Senegal", code: "SN" },
  { name: "Seychelles", code: "SC" },
  { name: "Sierra Leone", code: "SL" },
  { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" },
  { name: "South Sudan", code: "SS" },
  { name: "Sudan", code: "SD" },
  { name: "Tanzania", code: "TZ" },
  { name: "Togo", code: "TG" },
  { name: "Tunisia", code: "TN" },
  { name: "Uganda", code: "UG" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
];

function ProductCard({ product }: { product: Product }) {
  const { formatPrice } = useCurrency();
  const countryCode = AFRICAN_COUNTRIES.find(c => c.name === product.country)?.code;
  const [, navigate] = useLocation();
  
  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };
  
  const handleStoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/store/${product.sellerId}`);
  };
  
  return (
    <Card className="hover-elevate cursor-pointer h-full group" onClick={handleCardClick}>
      <CardContent className="p-0">
        <div className="aspect-square bg-muted relative overflow-hidden rounded-t-md protected-image-container" onContextMenu={(e: any) => e.preventDefault()}>
          {product.images && product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {product.isFeatured && (
            <Badge className="absolute top-2 left-2" variant="default">
              Featured
            </Badge>
          )}
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <WishlistButton productId={product.id} variant="ghost" className="bg-background/80 backdrop-blur-sm" />
          </div>
          {product.stock && product.stock > 0 && (
            <Badge variant="secondary" className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm">
              In Stock
            </Badge>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start gap-1">
            <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] flex-1" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
            <TradeAssuranceProductBadge sellerId={product.sellerId} />
          </div>
          <p className="text-lg font-bold text-primary mt-1" data-testid={`text-product-price-${product.id}`}>
            {formatPrice(Number(product.price), true, product.currency || "USD")}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            {countryCode && <CountryFlag code={countryCode} size="sm" />}
            <span>{product.city}, {product.country}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            {product.moq && product.moq > 1 && (
              <p className="text-xs text-muted-foreground">
                MOQ: {product.moq} units
              </p>
            )}
            <Badge variant="outline" className="text-xs cursor-pointer" onClick={handleStoreClick} data-testid={`badge-view-store-${product.id}`}>
              <Store className="w-3 h-3 mr-1" />
              View Store
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Browse() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [condition, setCondition] = useState(searchParams.get("condition") || "");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [geoFilterActive, setGeoFilterActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFilterCount = [
    selectedCountry && selectedCountry !== "all",
    selectedCategory && selectedCategory !== "all",
    minPrice,
    maxPrice,
    condition && condition !== "all",
  ].filter(Boolean).length;

  const { data: userProfile } = useQuery<{ country?: string; geoFilterEnabled?: boolean } | null>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlCountry = searchParams.get("country") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlSort = searchParams.get("sortBy") || "";
    const urlMinPrice = searchParams.get("minPrice") || "";
    const urlMaxPrice = searchParams.get("maxPrice") || "";
    const urlCondition = searchParams.get("condition") || "";
    
    if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
    if (urlCountry !== selectedCountry) setSelectedCountry(urlCountry);
    if (urlCategory !== selectedCategory) setSelectedCategory(urlCategory);
    if (urlSort !== sortBy) setSortBy(urlSort);
    if (urlMinPrice !== minPrice) setMinPrice(urlMinPrice);
    if (urlMaxPrice !== maxPrice) setMaxPrice(urlMaxPrice);
    if (urlCondition !== condition) setCondition(urlCondition);
    if (urlMinPrice || urlMaxPrice || urlCondition) setShowAdvancedFilters(true);
  }, [location]);

  useEffect(() => {
    if (userProfile?.geoFilterEnabled && userProfile?.country && !searchParams.get("country")) {
      setSelectedCountry(userProfile.country);
      setGeoFilterActive(true);
    }
  }, [userProfile]);

  useEffect(() => {
    if (searchQuery && searchQuery.length >= 3) {
      const timeoutId = setTimeout(() => {
        trackSearch(searchQuery);
        fbTrackSearch(searchQuery);
        if (user) {
          fetch("/api/track/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              searchTerm: searchQuery,
              categoryId: selectedCategory || undefined,
              country: selectedCountry || undefined,
            }),
          }).catch(() => {});
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, user]);


  const resizeImageForSearch = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1024;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    try {
      const base64 = await resizeImageForSearch(file);
      setPreviewImage(base64);

      const response = await apiRequest("POST", "/api/search/image", { imageBase64: base64 });
      const result = await response.json();

      if (result.success && result.data) {
        const keywords = result.data.keywords?.join(" ") || "";
        setSearchQuery(keywords);
        setIsImageSearchOpen(false);
        setPreviewImage(null);
        toast({
          title: "Image analyzed",
          description: result.data.description || "Found matching keywords",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: "Could not extract search terms from image",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/geo/countries?lat=${latitude}&lng=${longitude}`);
          const result = await response.json();
          
          if (result.success && result.data?.detectedCountry) {
            setSelectedCountry(result.data.detectedCountry.name);
            toast({
              title: "Location detected",
              description: `Showing products from ${result.data.detectedCountry.name}`,
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to detect location",
            variant: "destructive",
          });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        toast({
          title: "Permission denied",
          description: "Please allow location access to use this feature",
          variant: "destructive",
        });
      }
    );
  };

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { search: searchQuery, country: selectedCountry, category: selectedCategory, sortBy, minPrice, maxPrice, condition }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCountry && selectedCountry !== "all") params.set("country", selectedCountry);
      if (selectedCategory && selectedCategory !== "all") params.set("categoryId", selectedCategory);
      if (sortBy && sortBy !== "all") params.set("sortBy", sortBy);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (condition && condition !== "all") params.set("condition", condition);
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: suppliers = [] } = useQuery<UserProfile[]>({
    queryKey: ["/api/suppliers/search", { search: searchQuery }],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return [];
      const response = await apiRequest("GET", `/api/suppliers/search?search=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: searchQuery.length >= 3,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <GradientLogo size="sm" />
            </div>
            
            <div className="hidden md:flex flex-1 max-w-xl mx-4">
              <div className="flex w-full gap-1">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-r-none"
                  data-testid="input-search"
                />
                <Button variant="outline" className="rounded-none" onClick={() => setIsImageSearchOpen(true)} data-testid="button-image-search">
                  <Camera className="w-4 h-4" />
                </Button>
                <Button className="rounded-l-none" data-testid="button-search">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              {user && (
                <>
                  <Link href="/messages">
                    <Button variant="ghost" size="icon" data-testid="button-messages">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" data-testid="button-cart">
                      <ShoppingCart className="w-5 h-5" />
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <Select 
              value={selectedCountry} 
              onValueChange={(v) => {
                setSelectedCountry(v);
                if (v !== userProfile?.country) {
                  setGeoFilterActive(false);
                }
              }}
            >
              <SelectTrigger className="w-[160px]" data-testid="select-country">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {AFRICAN_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.name}>
                    <span className="flex items-center gap-2">
                      <CountryFlag code={c.code} size="sm" />
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter(cat => !cat.parentId).map((parent) => {
                  const subs = categories.filter(c => c.parentId === parent.id);
                  return (
                    <div key={parent.id}>
                      <SelectItem value={String(parent.id)} className="font-semibold">
                        {parent.name}
                      </SelectItem>
                      {subs.map((sub) => (
                        <SelectItem key={sub.id} value={String(sub.id)} className="pl-8 text-sm">
                          {sub.name}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]" data-testid="select-sort">
                <ArrowUpDown className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Default</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showAdvancedFilters ? "secondary" : "outline"}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              data-testid="button-toggle-filters"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
              {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>

            <Button
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              data-testid="button-detect-location"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              Detect Location
            </Button>

            {geoFilterActive && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                My Location
                <button
                  onClick={() => {
                    setSelectedCountry("");
                    setGeoFilterActive(false);
                  }}
                  className="ml-1 hover:text-foreground"
                  data-testid="button-clear-geo-filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <CurrencySelector />
          </div>

          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/50 rounded-lg border" data-testid="advanced-filters-panel">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Min Price</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-[120px]"
                  min="0"
                  data-testid="input-min-price"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Max Price</label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-[120px]"
                  min="0"
                  data-testid="input-max-price"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Condition</label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="w-[140px]" data-testid="select-condition">
                    <SelectValue placeholder="Any Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Condition</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                    <SelectItem value="refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMinPrice("");
                  setMaxPrice("");
                  setCondition("");
                  setSelectedCountry("");
                  setSelectedCategory("");
                  setSortBy("");
                  setGeoFilterActive(false);
                }}
                data-testid="button-clear-all-filters"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Suppliers Section - shown when search has results */}
        {searchQuery && suppliers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Suppliers with Matching Products</h2>
              <Badge variant="secondary" className="ml-2">{suppliers.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.slice(0, 6).map((supplier) => (
                <Link key={supplier.id} href={`/store/${supplier.storeSlug || supplier.id}`} data-testid={`link-supplier-${supplier.id}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-supplier-${supplier.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{supplier.businessName || 'Supplier'}</h3>
                            {supplier.verificationLevel === 'verified' && (
                              <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </Badge>
                            )}
                            {supplier.verificationLevel === 'highly_recommended' && (
                              <Badge className="text-xs gap-1 bg-amber-500 flex-shrink-0">
                                <Award className="w-3 h-3" />
                                Top Rated
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">{supplier.role}</p>
                          {supplier.country && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {supplier.city ? `${supplier.city}, ` : ''}{supplier.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {suppliers.length > 6 && (
              <div className="mt-4 text-center">
                <Link href={`/suppliers?search=${encodeURIComponent(searchQuery)}`}>
                  <Button variant="outline" data-testid="button-view-all-suppliers">
                    View All {suppliers.length} Suppliers
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground" data-testid="text-result-count">
            {products.length} products found
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-6 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCountry("");
              setSelectedCategory("");
              setSortBy("");
              setMinPrice("");
              setMaxPrice("");
              setCondition("");
              setGeoFilterActive(false);
            }} data-testid="button-clear-filters">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isImageSearchOpen} onOpenChange={setIsImageSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search by Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a product photo and we'll find similar items in the marketplace.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {previewImage ? (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-md"
                />
                {isAnalyzingImage && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Analyzing image...</p>
                    </div>
                  </div>
                )}
                {!isAnalyzingImage && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => setPreviewImage(null)}
                    data-testid="button-clear-preview"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div 
                className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover-elevate"
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-image"
              >
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-medium">Click to upload an image</p>
                <p className="text-sm text-muted-foreground mt-1">
                  JPEG, PNG, or WebP up to 10MB
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImageSearchOpen(false);
                  setPreviewImage(null);
                }}
                data-testid="button-cancel-image-search"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
