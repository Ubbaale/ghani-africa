import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import type { CartItem, Product } from "@shared/schema";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Shield,
  CreditCard,
  Lock,
  CheckCircle,
  Clock,
  RefreshCw,
  Loader2,
  MapPin,
  Truck,
  ShieldCheck,
  Globe,
  AlertTriangle,
  Info,
  Zap,
  Timer,
  Smartphone,
  Phone,
} from "lucide-react";

const AFRICAN_COUNTRIES = [
  { code: "BW", name: "Botswana" },
  { code: "CM", name: "Cameroon" },
  { code: "CD", name: "DR Congo" },
  { code: "EG", name: "Egypt" },
  { code: "ET", name: "Ethiopia" },
  { code: "GH", name: "Ghana" },
  { code: "CI", name: "Ivory Coast" },
  { code: "KE", name: "Kenya" },
  { code: "MW", name: "Malawi" },
  { code: "MA", name: "Morocco" },
  { code: "MZ", name: "Mozambique" },
  { code: "NA", name: "Namibia" },
  { code: "NG", name: "Nigeria" },
  { code: "RW", name: "Rwanda" },
  { code: "SN", name: "Senegal" },
  { code: "ZA", name: "South Africa" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

type CartItemWithProduct = CartItem & { product: Product | null };

interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface PickupPoint {
  id: number;
  name: string;
  address: string;
  city: string;
  countryCode: string;
  partnerType: string;
  operatingHours: string;
  phone: string;
  isActive: boolean;
}

interface DeliveryTier {
  id: number;
  tier: string;
  city: string;
  countryCode: string;
  fee: string;
  estimatedTime: string;
  isAvailable: boolean;
}

interface ExpressCorridor {
  id: number;
  name: string;
  originCity: string;
  originCountryCode: string;
  destCity: string;
  destCountryCode: string;
  mode: string;
  fee: string;
  estimatedDays: string;
  isActive: boolean;
}

const MOBILE_MONEY_PROVIDERS: Record<string, { id: string; name: string; icon: string }[]> = {
  KE: [
    { id: "mpesa", name: "M-Pesa", icon: "M" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
  ],
  TZ: [
    { id: "mpesa", name: "M-Pesa", icon: "M" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  UG: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
  ],
  RW: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
  ],
  GH: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "airtel", name: "AirtelTigo Money", icon: "A" },
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  NG: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
  ],
  CM: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  CI: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  SN: [
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  ZA: [
    { id: "mpesa", name: "M-Pesa", icon: "M" },
  ],
  ZM: [
    { id: "mtn", name: "MTN Mobile Money", icon: "M" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
  ],
  MW: [
    { id: "airtel", name: "Airtel Money", icon: "A" },
    { id: "mpesa", name: "M-Pesa (TNM Mpamba)", icon: "M" },
  ],
  MZ: [
    { id: "mpesa", name: "M-Pesa", icon: "M" },
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  CD: [
    { id: "mpesa", name: "M-Pesa", icon: "M" },
    { id: "orange", name: "Orange Money", icon: "O" },
    { id: "airtel", name: "Airtel Money", icon: "A" },
  ],
  ET: [
    { id: "mpesa", name: "M-Pesa (Safaricom)", icon: "M" },
  ],
  EG: [
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
  BW: [
    { id: "orange", name: "Orange Money", icon: "O" },
    { id: "mtn", name: "Mascom MyZaka", icon: "M" },
  ],
  NA: [
    { id: "mtn", name: "MTC Money", icon: "M" },
  ],
  ZW: [
    { id: "mpesa", name: "EcoCash", icon: "E" },
  ],
  MA: [
    { id: "orange", name: "Orange Money", icon: "O" },
  ],
};

const TIER_CONFIG: Record<string, { icon: typeof Truck; label: string; time: string }> = {
  standard: { icon: Truck, label: "Standard", time: "1-2 days" },
  express: { icon: Timer, label: "Express", time: "4-8 hours" },
  instant: { icon: Zap, label: "Instant", time: "60-90 min" },
};

export default function Checkout() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  const [deliveryMethod, setDeliveryMethod] = useState<"home" | "pickup">("home");
  const [selectedTier, setSelectedTier] = useState<"standard" | "express" | "instant">("standard");
  const [selectedPickupPointId, setSelectedPickupPointId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "mobile_money">("stripe");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<string>("");
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState<string>("");
  const [mobileMoneyPaymentId, setMobileMoneyPaymentId] = useState<number | null>(null);
  const [mobileMoneyStatus, setMobileMoneyStatus] = useState<string | null>(null);

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!isLoading && cartItems.length === 0 && user) {
      navigate("/cart");
    }
  }, [isLoading, cartItems, user]);

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product ? Number(item.product.price) * item.quantity : 0);
  }, 0);

  const platformFee = Math.round(subtotal * 0.05 * 100) / 100;

  const originCountryCode = useMemo(() => {
    const firstProduct = cartItems.find(i => i.product)?.product;
    if (!firstProduct?.country) return "";
    const match = AFRICAN_COUNTRIES.find(c => c.name.toLowerCase() === firstProduct.country.toLowerCase());
    return match?.code || "";
  }, [cartItems]);

  const originCity = useMemo(() => {
    const firstProduct = cartItems.find(i => i.product)?.product;
    return (firstProduct as any)?.city || "";
  }, [cartItems]);

  const destCountryCode = useMemo(() => {
    return address.country || "";
  }, [address.country]);

  const { data: pickupPointsData } = useQuery<PickupPoint[]>({
    queryKey: ["/api/pickup-points", address.country, address.city],
    queryFn: async () => {
      const res = await fetch(`/api/pickup-points?countryCode=${address.country}&city=${address.city}`);
      if (!res.ok) throw new Error("Failed to fetch pickup points");
      return res.json();
    },
    enabled: !!address.country && !!address.city,
  });

  const { data: deliveryTiersData } = useQuery<DeliveryTier[]>({
    queryKey: ["/api/delivery-tiers", address.country, address.city],
    queryFn: async () => {
      const res = await fetch(`/api/delivery-tiers?countryCode=${address.country}&city=${address.city}`);
      if (!res.ok) throw new Error("Failed to fetch delivery tiers");
      return res.json();
    },
    enabled: !!address.country && !!address.city,
  });

  const { data: expressCorridorsData } = useQuery<ExpressCorridor[]>({
    queryKey: ["/api/express-corridors", originCity, originCountryCode, address.city, address.country],
    queryFn: async () => {
      const res = await fetch(`/api/express-corridors?originCity=${originCity}&originCountryCode=${originCountryCode}&destCity=${address.city}&destCountryCode=${address.country}`);
      if (!res.ok) throw new Error("Failed to fetch express corridors");
      return res.json();
    },
    enabled: !!originCity && !!originCountryCode && !!address.city && !!address.country,
  });

  const pickupPoints = pickupPointsData || [];
  const deliveryTiers = deliveryTiersData || [];
  const expressCorridors = expressCorridorsData || [];

  const selectedPickupPoint = pickupPoints.find(p => p.id === selectedPickupPointId) || null;

  const { data: tradeEstimate, isLoading: tradeLoading } = useQuery<{
    success: boolean;
    data: {
      tradeType: string;
      origin: { countryCode: string; countryName: string };
      destination: { countryCode: string; countryName: string };
      breakdown: {
        vat: { rate: string; amount: string; label: string };
        importDuty: { rate: string; amount: string; label: string } | null;
        exportDuty: { rate: string; amount: string; label: string } | null;
        customsProcessing: { amount: string; label: string } | null;
        shipping: { amount: string; label: string; estimatedDays: string; zoneName: string };
        tierPremium: { amount: string; label: string; tier: string } | null;
        expressCorridor: { name: string; mode: string; fee: string; estimatedDays: string } | null;
      };
      afcfta: {
        eligible: boolean;
        standardDutyRate: string;
        standardDutyAmount: string;
        preferentialRate: string;
        preferentialAmount: string;
        savings: string;
        savingsPercent: number;
      } | null;
      totalTaxAndDuties: string;
      totalShipping: string;
      grandTotal: string;
    };
  }>({
    queryKey: ["/api/trade/estimate", originCountryCode, destCountryCode, subtotal, deliveryMethod, selectedTier, address.city],
    queryFn: async () => {
      const res = await fetch(`/api/trade/estimate?origin=${originCountryCode}&destination=${destCountryCode}&subtotal=${subtotal}&weight_kg=2&delivery_tier=${selectedTier}&delivery_method=${deliveryMethod}&origin_city=${originCity}&destination_city=${address.city}`);
      if (!res.ok) throw new Error("Failed to estimate");
      return res.json();
    },
    enabled: !!originCountryCode && !!destCountryCode && subtotal > 0,
  });

  const estimate = tradeEstimate?.data;
  const totalTaxDuties = estimate ? parseFloat(estimate.totalTaxAndDuties) : 0;
  const totalShipping = estimate ? parseFloat(estimate.totalShipping) : 0;
  const total = subtotal + platformFee + totalTaxDuties + totalShipping;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout/create-session", {
        shippingAddress: address,
        destinationCountryCode: address.country,
        deliveryMethod,
        deliveryTier: selectedTier,
        pickupPointId: selectedPickupPointId,
      });
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const availableMobileMoneyProviders = useMemo(() => {
    return MOBILE_MONEY_PROVIDERS[address.country] || [];
  }, [address.country]);

  const mobileMoneyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mobile-money/initiate", {
        provider: mobileMoneyProvider,
        phoneNumber: mobileMoneyPhone,
        shippingAddress: address,
        destinationCountryCode: address.country,
        deliveryMethod,
        deliveryTier: selectedTier,
        pickupPointId: selectedPickupPointId,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setMobileMoneyPaymentId(data.payment.id);
        setMobileMoneyStatus("pending");
        toast({
          title: "Payment Initiated",
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment failed",
        description: error.message || "Failed to initiate mobile money payment.",
        variant: "destructive",
      });
    },
  });

  const { data: mobileMoneyStatusData } = useQuery<any>({
    queryKey: ["/api/mobile-money/status", mobileMoneyPaymentId],
    queryFn: async () => {
      const res = await fetch(`/api/mobile-money/status/${mobileMoneyPaymentId}`);
      if (!res.ok) throw new Error("Failed to check status");
      return res.json();
    },
    enabled: !!mobileMoneyPaymentId && mobileMoneyStatus === "pending",
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (mobileMoneyStatusData?.payment?.status === "completed") {
      setMobileMoneyStatus("completed");
      toast({
        title: "Payment Successful",
        description: "Your mobile money payment has been confirmed!",
      });
      navigate("/orders");
    } else if (mobileMoneyStatusData?.payment?.status === "failed") {
      setMobileMoneyStatus("failed");
      toast({
        title: "Payment Failed",
        description: "Your mobile money payment was not successful. Please try again.",
        variant: "destructive",
      });
    }
  }, [mobileMoneyStatusData]);

  const handleFieldChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const isAddressComplete =
    address.fullName.trim() &&
    address.phone.trim() &&
    address.city.trim() &&
    address.country.trim() &&
    (deliveryMethod === "pickup"
      ? selectedPickupPointId !== null
      : address.street.trim() !== "");

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-4">
              <Link href="/cart">
                <Button variant="ghost" size="icon" data-testid="button-back-to-cart">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <GradientLogo size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-sm">Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={address.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      data-testid="input-full-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+234 800 000 0000"
                      value={address.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    placeholder="123 Main Street, Apt 4B"
                    value={address.street}
                    onChange={(e) => handleFieldChange("street", e.target.value)}
                    data-testid="input-street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Lagos"
                      value={address.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      data-testid="input-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      placeholder="Lagos State"
                      value={address.state}
                      onChange={(e) => handleFieldChange("state", e.target.value)}
                      data-testid="input-state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select value={address.country} onValueChange={(value) => handleFieldChange("country", value)}>
                      <SelectTrigger id="country" data-testid="select-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="100001"
                      value={address.postalCode}
                      onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                      data-testid="input-postal-code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5 text-primary" />
                  Delivery Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Delivery Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod("home");
                        setSelectedPickupPointId(null);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                        deliveryMethod === "home"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="select-delivery-home"
                    >
                      <Truck className={`w-5 h-5 ${deliveryMethod === "home" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-left">
                        <p className="text-sm font-medium">Home Delivery</p>
                        <p className="text-xs text-muted-foreground">Delivers to your address</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("pickup")}
                      className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                        deliveryMethod === "pickup"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="select-delivery-pickup"
                    >
                      <MapPin className={`w-5 h-5 ${deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="text-left">
                        <p className="text-sm font-medium">Pickup Point</p>
                        <p className="text-xs text-muted-foreground">Collect from a local shop</p>
                      </div>
                    </button>
                  </div>
                </div>

                {deliveryMethod === "pickup" && (
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Select Pickup Point</Label>
                    {pickupPoints.length > 0 ? (
                      <>
                        <Select
                          value={selectedPickupPointId?.toString() || ""}
                          onValueChange={(val) => setSelectedPickupPointId(Number(val))}
                        >
                          <SelectTrigger data-testid="select-pickup-point">
                            <SelectValue placeholder="Choose a pickup location" />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupPoints.map((point) => (
                              <SelectItem key={point.id} value={point.id.toString()}>
                                {point.name} - {point.address}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPickupPoint && (
                          <div className="border rounded-md p-3 space-y-1.5 bg-muted/30" data-testid="pickup-point-details">
                            <p className="text-sm font-medium">{selectedPickupPoint.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedPickupPoint.address}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-[10px]">{selectedPickupPoint.partnerType}</Badge>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {selectedPickupPoint.operatingHours}
                              </span>
                              <span className="flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                {selectedPickupPoint.phone}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground" data-testid="text-no-pickup-points">
                        {address.city && address.country
                          ? "No pickup points available for this city"
                          : "Select a country and city to see available pickup points"}
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Speed Delivery</Label>
                  <div className="grid gap-3">
                    {(["standard", "express", "instant"] as const).map((tier) => {
                      const config = TIER_CONFIG[tier];
                      const TierIcon = config.icon;
                      const tierData = deliveryTiers.find(t => t.tier === tier);
                      const isAvailable = tier === "standard" || (tierData?.isAvailable ?? false);

                      if (tier !== "standard" && !tierData) return null;

                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => isAvailable && setSelectedTier(tier)}
                          disabled={!isAvailable}
                          className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                            selectedTier === tier
                              ? "border-primary bg-primary/5"
                              : isAvailable
                                ? "border-border hover-elevate"
                                : "border-border opacity-50 cursor-not-allowed"
                          }`}
                          data-testid={`select-tier-${tier}`}
                        >
                          <TierIcon className={`w-5 h-5 flex-shrink-0 ${
                            selectedTier === tier ? "text-primary" : "text-muted-foreground"
                          }`} />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{config.label}</p>
                            <p className="text-xs text-muted-foreground">{config.time}</p>
                          </div>
                          <span className="text-sm font-semibold">
                            {tier === "standard"
                              ? "Included"
                              : tierData
                                ? `+${formatPrice(parseFloat(tierData.fee))}`
                                : "N/A"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {expressCorridors.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    {expressCorridors.map((corridor) => (
                      <div key={corridor.id} className="flex items-start gap-2" data-testid={`express-corridor-${corridor.id}`}>
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Express corridor available: <span className="font-semibold">{corridor.name}</span> via {corridor.mode} - {corridor.estimatedDays} - +{formatPrice(parseFloat(corridor.fee))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-primary" />
                  Order Items ({cartItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center" data-testid={`checkout-item-${item.id}`}>
                    <div className="w-14 h-14 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {item.product?.images && item.product.images[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold" data-testid={`checkout-item-price-${item.id}`}>
                      {formatPrice(Number(item.product?.price || 0) * item.quantity, true, item.product?.currency || "USD")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("stripe");
                      setMobileMoneyPaymentId(null);
                      setMobileMoneyStatus(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                      paymentMethod === "stripe"
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    data-testid="select-payment-stripe"
                  >
                    <CreditCard className={`w-5 h-5 ${paymentMethod === "stripe" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">Card Payment</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, etc.</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("mobile_money")}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                      paymentMethod === "mobile_money"
                        ? "border-primary bg-primary/5"
                        : "border-border hover-elevate"
                    }`}
                    data-testid="select-payment-mobile-money"
                  >
                    <Smartphone className={`w-5 h-5 ${paymentMethod === "mobile_money" ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">Mobile Money</p>
                      <p className="text-xs text-muted-foreground">M-Pesa, MTN, Airtel</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === "mobile_money" && (
                  <div className="space-y-4">
                    {availableMobileMoneyProviders.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Select Provider</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {availableMobileMoneyProviders.map((provider) => (
                              <button
                                key={provider.id}
                                type="button"
                                onClick={() => setMobileMoneyProvider(provider.id)}
                                className={`flex items-center gap-2 p-2.5 rounded-md border transition-colors text-left ${
                                  mobileMoneyProvider === provider.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover-elevate"
                                }`}
                                data-testid={`select-provider-${provider.id}`}
                              >
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                                  mobileMoneyProvider === provider.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {provider.icon}
                                </div>
                                <span className="text-xs font-medium">{provider.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mobileMoneyPhone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="mobileMoneyPhone"
                              placeholder="+254 7XX XXX XXX"
                              value={mobileMoneyPhone}
                              onChange={(e) => setMobileMoneyPhone(e.target.value)}
                              className="pl-9"
                              data-testid="input-mobile-money-phone"
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Enter the phone number registered with your {mobileMoneyProvider ? availableMobileMoneyProviders.find(p => p.id === mobileMoneyProvider)?.name : "mobile money"} account
                          </p>
                        </div>

                        {mobileMoneyStatus === "pending" && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                              <div>
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Waiting for payment confirmation</p>
                                <p className="text-xs text-amber-600 dark:text-amber-500">Please check your phone and approve the payment request</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {mobileMoneyStatus === "failed" && (
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                              <div>
                                <p className="text-sm font-medium text-red-700 dark:text-red-400">Payment failed</p>
                                <p className="text-xs text-red-600 dark:text-red-500">Please try again or use a different payment method</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-muted/50 rounded-md p-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-muted-foreground" data-testid="text-no-mobile-money">
                            {address.country
                              ? "Mobile money is not available for the selected country. Please use card payment."
                              : "Select a shipping country to see available mobile money providers."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                    <span data-testid="text-subtotal">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (5%)</span>
                    <span data-testid="text-platform-fee">{formatPrice(platformFee)}</span>
                  </div>
                </div>

                {estimate && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">
                          {estimate.tradeType === "domestic" ? "Domestic Trade" : "Cross-Border Trade"}
                        </span>
                        <Badge variant={estimate.tradeType === "domestic" ? "secondary" : "default"} className="text-[10px]" data-testid="badge-trade-type">
                          {estimate.tradeType === "domestic" ? "Same Country" : `${estimate.origin.countryName} → ${estimate.destination.countryName}`}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{estimate.breakdown.vat.label}</span>
                        <span data-testid="text-vat">{formatPrice(parseFloat(estimate.breakdown.vat.amount))}</span>
                      </div>
                      {estimate.breakdown.importDuty && parseFloat(estimate.breakdown.importDuty.amount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{estimate.breakdown.importDuty.label}</span>
                          <span data-testid="text-import-duty">{formatPrice(parseFloat(estimate.breakdown.importDuty.amount))}</span>
                        </div>
                      )}
                      {estimate.breakdown.exportDuty && parseFloat(estimate.breakdown.exportDuty.amount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{estimate.breakdown.exportDuty.label}</span>
                          <span data-testid="text-export-duty">{formatPrice(parseFloat(estimate.breakdown.exportDuty.amount))}</span>
                        </div>
                      )}
                      {estimate.breakdown.customsProcessing && parseFloat(estimate.breakdown.customsProcessing.amount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{estimate.breakdown.customsProcessing.label}</span>
                          <span data-testid="text-customs-fee">{formatPrice(parseFloat(estimate.breakdown.customsProcessing.amount))}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <div className="text-muted-foreground">
                          <span>{estimate.breakdown.shipping.label}</span>
                          <p className="text-[10px] flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {estimate.breakdown.shipping.estimatedDays}
                          </p>
                        </div>
                        <span data-testid="text-shipping-cost">{formatPrice(parseFloat(estimate.breakdown.shipping.amount))}</span>
                      </div>

                      {estimate.breakdown.tierPremium && parseFloat(estimate.breakdown.tierPremium.amount) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground" data-testid="text-tier-premium-label">
                            {estimate.breakdown.tierPremium.tier === "express" ? "Express Delivery Premium" : "Instant Delivery Premium"}
                          </span>
                          <span data-testid="text-tier-premium">{formatPrice(parseFloat(estimate.breakdown.tierPremium.amount))}</span>
                        </div>
                      )}

                      {estimate.breakdown.expressCorridor && parseFloat(estimate.breakdown.expressCorridor.fee) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground" data-testid="text-corridor-fee-label">Express Corridor Fee</span>
                          <span data-testid="text-corridor-fee">{formatPrice(parseFloat(estimate.breakdown.expressCorridor.fee))}</span>
                        </div>
                      )}
                    </div>

                    {estimate.afcfta && (
                      <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-2.5" data-testid="card-afcfta-savings">
                        <div className="flex items-start gap-2">
                          <Globe className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1 flex-1">
                            <p className="text-[11px] font-semibold text-green-700 dark:text-green-300">
                              AfCFTA Preferential Rates Available
                            </p>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-green-600 dark:text-green-500">Standard duty ({estimate.afcfta.standardDutyRate})</span>
                              <span className="line-through text-muted-foreground">{formatPrice(parseFloat(estimate.afcfta.standardDutyAmount))}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-green-600 dark:text-green-500">AfCFTA rate ({estimate.afcfta.preferentialRate})</span>
                              <span className="font-semibold text-green-700 dark:text-green-300">{formatPrice(parseFloat(estimate.afcfta.preferentialAmount))}</span>
                            </div>
                            <div className="flex justify-between text-[11px] pt-0.5 border-t border-green-200 dark:border-green-800">
                              <span className="font-semibold text-green-700 dark:text-green-300">
                                Potential savings ({estimate.afcfta.savingsPercent}% off)
                              </span>
                              <span className="font-bold text-green-700 dark:text-green-300" data-testid="text-afcfta-savings">
                                {formatPrice(parseFloat(estimate.afcfta.savings))}
                              </span>
                            </div>
                            <p className="text-[10px] text-green-600 dark:text-green-500">
                              Products with AfCFTA certificates qualify for these reduced rates
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {estimate.tradeType === "cross_border" && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-2.5">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-amber-700 dark:text-amber-400" data-testid="text-cross-border-notice">
                            Cross-border order: taxes and duties are estimated based on destination country rates. Actual charges may vary based on customs inspection.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!estimate && destCountryCode && tradeLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Calculating taxes & shipping...
                  </div>
                )}

                {!estimate && !destCountryCode && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                    <Info className="w-3 h-3" />
                    Select a country to see tax & shipping estimates
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-total">{formatPrice(total)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                {paymentMethod === "stripe" ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => checkoutMutation.mutate()}
                    disabled={!isAddressComplete || checkoutMutation.isPending || cartItems.length === 0}
                    data-testid="button-pay-now"
                  >
                    {checkoutMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Redirecting to payment...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Pay with Card {formatPrice(total)}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => mobileMoneyMutation.mutate()}
                    disabled={
                      !isAddressComplete ||
                      mobileMoneyMutation.isPending ||
                      cartItems.length === 0 ||
                      !mobileMoneyProvider ||
                      !mobileMoneyPhone.trim() ||
                      mobileMoneyStatus === "pending"
                    }
                    data-testid="button-pay-mobile-money"
                  >
                    {mobileMoneyMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Initiating payment...
                      </>
                    ) : mobileMoneyStatus === "pending" ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Awaiting confirmation...
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-5 h-5 mr-2" />
                        Pay with Mobile Money {formatPrice(total)}
                      </>
                    )}
                  </Button>
                )}

                {!isAddressComplete && (
                  <p className="text-xs text-amber-600 text-center" data-testid="text-address-required">
                    {deliveryMethod === "pickup" && !selectedPickupPointId
                      ? "Please select a pickup point for collection"
                      : "Please fill in all required shipping fields"}
                  </p>
                )}

                {paymentMethod === "mobile_money" && isAddressComplete && (!mobileMoneyProvider || !mobileMoneyPhone.trim()) && (
                  <p className="text-xs text-amber-600 text-center" data-testid="text-mobile-money-required">
                    {!mobileMoneyProvider
                      ? "Please select a mobile money provider"
                      : "Please enter your mobile money phone number"}
                  </p>
                )}

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>{paymentMethod === "stripe" ? "Secured by Stripe" : "Secure Mobile Money Payment"}</span>
                  </div>

                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Trade Assurance Protection</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        <span>Payment held in escrow until you confirm delivery</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500">
                        <RefreshCw className="w-3 h-3 flex-shrink-0" />
                        <span>Auto-refund if dispute unresolved within 7 days</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-500">
                        <Truck className="w-3 h-3 flex-shrink-0" />
                        <span>Real-time tracking with proof of delivery</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 space-y-2" data-testid="terms-conditions-section">
                    <p className="text-xs font-semibold text-foreground">Transaction Terms & Conditions</p>
                    <ul className="space-y-1 text-[11px] text-muted-foreground leading-relaxed">
                      <li>By completing this purchase, you agree to Ghani Africa's Buyer Protection terms.</li>
                      <li>Your payment is held in escrow and only released to the seller after you confirm delivery or 14 days after delivery proof is uploaded.</li>
                      <li>The seller must ship within 3 business days. If shipping is delayed without update for 5+ days, an automatic dispute is opened.</li>
                      <li>You may file a dispute within 30 days of purchase for any order issue.</li>
                      <li>Unresolved disputes are automatically refunded to you after 7 days.</li>
                      <li>The 5% platform fee covers escrow protection, dispute resolution, and transaction processing. It is non-refundable.</li>
                      <li>Both buyer and seller will receive full transaction receipts via email.</li>
                    </ul>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
