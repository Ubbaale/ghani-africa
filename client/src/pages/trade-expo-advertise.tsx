import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  CalendarDays,
  Globe,
  MapPin,
  Megaphone,
  CheckCircle,
  Star,
  Zap,
  Crown,
  Users,
  Eye,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";

const AFRICAN_COUNTRIES = [
  { name: "Algeria", code: "DZ" }, { name: "Angola", code: "AO" }, { name: "Benin", code: "BJ" },
  { name: "Botswana", code: "BW" }, { name: "Burkina Faso", code: "BF" }, { name: "Burundi", code: "BI" },
  { name: "Cabo Verde", code: "CV" }, { name: "Cameroon", code: "CM" }, { name: "Central African Republic", code: "CF" },
  { name: "Chad", code: "TD" }, { name: "Comoros", code: "KM" }, { name: "Congo", code: "CG" },
  { name: "DR Congo", code: "CD" }, { name: "Djibouti", code: "DJ" }, { name: "Egypt", code: "EG" },
  { name: "Equatorial Guinea", code: "GQ" }, { name: "Eritrea", code: "ER" }, { name: "Eswatini", code: "SZ" },
  { name: "Ethiopia", code: "ET" }, { name: "Gabon", code: "GA" }, { name: "Gambia", code: "GM" },
  { name: "Ghana", code: "GH" }, { name: "Guinea", code: "GN" }, { name: "Guinea-Bissau", code: "GW" },
  { name: "Ivory Coast", code: "CI" }, { name: "Kenya", code: "KE" }, { name: "Lesotho", code: "LS" },
  { name: "Liberia", code: "LR" }, { name: "Libya", code: "LY" }, { name: "Madagascar", code: "MG" },
  { name: "Malawi", code: "MW" }, { name: "Mali", code: "ML" }, { name: "Mauritania", code: "MR" },
  { name: "Mauritius", code: "MU" }, { name: "Morocco", code: "MA" }, { name: "Mozambique", code: "MZ" },
  { name: "Namibia", code: "NA" }, { name: "Niger", code: "NE" }, { name: "Nigeria", code: "NG" },
  { name: "Rwanda", code: "RW" }, { name: "Sao Tome and Principe", code: "ST" }, { name: "Senegal", code: "SN" },
  { name: "Seychelles", code: "SC" }, { name: "Sierra Leone", code: "SL" }, { name: "Somalia", code: "SO" },
  { name: "South Africa", code: "ZA" }, { name: "South Sudan", code: "SS" }, { name: "Sudan", code: "SD" },
  { name: "Tanzania", code: "TZ" }, { name: "Togo", code: "TG" }, { name: "Tunisia", code: "TN" },
  { name: "Uganda", code: "UG" }, { name: "Zambia", code: "ZM" }, { name: "Zimbabwe", code: "ZW" },
];

const PACKAGES = [
  {
    key: "basic",
    name: "Basic",
    price: 49,
    duration: "7 days",
    icon: Star,
    color: "blue",
    features: [
      "Homepage ticker banner placement",
      "Country flag + event name display",
      "Clickable link to your website",
      "Basic performance stats",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: 129,
    duration: "14 days",
    icon: Zap,
    color: "amber",
    popular: true,
    features: [
      "Everything in Basic",
      "Priority banner placement",
      "Highlighted event styling",
      "Detailed analytics dashboard",
      "Email notification on go-live",
    ],
  },
  {
    key: "featured",
    name: "Featured",
    price: 249,
    duration: "30 days",
    icon: Crown,
    color: "purple",
    features: [
      "Everything in Premium",
      "Top position in ticker",
      "Featured badge on banner",
      "Social media cross-promotion",
      "Dedicated account support",
      "Post-event analytics report",
    ],
  },
];

export default function TradeExpoAdvertise() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    organizerName: "",
    organizerEmail: "",
    eventName: "",
    eventDescription: "",
    location: "",
    eventDate: "",
    countryCode: "",
    websiteUrl: "",
  });

  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get("success") === "true";
  const isCancelled = urlParams.get("cancelled") === "true";

  const checkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/trade-expo-ads/checkout", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      toast({ title: "Select a Package", description: "Please choose an advertising package first.", variant: "destructive" });
      return;
    }
    if (!formData.organizerName || !formData.organizerEmail || !formData.eventName || !formData.location || !formData.eventDate || !formData.countryCode || !formData.websiteUrl) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    checkoutMutation.mutate({ ...formData, packageType: selectedPackage });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </Link>

        {isSuccess && (
          <Card className="mb-8 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Payment Successful!</h3>
                <p className="text-sm text-green-600 dark:text-green-500">Your trade expo ad has been submitted and will be activated shortly. You'll see your event on the homepage banner once it goes live.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isCancelled && (
          <Card className="mb-8 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-6 flex items-center gap-4">
              <Megaphone className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-700 dark:text-amber-400">Payment Cancelled</h3>
                <p className="text-sm text-amber-600 dark:text-amber-500">No worries — you can complete your payment anytime by submitting the form again.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Advertise Your Trade Expo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get your trade fair, exhibition, or business event in front of millions of African buyers and sellers. 
            Your event will be featured on the scrolling banner at the top of our homepage.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="text-center p-4">
            <Eye className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">10M+</p>
            <p className="text-xs text-muted-foreground">Monthly Impressions</p>
          </div>
          <div className="text-center p-4">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">50K+</p>
            <p className="text-xs text-muted-foreground">Active Traders</p>
          </div>
          <div className="text-center p-4">
            <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">54</p>
            <p className="text-xs text-muted-foreground">African Countries</p>
          </div>
          <div className="text-center p-4">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">85%</p>
            <p className="text-xs text-muted-foreground">Click-Through Rate</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-6">Choose Your Package</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.key}
              className={`cursor-pointer transition-all hover-elevate ${
                selectedPackage === pkg.key ? "ring-2 ring-primary border-primary" : ""
              } ${pkg.popular ? "relative border-primary" : ""}`}
              onClick={() => setSelectedPackage(pkg.key)}
              data-testid={`card-expo-pkg-${pkg.key}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
              )}
              <CardContent className="p-6 text-center">
                <div className={`w-14 h-14 rounded-full bg-${pkg.color}-500/10 flex items-center justify-center mx-auto mb-4`}>
                  <pkg.icon className={`w-7 h-7 text-${pkg.color}-500`} />
                </div>
                <h3 className="font-semibold text-lg mb-1">{pkg.name}</h3>
                <p className="text-3xl font-bold text-primary mb-1">${pkg.price}</p>
                <p className="text-sm text-muted-foreground mb-4">{pkg.duration}</p>
                <ul className="text-sm text-left space-y-2 mb-4">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={selectedPackage === pkg.key ? "default" : "outline"}
                  className="w-full"
                  data-testid={`button-select-pkg-${pkg.key}`}
                >
                  {selectedPackage === pkg.key ? "Selected" : "Select"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPackage && (
          <Card className="max-w-2xl mx-auto" data-testid="form-expo-details">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizerName">Organizer Name *</Label>
                    <Input
                      id="organizerName"
                      value={formData.organizerName}
                      onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                      placeholder="e.g. Africa Trade Forum Ltd"
                      required
                      data-testid="input-organizer-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizerEmail">Email Address *</Label>
                    <Input
                      id="organizerEmail"
                      type="email"
                      value={formData.organizerEmail}
                      onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
                      placeholder="contact@example.com"
                      required
                      data-testid="input-organizer-email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="e.g. East Africa International Trade Fair 2026"
                    required
                    data-testid="input-event-name"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDescription">Event Description</Label>
                  <Textarea
                    id="eventDescription"
                    value={formData.eventDescription}
                    onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
                    placeholder="Brief description of your trade event..."
                    rows={3}
                    data-testid="input-event-description"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Event Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Nairobi, Kenya"
                      required
                      data-testid="input-event-location"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventDate">Event Date *</Label>
                    <Input
                      id="eventDate"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      placeholder="e.g. Mar 2026 or March 15-18, 2026"
                      required
                      data-testid="input-event-date"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="countryCode">Country *</Label>
                    <Select value={formData.countryCode} onValueChange={(v) => setFormData({ ...formData, countryCode: v })}>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Event Website URL *</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://www.yourexpo.com"
                      required
                      data-testid="input-website-url"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {PACKAGES.find(p => p.key === selectedPackage)?.name} Package
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {PACKAGES.find(p => p.key === selectedPackage)?.duration} banner placement
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ${PACKAGES.find(p => p.key === selectedPackage)?.price}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={checkoutMutation.isPending}
                  data-testid="button-proceed-checkout"
                >
                  {checkoutMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Shield className="w-4 h-4 mr-2" /> Proceed to Secure Payment</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Stripe. Your ad will go live automatically after payment.
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-12 text-center">
          <h3 className="font-semibold mb-4">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary">1</span>
              </div>
              <p className="font-medium text-sm">Choose a Package</p>
              <p className="text-xs text-muted-foreground">Select the duration and visibility level that fits your event</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary">2</span>
              </div>
              <p className="font-medium text-sm">Submit Event Details</p>
              <p className="text-xs text-muted-foreground">Fill in your event name, date, location, and website link</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary">3</span>
              </div>
              <p className="font-medium text-sm">Go Live Instantly</p>
              <p className="text-xs text-muted-foreground">After payment, your expo appears on our homepage banner reaching millions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
