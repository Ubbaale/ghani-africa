import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CountryFlag } from "@/components/country-flag";
import {
  Package,
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building2,
  Globe,
  FileText,
  Send,
  Truck,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import type { DropshipApplication } from "@shared/schema";

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

interface OnboardingWizardProps {
  existingApplication?: DropshipApplication | null;
  onComplete: () => void;
}

export function DropshipOnboardingWizard({ existingApplication, onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    applicationType: existingApplication?.applicationType || "",
    companyName: existingApplication?.companyName || "",
    businessDescription: existingApplication?.businessDescription || "",
    website: existingApplication?.website || "",
    countriesServed: existingApplication?.countriesServed || ([] as string[]),
    fulfillmentCapacity: existingApplication?.fulfillmentCapacity || "",
    avgLeadTimeDays: existingApplication?.avgLeadTimeDays || 3,
    experienceLevel: existingApplication?.experienceLevel || "",
    referenceLinks: existingApplication?.referenceLinks || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/dropship/application", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/application"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("PATCH", "/api/dropship/application", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/application"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/dropship/application/submit");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dropship/application"] });
      toast({ title: "Application submitted!", description: "We'll review your application and get back to you soon." });
      onComplete();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit application", variant: "destructive" });
    },
  });

  const saveAndNext = async () => {
    try {
      if (existingApplication && existingApplication.status === 'draft') {
        await updateMutation.mutateAsync(form);
      } else if (!existingApplication) {
        await createMutation.mutateAsync(form);
      }
      setStep(step + 1);
    } catch {
      toast({ title: "Error", description: "Failed to save progress", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (existingApplication && existingApplication.status === 'draft') {
      await updateMutation.mutateAsync(form);
    } else if (!existingApplication) {
      await createMutation.mutateAsync(form);
    }
    await submitMutation.mutateAsync();
  };

  const toggleCountry = (code: string) => {
    setForm(prev => ({
      ...prev,
      countriesServed: prev.countriesServed.includes(code)
        ? prev.countriesServed.filter(c => c !== code)
        : [...prev.countriesServed, code],
    }));
  };

  const steps = [
    { title: "Choose Role", icon: Users },
    { title: "Business Info", icon: Building2 },
    { title: "Service Details", icon: Globe },
    { title: "Review & Submit", icon: Send },
  ];

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.applicationType;
      case 1: return !!form.companyName && !!form.businessDescription;
      case 2: return form.countriesServed.length > 0 && !!form.experienceLevel;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Join Our Dropshipping Network</h2>
            <p className="text-muted-foreground mt-2">Choose how you want to participate in the marketplace</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${form.applicationType === "supplier" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setForm({ ...form, applicationType: "supplier" })}
              data-testid="card-role-supplier"
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Supplier</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You manufacture or source products and want resellers to sell them for you
                </p>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>List products at wholesale prices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Get a network of resellers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Scale your distribution</span>
                  </div>
                </div>
                {form.applicationType === "supplier" && (
                  <Badge className="mt-4" variant="default">Selected</Badge>
                )}
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${form.applicationType === "reseller" ? "ring-2 ring-primary" : ""}`}
              onClick={() => setForm({ ...form, applicationType: "reseller" })}
              data-testid="card-role-reseller"
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Reseller</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You want to sell products without managing inventory or shipping
                </p>
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    <span>No inventory needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Low risk, low upfront cost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Set your own profit margins</span>
                  </div>
                </div>
                {form.applicationType === "reseller" && (
                  <Badge className="mt-4" variant="default">Selected</Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Business Information
            </CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company / Business Name *</Label>
              <Input
                id="companyName"
                placeholder="Your business or trade name"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                data-testid="input-company-name"
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe your business, what you do, and your experience in trade"
                value={form.businessDescription}
                onChange={(e) => setForm({ ...form, businessDescription: e.target.value })}
                rows={4}
                data-testid="input-business-description"
              />
            </div>
            <div>
              <Label htmlFor="website">Website / Social Media (Optional)</Label>
              <Input
                id="website"
                placeholder="https://your-business.com or social media link"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                data-testid="input-website"
              />
            </div>
            <div>
              <Label htmlFor="referenceLinks">References / Portfolio (Optional)</Label>
              <Textarea
                id="referenceLinks"
                placeholder="Links to your previous work, marketplace profiles, or references"
                value={form.referenceLinks}
                onChange={(e) => setForm({ ...form, referenceLinks: e.target.value })}
                rows={2}
                data-testid="input-reference-links"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" /> Service Details
            </CardTitle>
            <CardDescription>
              {form.applicationType === "supplier"
                ? "Where can you ship and how much can you handle?"
                : "Where do you plan to sell and what's your experience?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Countries You Serve *</Label>
              <p className="text-xs text-muted-foreground mb-2">Select all countries where you can operate</p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {AFRICAN_COUNTRIES.map((country) => (
                  <Badge
                    key={country.code}
                    variant={form.countriesServed.includes(country.code) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => toggleCountry(country.code)}
                    data-testid={`badge-country-${country.code}`}
                  >
                    <CountryFlag code={country.code} className="w-4 h-3 mr-1" />
                    {country.name}
                  </Badge>
                ))}
              </div>
              {form.countriesServed.length > 0 && (
                <p className="text-xs text-primary mt-1">{form.countriesServed.length} countries selected</p>
              )}
            </div>

            <div>
              <Label htmlFor="experienceLevel">Experience Level *</Label>
              <Select
                value={form.experienceLevel}
                onValueChange={(v) => setForm({ ...form, experienceLevel: v })}
              >
                <SelectTrigger data-testid="select-experience-level">
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - New to e-commerce/trade</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                  <SelectItem value="experienced">Experienced - Established business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.applicationType === "supplier" && (
              <>
                <div>
                  <Label htmlFor="fulfillmentCapacity">Fulfillment Capacity</Label>
                  <Select
                    value={form.fulfillmentCapacity}
                    onValueChange={(v) => setForm({ ...form, fulfillmentCapacity: v })}
                  >
                    <SelectTrigger data-testid="select-fulfillment-capacity">
                      <SelectValue placeholder="How many orders can you handle?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-50 orders/month)</SelectItem>
                      <SelectItem value="medium">Medium (50-200 orders/month)</SelectItem>
                      <SelectItem value="large">Large (200-1000 orders/month)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+ orders/month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="avgLeadTimeDays">Average Lead Time (Days)</Label>
                  <Input
                    id="avgLeadTimeDays"
                    type="number"
                    min={1}
                    max={30}
                    value={form.avgLeadTimeDays}
                    onChange={(e) => setForm({ ...form, avgLeadTimeDays: parseInt(e.target.value) || 3 })}
                    data-testid="input-lead-time"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Review Your Application
            </CardTitle>
            <CardDescription>Please review your information before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="default" data-testid="text-review-role">
                  {form.applicationType === "supplier" ? "Supplier" : "Reseller"}
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Company</span>
                <p className="font-medium mt-1" data-testid="text-review-company">{form.companyName}</p>
              </div>
              <div className="p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="text-sm mt-1" data-testid="text-review-description">{form.businessDescription}</p>
              </div>
              {form.website && (
                <div className="p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Website</span>
                  <p className="text-sm mt-1">{form.website}</p>
                </div>
              )}
              <div className="p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Countries ({form.countriesServed.length})</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.countriesServed.map(code => {
                    const country = AFRICAN_COUNTRIES.find(c => c.code === code);
                    return country ? (
                      <Badge key={code} variant="outline" className="text-xs">
                        <CountryFlag code={code} className="w-3 h-2 mr-1" />
                        {country.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                <span className="text-sm text-muted-foreground">Experience</span>
                <span className="text-sm font-medium capitalize">{form.experienceLevel}</span>
              </div>
              {form.applicationType === "supplier" && form.fulfillmentCapacity && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground">Capacity</span>
                  <span className="text-sm font-medium capitalize">{form.fulfillmentCapacity}</span>
                </div>
              )}
            </div>

            <div className="p-4 border border-primary/20 rounded-md bg-primary/5">
              <p className="text-sm">
                By submitting this application, you agree to follow marketplace guidelines and maintain quality standards.
                Our team will review your application, usually within 1-2 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={saveAndNext}
            disabled={!canProceed() || createMutation.isPending || updateMutation.isPending}
            data-testid="button-wizard-next"
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Next"} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            data-testid="button-wizard-submit"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Application"} <Send className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
