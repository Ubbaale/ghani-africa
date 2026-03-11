import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import type { Product, UserProfile, Order, BusinessDocument, Category, Invoice, ActivityLog } from "@shared/schema";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Star,
  Eye,
  LogOut,
  MessageCircle,
  ArrowLeft,
  Store,
  Link as LinkIcon,
  Share2,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Award,
  Shield,
  Upload,
  Calendar,
  Building2,
  Crown,
  MapPin,
  Truck,
  Activity,
  Receipt,
  Layers,
  CreditCard,
  Wheat,
  Video,
  Users,
  BarChart3,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useState, useEffect } from "react";
import { CountryFlag } from "@/components/country-flag";
import { useCurrency } from "@/lib/currency-context";
import { ImageCaptureUploader, ProductImageGallery } from "@/components/ImageCaptureUploader";

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

const MANUFACTURER_TYPES = [
  "Aerospace & Defense",
  "Agricultural Equipment",
  "Apparel & Textiles",
  "Automotive & Auto Parts",
  "Beauty & Cosmetics",
  "Beverages",
  "Building Materials & Construction",
  "Cement & Concrete",
  "Ceramics & Glass",
  "Chemicals & Petrochemicals",
  "Consumer Electronics",
  "Electrical Equipment",
  "Energy & Power Generation",
  "Fertilizers & Agrochemicals",
  "Food Processing",
  "Footwear & Leather Goods",
  "Furniture & Wood Products",
  "Handicrafts & Artisan Goods",
  "Heavy Machinery & Equipment",
  "Household Products",
  "Industrial Tools & Hardware",
  "Iron & Steel",
  "Jewelry & Accessories",
  "Leather & Leather Products",
  "Lighting & Fixtures",
  "Medical Equipment & Devices",
  "Metal Fabrication",
  "Mining Equipment",
  "Office Supplies & Stationery",
  "Packaging Materials",
  "Paint & Coatings",
  "Paper & Pulp Products",
  "Pharmaceuticals",
  "Plastics & Rubber",
  "Printing & Publishing",
  "Renewable Energy Equipment",
  "Sporting Goods",
  "Telecom Equipment",
  "Textile Machinery",
  "Toys & Games",
  "Transportation Equipment",
  "Water Treatment Equipment",
  "Other Manufacturing"
];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && <p className="text-xs text-green-600 mt-1">{trend}</p>}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { formatPrice, formatOriginalPrice, currencies } = useCurrency();
  const [, navigate] = useLocation();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const { data: myProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/products?sellerId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: buyerOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "buyer"],
    queryFn: async () => {
      const response = await fetch("/api/orders?role=buyer");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: sellerOrders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "seller"],
    queryFn: async () => {
      const response = await fetch("/api/orders?role=seller");
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: businessDocuments = [] } = useQuery<BusinessDocument[]>({
    queryKey: ["/api/business-documents"],
    queryFn: async () => {
      const response = await fetch("/api/business-documents");
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const [profileForm, setProfileForm] = useState({
    role: "consumer",
    manufacturerType: "",
    lineOfBusiness: "",
    businessName: "",
    businessDescription: "",
    phone: "",
    country: "Kenya",
    city: "",
    address: "",
    geoFilterEnabled: false,
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    currency: "USD",
    moq: "1",
    stock: "",
    country: "Kenya",
    city: "",
    categoryId: "",
    newCategoryName: "",
    images: [] as string[],
    wholesalePricing: [] as { minQty: number; maxQty: number | null; unitPrice: string }[],
    sampleAvailable: false,
    samplePrice: "",
    sampleMaxQty: "5",
  });
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        role: profile.role || "consumer",
        manufacturerType: (profile as any).manufacturerType || "",
        lineOfBusiness: (profile as any).lineOfBusiness || "",
        businessName: profile.businessName || "",
        businessDescription: profile.businessDescription || "",
        phone: profile.phone || "",
        country: profile.country || "Kenya",
        city: profile.city || "",
        address: profile.address || "",
        geoFilterEnabled: (profile as any).geoFilterEnabled ?? false,
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      return apiRequest("POST", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: t("dashboard.saveProfile") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: "Failed to update profile", variant: "destructive" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      return apiRequest("POST", "/api/products", {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency || "USD",
        moq: parseInt(data.moq) || 1,
        stock: parseInt(data.stock) || 0,
        country: data.country,
        city: data.city,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        categoryName: data.newCategoryName || undefined,
        images: data.images,
        wholesalePricing: data.wholesalePricing.length > 0
          ? data.wholesalePricing.map(t => ({ minQty: t.minQty, maxQty: t.maxQty, unitPrice: parseFloat(t.unitPrice) }))
          : undefined,
        sampleAvailable: data.sampleAvailable,
        samplePrice: data.samplePrice ? data.samplePrice : undefined,
        sampleMaxQty: data.sampleMaxQty ? parseInt(data.sampleMaxQty) : 5,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setProductForm({
        name: "",
        description: "",
        price: "",
        currency: "USD",
        moq: "1",
        stock: "",
        country: "Kenya",
        city: "",
        categoryId: "",
        newCategoryName: "",
        images: [],
        wholesalePricing: [],
        sampleAvailable: false,
        samplePrice: "",
        sampleMaxQty: "5",
      });
      setIsCreatingNewCategory(false);
      toast({ title: t("dashboard.addProduct") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: "Failed to create product", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: t("seller.myProducts") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: "Failed to delete product", variant: "destructive" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: t("dashboard.updateStatus") });
    },
    onError: () => {
      toast({ title: t("common.error"), description: "Failed to update order", variant: "destructive" });
    },
  });

  const [documentForm, setDocumentForm] = useState({
    type: "registration",
    name: "",
    description: "",
    documentUrl: "",
    issuingAuthority: "",
    issuingCountry: "",
    issueDate: "",
    expiryDate: "",
    documentNumber: "",
    isPublic: true,
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof documentForm) => {
      return apiRequest("POST", "/api/business-documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-documents"] });
      setDocumentForm({
        type: "registration",
        name: "",
        description: "",
        documentUrl: "",
        issuingAuthority: "",
        issuingCountry: "",
        issueDate: "",
        expiryDate: "",
        documentNumber: "",
        isPublic: true,
      });
      toast({ title: "Document added successfully" });
    },
    onError: () => {
      toast({ title: t("common.error"), description: "Failed to add document", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest("DELETE", `/api/business-documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-documents"] });
      toast({ title: "Document removed" });
    },
    onError: () => {
      toast({ title: t("common.error"), description: "Failed to delete document", variant: "destructive" });
    },
  });

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

  const isSeller = profile?.role === "trader" || profile?.role === "manufacturer";

  const totalRevenue = sellerOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const avgOrderValue = sellerOrders.length > 0 ? totalRevenue / sellerOrders.length : 0;
  const pendingOrders = sellerOrders.filter(o => o.status === "pending" || o.status === "confirmed").length;

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <GradientLogo size="sm" />
              <span className="font-bold text-xl text-primary">{t("dashboard.title")}</span>
            </div>
            
            <nav className="flex items-center gap-2">
              <Link href="/messages">
                <Button variant="ghost" size="icon" data-testid="button-messages">
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
                <LogOut className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-14 h-14">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.firstName?.[0] || user.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">
              {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{profile?.role || "Consumer"}</Badge>
              {profile?.verificationLevel && (
                <Badge variant="outline">{profile.verificationLevel}</Badge>
              )}
            </div>
          </div>
        </div>

        {isSeller && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              title={t("seller.totalProducts")}
              value={myProducts.length}
              icon={Package}
            />
            <StatCard
              title={t("seller.ordersCount")}
              value={sellerOrders.length}
              icon={ShoppingBag}
            />
            <StatCard
              title={t("seller.totalRevenue")}
              value={formatPrice(totalRevenue)}
              icon={DollarSign}
            />
            <StatCard
              title={t("seller.rating")}
              value={profile?.rating || "N/A"}
              icon={Star}
            />
          </div>
        )}

        <div className="mb-6" data-testid="quick-access-toolbar">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Access</h2>
            <Link href="/services">
              <Button variant="ghost" size="sm" className="text-xs" data-testid="link-all-services">
                <Compass className="w-3 h-3 mr-1" /> All Services
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {(isSeller ? [
              { icon: Store, label: "Storefront", href: "/storefront-builder", color: "text-purple-600", bg: "bg-purple-50" },
              { icon: Video, label: "Go Live", href: "/live-shopping", color: "text-red-600", bg: "bg-red-50" },
              { icon: Calendar, label: "Events", href: "/trade-events", color: "text-orange-600", bg: "bg-orange-50" },
              { icon: Wheat, label: "Agri Exchange", href: "/agri-exchange", color: "text-green-600", bg: "bg-green-50" },
              { icon: FileText, label: "Trade Docs", href: "/trade-documents", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: BarChart3, label: "Commodities", href: "/commodity-prices", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Users, label: "Community", href: "/community", color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: Truck, label: "Logistics", href: "/logistics", color: "text-amber-600", bg: "bg-amber-50" },
            ] : [
              { icon: CreditCard, label: "BNPL", href: "/bnpl", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: ShieldCheck, label: "Get Verified", href: "/buyer-verification", color: "text-green-600", bg: "bg-green-50" },
              { icon: BarChart3, label: "Commodities", href: "/commodity-prices", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: Users, label: "Community", href: "/community", color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: Video, label: "Live Deals", href: "/live-shopping", color: "text-red-600", bg: "bg-red-50" },
              { icon: Wheat, label: "Agri Market", href: "/agri-exchange", color: "text-green-600", bg: "bg-green-50" },
              { icon: Calendar, label: "Events", href: "/trade-events", color: "text-orange-600", bg: "bg-orange-50" },
              { icon: Truck, label: "Logistics", href: "/logistics", color: "text-amber-600", bg: "bg-amber-50" },
            ]).map((item, i) => (
              <Link key={i} href={item.href}>
                <div className={`flex flex-col items-center gap-1 p-2 rounded-lg ${item.bg} hover:opacity-80 transition-opacity cursor-pointer`} data-testid={`quick-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {isSeller && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/20">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Dropshipping</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.role === "manufacturer" 
                        ? "Offer your products for resellers to sell" 
                        : "Add supplier products to your catalog"}
                    </p>
                  </div>
                </div>
                <Link href="/dropship">
                  <Button data-testid="button-dropship">
                    <Store className="w-4 h-4 mr-2" />
                    Go to Dropship
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className={`w-full grid ${isSeller ? 'grid-cols-2 md:grid-cols-8' : 'grid-cols-2'}`}>
            <TabsTrigger value="profile" data-testid="tab-profile">{t("dashboard.profile")}</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">{t("dashboard.myOrders")}</TabsTrigger>
            {isSeller && (
              <>
                <TabsTrigger value="products" data-testid="tab-products">{t("seller.myProducts")}</TabsTrigger>
                <TabsTrigger value="sales" data-testid="tab-sales">{t("dashboard.salesOrders")}</TabsTrigger>
                <TabsTrigger value="quotations" data-testid="tab-quotations">Quotations</TabsTrigger>
                <TabsTrigger value="store" data-testid="tab-store">My Store</TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">Credentials</TabsTrigger>
                <TabsTrigger value="invoices" data-testid="tab-invoices">Invoices</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.profileSettings")}</CardTitle>
                <CardDescription>{t("dashboard.profileDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateProfileMutation.mutate(profileForm);
                  }}
                  className="space-y-5"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">{t("dashboard.accountType")}</Label>
                      <Select
                        value={profileForm.role}
                        onValueChange={(v) => setProfileForm({ ...profileForm, role: v })}
                      >
                        <SelectTrigger data-testid="select-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumer">{t("dashboard.consumer")}</SelectItem>
                          <SelectItem value="trader">{t("dashboard.trader")}</SelectItem>
                          <SelectItem value="manufacturer">{t("dashboard.manufacturer")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">{t("form.phone") || "Phone Number"}</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+254 700 000 000"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  {profileForm.role === "manufacturer" && (
                    <div>
                      <Label htmlFor="manufacturerType">Manufacturing Type</Label>
                      <Select
                        value={profileForm.manufacturerType}
                        onValueChange={(v) => setProfileForm({ ...profileForm, manufacturerType: v })}
                      >
                        <SelectTrigger data-testid="select-manufacturer-type">
                          <SelectValue placeholder="Select your manufacturing type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MANUFACTURER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(profileForm.role === "trader" || profileForm.role === "manufacturer") && (
                    <>
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={profileForm.businessName}
                          onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                          placeholder="Your business name"
                          data-testid="input-business-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lineOfBusiness">Line of Business</Label>
                        <Input
                          id="lineOfBusiness"
                          value={profileForm.lineOfBusiness}
                          onChange={(e) => setProfileForm({ ...profileForm, lineOfBusiness: e.target.value })}
                          placeholder="e.g., Agricultural exports, Electronics retail, Fashion wholesale"
                          data-testid="input-line-of-business"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Describe your main business activity to help customers understand what you do
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="businessDescription">{t("form.description")}</Label>
                        <Textarea
                          id="businessDescription"
                          value={profileForm.businessDescription}
                          onChange={(e) => setProfileForm({ ...profileForm, businessDescription: e.target.value })}
                          placeholder="Tell buyers about your business..."
                          data-testid="input-business-description"
                        />
                      </div>
                    </>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={profileForm.country}
                        onValueChange={(v) => setProfileForm({ ...profileForm, country: v })}
                      >
                        <SelectTrigger data-testid="select-profile-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
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
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder="Your city"
                        data-testid="input-city"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Show products from my location only
                      </p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, you'll see products from {profileForm.country || "your country"} first when browsing
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={profileForm.geoFilterEnabled ? "default" : "outline"}
                      onClick={() => setProfileForm({ ...profileForm, geoFilterEnabled: !profileForm.geoFilterEnabled })}
                      data-testid="button-toggle-geo-filter"
                    >
                      {profileForm.geoFilterEnabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Your business or shipping address"
                      data-testid="input-address"
                    />
                  </div>

                  <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                    {updateProfileMutation.isPending ? t("dashboard.saving") : t("dashboard.saveProfile")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.myOrders")}</CardTitle>
                <CardDescription>{t("dashboard.trackPurchases")}</CardDescription>
              </CardHeader>
              <CardContent>
                {buyerOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">{t("dashboard.noOrders")}</p>
                    <Link href="/browse">
                      <Button data-testid="button-start-shopping">{t("dashboard.startShopping")}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {buyerOrders.map((order) => (
                      <Card key={order.id} data-testid={`card-order-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">Order #{order.id}</p>
                                {(order as any).orderType === "sample" && (
                                  <Badge variant="outline" className="text-xs">
                                    Sample
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatPrice(Number(order.totalAmount))}</p>
                              <Badge variant={
                                order.status === "delivered" ? "default" :
                                order.status === "shipped" ? "secondary" : "outline"
                              }>
                                {t(`orders.${order.status}`) || order.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isSeller && (
            <>
              <TabsContent value="products">
                <Card className="mb-4">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Crown className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Seller Subscription</p>
                        <p className="text-sm text-muted-foreground">
                          Manage your plan and view your fees
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard/subscription">
                      <Button variant="outline" data-testid="button-manage-subscription">
                        Manage Plan
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="h-8 w-8 text-blue-500" />
                        <div>
                          <h3 className="font-semibold">Shipping Management</h3>
                          <p className="text-sm text-muted-foreground">
                            Create and manage shipments, track deliveries
                          </p>
                        </div>
                      </div>
                      <Link href="/dashboard/shipping">
                        <Button variant="outline" data-testid="button-manage-shipping">
                          Manage Shipments
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>{t("dashboard.addProduct")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createProductMutation.mutate(productForm);
                      }}
                      className="space-y-4"
                    >
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="productName">{t("form.productName")}</Label>
                          <Input
                            id="productName"
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            placeholder="Product name"
                            required
                            data-testid="input-product-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">{t("form.price")}</Label>
                          <div className="flex gap-2">
                            <Select
                              value={productForm.currency}
                              onValueChange={(v) => setProductForm({ ...productForm, currency: v })}
                            >
                              <SelectTrigger className="w-[130px]" data-testid="select-product-currency">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">$ USD</SelectItem>
                                {currencies
                                  .filter(c => c.code !== "USD")
                                  .sort((a, b) => a.code.localeCompare(b.code))
                                  .map((c) => (
                                    <SelectItem key={c.code} value={c.code}>
                                      {c.symbol} {c.code}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={productForm.price}
                              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                              placeholder="0.00"
                              required
                              className="flex-1"
                              data-testid="input-product-price"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">{t("form.description")}</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Describe your product..."
                          data-testid="input-product-description"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Product Images</Label>
                        <ProductImageGallery
                          images={productForm.images}
                          onRemove={(index) => {
                            const newImages = [...productForm.images];
                            newImages.splice(index, 1);
                            setProductForm({ ...productForm, images: newImages });
                          }}
                        />
                        <ImageCaptureUploader
                          existingImages={productForm.images}
                          maxImages={5}
                          onImageUploaded={(imageUrl) => {
                            setProductForm({ ...productForm, images: [...productForm.images, imageUrl] });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Take photos with your camera or upload from gallery. Images are automatically cropped for best display.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="moq">{t("product.moq")}</Label>
                          <Input
                            id="moq"
                            type="number"
                            value={productForm.moq}
                            onChange={(e) => setProductForm({ ...productForm, moq: e.target.value })}
                            data-testid="input-product-moq"
                          />
                        </div>
                        <div>
                          <Label htmlFor="stock">{t("form.quantity")}</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                            data-testid="input-product-stock"
                          />
                        </div>
                        <div>
                          <Label htmlFor="productCountry">Country</Label>
                          <Select
                            value={productForm.country}
                            onValueChange={(v) => setProductForm({ ...productForm, country: v })}
                          >
                            <SelectTrigger data-testid="select-product-country">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
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
                        </div>
                        <div>
                          <Label htmlFor="productCity">City</Label>
                          <Input
                            id="productCity"
                            value={productForm.city}
                            onChange={(e) => setProductForm({ ...productForm, city: e.target.value })}
                            placeholder="City"
                            data-testid="input-product-city"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="category">{t("product.category")}</Label>
                        <div className="flex items-center gap-2">
                          {isCreatingNewCategory ? (
                            <>
                              <Input
                                id="newCategory"
                                value={productForm.newCategoryName}
                                onChange={(e) => setProductForm({ ...productForm, newCategoryName: e.target.value })}
                                placeholder="Enter new category name"
                                className="flex-1"
                                data-testid="input-new-category"
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setIsCreatingNewCategory(false);
                                  setProductForm({ ...productForm, newCategoryName: "" });
                                }}
                                data-testid="button-cancel-new-category"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Select
                                value={productForm.categoryId}
                                onValueChange={(v) => setProductForm({ ...productForm, categoryId: v })}
                              >
                                <SelectTrigger className="flex-1" data-testid="select-product-category">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => setIsCreatingNewCategory(true)}
                                data-testid="button-add-new-category"
                              >
                                <Plus className="w-4 h-4 mr-1" /> New
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Bulk / Tiered Pricing (optional)
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const tiers = [...productForm.wholesalePricing];
                              const lastMax = tiers.length > 0 ? (tiers[tiers.length - 1].maxQty || 0) : 0;
                              tiers.push({ minQty: lastMax + 1, maxQty: null, unitPrice: "" });
                              setProductForm({ ...productForm, wholesalePricing: tiers });
                            }}
                            data-testid="button-add-tier"
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Tier
                          </Button>
                        </div>
                        {productForm.wholesalePricing.length > 0 && (
                          <div className="space-y-2">
                            {productForm.wholesalePricing.map((tier, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md" data-testid={`tier-row-${idx}`}>
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Min Qty</Label>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={tier.minQty}
                                      onChange={(e) => {
                                        const tiers = [...productForm.wholesalePricing];
                                        tiers[idx] = { ...tiers[idx], minQty: parseInt(e.target.value) || 1 };
                                        setProductForm({ ...productForm, wholesalePricing: tiers });
                                      }}
                                      data-testid={`input-tier-min-${idx}`}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Max Qty</Label>
                                    <Input
                                      type="number"
                                      min={tier.minQty}
                                      placeholder="No limit"
                                      value={tier.maxQty ?? ""}
                                      onChange={(e) => {
                                        const tiers = [...productForm.wholesalePricing];
                                        const val = e.target.value ? parseInt(e.target.value) : null;
                                        tiers[idx] = { ...tiers[idx], maxQty: val };
                                        setProductForm({ ...productForm, wholesalePricing: tiers });
                                      }}
                                      data-testid={`input-tier-max-${idx}`}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Unit Price</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min={0}
                                      placeholder="0.00"
                                      value={tier.unitPrice}
                                      onChange={(e) => {
                                        const tiers = [...productForm.wholesalePricing];
                                        tiers[idx] = { ...tiers[idx], unitPrice: e.target.value };
                                        setProductForm({ ...productForm, wholesalePricing: tiers });
                                      }}
                                      data-testid={`input-tier-price-${idx}`}
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="flex-shrink-0 mt-4"
                                  onClick={() => {
                                    const tiers = productForm.wholesalePricing.filter((_, i) => i !== idx);
                                    setProductForm({ ...productForm, wholesalePricing: tiers });
                                  }}
                                  data-testid={`button-remove-tier-${idx}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground">
                              Set quantity ranges with discounted unit prices. Leave Max Qty empty for the last tier.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Sample Orders</Label>
                          <Button
                            type="button"
                            variant={productForm.sampleAvailable ? "default" : "outline"}
                            size="sm"
                            onClick={() => setProductForm({ ...productForm, sampleAvailable: !productForm.sampleAvailable })}
                            data-testid="button-toggle-sample"
                          >
                            {productForm.sampleAvailable ? "Enabled" : "Disabled"}
                          </Button>
                        </div>
                        {productForm.sampleAvailable && (
                          <div className="grid grid-cols-2 gap-3 p-3 border rounded-md bg-muted/30">
                            <div>
                              <Label htmlFor="samplePrice">Sample Price per Unit</Label>
                              <Input
                                id="samplePrice"
                                type="number"
                                step="0.01"
                                min={0}
                                placeholder="Leave empty to use regular price"
                                value={productForm.samplePrice}
                                onChange={(e) => setProductForm({ ...productForm, samplePrice: e.target.value })}
                                data-testid="input-sample-price"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Optional. If empty, regular price is used.
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="sampleMaxQty">Max Sample Quantity</Label>
                              <Input
                                id="sampleMaxQty"
                                type="number"
                                min={1}
                                max={50}
                                value={productForm.sampleMaxQty}
                                onChange={(e) => setProductForm({ ...productForm, sampleMaxQty: e.target.value })}
                                data-testid="input-sample-max-qty"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Maximum units a buyer can order as sample.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button type="submit" disabled={createProductMutation.isPending} data-testid="button-add-product">
                        <Plus className="w-4 h-4 mr-2" />
                        {createProductMutation.isPending ? t("common.loading") : t("dashboard.addProduct")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("dashboard.yourProducts")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myProducts.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{t("dashboard.noProducts")}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myProducts.map((product) => (
                          <Card key={product.id} data-testid={`card-product-${product.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                  {product.images?.[0] ? (
                                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{product.name}</p>
                                  <p className="text-sm text-primary font-bold">{formatOriginalPrice(Number(product.price), product.currency || "USD")}</p>
                                  <p className="text-xs text-muted-foreground">{product.city}, {product.country}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link href={`/product/${product.id}`}>
                                    <Button variant="ghost" size="icon" data-testid={`button-view-${product.id}`}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteProductMutation.mutate(product.id)}
                                    disabled={deleteProductMutation.isPending}
                                    data-testid={`button-delete-${product.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("dashboard.salesOrders")}</CardTitle>
                    <CardDescription>{t("dashboard.manageOrders")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sellerOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">{t("dashboard.noSales")}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sellerOrders.map((order) => (
                          <Card key={order.id} data-testid={`card-sale-${order.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium">Order #{order.id}</p>
                                    {(order as any).orderType === "sample" && (
                                      <Badge variant="outline" className="text-xs" data-testid={`badge-sample-${order.id}`}>
                                        Sample
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(order.createdAt!).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="font-bold">{formatPrice(Number(order.totalAmount))}</p>
                                  <Select
                                    value={order.status || "pending"}
                                    onValueChange={(status) => updateOrderStatusMutation.mutate({ orderId: order.id, status })}
                                  >
                                    <SelectTrigger className="w-32" data-testid={`select-status-${order.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">{t("orders.pending")}</SelectItem>
                                      <SelectItem value="confirmed">{t("orders.confirmed")}</SelectItem>
                                      <SelectItem value="shipped">{t("orders.shipped")}</SelectItem>
                                      <SelectItem value="delivered">{t("orders.delivered")}</SelectItem>
                                      <SelectItem value="cancelled">{t("orders.cancelled")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quotations">
                <SellerQuotationsTab />
              </TabsContent>

              <TabsContent value="store">
                <StoreSettingsTab profile={profile} />
              </TabsContent>

              <TabsContent value="invoices" data-testid="tab-content-invoices">
                <InvoicesTab />
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Business Credentials & Documents
                    </CardTitle>
                    <CardDescription>
                      Upload business documents like registrations, certificates, and awards to build customer trust
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (documentForm.name && documentForm.documentUrl) {
                          createDocumentMutation.mutate(documentForm);
                        }
                      }}
                      className="space-y-4 p-4 border rounded-md bg-muted/30"
                    >
                      <h4 className="font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Add New Document
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="docType">Document Type</Label>
                          <Select
                            value={documentForm.type}
                            onValueChange={(v) => setDocumentForm({ ...documentForm, type: v })}
                          >
                            <SelectTrigger data-testid="select-doc-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registration">Business Registration</SelectItem>
                              <SelectItem value="certificate">Certificate</SelectItem>
                              <SelectItem value="license">License</SelectItem>
                              <SelectItem value="standard">Standard/Accreditation</SelectItem>
                              <SelectItem value="tax">Tax Document</SelectItem>
                              <SelectItem value="award">Award/Recognition</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="docName">Document Name</Label>
                          <Input
                            id="docName"
                            value={documentForm.name}
                            onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                            placeholder="e.g., ISO 9001 Certificate"
                            data-testid="input-doc-name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="docUrl">Document URL</Label>
                        <Input
                          id="docUrl"
                          value={documentForm.documentUrl}
                          onChange={(e) => setDocumentForm({ ...documentForm, documentUrl: e.target.value })}
                          placeholder="https://example.com/document.pdf"
                          data-testid="input-doc-url"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Upload your document to a cloud service and paste the link here
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="docAuthority">Issuing Authority</Label>
                          <Input
                            id="docAuthority"
                            value={documentForm.issuingAuthority}
                            onChange={(e) => setDocumentForm({ ...documentForm, issuingAuthority: e.target.value })}
                            placeholder="e.g., Kenya Revenue Authority"
                            data-testid="input-doc-authority"
                          />
                        </div>
                        <div>
                          <Label htmlFor="docCountry">Issuing Country</Label>
                          <Select
                            value={documentForm.issuingCountry}
                            onValueChange={(v) => setDocumentForm({ ...documentForm, issuingCountry: v })}
                          >
                            <SelectTrigger data-testid="select-doc-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {AFRICAN_COUNTRIES.map((c) => (
                                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="docNumber">Document Number</Label>
                          <Input
                            id="docNumber"
                            value={documentForm.documentNumber}
                            onChange={(e) => setDocumentForm({ ...documentForm, documentNumber: e.target.value })}
                            placeholder="Certificate/License Number"
                            data-testid="input-doc-number"
                          />
                        </div>
                        <div>
                          <Label htmlFor="docIssueDate">Issue Date</Label>
                          <Input
                            id="docIssueDate"
                            type="date"
                            value={documentForm.issueDate}
                            onChange={(e) => setDocumentForm({ ...documentForm, issueDate: e.target.value })}
                            data-testid="input-doc-issue-date"
                          />
                        </div>
                        <div>
                          <Label htmlFor="docExpiryDate">Expiry Date</Label>
                          <Input
                            id="docExpiryDate"
                            type="date"
                            value={documentForm.expiryDate}
                            onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                            data-testid="input-doc-expiry-date"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium text-sm">Show on Public Store</p>
                          <p className="text-xs text-muted-foreground">
                            Make this document visible to customers on your store page
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant={documentForm.isPublic ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDocumentForm({ ...documentForm, isPublic: !documentForm.isPublic })}
                          data-testid="button-toggle-public"
                        >
                          {documentForm.isPublic ? "Public" : "Private"}
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        disabled={createDocumentMutation.isPending || !documentForm.name || !documentForm.documentUrl}
                        data-testid="button-add-document"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Document
                      </Button>
                    </form>

                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Your Documents ({businessDocuments.length})
                      </h4>
                      {businessDocuments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No documents uploaded yet</p>
                          <p className="text-sm">Add business documents to build trust with your customers</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {businessDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-4 border rounded-md"
                              data-testid={`doc-item-${doc.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-md bg-muted">
                                  {doc.type === "award" ? (
                                    <Award className="w-5 h-5" />
                                  ) : doc.type === "certificate" || doc.type === "standard" ? (
                                    <Shield className="w-5 h-5" />
                                  ) : (
                                    <FileText className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                      {doc.type}
                                    </Badge>
                                    {doc.issuingAuthority && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {doc.issuingAuthority}
                                      </span>
                                    )}
                                    {doc.expiryDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.isVerified && (
                                  <Badge className="bg-green-600">
                                    <Check className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                                <Badge variant={doc.isPublic ? "default" : "secondary"}>
                                  {doc.isPublic ? "Public" : "Private"}
                                </Badge>
                                <a
                                  href={doc.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="icon" data-testid={`button-view-doc-${doc.id}`}>
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                  data-testid={`button-delete-doc-${doc.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function SellerQuotationsTab() {
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteMoq, setQuoteMoq] = useState("");
  const [quoteLeadTime, setQuoteLeadTime] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");

  const { data: sellerRfqs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/rfq/seller"],
  });

  const submitQuoteMutation = useMutation({
    mutationFn: async (rfqId: number) => {
      return apiRequest("POST", `/api/rfq/${rfqId}/quote`, {
        price: quotePrice,
        moq: quoteMoq ? parseInt(quoteMoq) : undefined,
        leadTime: quoteLeadTime || undefined,
        message: quoteMessage || undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Quote Sent", description: "Your quotation has been submitted to the buyer." });
      setReplyingTo(null);
      setQuotePrice("");
      setQuoteMoq("");
      setQuoteLeadTime("");
      setQuoteMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/rfq/seller"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send quote", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Quotation Requests
        </CardTitle>
        <CardDescription>Buyers requesting custom pricing for your products</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : sellerRfqs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quotation requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">When buyers request quotes for your products, they will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sellerRfqs.map((rfq: any) => (
              <Card key={rfq.id} data-testid={`card-rfq-${rfq.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-medium text-sm">{rfq.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {rfq.quantity} {rfq.unit}
                        {rfq.targetPrice ? ` · Target: ${formatPrice(Number(rfq.targetPrice))}` : ""}
                      </p>
                      {rfq.user && (
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {rfq.user.businessName || rfq.user.firstName || "Anonymous"}
                          {rfq.country ? ` · ${rfq.country}` : ""}
                        </p>
                      )}
                    </div>
                    <Badge variant={rfq.status === "open" ? "default" : rfq.status === "quoted" ? "secondary" : "outline"}>
                      {rfq.status}
                    </Badge>
                  </div>
                  {rfq.details && (
                    <p className="text-sm text-muted-foreground mb-3 bg-muted p-2 rounded">{rfq.details}</p>
                  )}
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </p>

                  {rfq.status === "open" && replyingTo !== rfq.id && (
                    <Button
                      size="sm"
                      onClick={() => setReplyingTo(rfq.id)}
                      data-testid={`button-reply-rfq-${rfq.id}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Send Quote
                    </Button>
                  )}

                  {replyingTo === rfq.id && (
                    <div className="mt-3 p-3 border rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Your Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={quotePrice}
                            onChange={(e) => setQuotePrice(e.target.value)}
                            data-testid="input-quote-price"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Min. Order Qty</Label>
                          <Input
                            type="number"
                            placeholder="MOQ"
                            value={quoteMoq}
                            onChange={(e) => setQuoteMoq(e.target.value)}
                            data-testid="input-quote-moq"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Lead Time</Label>
                        <Input
                          placeholder="e.g. 7-14 business days"
                          value={quoteLeadTime}
                          onChange={(e) => setQuoteLeadTime(e.target.value)}
                          data-testid="input-quote-lead-time"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Message to Buyer</Label>
                        <Textarea
                          placeholder="Additional details about your offer..."
                          className="min-h-[60px]"
                          value={quoteMessage}
                          onChange={(e) => setQuoteMessage(e.target.value)}
                          data-testid="input-quote-message"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(null)}
                          data-testid="button-cancel-quote"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => submitQuoteMutation.mutate(rfq.id)}
                          disabled={submitQuoteMutation.isPending || !quotePrice}
                          data-testid="button-submit-quote"
                        >
                          {submitQuoteMutation.isPending ? "Sending..." : "Submit Quote"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StoreSettingsTab({ profile }: { profile: UserProfile | null | undefined }) {
  const { toast } = useToast();
  const [storeSlug, setStoreSlug] = useState(profile?.storeSlug || "");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);
  const [socialShareEnabled, setSocialShareEnabled] = useState(profile?.socialShareEnabled ?? true);
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsappNumber || "");
  const [factoryForm, setFactoryForm] = useState({
    factorySize: profile?.factorySize || "",
    productionCapacity: profile?.productionCapacity || "",
    yearEstablished: profile?.yearEstablished?.toString() || "",
    totalEmployees: profile?.totalEmployees?.toString() || "",
    factoryAddress: profile?.factoryAddress || "",
    factoryImages: (profile?.factoryImages || []) as string[],
    certifications: (profile?.certifications || []) as string[],
    mainProducts: (profile?.mainProducts || []) as string[],
    exportMarkets: (profile?.exportMarkets || []) as string[],
    qualityControl: profile?.qualityControl || "",
  });
  const [newCertification, setNewCertification] = useState("");
  const [newMainProduct, setNewMainProduct] = useState("");
  const [newExportMarket, setNewExportMarket] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const storeUrl = storeSlug && origin
    ? `${origin}/store/${storeSlug}` 
    : "";

  useEffect(() => {
    if (profile?.storeSlug) {
      setStoreSlug(profile.storeSlug);
    }
    if (profile?.socialShareEnabled !== undefined) {
      setSocialShareEnabled(profile.socialShareEnabled ?? true);
    }
    if (profile?.whatsappNumber) {
      setWhatsappNumber(profile.whatsappNumber);
    }
    setFactoryForm({
      factorySize: profile?.factorySize || "",
      productionCapacity: profile?.productionCapacity || "",
      yearEstablished: profile?.yearEstablished?.toString() || "",
      totalEmployees: profile?.totalEmployees?.toString() || "",
      factoryAddress: profile?.factoryAddress || "",
      factoryImages: (profile?.factoryImages || []) as string[],
      certifications: (profile?.certifications || []) as string[],
      mainProducts: (profile?.mainProducts || []) as string[],
      exportMarkets: (profile?.exportMarkets || []) as string[],
      qualityControl: profile?.qualityControl || "",
    });
  }, [profile]);

  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    const res = await fetch(`/api/store-slug/check?slug=${encodeURIComponent(slug)}&userId=${profile?.id}`);
    const data = await res.json();
    setSlugAvailable(data.available);
  };

  const updateStoreMutation = useMutation({
    mutationFn: async (data: Record<string, any>) =>
      apiRequest("POST", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Store settings updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update store settings", variant: "destructive" });
    },
  });

  const saveFactoryProfile = () => {
    updateStoreMutation.mutate({
      factorySize: factoryForm.factorySize || null,
      productionCapacity: factoryForm.productionCapacity || null,
      yearEstablished: factoryForm.yearEstablished ? parseInt(factoryForm.yearEstablished) : null,
      totalEmployees: factoryForm.totalEmployees ? parseInt(factoryForm.totalEmployees) : null,
      factoryAddress: factoryForm.factoryAddress || null,
      factoryImages: factoryForm.factoryImages.length > 0 ? factoryForm.factoryImages : null,
      certifications: factoryForm.certifications.length > 0 ? factoryForm.certifications : null,
      mainProducts: factoryForm.mainProducts.length > 0 ? factoryForm.mainProducts : null,
      exportMarkets: factoryForm.exportMarkets.length > 0 ? factoryForm.exportMarkets : null,
      qualityControl: factoryForm.qualityControl || null,
    });
  };

  const copyLink = async () => {
    if (storeUrl && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(storeUrl);
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

  const slugPattern = /^[a-z0-9-]+$/;
  const isValidSlug = storeSlug.length >= 3 && slugPattern.test(storeSlug);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Public Store Link
          </CardTitle>
          <CardDescription>
            Create a unique URL for your public store page that you can share with customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="storeSlug">Store URL Slug</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 flex items-center">
                <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                  {origin || "..."}/store/
                </span>
                <Input
                  id="storeSlug"
                  value={storeSlug}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                    setStoreSlug(val);
                    checkSlug(val);
                  }}
                  placeholder="my-store"
                  className="rounded-l-none flex-1"
                  data-testid="input-store-slug"
                />
              </div>
              <Button
                onClick={() => updateStoreMutation.mutate({ storeSlug })}
                disabled={!isValidSlug || slugAvailable === false || updateStoreMutation.isPending}
                data-testid="button-save-slug"
              >
                Save
              </Button>
            </div>
            {storeSlug && (
              <p className="text-sm mt-1">
                {slugAvailable === true && (
                  <span className="text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> This URL is available
                  </span>
                )}
                {slugAvailable === false && (
                  <span className="text-destructive">This URL is already taken</span>
                )}
                {!isValidSlug && storeSlug.length > 0 && (
                  <span className="text-destructive">
                    Must be at least 3 characters, lowercase letters, numbers, and hyphens only
                  </span>
                )}
              </p>
            )}
          </div>

          {profile?.storeSlug && (
            <div className="bg-muted p-4 rounded-md">
              <Label className="text-xs text-muted-foreground">Your Store Link</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  readOnly
                  value={storeUrl}
                  className="bg-background"
                  data-testid="input-store-url"
                />
                <Button size="icon" variant="outline" onClick={copyLink} data-testid="button-copy-store-url">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="outline" data-testid="button-open-store">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Social Sharing
          </CardTitle>
          <CardDescription>
            Control how your store appears when shared on social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Social Sharing</p>
              <p className="text-sm text-muted-foreground">
                Allow customers to share your products on social media
              </p>
            </div>
            <Button
              variant={socialShareEnabled ? "default" : "outline"}
              onClick={() => {
                const newValue = !socialShareEnabled;
                setSocialShareEnabled(newValue);
                updateStoreMutation.mutate({ socialShareEnabled: newValue });
              }}
              data-testid="button-toggle-social"
            >
              {socialShareEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>

          {profile?.storeSlug && storeUrl && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Share Your Store</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`)}
                  data-testid="button-share-facebook"
                >
                  Facebook
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(`Check out my store on Ghani Africa!`)}`)}
                  data-testid="button-share-twitter"
                >
                  X / Twitter
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openShare(`https://wa.me/?text=${encodeURIComponent(`Check out my store on Ghani Africa: ${storeUrl}`)}`)}
                  data-testid="button-share-whatsapp"
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storeUrl)}`)}
                  data-testid="button-share-linkedin"
                >
                  LinkedIn
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SiWhatsapp className="w-5 h-5" />
            WhatsApp Contact
          </CardTitle>
          <CardDescription>
            Add your WhatsApp number so buyers can contact you directly via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Include country code without + sign (e.g., 254712345678 for Kenya)
            </p>
            <div className="flex gap-2 mt-1">
              <Input
                id="whatsappNumber"
                value={whatsappNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setWhatsappNumber(val);
                }}
                placeholder="254712345678"
                className="flex-1"
                data-testid="input-whatsapp-number"
              />
              <Button
                onClick={() => updateStoreMutation.mutate({ whatsappNumber: whatsappNumber || null } as any)}
                disabled={updateStoreMutation.isPending}
                data-testid="button-save-whatsapp"
              >
                Save
              </Button>
            </div>
            {whatsappNumber && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                <SiWhatsapp className="w-4 h-4 text-green-600" />
                Buyers will see a "Chat on WhatsApp" button on your product pages and store page
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Factory Profile
          </CardTitle>
          <CardDescription>
            Showcase your manufacturing capabilities to attract buyers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="factorySize">Factory Size</Label>
              <Input
                id="factorySize"
                value={factoryForm.factorySize}
                onChange={(e) => setFactoryForm({ ...factoryForm, factorySize: e.target.value })}
                placeholder="e.g., 5,000 sqm, Large, Medium"
                data-testid="input-factory-size"
              />
            </div>
            <div>
              <Label htmlFor="productionCapacity">Production Capacity</Label>
              <Input
                id="productionCapacity"
                value={factoryForm.productionCapacity}
                onChange={(e) => setFactoryForm({ ...factoryForm, productionCapacity: e.target.value })}
                placeholder="e.g., 10,000 units/month"
                data-testid="input-production-capacity"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearEstablished">Year Established</Label>
              <Input
                id="yearEstablished"
                type="number"
                value={factoryForm.yearEstablished}
                onChange={(e) => setFactoryForm({ ...factoryForm, yearEstablished: e.target.value })}
                placeholder="e.g., 2010"
                data-testid="input-year-established"
              />
            </div>
            <div>
              <Label htmlFor="totalEmployees">Total Employees</Label>
              <Input
                id="totalEmployees"
                type="number"
                value={factoryForm.totalEmployees}
                onChange={(e) => setFactoryForm({ ...factoryForm, totalEmployees: e.target.value })}
                placeholder="e.g., 250"
                data-testid="input-total-employees"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="factoryAddress">Factory Address</Label>
            <Input
              id="factoryAddress"
              value={factoryForm.factoryAddress}
              onChange={(e) => setFactoryForm({ ...factoryForm, factoryAddress: e.target.value })}
              placeholder="Full factory address"
              data-testid="input-factory-address"
            />
          </div>
          <div>
            <Label htmlFor="qualityControl">Quality Control Process</Label>
            <Textarea
              id="qualityControl"
              value={factoryForm.qualityControl}
              onChange={(e) => setFactoryForm({ ...factoryForm, qualityControl: e.target.value })}
              placeholder="Describe your quality control process..."
              data-testid="input-quality-control"
            />
          </div>

          <div>
            <Label>Factory Images</Label>
            {factoryForm.factoryImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {factoryForm.factoryImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border" data-testid={`factory-image-preview-${i}`}>
                    <img src={img} alt={`Factory ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={() => {
                        const newImages = [...factoryForm.factoryImages];
                        newImages.splice(i, 1);
                        setFactoryForm({ ...factoryForm, factoryImages: newImages });
                      }}
                      data-testid={`button-remove-factory-image-${i}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <ImageCaptureUploader
              existingImages={factoryForm.factoryImages}
              maxImages={10}
              onImageUploaded={(imageUrl) => {
                setFactoryForm({ ...factoryForm, factoryImages: [...factoryForm.factoryImages, imageUrl] });
              }}
            />
          </div>

          <div>
            <Label>Certifications</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {factoryForm.certifications.map((cert, i) => (
                <Badge key={i} variant="secondary" data-testid={`badge-cert-${i}`}>
                  {cert}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => {
                      const newCerts = [...factoryForm.certifications];
                      newCerts.splice(i, 1);
                      setFactoryForm({ ...factoryForm, certifications: newCerts });
                    }}
                    data-testid={`button-remove-cert-${i}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="e.g., ISO 9001, CE, FDA"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newCertification.trim()) {
                      setFactoryForm({ ...factoryForm, certifications: [...factoryForm.certifications, newCertification.trim()] });
                      setNewCertification("");
                    }
                  }
                }}
                data-testid="input-new-certification"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newCertification.trim()) {
                    setFactoryForm({ ...factoryForm, certifications: [...factoryForm.certifications, newCertification.trim()] });
                    setNewCertification("");
                  }
                }}
                data-testid="button-add-certification"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Main Products</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {factoryForm.mainProducts.map((prod, i) => (
                <Badge key={i} variant="outline" data-testid={`badge-main-product-${i}`}>
                  {prod}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => {
                      const newProds = [...factoryForm.mainProducts];
                      newProds.splice(i, 1);
                      setFactoryForm({ ...factoryForm, mainProducts: newProds });
                    }}
                    data-testid={`button-remove-main-product-${i}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newMainProduct}
                onChange={(e) => setNewMainProduct(e.target.value)}
                placeholder="e.g., Cotton Textiles, Leather Bags"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newMainProduct.trim()) {
                      setFactoryForm({ ...factoryForm, mainProducts: [...factoryForm.mainProducts, newMainProduct.trim()] });
                      setNewMainProduct("");
                    }
                  }
                }}
                data-testid="input-new-main-product"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newMainProduct.trim()) {
                    setFactoryForm({ ...factoryForm, mainProducts: [...factoryForm.mainProducts, newMainProduct.trim()] });
                    setNewMainProduct("");
                  }
                }}
                data-testid="button-add-main-product"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Export Markets</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {factoryForm.exportMarkets.map((market, i) => (
                <Badge key={i} variant="outline" data-testid={`badge-export-market-${i}`}>
                  {market}
                  <button
                    type="button"
                    className="ml-1"
                    onClick={() => {
                      const newMarkets = [...factoryForm.exportMarkets];
                      newMarkets.splice(i, 1);
                      setFactoryForm({ ...factoryForm, exportMarkets: newMarkets });
                    }}
                    data-testid={`button-remove-export-market-${i}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newExportMarket}
                onChange={(e) => setNewExportMarket(e.target.value)}
                placeholder="e.g., East Africa, Europe, Middle East"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newExportMarket.trim()) {
                      setFactoryForm({ ...factoryForm, exportMarkets: [...factoryForm.exportMarkets, newExportMarket.trim()] });
                      setNewExportMarket("");
                    }
                  }
                }}
                data-testid="input-new-export-market"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newExportMarket.trim()) {
                    setFactoryForm({ ...factoryForm, exportMarkets: [...factoryForm.exportMarkets, newExportMarket.trim()] });
                    setNewExportMarket("");
                  }
                }}
                data-testid="button-add-export-market"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={saveFactoryProfile}
            disabled={updateStoreMutation.isPending}
            data-testid="button-save-factory-profile"
          >
            {updateStoreMutation.isPending ? "Saving..." : "Save Factory Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InvoicesTab() {
  const { formatPrice } = useCurrency();
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{ success: boolean; data: Invoice[] }>({
    queryKey: ["/api/invoices", "seller"],
    queryFn: async () => {
      const response = await fetch("/api/invoices?role=seller");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
  });

  const { data: activityData, isLoading: activityLoading } = useQuery<{ success: boolean; data: ActivityLog[] }>({
    queryKey: ["/api/activity/my"],
    queryFn: async () => {
      const response = await fetch("/api/activity/my");
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
  });

  const invoices = invoicesData?.data || [];
  const activities = activityData?.data || [];

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "paid": return "default";
      case "issued": return "secondary";
      case "overdue": return "destructive";
      case "cancelled": return "destructive";
      case "refunded": return "outline";
      default: return "secondary";
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("payment") || action.includes("paid")) return <DollarSign className="w-4 h-4" />;
    if (action.includes("invoice")) return <Receipt className="w-4 h-4" />;
    if (action.includes("ship") || action.includes("deliver")) return <Truck className="w-4 h-4" />;
    if (action.includes("order")) return <ShoppingBag className="w-4 h-4" />;
    if (action.includes("escrow")) return <Shield className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoices
          </CardTitle>
          <CardDescription>View and manage your transaction invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-invoices">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices yet</p>
              <p className="text-sm text-muted-foreground">Invoices will appear here when orders are placed</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="invoice-list">
              {invoices.map((invoice) => (
                <Card key={invoice.id} data-testid={`card-invoice-${invoice.id}`}>
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-between flex-wrap gap-3 cursor-pointer"
                      onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                      data-testid={`invoice-header-${invoice.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`invoice-number-${invoice.id}`}>
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Order #{invoice.orderId} &middot; {new Date(invoice.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold" data-testid={`invoice-total-${invoice.id}`}>
                            {formatPrice(Number(invoice.totalAmount))}
                          </p>
                          {Number(invoice.platformFee) > 0 && (
                            <p className="text-xs text-muted-foreground" data-testid={`invoice-fee-${invoice.id}`}>
                              Commission: {formatPrice(Number(invoice.platformFee))}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusVariant(invoice.status)} data-testid={`invoice-status-${invoice.id}`}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>

                    {expandedInvoice === invoice.id && invoice.lineItems && invoice.lineItems.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-2" data-testid={`invoice-items-${invoice.id}`}>
                        <p className="text-sm font-medium text-muted-foreground">Line Items</p>
                        {invoice.lineItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm py-1"
                            data-testid={`invoice-item-${invoice.id}-${idx}`}
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-muted-foreground" />
                              <span>{item.name}</span>
                              <span className="text-muted-foreground">x{item.quantity}</span>
                            </div>
                            <span className="font-medium">{formatPrice(Number(item.totalPrice))}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatPrice(Number(invoice.subtotal))}</span>
                        </div>
                        {Number(invoice.platformFee) > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Platform Fee</span>
                            <span className="text-destructive">-{formatPrice(Number(invoice.platformFee))}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span>Total</span>
                          <span>{formatPrice(Number(invoice.totalAmount))}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Timeline of your recent transaction activities</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-activity">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recent activity</p>
              <p className="text-sm text-muted-foreground">Transaction activities will appear here</p>
            </div>
          ) : (
            <div className="space-y-1" data-testid="activity-list">
              {activities.map((activity, idx) => (
                <div
                  key={activity.id}
                  className="flex gap-3 py-3"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-muted">
                      {getActionIcon(activity.action)}
                    </div>
                    {idx < activities.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium" data-testid={`activity-action-${activity.id}`}>
                      {activity.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`activity-description-${activity.id}`}>
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt!).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
