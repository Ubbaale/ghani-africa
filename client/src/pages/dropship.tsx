import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import type { Product, DropshipOffer, DropshipListing, DropshipFulfillment, DropshipApplication, UserProfile } from "@shared/schema";
import { DropshipOnboardingWizard } from "@/components/dropship-onboarding";
import {
  Package,
  Plus,
  Trash2,
  ArrowLeft,
  Store,
  Truck,
  DollarSign,
  Clock,
  MapPin,
  ShoppingCart,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { CountryFlag } from "@/components/country-flag";
import { useCurrency } from "@/lib/currency-context";

const AFRICAN_COUNTRIES = [
  { name: "Algeria", code: "DZ" },
  { name: "Angola", code: "AO" },
  { name: "Benin", code: "BJ" },
  { name: "Botswana", code: "BW" },
  { name: "Burkina Faso", code: "BF" },
  { name: "Cameroon", code: "CM" },
  { name: "Egypt", code: "EG" },
  { name: "Ethiopia", code: "ET" },
  { name: "Ghana", code: "GH" },
  { name: "Ivory Coast", code: "CI" },
  { name: "Kenya", code: "KE" },
  { name: "Morocco", code: "MA" },
  { name: "Nigeria", code: "NG" },
  { name: "Rwanda", code: "RW" },
  { name: "Senegal", code: "SN" },
  { name: "South Africa", code: "ZA" },
  { name: "Tanzania", code: "TZ" },
  { name: "Tunisia", code: "TN" },
  { name: "Uganda", code: "UG" },
  { name: "Zambia", code: "ZM" },
  { name: "Zimbabwe", code: "ZW" },
];

type CatalogItem = DropshipOffer & { product: Product; supplier: UserProfile };
type OfferWithProduct = DropshipOffer & { product: Product };
type ListingWithOffer = DropshipListing & { offer: DropshipOffer & { product: Product } };
type FulfillmentWithListing = DropshipFulfillment & { listing: DropshipListing };

export default function DropshipPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("catalog");
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [createListingOpen, setCreateListingOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<CatalogItem | null>(null);

  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: applicationResponse } = useQuery<{ success: boolean; data: DropshipApplication | null }>({
    queryKey: ["/api/dropship/application"],
    enabled: !!user,
  });
  const application = applicationResponse?.data;

  const { data: myProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/products?sellerId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!user,
  });

  const { data: catalogResponse } = useQuery<{ success: boolean; data: CatalogItem[] }>({
    queryKey: ["/api/dropship/catalog"],
  });
  const catalog = catalogResponse?.data || [];

  const { data: offersResponse } = useQuery<{ success: boolean; data: OfferWithProduct[] }>({
    queryKey: ["/api/dropship/offers"],
  });
  const myOffers = offersResponse?.data || [];

  const { data: listingsResponse } = useQuery<{ success: boolean; data: ListingWithOffer[] }>({
    queryKey: ["/api/dropship/listings"],
  });
  const myListings = listingsResponse?.data || [];

  const { data: supplierFulfillmentsResponse } = useQuery<{ success: boolean; data: FulfillmentWithListing[] }>({
    queryKey: ["/api/dropship/fulfillments/supplier"],
  });
  const supplierFulfillments = supplierFulfillmentsResponse?.data || [];

  const { data: resellerFulfillmentsResponse } = useQuery<{ success: boolean; data: DropshipFulfillment[] }>({
    queryKey: ["/api/dropship/fulfillments/reseller"],
  });
  const resellerFulfillments = resellerFulfillmentsResponse?.data || [];

  const [offerForm, setOfferForm] = useState({
    productId: "",
    wholesalePrice: "",
    minOrderQty: "1",
    leadTimeDays: "3",
    serviceRegions: [] as string[],
    stock: "",
    terms: "",
  });

  const [listingForm, setListingForm] = useState({
    retailPrice: "",
    customName: "",
    customDescription: "",
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: typeof offerForm) => {
      return apiRequest("POST", "/api/dropship/offers", {
        productId: parseInt(data.productId),
        wholesalePrice: data.wholesalePrice,
        minOrderQty: parseInt(data.minOrderQty) || 1,
        leadTimeDays: parseInt(data.leadTimeDays) || 3,
        serviceRegions: data.serviceRegions,
        stock: parseInt(data.stock) || 0,
        terms: data.terms,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/catalog"] });
      setCreateOfferOpen(false);
      setOfferForm({
        productId: "",
        wholesalePrice: "",
        minOrderQty: "1",
        leadTimeDays: "3",
        serviceRegions: [],
        stock: "",
        terms: "",
      });
      toast({ title: "Dropship offer created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create dropship offer", variant: "destructive" });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      return apiRequest("DELETE", `/api/dropship/offers/${offerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/catalog"] });
      toast({ title: "Dropship offer deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete offer", variant: "destructive" });
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: { offerId: number; retailPrice: string; customName?: string; customDescription?: string }) => {
      return apiRequest("POST", "/api/dropship/listings", {
        offer_id: data.offerId,
        retail_price: data.retailPrice,
        custom_name: data.customName,
        custom_description: data.customDescription,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/listings"] });
      setCreateListingOpen(false);
      setSelectedOffer(null);
      setListingForm({ retailPrice: "", customName: "", customDescription: "" });
      toast({ title: "Product added to your catalog" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add listing", variant: "destructive" });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: number) => {
      return apiRequest("DELETE", `/api/dropship/listings/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/listings"] });
      toast({ title: "Listing removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
    },
  });

  const updateFulfillmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/dropship/fulfillments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/fulfillments/supplier"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/fulfillments/reseller"] });
      toast({ title: "Fulfillment status updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
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

  const isApproved = application?.status === 'approved';
  const isSupplier = isApproved && application?.applicationType === 'supplier';
  const isReseller = isApproved && application?.applicationType === 'reseller';

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "acknowledged": return "outline";
      case "shipped": return "default";
      case "delivered": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <GradientLogo size="sm" />
              <span className="font-bold text-xl text-primary">Dropshipping</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {/* Onboarding & Status Banners */}
        {!isApproved && !showOnboarding && (
          <div className="mb-6">
            {!application && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-xl font-bold mb-2">Start Dropshipping on Ghani Africa</h2>
                      <p className="text-muted-foreground mb-4">
                        Join our dropshipping network as a supplier or reseller. Apply now to get started!
                      </p>
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>No upfront costs</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Access to verified partners</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>African-wide network</span>
                        </div>
                      </div>
                    </div>
                    <Button size="lg" onClick={() => setShowOnboarding(true)} data-testid="button-start-onboarding">
                      Apply Now <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {application?.status === 'submitted' && (
              <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-900/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Application Under Review</h3>
                      <p className="text-sm text-muted-foreground">
                        Your {application.applicationType} application for "{application.companyName}" is being reviewed.
                        We'll notify you once a decision has been made. This usually takes 1-2 business days.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : "Recently"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {application?.status === 'rejected' && (
              <Card className="border-red-500/30 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Application Not Approved</h3>
                        <p className="text-sm text-muted-foreground">
                          {application.rejectionReason || "Your application was not approved at this time."}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowOnboarding(true)} data-testid="button-reapply">
                      Reapply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {application?.status === 'draft' && (
              <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-900/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Continue Your Application</h3>
                        <p className="text-sm text-muted-foreground">
                          You have an unfinished application. Complete and submit it to get started.
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setShowOnboarding(true)} data-testid="button-continue-application">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {application?.status === 'revoked' && (
              <Card className="border-red-500/30 bg-red-50 dark:bg-red-900/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Access Revoked</h3>
                      <p className="text-sm text-muted-foreground">
                        Your dropshipping access has been revoked. Please contact support for more information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {showOnboarding && !isApproved && (
          <DropshipOnboardingWizard
            existingApplication={application}
            onComplete={() => setShowOnboarding(false)}
          />
        )}

        {!showOnboarding && isApproved && (
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {isSupplier && (
            <>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Offers</p>
                    <p className="text-xl font-bold">{myOffers.filter(o => o.isActive).length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary/50">
                    <Users className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Resellers</p>
                    <p className="text-xl font-bold">{supplierFulfillments.length}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {isReseller && (
            <>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">My Listings</p>
                    <p className="text-xl font-bold">{myListings.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-md bg-secondary/50">
                    <TrendingUp className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-xl font-bold">{resellerFulfillments.length}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-accent">
                <ShoppingCart className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Catalog Items</p>
                <p className="text-xl font-bold">{catalog.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="catalog" data-testid="tab-catalog">Browse Catalog</TabsTrigger>
            {isReseller && (
              <TabsTrigger value="my-listings" data-testid="tab-my-listings">My Listings</TabsTrigger>
            )}
            {isSupplier && (
              <>
                <TabsTrigger value="my-offers" data-testid="tab-my-offers">My Offers</TabsTrigger>
                <TabsTrigger value="fulfillments" data-testid="tab-fulfillments">Fulfillments</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="catalog">
            <Card>
              <CardHeader>
                <CardTitle>Dropship Catalog</CardTitle>
                <CardDescription>Browse products available for dropshipping from verified suppliers</CardDescription>
              </CardHeader>
              <CardContent>
                {catalog.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No dropship products available yet</p>
                    {isSupplier && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Create your first dropship offer to appear here
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {catalog.map((item) => (
                      <Card key={item.id} data-testid={`card-catalog-${item.id}`}>
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                              {item.product.images?.[0] ? (
                                <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.product.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-bold text-primary">
                                  {formatPrice(Number(item.wholesalePrice))}
                                </span>
                                <span className="text-xs text-muted-foreground">wholesale</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{item.leadTimeDays} days lead time</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{item.product.country}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                MOQ: {item.minOrderQty}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Stock: {item.stock}
                              </Badge>
                            </div>
                            {isReseller && item.supplierId !== user.id && (
                              <Dialog open={createListingOpen && selectedOffer?.id === item.id} onOpenChange={(open) => {
                                setCreateListingOpen(open);
                                if (!open) setSelectedOffer(null);
                              }}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    onClick={() => setSelectedOffer(item)}
                                    data-testid={`button-add-listing-${item.id}`}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add to Catalog
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Add to Your Catalog</DialogTitle>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (selectedOffer) {
                                        createListingMutation.mutate({
                                          offerId: selectedOffer.id,
                                          retailPrice: listingForm.retailPrice,
                                          customName: listingForm.customName || undefined,
                                          customDescription: listingForm.customDescription || undefined,
                                        });
                                      }
                                    }}
                                    className="space-y-4"
                                  >
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="font-medium">{selectedOffer?.product.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Wholesale: {formatPrice(Number(selectedOffer?.wholesalePrice || 0))}
                                      </p>
                                    </div>
                                    <div>
                                      <Label htmlFor="retailPrice">Your Retail Price *</Label>
                                      <Input
                                        id="retailPrice"
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter your selling price"
                                        value={listingForm.retailPrice}
                                        onChange={(e) => setListingForm({ ...listingForm, retailPrice: e.target.value })}
                                        required
                                        data-testid="input-retail-price"
                                      />
                                      {listingForm.retailPrice && selectedOffer && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Your margin: {formatPrice(parseFloat(listingForm.retailPrice) - parseFloat(selectedOffer.wholesalePrice))}
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <Label htmlFor="customName">Custom Product Name (Optional)</Label>
                                      <Input
                                        id="customName"
                                        placeholder="Leave empty to use original name"
                                        value={listingForm.customName}
                                        onChange={(e) => setListingForm({ ...listingForm, customName: e.target.value })}
                                        data-testid="input-custom-name"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="customDescription">Custom Description (Optional)</Label>
                                      <Textarea
                                        id="customDescription"
                                        placeholder="Leave empty to use original description"
                                        value={listingForm.customDescription}
                                        onChange={(e) => setListingForm({ ...listingForm, customDescription: e.target.value })}
                                        data-testid="input-custom-description"
                                      />
                                    </div>
                                    <Button
                                      type="submit"
                                      className="w-full"
                                      disabled={createListingMutation.isPending}
                                      data-testid="button-confirm-listing"
                                    >
                                      {createListingMutation.isPending ? "Adding..." : "Add to My Catalog"}
                                    </Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isReseller && (
            <TabsContent value="my-listings">
              <Card>
                <CardHeader>
                  <CardTitle>My Dropship Listings</CardTitle>
                  <CardDescription>Products you are reselling from suppliers</CardDescription>
                </CardHeader>
                <CardContent>
                  {myListings.length === 0 ? (
                    <div className="text-center py-12">
                      <Store className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No listings yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Browse the catalog and add products to your store
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myListings.map((listing) => (
                        <Card key={listing.id} data-testid={`card-listing-${listing.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                {listing.offer.product.images?.[0] ? (
                                  <img src={listing.offer.product.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {listing.customName || listing.offer.product.name}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-sm">
                                    Wholesale: <span className="text-muted-foreground">{formatPrice(Number(listing.offer.wholesalePrice))}</span>
                                  </span>
                                  <span className="text-sm">
                                    Retail: <span className="text-primary font-bold">{formatPrice(Number(listing.retailPrice))}</span>
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    Margin: {formatPrice(Number(listing.retailPrice) - Number(listing.offer.wholesalePrice))}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={listing.isActive ? "default" : "secondary"}>
                                  {listing.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteListingMutation.mutate(listing.id)}
                                  disabled={deleteListingMutation.isPending}
                                  data-testid={`button-delete-listing-${listing.id}`}
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
          )}

          {isSupplier && (
            <>
              <TabsContent value="my-offers">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 flex-wrap">
                    <div>
                      <CardTitle>My Dropship Offers</CardTitle>
                      <CardDescription>Products available for resellers to list</CardDescription>
                    </div>
                    <Dialog open={createOfferOpen} onOpenChange={setCreateOfferOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-offer">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Offer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Create Dropship Offer</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            createOfferMutation.mutate(offerForm);
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="productId">Select Product *</Label>
                            <Select
                              value={offerForm.productId}
                              onValueChange={(v) => setOfferForm({ ...offerForm, productId: v })}
                            >
                              <SelectTrigger data-testid="select-product">
                                <SelectValue placeholder="Choose a product" />
                              </SelectTrigger>
                              <SelectContent>
                                {myProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - {formatPrice(Number(product.price), true, product.currency || "USD")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="wholesalePrice">Wholesale Price *</Label>
                              <Input
                                id="wholesalePrice"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={offerForm.wholesalePrice}
                                onChange={(e) => setOfferForm({ ...offerForm, wholesalePrice: e.target.value })}
                                required
                                data-testid="input-wholesale-price"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stock">Available Stock *</Label>
                              <Input
                                id="stock"
                                type="number"
                                placeholder="0"
                                value={offerForm.stock}
                                onChange={(e) => setOfferForm({ ...offerForm, stock: e.target.value })}
                                required
                                data-testid="input-stock"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="minOrderQty">Min Order Qty</Label>
                              <Input
                                id="minOrderQty"
                                type="number"
                                value={offerForm.minOrderQty}
                                onChange={(e) => setOfferForm({ ...offerForm, minOrderQty: e.target.value })}
                                data-testid="input-moq"
                              />
                            </div>
                            <div>
                              <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                              <Input
                                id="leadTimeDays"
                                type="number"
                                value={offerForm.leadTimeDays}
                                onChange={(e) => setOfferForm({ ...offerForm, leadTimeDays: e.target.value })}
                                data-testid="input-lead-time"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Service Regions</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {AFRICAN_COUNTRIES.slice(0, 12).map((country) => (
                                <Badge
                                  key={country.code}
                                  variant={offerForm.serviceRegions.includes(country.name) ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const regions = offerForm.serviceRegions.includes(country.name)
                                      ? offerForm.serviceRegions.filter(r => r !== country.name)
                                      : [...offerForm.serviceRegions, country.name];
                                    setOfferForm({ ...offerForm, serviceRegions: regions });
                                  }}
                                >
                                  <CountryFlag code={country.code} size="sm" className="mr-1" />
                                  {country.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="terms">Terms & Conditions</Label>
                            <Textarea
                              id="terms"
                              placeholder="Return policy, shipping terms, etc."
                              value={offerForm.terms}
                              onChange={(e) => setOfferForm({ ...offerForm, terms: e.target.value })}
                              data-testid="input-terms"
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={createOfferMutation.isPending}
                            data-testid="button-confirm-offer"
                          >
                            {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {myOffers.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No dropship offers yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Create offers to allow resellers to sell your products
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myOffers.map((offer) => (
                          <Card key={offer.id} data-testid={`card-offer-${offer.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                  {offer.product.images?.[0] ? (
                                    <img src={offer.product.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{offer.product.name}</p>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                                    <span className="text-sm text-primary font-bold">
                                      {formatPrice(Number(offer.wholesalePrice))}
                                    </span>
                                    <Badge variant="outline" className="text-xs">MOQ: {offer.minOrderQty}</Badge>
                                    <Badge variant="secondary" className="text-xs">Stock: {offer.stock}</Badge>
                                    <Badge variant="outline" className="text-xs">{offer.leadTimeDays} days</Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={offer.isActive ? "default" : "secondary"}>
                                    {offer.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteOfferMutation.mutate(offer.id)}
                                    disabled={deleteOfferMutation.isPending}
                                    data-testid={`button-delete-offer-${offer.id}`}
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

              <TabsContent value="fulfillments">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Fulfillments</CardTitle>
                    <CardDescription>Orders from resellers waiting to be fulfilled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {supplierFulfillments.length === 0 ? (
                      <div className="text-center py-12">
                        <Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No pending fulfillments</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {supplierFulfillments.map((fulfillment) => (
                          <Card key={fulfillment.id} data-testid={`card-fulfillment-${fulfillment.id}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <p className="font-medium">Order #{fulfillment.orderId}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Wholesale: {formatPrice(Number(fulfillment.wholesaleAmount))}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant={getStatusColor(fulfillment.status)}>
                                    {fulfillment.status}
                                  </Badge>
                                  {fulfillment.status === "pending" && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateFulfillmentStatusMutation.mutate({
                                        id: fulfillment.id,
                                        status: "acknowledged",
                                      })}
                                      disabled={updateFulfillmentStatusMutation.isPending}
                                      data-testid={`button-ack-${fulfillment.id}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Acknowledge
                                    </Button>
                                  )}
                                  {fulfillment.status === "acknowledged" && (
                                    <Button
                                      size="sm"
                                      onClick={() => updateFulfillmentStatusMutation.mutate({
                                        id: fulfillment.id,
                                        status: "shipped",
                                      })}
                                      disabled={updateFulfillmentStatusMutation.isPending}
                                      data-testid={`button-ship-${fulfillment.id}`}
                                    >
                                      <Truck className="w-4 h-4 mr-1" />
                                      Mark Shipped
                                    </Button>
                                  )}
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
            </>
          )}
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}
