import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ShipperApplication, Shipment } from "@shared/schema";
import {
  Truck,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Building2,
  Globe,
  FileText,
  Send,
  Shield,
  Package,
  MapPin,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  XCircle,
  Loader2,
  Navigation,
} from "lucide-react";
import { useState } from "react";
import { SHIPPING_MILESTONES } from "@shared/shipping";

const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Cameroon",
  "Egypt", "Ethiopia", "Ghana", "Ivory Coast", "Kenya", "Morocco",
  "Nigeria", "Rwanda", "Senegal", "South Africa", "Tanzania", "Tunisia",
  "Uganda", "Zambia", "Zimbabwe",
];

const VEHICLE_TYPES = [
  { value: "motorcycle", label: "Motorcycle" },
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "container", label: "Container Truck" },
  { value: "air_freight", label: "Air Freight" },
];

export default function ShipperPage() {
  const { user } = useAuth();

  const { data: application, isLoading } = useQuery<ShipperApplication | null>({
    queryKey: ["/api/shipper/application"],
    queryFn: async () => {
      const res = await fetch("/api/shipper/application", { credentials: "include" });
      const data = await res.json();
      return data.data;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access the shipper portal.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!application || application.status === 'rejected' || application.status === 'revoked') {
    return <ShipperOnboarding existingApplication={application} />;
  }

  if (application.status === 'draft') {
    return <ShipperOnboarding existingApplication={application} />;
  }

  if (application.status === 'submitted') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-bold mb-2">Application Under Review</h2>
            <p className="text-muted-foreground mb-4">
              Your shipper application has been submitted and is being reviewed by our team.
              You'll be notified once a decision is made.
            </p>
            <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (application.status === 'approved') {
    return <ShipperDashboard application={application} />;
  }

  return null;
}

function ShipperOnboarding({ existingApplication }: { existingApplication?: ShipperApplication | null }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    companyName: existingApplication?.companyName || "",
    companyType: existingApplication?.companyType || "",
    businessDescription: existingApplication?.businessDescription || "",
    fleetSize: existingApplication?.fleetSize || "",
    vehicleTypes: existingApplication?.vehicleTypes || ([] as string[]),
    serviceRegions: existingApplication?.serviceRegions || ([] as string[]),
    hasInsurance: existingApplication?.hasInsurance || false,
    insuranceDetails: existingApplication?.insuranceDetails || "",
    contactPhone: existingApplication?.contactPhone || "",
    contactEmail: existingApplication?.contactEmail || "",
    website: existingApplication?.website || "",
    experienceYears: existingApplication?.experienceYears || 0,
    referenceLinks: existingApplication?.referenceLinks || "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/shipper/application", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/application"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("PATCH", "/api/shipper/application", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/application"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/shipper/application/submit", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/application"] });
      toast({ title: "Application submitted for review!" });
    },
    onError: () => {
      toast({ title: "Failed to submit application", variant: "destructive" });
    },
  });

  const saveDraft = async () => {
    try {
      if (existingApplication && existingApplication.status === 'draft') {
        await updateMutation.mutateAsync(form);
      } else {
        await createMutation.mutateAsync(form);
      }
      toast({ title: "Draft saved" });
    } catch (e) {
      toast({ title: "Failed to save draft", variant: "destructive" });
    }
  };

  const steps = [
    { label: "Company Info", icon: Building2 },
    { label: "Fleet & Coverage", icon: Truck },
    { label: "Contact & Experience", icon: Phone },
    { label: "Review & Submit", icon: Send },
  ];

  const toggleVehicleType = (type: string) => {
    setForm(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  const toggleRegion = (country: string) => {
    setForm(prev => ({
      ...prev,
      serviceRegions: prev.serviceRegions.includes(country)
        ? prev.serviceRegions.filter(c => c !== country)
        : [...prev.serviceRegions, country],
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="link-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      {existingApplication?.status === 'rejected' && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Your previous application was rejected</span>
            </div>
            {existingApplication.rejectionReason && (
              <p className="text-sm text-red-600 mt-1">Reason: {existingApplication.rejectionReason}</p>
            )}
            <p className="text-sm text-red-600 mt-1">You may submit a new application below.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Become a Shipper
          </CardTitle>
          <CardDescription>
            Apply to join our courier network and deliver shipments across Africa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-8">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 ${i <= step ? "text-primary" : "text-muted-foreground"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i < step ? "bg-primary text-white" : i === step ? "bg-primary/20 text-primary" : "bg-muted"}`}>
                  {i < step ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className="text-xs hidden md:block">{s.label}</span>
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Company / Business Name *</Label>
                <Input
                  value={form.companyName}
                  onChange={(e) => setForm(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Your shipping company name"
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <Label>Company Type *</Label>
                <Select value={form.companyType} onValueChange={(v) => setForm(prev => ({ ...prev, companyType: v }))}>
                  <SelectTrigger data-testid="select-company-type">
                    <SelectValue placeholder="Select your company type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Courier</SelectItem>
                    <SelectItem value="small_fleet">Small Fleet (2-5 vehicles)</SelectItem>
                    <SelectItem value="logistics_company">Logistics Company</SelectItem>
                    <SelectItem value="freight_forwarder">Freight Forwarder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Description</Label>
                <Textarea
                  value={form.businessDescription}
                  onChange={(e) => setForm(prev => ({ ...prev, businessDescription: e.target.value }))}
                  placeholder="Describe your shipping business and capabilities..."
                  data-testid="input-business-desc"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Fleet Size</Label>
                <Select value={form.fleetSize} onValueChange={(v) => setForm(prev => ({ ...prev, fleetSize: v }))}>
                  <SelectTrigger data-testid="select-fleet-size">
                    <SelectValue placeholder="Number of vehicles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 vehicle</SelectItem>
                    <SelectItem value="2-5">2-5 vehicles</SelectItem>
                    <SelectItem value="6-20">6-20 vehicles</SelectItem>
                    <SelectItem value="20+">20+ vehicles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle Types</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {VEHICLE_TYPES.map(v => (
                    <Badge
                      key={v.value}
                      variant={form.vehicleTypes.includes(v.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleVehicleType(v.value)}
                      data-testid={`badge-vehicle-${v.value}`}
                    >
                      {v.label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Service Regions (countries you can deliver to)</Label>
                <div className="flex flex-wrap gap-2 mt-1 max-h-48 overflow-y-auto">
                  {AFRICAN_COUNTRIES.map(c => (
                    <Badge
                      key={c}
                      variant={form.serviceRegions.includes(c) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleRegion(c)}
                      data-testid={`badge-region-${c}`}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.hasInsurance}
                  onChange={(e) => setForm(prev => ({ ...prev, hasInsurance: e.target.checked }))}
                  id="insurance"
                  data-testid="checkbox-insurance"
                />
                <Label htmlFor="insurance">I have shipping/cargo insurance</Label>
              </div>
              {form.hasInsurance && (
                <div>
                  <Label>Insurance Details</Label>
                  <Input
                    value={form.insuranceDetails}
                    onChange={(e) => setForm(prev => ({ ...prev, insuranceDetails: e.target.value }))}
                    placeholder="Insurance provider and coverage details"
                    data-testid="input-insurance"
                  />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Contact Phone *</Label>
                <Input
                  value={form.contactPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+234..."
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  value={form.contactEmail}
                  onChange={(e) => setForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="logistics@company.com"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://..."
                  data-testid="input-website"
                />
              </div>
              <div>
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) => setForm(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                  min={0}
                  data-testid="input-experience"
                />
              </div>
              <div>
                <Label>References / Portfolio Links</Label>
                <Textarea
                  value={form.referenceLinks}
                  onChange={(e) => setForm(prev => ({ ...prev, referenceLinks: e.target.value }))}
                  placeholder="Links to past work or references..."
                  data-testid="input-references"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Review Your Application</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <p className="font-medium">{form.companyName || "Not set"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{form.companyType || "Not set"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fleet Size:</span>
                  <p className="font-medium">{form.fleetSize || "Not set"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicle Types:</span>
                  <div className="flex flex-wrap gap-1">
                    {form.vehicleTypes.length ? form.vehicleTypes.map(v => (
                      <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                    )) : <span className="text-muted-foreground">None selected</span>}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Regions:</span>
                  <div className="flex flex-wrap gap-1">
                    {form.serviceRegions.length ? form.serviceRegions.map(r => (
                      <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                    )) : <span className="text-muted-foreground">None selected</span>}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Insurance:</span>
                  <p className="font-medium">{form.hasInsurance ? "Yes" : "No"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{form.contactPhone || "Not set"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Experience:</span>
                  <p className="font-medium">{form.experienceYears} years</p>
                </div>
              </div>
              {form.businessDescription && (
                <div>
                  <span className="text-muted-foreground text-sm">Description:</span>
                  <p className="text-sm">{form.businessDescription}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              data-testid="button-prev"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex gap-2">
              {step < 3 && (
                <Button variant="outline" onClick={saveDraft} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-draft">
                  Save Draft
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)} data-testid="button-next">
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    await saveDraft();
                    submitMutation.mutate();
                  }}
                  disabled={submitMutation.isPending || !form.companyName || !form.companyType || !form.contactPhone}
                  data-testid="button-submit"
                >
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Submit Application
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShipperDashboard({ application }: { application: ShipperApplication }) {
  const { toast } = useToast();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateLocation, setUpdateLocation] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<Shipment[]>({
    queryKey: ["/api/shipper/assignments"],
    queryFn: async () => {
      const res = await fetch("/api/shipper/assignments", { credentials: "include" });
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: available = [], isLoading: loadingAvailable } = useQuery<Shipment[]>({
    queryKey: ["/api/shipper/available"],
    queryFn: async () => {
      const res = await fetch("/api/shipper/available", { credentials: "include" });
      const data = await res.json();
      return data.data || [];
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      const res = await apiRequest("POST", `/api/shipper/assignments/${shipmentId}/accept`, {});
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to accept shipment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shipment accepted! You've been assigned this delivery." });
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/available"] });
    },
    onError: (error: any) => {
      const message = error?.message?.includes("claimed") || error?.message?.includes("another courier")
        ? "This shipment was already taken by another courier."
        : "Failed to accept shipment. Please try again.";
      toast({ title: message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/available"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      const res = await apiRequest("POST", `/api/shipper/assignments/${shipmentId}/reject`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shipment declined" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/available"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ shipmentId, status, location, description }: { shipmentId: number; status: string; location: string; description: string }) => {
      const res = await apiRequest("POST", `/api/shipper/shipments/${shipmentId}/status`, { status, location, description });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status updated!" });
      queryClient.invalidateQueries({ queryKey: ["/api/shipper/assignments"] });
      setSelectedShipment(null);
      setUpdateStatus("");
      setUpdateLocation("");
      setUpdateDescription("");
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const activeJobs = assignments.filter(s => !['delivered', 'returned'].includes(s.status));
  const completedJobs = assignments.filter(s => ['delivered', 'returned'].includes(s.status));

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Shipper Dashboard
          </h1>
          <p className="text-muted-foreground">{application.companyName}</p>
        </div>
        <Badge className="bg-green-100 text-green-800">Approved Courier</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold" data-testid="text-active-count">{activeJobs.length}</p>
            <p className="text-sm text-muted-foreground">Active Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold" data-testid="text-completed-count">{completedJobs.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold" data-testid="text-available-count">{available.length}</p>
            <p className="text-sm text-muted-foreground">Available Jobs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList data-testid="tabs-shipper">
          <TabsTrigger value="active" data-testid="tab-active">Active Jobs ({activeJobs.length})</TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available">Available ({available.length})</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed ({completedJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {loadingAssignments ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : activeJobs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-active">No active jobs. Check available shipments to pick up new deliveries.</CardContent></Card>
          ) : (
            activeJobs.map(shipment => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                type="active"
                onUpdateStatus={() => { setSelectedShipment(shipment); setUpdateStatus(shipment.status); }}
                onAccept={() => {}}
                onReject={() => {}}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-3 mt-4">
          {loadingAvailable ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : available.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-available">No available shipments in your service area right now.</CardContent></Card>
          ) : (
            available.map(shipment => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                type="available"
                onAccept={() => acceptMutation.mutate(shipment.id)}
                onReject={() => {}}
                onUpdateStatus={() => {}}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedJobs.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground" data-testid="text-no-completed">No completed deliveries yet.</CardContent></Card>
          ) : (
            completedJobs.map(shipment => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                type="completed"
                onAccept={() => {}}
                onReject={() => {}}
                onUpdateStatus={() => {}}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedShipment} onOpenChange={(o) => !o && setSelectedShipment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Shipment Status</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <Badge>{selectedShipment.status}</Badge>
              </div>
              <div>
                <Label>New Status</Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_MILESTONES.map(m => (
                      <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Location</Label>
                <Input
                  value={updateLocation}
                  onChange={(e) => setUpdateLocation(e.target.value)}
                  placeholder="City, Country"
                  data-testid="input-update-location"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  placeholder="Status update details..."
                  data-testid="input-update-desc"
                />
              </div>
              <Button
                onClick={() => statusMutation.mutate({
                  shipmentId: selectedShipment.id,
                  status: updateStatus,
                  location: updateLocation,
                  description: updateDescription,
                })}
                disabled={!updateStatus || statusMutation.isPending}
                className="w-full"
                data-testid="button-update-status"
              >
                {statusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Navigation className="h-4 w-4 mr-1" />}
                Update Status
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ShipmentCard({ shipment, type, onAccept, onReject, onUpdateStatus }: {
  shipment: Shipment;
  type: "active" | "available" | "completed";
  onAccept: () => void;
  onReject: () => void;
  onUpdateStatus: () => void;
}) {
  const pickup = shipment.pickupAddress as any;
  const delivery = shipment.deliveryAddress as any;
  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800",
    assigned: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    in_transit: "bg-indigo-100 text-indigo-800",
    out_for_delivery: "bg-yellow-100 text-yellow-800",
    delivered: "bg-green-100 text-green-800",
    returned: "bg-red-100 text-red-800",
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-shipment-${shipment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">SHIP{shipment.id}</span>
            {shipment.trackingNumber && (
              <span className="text-xs text-muted-foreground">({shipment.trackingNumber})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[shipment.status] || ""}>{shipment.status}</Badge>
            {shipment.priority && shipment.priority !== 'standard' && (
              <Badge variant="outline" className="text-xs">{shipment.priority}</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-start gap-1">
            <MapPin className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p>{pickup?.city || "Unknown"}, {pickup?.country || ""}</p>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <MapPin className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Delivery</p>
              <p>{delivery?.city || "Unknown"}, {delivery?.country || ""}</p>
            </div>
          </div>
        </div>

        {shipment.estimatedDelivery && (
          <p className="text-xs text-muted-foreground mb-2">
            <Clock className="h-3 w-3 inline mr-1" />
            ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
          </p>
        )}

        <div className="flex gap-2 mt-2">
          {type === "available" && (
            <Button size="sm" onClick={onAccept} data-testid={`button-accept-${shipment.id}`}>
              <CheckCircle className="h-4 w-4 mr-1" /> Accept Job
            </Button>
          )}
          {type === "active" && (
            <Button size="sm" onClick={onUpdateStatus} data-testid={`button-update-${shipment.id}`}>
              <Navigation className="h-4 w-4 mr-1" /> Update Status
            </Button>
          )}
          {type === "active" && shipment.courierStatus === 'assigned' && (
            <Button size="sm" variant="outline" onClick={onReject} data-testid={`button-decline-${shipment.id}`}>
              <XCircle className="h-4 w-4 mr-1" /> Decline
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
