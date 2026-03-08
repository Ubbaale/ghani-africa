import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { LanguageSelector } from "@/components/language-selector";
import { CurrencySelector } from "@/components/currency-selector";
import { useCurrency } from "@/lib/currency-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Category } from "@shared/schema";
import { AIAssistant } from "@/components/ai-assistant";
import { HowItWorksAnimation } from "@/components/how-it-works-animation";
import {
  Search,
  MapPin,
  ShoppingCart,
  MessageCircle,
  Shield,
  Truck,
  Users,
  Star,
  ChevronRight,
  ChevronLeft,
  Package,
  Cpu,
  Shirt,
  Leaf,
  Wrench,
  Briefcase,
  CheckCircle,
  Camera,
  Menu,
  Bell,
  Heart,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Globe,
  CreditCard,
  Headphones,
  FileText,
  Send,
  Building2,
  Factory,
  Sparkles,
  ArrowRight,
  Play,
  Download,
  Smartphone,
  CalendarDays,
  Megaphone,
  BarChart3,
  Eye,
  Target,
  History,
  Flame,
  RefreshCw,
  Store,
} from "lucide-react";
import { useState, useEffect } from "react";
import { CountryFlag } from "@/components/country-flag";
import { AppDownloadPrompt, AppDownloadSection } from "@/components/app-download-prompt";
import africanTradeVideo from "@assets/generated_videos/african_business_trade_activities.mp4";

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

const MAIN_CATEGORIES = [
  { name: "Agriculture", slug: "agriculture", icon: Leaf },
  { name: "Apparel & Accessories", slug: "apparel-accessories", icon: Shirt },
  { name: "Automobiles & Motorcycles", slug: "automobiles-motorcycles", icon: Truck },
  { name: "Beauty & Personal Care", slug: "beauty-personal-care", icon: Sparkles },
  { name: "Consumer Electronics", slug: "consumer-electronics", icon: Smartphone },
  { name: "Construction & Real Estate", slug: "construction-real-estate", icon: Building2 },
  { name: "Food & Beverage", slug: "food-beverage", icon: Package },
  { name: "Furniture", slug: "furniture", icon: Building2 },
  { name: "Health & Medical", slug: "health-medical", icon: Heart },
  { name: "Home & Garden", slug: "home-garden", icon: Globe },
  { name: "Machinery", slug: "machinery", icon: Wrench },
  { name: "Minerals & Metallurgy", slug: "minerals-metallurgy", icon: Factory },
  { name: "Textiles & Leather", slug: "textiles-leather", icon: Briefcase },
  { name: "Jewelry & Watches", slug: "jewelry-watches", icon: Star },
  { name: "Sports & Entertainment", slug: "sports-entertainment", icon: Award },
  { name: "Tools & Hardware", slug: "tools-hardware", icon: Cpu },
];

const PROMO_BANNERS = [
  {
    id: 1,
    title: "Trade Assurance",
    subtitle: "Safe & Easy Online Transactions",
    description: "Get refunded if your order doesn't ship",
    bgClass: "from-primary via-primary/90 to-emerald-700",
    icon: Shield,
  },
  {
    id: 2,
    title: "Weekly Deals",
    subtitle: "Up to 50% Off Selected Items",
    description: "Limited time offers on top African products",
    bgClass: "from-amber-600 via-orange-500 to-amber-500",
    icon: Zap,
  },
  {
    id: 3,
    title: "Verified African Suppliers",
    subtitle: "Trade with Confidence Across Africa",
    description: "All sellers verified with business documentation",
    bgClass: "from-emerald-700 via-primary to-emerald-600",
    icon: CheckCircle,
  },
];

const TRADE_EXPOS = [
  { id: 1, name: "IATF - Intra-African Trade Fair", location: "Algiers, Algeria", date: "Sep 2026", country: "DZ", url: "https://www.intrafricantradefair.com" },
  { id: 2, name: "AfCFTA Business Forum", location: "Accra, Ghana", date: "Mar 2026", country: "GH", url: "https://au-afcfta.org" },
  { id: 3, name: "Africa Trade Week", location: "Nairobi, Kenya", date: "May 2026", country: "KE", url: "https://www.uneca.org" },
  { id: 4, name: "Lagos International Trade Fair", location: "Lagos, Nigeria", date: "Nov 2026", country: "NG", url: "https://www.lagoschamber.com" },
  { id: 5, name: "Cairo Trade Expo Africa", location: "Cairo, Egypt", date: "Jun 2026", country: "EG", url: "https://www.cairotradeexpo.com" },
  { id: 6, name: "SAITEX - Southern Africa Trade", location: "Johannesburg, South Africa", date: "Jun 2026", country: "ZA", url: "https://www.saitex.co.za" },
  { id: 7, name: "East Africa Trade Expo", location: "Dar es Salaam, Tanzania", date: "Jul 2026", country: "TZ", url: "https://www.eaiteexpo.com" },
  { id: 8, name: "PROMOTE - Cameroon International Fair", location: "Douala, Cameroon", date: "Dec 2026", country: "CM", url: "https://www.promote-fair.com" },
  { id: 9, name: "FOIRE Internationale de Dakar", location: "Dakar, Senegal", date: "Dec 2026", country: "SN", url: "https://www.fidak.sn" },
  { id: 10, name: "Addis Chamber Trade Fair", location: "Addis Ababa, Ethiopia", date: "Oct 2026", country: "ET", url: "https://www.addischamber.com" },
  { id: 11, name: "Rwanda International Trade Fair", location: "Kigali, Rwanda", date: "Aug 2026", country: "RW", url: "https://www.minicom.gov.rw" },
  { id: 12, name: "Morocco Expo", location: "Casablanca, Morocco", date: "Apr 2026", country: "MA", url: "https://www.ofec.ma" },
];

const BROWSING_HISTORY_KEY = "ghani_browsing_history";
const MAX_HISTORY_ITEMS = 20;

function getBrowsingHistory(): number[] {
  try {
    const stored = localStorage.getItem(BROWSING_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function ProductCard({ product, onWishlistToggle, isInWishlist }: { product: Product; onWishlistToggle?: (productId: number) => void; isInWishlist?: boolean }) {
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    }
  };

  const handleStoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/store/${product.sellerId}`);
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
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
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {product.isFeatured && (
            <Badge className="absolute top-2 left-2" variant="default">
              Featured
            </Badge>
          )}
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-2 right-2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity ${isInWishlist ? 'text-red-500' : ''}`}
            onClick={handleWishlistClick}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-xl font-bold mt-1 text-primary" data-testid={`text-product-price-${product.id}`}>
            {formatPrice(Number(product.price), true, product.currency || "USD")}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3 h-3" />
            <span>{product.city}, {product.country}</span>
          </div>
          {product.moq && product.moq > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              MOQ: {product.moq} units
            </p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
            <Badge
              variant="outline"
              className="text-xs cursor-pointer"
              onClick={handleStoreClick}
              data-testid={`badge-view-store-${product.id}`}
            >
              <Store className="w-3 h-3 mr-1" />
              View Store
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PromoBanner({ banner, isActive }: { banner: typeof PROMO_BANNERS[0]; isActive: boolean }) {
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className={`h-full bg-gradient-to-r ${banner.bgClass} flex items-center justify-between px-10 rounded-lg`}>
        <div className="text-white max-w-md">
          <p className="text-sm font-medium opacity-80 mb-1">{banner.subtitle}</p>
          <h3 className="text-3xl font-bold mb-3">{banner.title}</h3>
          <p className="text-base opacity-90">{banner.description}</p>
          <Button variant="secondary" className="mt-5" data-testid={`button-promo-${banner.id}`}>
            Learn More <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <banner.icon className="w-32 h-32 text-white/15" />
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [currentBanner, setCurrentBanner] = useState(0);
  const [showCategories, setShowCategories] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
  const { t } = useI18n();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  
  const [rfqProduct, setRfqProduct] = useState("");
  const [rfqQuantity, setRfqQuantity] = useState("");
  const [rfqUnit, setRfqUnit] = useState("pieces");
  const [rfqDetails, setRfqDetails] = useState("");
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<"products" | "suppliers" | "manufacturers">("products");
  const [browsingHistoryIds, setBrowsingHistoryIds] = useState<number[]>([]);

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: popularProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/popular"],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: wishlistData } = useQuery<{ id: number; productId: number }[]>({
    queryKey: ["/api/wishlist"],
    enabled: !!user,
  });

  const { data: sponsoredAds = [] } = useQuery<Array<{ id: number; productId: number; product: Product; packageType: string; impressions: number; clicks: number; videoUrl?: string | null }>>({
    queryKey: ["/api/advertisements"],
  });

  const { data: activeExpoAdsResponse } = useQuery<{ success: boolean; data: Array<{ id: number; eventName: string; location: string; eventDate: string; countryCode: string; websiteUrl: string; packageType: string }> }>({
    queryKey: ["/api/trade-expo-ads/active"],
  });
  const activeExpoAds = activeExpoAdsResponse?.data || [];

  useEffect(() => {
    if (wishlistData) {
      setWishlistIds(new Set(wishlistData.map(item => item.productId)));
    }
  }, [wishlistData]);

  useEffect(() => {
    setBrowsingHistoryIds(getBrowsingHistory());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const rfqMutation = useMutation({
    mutationFn: async (data: { productName: string; quantity: number; unit: string; details: string }) => {
      const response = await apiRequest("POST", "/api/rfq", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Request submitted!", description: "Suppliers will send you quotes soon." });
      setRfqProduct("");
      setRfqQuantity("");
      setRfqUnit("pieces");
      setRfqDetails("");
    },
    onError: () => {
      toast({ title: "Failed to submit request", variant: "destructive" });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      if (wishlistIds.has(productId)) {
        await apiRequest("DELETE", `/api/wishlist/product/${productId}`);
        return { action: 'removed', productId };
      } else {
        const response = await apiRequest("POST", "/api/wishlist", { productId });
        return { action: 'added', productId, data: await response.json() };
      }
    },
    onSuccess: (result) => {
      if (result.action === 'removed') {
        setWishlistIds(prev => {
          const next = new Set(prev);
          next.delete(result.productId);
          return next;
        });
        toast({ title: "Removed from wishlist" });
      } else {
        setWishlistIds(prev => new Set(prev).add(result.productId));
        toast({ title: "Added to wishlist" });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    },
    onError: () => {
      toast({ title: "Please sign in to save items", variant: "destructive" });
    },
  });

  const handleRfqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqProduct || !rfqQuantity) {
      toast({ title: "Please fill in product name and quantity", variant: "destructive" });
      return;
    }
    rfqMutation.mutate({
      productName: rfqProduct,
      quantity: parseInt(rfqQuantity),
      unit: rfqUnit,
      details: rfqDetails,
    });
  };

  const handleWishlistToggle = (productId: number) => {
    if (!user) {
      toast({ title: "Please sign in to save items", variant: "destructive" });
      return;
    }
    wishlistMutation.mutate(productId);
  };

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

  const handleImageSearch = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setIsImageSearching(true);
      try {
        const base64 = await resizeImageForSearch(file);
        const response = await apiRequest("POST", "/api/search/image", { imageBase64: base64 });
        const result = await response.json();
        
        if (result.success && result.data.keywords?.length > 0) {
          const searchTerm = result.data.keywords.join(' ');
          navigate(`/browse?search=${encodeURIComponent(searchTerm)}`);
          toast({ title: "Image analyzed!", description: `Searching for: ${result.data.keywords.slice(0, 3).join(', ')}` });
        } else {
          toast({ title: "Could not identify product", variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "Image search failed", variant: "destructive" });
      } finally {
        setIsImageSearching(false);
      }
    };
    input.click();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/browse?search=${encodeURIComponent(searchQuery)}${selectedCountry && selectedCountry !== "all" ? `&country=${selectedCountry}` : ""}`);
  };

  const topRankingProducts = allProducts.filter(p => p.isFeatured).slice(0, 6);
  const newArrivals = [...allProducts].sort((a, b) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  ).slice(0, 6);

  const browsingHistoryProducts = browsingHistoryIds
    .map(id => allProducts.find(p => p.id === id))
    .filter((p): p is Product => !!p)
    .slice(0, 8);

  const viewedCountries = new Set(browsingHistoryProducts.map(p => p.country));
  const keepLookingProducts = viewedCountries.size > 0
    ? allProducts
        .filter(p => viewedCountries.has(p.country) && !browsingHistoryIds.includes(p.id))
        .slice(0, 6)
    : [];

  const buyersPickProducts = [...allProducts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .filter(p => p.isFeatured || (p.views || 0) > 0)
    .slice(0, 8);

  const handleSearchWithTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTab === "suppliers") {
      navigate(`/suppliers?search=${encodeURIComponent(searchQuery)}`);
    } else if (searchTab === "manufacturers") {
      navigate(`/browse?category=manufacturing&search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/browse?search=${encodeURIComponent(searchQuery)}${selectedCountry && selectedCountry !== "all" ? `&country=${selectedCountry}` : ""}`);
    }
  };

  const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    "agriculture": "Farm produce & inputs",
    "apparel-accessories": "Clothing & fashion",
    "automobiles-motorcycles": "Vehicles & parts",
    "beauty-personal-care": "Cosmetics & wellness",
    "chemicals": "Industrial chemicals",
    "construction-real-estate": "Building materials",
    "consumer-electronics": "Phones, laptops & gadgets",
    "electrical-equipment": "Wires, generators & solar",
    "energy": "Solar, wind & biofuels",
    "environment": "Water & waste solutions",
    "food-beverage": "Snacks, drinks & groceries",
    "furniture": "Home & office furniture",
    "health-medical": "Medical supplies & pharma",
    "home-garden": "Decor, kitchen & garden",
    "industrial-equipment": "Pumps, valves & machinery",
    "lights-lighting": "LED, solar & commercial",
    "luggage-bags-cases": "Bags, wallets & luggage",
    "machinery": "Agricultural & industrial",
    "minerals-metallurgy": "Gold, gems & metals",
    "office-school-supplies": "Stationery & electronics",
    "packaging-printing": "Paper, plastic & labels",
    "security-protection": "CCTV, alarms & safety",
    "shoes-footwear": "Men's, women's & sports",
    "sports-entertainment": "Fitness & musical",
    "telecommunications": "Networking & telecom",
    "textiles-leather": "African prints & leather",
    "tools-hardware": "Hand & power tools",
    "toys-hobbies": "Educational & outdoor",
    "transportation": "Shipping & logistics",
    "jewelry-watches": "Gold, beads & watches",
  };

  const CATEGORY_COLORS: Record<string, string> = {
    "agriculture": "bg-green-500/10 text-green-600 dark:text-green-400",
    "apparel-accessories": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    "automobiles-motorcycles": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    "beauty-personal-care": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    "chemicals": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    "construction-real-estate": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    "consumer-electronics": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "electrical-equipment": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "energy": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    "environment": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "food-beverage": "bg-red-500/10 text-red-600 dark:text-red-400",
    "furniture": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "health-medical": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    "home-garden": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    "industrial-equipment": "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    "lights-lighting": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    "luggage-bags-cases": "bg-stone-500/10 text-stone-600 dark:text-stone-400",
    "machinery": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    "minerals-metallurgy": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "office-school-supplies": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    "packaging-printing": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    "security-protection": "bg-red-500/10 text-red-600 dark:text-red-400",
    "shoes-footwear": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    "sports-entertainment": "bg-lime-500/10 text-lime-600 dark:text-lime-400",
    "telecommunications": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    "textiles-leather": "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
    "tools-hardware": "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
    "toys-hobbies": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    "transportation": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "jewelry-watches": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 0. Trade Expos Ticker Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white overflow-hidden" data-testid="banner-trade-expos">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center h-9 gap-3">
            <div className="flex items-center gap-1.5 shrink-0 font-semibold text-xs uppercase tracking-wide border-r border-white/30 pr-3">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Trade Expos</span>
            </div>
            <div className="overflow-hidden flex-1 relative">
              <div className="flex animate-scroll-left gap-8 whitespace-nowrap">
                {(() => {
                  const expoList = activeExpoAds.length > 0
                    ? activeExpoAds.map(ad => ({
                        id: ad.id,
                        name: ad.eventName,
                        location: ad.location,
                        date: ad.eventDate,
                        country: ad.countryCode,
                        url: ad.websiteUrl,
                      }))
                    : TRADE_EXPOS;
                  return [...expoList, ...expoList].map((expo, idx) => (
                    <a
                      key={`${expo.id}-${idx}`}
                      href={expo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                      data-testid={`link-expo-${expo.id}`}
                    >
                      <CountryFlag code={expo.country} size="sm" />
                      <span className="font-medium underline decoration-white/40 underline-offset-2">{expo.name}</span>
                      <span className="opacity-75">•</span>
                      <span className="opacity-90">{expo.location}</span>
                      <Badge className="bg-white/20 text-white border-0 text-[10px] px-1.5 py-0">{expo.date}</Badge>
                    </a>
                  ));
                })()}
              </div>
            </div>
            <Link href="/trade-expo-advertise" className="shrink-0 ml-2">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[10px] px-2 py-0.5 cursor-pointer whitespace-nowrap" data-testid="link-advertise-expo">
                <Megaphone className="w-3 h-3 mr-1" /> Advertise Here
              </Badge>
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Top Utility Bar */}
      <div className="bg-muted/50 border-b text-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-1.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                Free Shipping on Orders $100+
              </span>
              <span className="hidden md:flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Buyer Protection
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CurrencySelector />
              <LanguageSelector />
              <Link href="/help" className="text-muted-foreground hover:text-foreground" data-testid="link-help-center">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Header - Sticky */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-4">
              <GradientLogo size="md" />
              
              <div className="relative hidden lg:block">
                <Button
                  variant="ghost"
                  className="gap-2"
                  onMouseEnter={() => setShowCategories(true)}
                  onMouseLeave={() => setShowCategories(false)}
                  data-testid="button-categories"
                >
                  <Menu className="w-5 h-5" />
                  Categories
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                {showCategories && (
                  <div
                    className="absolute top-full left-0 flex bg-background border rounded-lg shadow-lg z-50"
                    onMouseEnter={() => setShowCategories(true)}
                    onMouseLeave={() => { setShowCategories(false); setHoveredCategoryId(null); }}
                  >
                    <div className="w-[280px] border-r max-h-[500px] overflow-y-auto py-2">
                      {categories.filter((c: Category) => !c.parentId).map((cat: Category) => {
                        const staticCat = MAIN_CATEGORIES.find(m => m.slug === cat.slug);
                        const IconComponent = staticCat?.icon || Package;
                        return (
                          <Link key={cat.id} href={`/browse?category=${cat.id}`} data-testid={`link-mega-${cat.slug}`}>
                            <div
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${hoveredCategoryId === cat.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                              onMouseEnter={() => setHoveredCategoryId(cat.id)}
                            >
                              <IconComponent className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{cat.name}</span>
                              {categories.some((c: Category) => c.parentId === cat.id) && (
                                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    {hoveredCategoryId && (
                      <div className="w-[400px] p-4 max-h-[500px] overflow-y-auto">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                          {categories.find((c: Category) => c.id === hoveredCategoryId)?.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-1">
                          {categories.filter((c: Category) => c.parentId === hoveredCategoryId).map((sub: Category) => (
                            <Link key={sub.id} href={`/browse?category=${sub.id}`} data-testid={`link-sub-${sub.slug}`}>
                              <div className="px-3 py-2 text-sm rounded-md hover:bg-muted cursor-pointer transition-colors">
                                {sub.name}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="hidden md:flex flex-col flex-1 max-w-2xl">
              <div className="flex items-center gap-1 mb-1">
                {(["products", "suppliers", "manufacturers"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSearchTab(tab)}
                    className={`px-3 py-1 text-sm font-medium rounded-t-md transition-colors capitalize ${
                      searchTab === tab
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`tab-search-${tab}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSearchWithTab} className="flex">
                <div className="flex w-full border-2 border-primary rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/50">
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-[140px] border-0 border-r rounded-none bg-muted/30" data-testid="select-header-country">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {AFRICAN_COUNTRIES.slice(0, 20).map((c) => (
                        <SelectItem key={c.code} value={c.name}>
                          <span className="flex items-center gap-2">
                            <CountryFlag code={c.code} size="sm" />
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="search"
                    placeholder={
                      searchTab === "products" ? "Search products, suppliers, and more..." :
                      searchTab === "suppliers" ? "Search verified suppliers..." :
                      "Find manufacturers & factories..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0"
                    data-testid="input-search"
                  />
                  <Button type="button" variant="ghost" size="icon" className="border-l rounded-none" onClick={handleImageSearch} disabled={isImageSearching} data-testid="button-image-search">
                    <Camera className={`w-5 h-5 text-muted-foreground ${isImageSearching ? 'animate-pulse' : ''}`} />
                  </Button>
                  <Button type="submit" className="rounded-none px-6 font-semibold" data-testid="button-search">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </form>
            </div>

            <nav className="flex items-center gap-1">
              {authLoading ? null : user ? (
                <>
                  <Link href="/messages">
                    <Button variant="ghost" size="icon" data-testid="button-messages">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/orders">
                    <Button variant="ghost" size="icon" data-testid="button-orders">
                      <Package className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/wishlist">
                    <Button variant="ghost" size="icon" data-testid="button-wishlist">
                      <Heart className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" data-testid="button-cart">
                      <ShoppingCart className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="default" data-testid="button-dashboard">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <a href="/login">
                    <Button variant="ghost" data-testid="button-login">Sign In</Button>
                  </a>
                  <a href="/register">
                    <Button data-testid="button-get-started">Join Free</Button>
                  </a>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 3. Quick Links Bar */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-2 overflow-x-auto scrollbar-none text-sm">
            <Link href="/browse?featured=true" className="whitespace-nowrap text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0" data-testid="link-top-ranking">
              <Star className="w-4 h-4" /> Top Ranking
            </Link>
            <Link href="/browse?deals=true" className="whitespace-nowrap text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0" data-testid="link-weekly-deals">
              <Zap className="w-4 h-4" /> Weekly Deals
            </Link>
            <Link href="/browse?new=true" className="whitespace-nowrap text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0" data-testid="link-new-arrivals">
              <Sparkles className="w-4 h-4" /> New Arrivals
            </Link>
            <Link href="/rfq" className="whitespace-nowrap text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0" data-testid="link-rfq">
              <FileText className="w-4 h-4" /> Request Quotation
            </Link>
            <Link href="/suppliers" className="whitespace-nowrap text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0" data-testid="link-verified-suppliers">
              <Building2 className="w-4 h-4" /> Verified Suppliers
            </Link>
            <Link href="/trade-assurance" className="whitespace-nowrap text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0" data-testid="link-trade-assurance">
              <Shield className="w-4 h-4" /> Trade Assurance
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Hero Section - 3 column */}
      <section className="relative py-4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="video-hero-background"
        >
          <source src={africanTradeVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background" />
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[250px_1fr_300px] gap-4">
            <div className="hidden lg:block bg-background rounded-lg border p-4 max-h-[380px] overflow-y-auto">
              <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">Categories</h3>
              <nav className="space-y-0.5">
                {categories.filter((c: Category) => !c.parentId).map((cat: Category) => {
                  const staticCat = MAIN_CATEGORIES.find(m => m.slug === cat.slug);
                  const IconComponent = staticCat?.icon || Package;
                  return (
                    <Link key={cat.id} href={`/browse?category=${cat.id}`} data-testid={`link-sidebar-${cat.slug}`}>
                      <div className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer text-sm">
                        <IconComponent className="w-4 h-4 text-primary" />
                        <span className="truncate">{cat.name}</span>
                        <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="relative h-[340px] rounded-lg overflow-hidden">
              {PROMO_BANNERS.map((banner, idx) => (
                <PromoBanner key={banner.id} banner={banner} isActive={idx === currentBanner} />
              ))}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {PROMO_BANNERS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBanner(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentBanner ? 'bg-white' : 'bg-white/50'}`}
                    data-testid={`button-banner-dot-${idx}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentBanner((prev) => (prev - 1 + PROMO_BANNERS.length) % PROMO_BANNERS.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40"
                data-testid="button-banner-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentBanner((prev) => (prev + 1) % PROMO_BANNERS.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/40"
                data-testid="button-banner-next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="hidden lg:flex flex-col gap-2" data-testid="hero-product-showcase">
              <div className="bg-background rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Trending Now</p>
                <div className="grid grid-cols-2 gap-2">
                  {allProducts.filter(p => p.images && p.images.length > 0).slice(0, 4).map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`}>
                      <div className="group cursor-pointer" data-testid={`hero-product-${product.id}`}>
                        <div className="aspect-square rounded-md overflow-hidden bg-muted mb-1">
                          <img
                            src={product.images![0]}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <p className="text-[11px] line-clamp-1 text-muted-foreground">{product.name}</p>
                        <p className="text-xs font-bold text-primary">{formatPrice(Number(product.price), true, product.currency || "USD")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {user ? (
                  <Link href="/dashboard" className="flex-1">
                    <Button size="sm" className="w-full text-xs" data-testid="button-sidebar-dashboard">My Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <a href="/login" className="flex-1">
                      <Button size="sm" className="w-full text-xs" data-testid="button-sidebar-signin">Sign In</Button>
                    </a>
                    <a href="/register" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full text-xs" data-testid="button-sidebar-join">Join Free</Button>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4b. Featured Products Photo Strip - immediately visible */}
      <section className="py-4 border-b bg-background" data-testid="section-product-showcase">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Top Products From Africa
            </h2>
            <Link href="/browse">
              <Button variant="ghost" size="sm" className="text-xs" data-testid="link-shop-all">
                Shop All <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {allProducts.filter(p => p.images && p.images.length > 0).slice(0, 12).map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="shrink-0">
                <div className="group w-[140px] md:w-[170px] cursor-pointer" data-testid={`showcase-product-${product.id}`}>
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted shadow-sm border">
                    <img
                      src={product.images![0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-xs line-clamp-1 mt-1.5 font-medium">{product.name}</p>
                  <p className="text-sm font-bold text-primary">{formatPrice(Number(product.price), true, product.currency || "USD")}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {product.country}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Trust Indicators Strip */}
      <section className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3" data-testid="stat-sellers">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold">50K+</p>
                <p className="text-xs text-muted-foreground">Verified Sellers</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="stat-products">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold">1M+</p>
                <p className="text-xs text-muted-foreground">Products Listed</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="stat-countries">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold">54</p>
                <p className="text-xs text-muted-foreground">African Countries</p>
              </div>
            </div>
            <div className="flex items-center gap-3" data-testid="stat-support">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Headphones className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-base font-bold">24/7</p>
                <p className="text-xs text-muted-foreground">Customer Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5b. Browsing History - like Alibaba */}
      {browsingHistoryProducts.length > 0 && (
        <section className="py-6 border-b bg-muted/20" data-testid="section-browsing-history">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold">Browsing History</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  localStorage.removeItem(BROWSING_HISTORY_KEY);
                  setBrowsingHistoryIds([]);
                }}
                data-testid="button-clear-history"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Clear
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {browsingHistoryProducts.map((product) => (
                <div key={product.id} className="shrink-0 w-[160px]">
                  <Link href={`/products/${product.id}`}>
                    <Card className="hover-elevate cursor-pointer h-full">
                      <CardContent className="p-0">
                        <div className="aspect-square bg-muted relative overflow-hidden rounded-t-md protected-image-container" onContextMenu={(e: any) => e.preventDefault()}>
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" draggable={false} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs line-clamp-1 text-muted-foreground">{product.name}</p>
                          <p className="text-sm font-bold text-primary">{formatPrice(Number(product.price), true, product.currency || "USD")}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5c. Keep Looking For - personalized suggestions like Alibaba */}
      {keepLookingProducts.length > 0 && (
        <section className="py-6 border-b" data-testid="section-keep-looking">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Keep Looking For</h2>
                  <p className="text-xs text-muted-foreground">Based on products you've viewed</p>
                </div>
              </div>
              <Link href="/browse">
                <Button variant="ghost" size="sm" data-testid="link-view-more-suggestions">
                  More <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {keepLookingProducts.map((product) => (
                <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} isInWishlist={wishlistIds.has(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5d. Buyers' Picks / Proven Favorites - promotional banner like Alibaba */}
      {buyersPickProducts.length > 0 && (
        <section className="py-6 border-b" data-testid="section-buyers-picks">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Buyers' Picks</h2>
                    <p className="text-xs text-muted-foreground">Most popular with African buyers</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {buyersPickProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} isInWishlist={wishlistIds.has(product.id)} />
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <Card className="h-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white border-0 overflow-hidden">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <Badge className="bg-white/20 text-white border-0 mb-3">Trending</Badge>
                      <h3 className="text-2xl font-bold leading-tight mb-2">Repeat buyers' picks</h3>
                      <p className="text-lg font-semibold opacity-90 mb-1">Proven favorites - stock up</p>
                      <p className="text-sm opacity-80">Products African businesses keep coming back for</p>
                    </div>
                    <Link href="/browse?featured=true">
                      <Button variant="secondary" className="w-full mt-4" data-testid="button-explore-picks">
                        Explore now <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5e. Recommended Products - Prominent product grid like Alibaba */}
      {allProducts.length > 0 && (
        <section className="py-8 border-b" data-testid="section-recommended">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Recommended For You</h2>
                  <p className="text-sm text-muted-foreground">Handpicked products from across Africa</p>
                </div>
              </div>
              <Link href="/browse">
                <Button variant="ghost" data-testid="link-view-all-recommended">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {allProducts.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} isInWishlist={wishlistIds.has(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Category Grid - Explore by Category */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Explore by Category</h2>
                <p className="text-sm text-muted-foreground">Browse products across all sectors</p>
              </div>
            </div>
            <Link href="/browse">
              <Button variant="ghost" data-testid="link-view-all-categories">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.filter((c: Category) => !c.parentId).map((cat: Category) => {
              const staticCat = MAIN_CATEGORIES.find(m => m.slug === cat.slug);
              const IconComponent = staticCat?.icon || Package;
              return (
                <Link key={cat.id} href={`/browse?category=${cat.id}`}>
                  <Card className="hover-elevate cursor-pointer h-full">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${CATEGORY_COLORS[cat.slug] || 'bg-primary/10 text-primary'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" data-testid={`link-category-${cat.slug}`}>{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{CATEGORY_DESCRIPTIONS[cat.slug] || ''}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Sponsored/Featured Products */}
      {sponsoredAds.length > 0 && (
        <section className="py-8 bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    Featured Products
                    <Badge variant="secondary" className="text-xs">Sponsored</Badge>
                  </h2>
                  <p className="text-sm text-muted-foreground">Premium listings from verified sellers</p>
                </div>
              </div>
              <Link href="/browse?sponsored=true">
                <Button variant="ghost" data-testid="link-view-all-sponsored">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            {sponsoredAds.filter(ad => ad.videoUrl && ad.packageType === "featured").length > 0 && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {sponsoredAds.filter(ad => ad.videoUrl && ad.packageType === "featured").slice(0, 2).map((ad) => (
                  <Link key={ad.id} href={`/products/${ad.productId}`}>
                    <Card className="overflow-hidden hover-elevate cursor-pointer" data-testid={`card-video-ad-${ad.id}`}>
                      <div className="relative aspect-video bg-black">
                        <video
                          src={ad.videoUrl!}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                        <div className="absolute top-2 left-2 flex gap-2">
                          <Badge className="bg-amber-500 text-white text-xs">Ad</Badge>
                          <Badge variant="secondary" className="text-xs">Video</Badge>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <h3 className="text-white font-semibold truncate">{ad.product.name}</h3>
                          <p className="text-white/80 text-sm">{formatPrice(Number(ad.product.price), true, ad.product.currency || "USD")}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sponsoredAds.slice(0, 6).map((ad) => (
                <div key={ad.id} className="relative" data-testid={`card-sponsored-${ad.id}`}>
                  <Badge className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-xs">
                    Ad
                  </Badge>
                  {ad.videoUrl && ad.packageType !== "featured" && (
                    <Badge className="absolute top-2 right-2 z-10 bg-black/70 text-white text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Video
                    </Badge>
                  )}
                  <ProductCard 
                    product={ad.product} 
                    onWishlistToggle={handleWishlistToggle} 
                    isInWishlist={wishlistIds.has(ad.productId)} 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Top Ranking Products */}
      {topRankingProducts.length > 0 && (
        <section className="py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Top Ranking</h2>
                  <p className="text-sm text-muted-foreground">Best sellers this week</p>
                </div>
              </div>
              <Link href="/browse?featured=true">
                <Button variant="ghost" data-testid="link-view-all-ranking">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topRankingProducts.map((product) => (
                <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} isInWishlist={wishlistIds.has(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-8 bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">New Arrivals</h2>
                  <p className="text-sm text-muted-foreground">Fresh products just added</p>
                </div>
              </div>
              <Link href="/browse?sort=newest">
                <Button variant="ghost" data-testid="link-view-all-new">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} isInWishlist={wishlistIds.has(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. Popular Products */}
      {popularProducts.length > 0 && (
        <section className="py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Popular Products</h2>
                  <p className="text-sm text-muted-foreground">Most viewed by buyers this week</p>
                </div>
              </div>
              <Link href="/browse?sort=popular">
                <Button variant="ghost" data-testid="link-view-all-popular">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {popularProducts.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} onWishlistToggle={handleWishlistToggle} isInWishlist={wishlistIds.has(product.id)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. Request for Quotation */}
      <section className="py-12 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-4">Request for Quotation</h2>
              <p className="text-lg opacity-90 mb-6">
                Tell us what you need and get quotes from verified suppliers across Africa
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>One request, multiple quotes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Compare prices easily</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Verified suppliers only</span>
                </li>
              </ul>
            </div>
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Submit Your Request</h3>
                <form className="space-y-4" onSubmit={handleRfqSubmit}>
                  <div>
                    <Input 
                      placeholder="Product name or description" 
                      value={rfqProduct}
                      onChange={(e) => setRfqProduct(e.target.value)}
                      data-testid="input-rfq-product" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Quantity" 
                      type="number" 
                      value={rfqQuantity}
                      onChange={(e) => setRfqQuantity(e.target.value)}
                      data-testid="input-rfq-quantity" 
                    />
                    <Select value={rfqUnit} onValueChange={setRfqUnit}>
                      <SelectTrigger data-testid="select-rfq-unit">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea 
                    placeholder="Additional details (specifications, quality requirements, etc.)" 
                    value={rfqDetails}
                    onChange={(e) => setRfqDetails(e.target.value)}
                    data-testid="textarea-rfq-details" 
                  />
                  <Button type="submit" className="w-full" disabled={rfqMutation.isPending} data-testid="button-submit-rfq">
                    <Send className="w-4 h-4 mr-2" />
                    {rfqMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 11b. Advertise With Us */}
      <section className="py-12 bg-muted/30 border-b" data-testid="section-advertise">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Advertise on Ghani Africa</h2>
                <p className="text-sm text-muted-foreground">Reach millions of buyers across the continent</p>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="font-semibold mb-2">Basic Ad</h3>
                <p className="text-2xl font-bold text-primary mb-1">$29</p>
                <p className="text-sm text-muted-foreground mb-4">7 days • Image only</p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Standard placement in browse</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Product image showcase</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Basic analytics</li>
                </ul>
                <Link href="/dashboard/advertising">
                  <Button variant="outline" className="w-full" data-testid="button-ad-basic">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-white">Most Popular</Badge>
              </div>
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <Play className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-semibold mb-2">Premium Ad</h3>
                <p className="text-2xl font-bold text-primary mb-1">$79</p>
                <p className="text-sm text-muted-foreground mb-4">14 days • Video support</p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Priority placement</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Video ads up to 60s</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Detailed analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Featured badge</li>
                </ul>
                <Link href="/dashboard/advertising">
                  <Button className="w-full" data-testid="button-ad-premium">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-7 h-7 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">Featured Ad</h3>
                <p className="text-2xl font-bold text-primary mb-1">$149</p>
                <p className="text-sm text-muted-foreground mb-4">30 days • Homepage spotlight</p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left mb-6">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Homepage auto-play video</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Top search results</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Full analytics dashboard</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> Dedicated support</li>
                </ul>
                <Link href="/dashboard/advertising">
                  <Button variant="outline" className="w-full" data-testid="button-ad-featured">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Trusted by 5,000+ sellers across Africa to grow their businesses</p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Real-time analytics</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4 text-primary" />
                <span>10M+ monthly views</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4 text-primary" />
                <span>54 African countries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Browse by Country */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Browse by Country</h2>
                <p className="text-sm text-muted-foreground">Discover products from across the continent</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {AFRICAN_COUNTRIES.slice(0, 24).map((country) => (
              <Link key={country.code} href={`/browse?country=${country.name}`}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover-elevate cursor-pointer" data-testid={`button-country-${country.code}`}>
                  <CountryFlag code={country.code} size="lg" />
                  <span className="text-xs text-center">{country.name}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/browse">
              <Button variant="outline" data-testid="button-all-countries">
                View All 54 Countries <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 13. How It Works (static only) */}
      <section className="py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold">How Ghani Africa Works</h2>
            <p className="text-sm text-muted-foreground mt-1">Simple steps to trade across Africa</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Search & Discover</h3>
              <p className="text-sm text-muted-foreground">
                Find products from verified sellers across 54 African countries
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Connect & Negotiate</h3>
              <p className="text-sm text-muted-foreground">
                Chat directly with sellers to discuss pricing and terms
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">
                Pay safely with escrow protection on all transactions
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Receive & Confirm</h3>
              <p className="text-sm text-muted-foreground">
                Get your order delivered and release payment on confirmation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 14. Trust Features */}
      <section className="py-12 bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Trade Assurance</h3>
                <p className="text-sm text-muted-foreground">
                  Your payments are protected with our escrow system. Funds are only released to sellers after you confirm delivery.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">African Logistics</h3>
                <p className="text-sm text-muted-foreground">
                  Integrated shipping partners for reliable cross-border and local delivery across the continent.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Verified Suppliers</h3>
                <p className="text-sm text-muted-foreground">
                  Trade with confidence knowing all sellers are verified with business documentation and quality checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 15. App Download Section */}
      <AppDownloadSection />

      {/* 16. AI Assistant */}
      <AIAssistant />

      {/* 17. Footer */}
      <footer className="bg-card border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <GradientLogo size="lg" showText={false} linkTo="" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Africa's Premier Digital Marketplace. Connecting Africa's trade ecosystem for a prosperous future.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Smartphone className="w-4 h-4" />
                  Get the App
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Buyers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/browse" data-testid="link-footer-browse">Browse Products</Link></li>
                <li><Link href="/rfq" data-testid="link-footer-rfq">Request Quotation</Link></li>
                <li><Link href="/trade-assurance" data-testid="link-footer-trade-assurance">Trade Assurance</Link></li>
                <li><Link href="/help" data-testid="link-footer-help">Help Center</Link></li>
                <li><Link href="/trust-safety" data-testid="link-footer-trust-safety">Trust & Safety</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sellers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/sell" data-testid="link-footer-sell">Start Selling</Link></li>
                <li><Link href="/dashboard" data-testid="link-footer-dashboard">Seller Dashboard</Link></li>
                <li><a href="#" data-testid="link-footer-resources">Seller Resources</a></li>
                <li><a href="#" data-testid="link-footer-pricing">Pricing Plans</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" data-testid="link-footer-about">About Us</a></li>
                <li><a href="#" data-testid="link-footer-careers">Careers</a></li>
                <li><a href="#" data-testid="link-footer-press">Press</a></li>
                <li><a href="#" data-testid="link-footer-contact">Contact</a></li>
              </ul>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="border-t mt-8 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Accepted Payments:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Visa</Badge>
                  <Badge variant="secondary">Mastercard</Badge>
                  <Badge variant="secondary">M-Pesa</Badge>
                  <Badge variant="secondary">MTN Mobile</Badge>
                  <Badge variant="secondary">Orange Money</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Ghani Africa. All rights reserved. This digital marketplace is powered by PAIDM.</p>
            <div className="flex gap-4">
              <a href="#" data-testid="link-footer-terms">Terms of Service</a>
              <a href="#" data-testid="link-footer-privacy">Privacy Policy</a>
              <a href="#" data-testid="link-footer-cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 18. App Download Prompt */}
      <AppDownloadPrompt />
    </div>
  );
}
