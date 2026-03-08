import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  PackageCheck,
} from "lucide-react";
import { SHIPPING_MILESTONES, getMilestoneIndex, getMilestoneLabel, getMilestoneProgress } from "@shared/shipping";

export default function SellerShipping() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState<number | null>(null);
  const [dispatchShipmentId, setDispatchShipmentId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    orderId: "",
    pickupCity: "",
    pickupCountry: "",
    pickupPhone: "",
    pickupAddress: "",
    deliveryCity: "",
    deliveryCountry: "",
    deliveryPhone: "",
    deliveryAddress: "",
    weightKg: "",
    packageType: "parcel",
  });
  const [updateForm, setUpdateForm] = useState({
    status: "",
    location: "",
    description: "",
  });

  const { data: shipmentsData, isLoading } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/logistics/seller/shipments"],
  });
  const shipmentsList = shipmentsData?.data || [];

  const overdueCount = shipmentsList.filter((s: any) => s.needsUpdate).length;
  const activeCount = shipmentsList.filter((s: any) => s.status !== 'delivered' && s.status !== 'returned').length;
  const deliveredCount = shipmentsList.filter((s: any) => s.status === 'delivered').length;

  const broadcastMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      const res = await apiRequest("POST", "/api/logistics/dispatch", { shipmentId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/seller/shipments"] });
      toast({ title: data.data?.message || "Broadcasted to all couriers!" });
      setDispatchShipmentId(null);
    },
    onError: () => toast({ title: "Failed to broadcast to couriers", variant: "destructive" }),
  });

  const renotifyMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      const res = await apiRequest("POST", `/api/logistics/dispatch/${shipmentId}/renotify`, {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/seller/shipments"] });
      toast({ title: data.data?.message || "Re-notified all couriers!" });
    },
    onError: () => toast({ title: "Failed to re-notify couriers", variant: "destructive" }),
  });

  const createShipmentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/logistics/shipments", {
        order_id: parseInt(createForm.orderId),
        pickup: {
          address: createForm.pickupAddress,
          city: createForm.pickupCity,
          country: createForm.pickupCountry,
          phone: createForm.pickupPhone,
        },
        delivery: {
          address: createForm.deliveryAddress,
          city: createForm.deliveryCity,
          country: createForm.deliveryCountry,
          phone: createForm.deliveryPhone,
        },
        package: {
          weight_kg: parseFloat(createForm.weightKg) || undefined,
          type: createForm.packageType,
        },
      });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/seller/shipments"] });
      toast({ title: `Shipment created! Tracking: ${data.data.tracking_number}` });
      setShowCreateDialog(false);
      setCreateForm({ orderId: "", pickupCity: "", pickupCountry: "", pickupPhone: "", pickupAddress: "", deliveryCity: "", deliveryCountry: "", deliveryPhone: "", deliveryAddress: "", weightKg: "", packageType: "parcel" });
    },
    onError: () => toast({ title: "Failed to create shipment", variant: "destructive" }),
  });

  const updateShipmentMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      return apiRequest("POST", "/api/logistics/seller/update", {
        shipment_id: shipmentId,
        status: updateForm.status || undefined,
        location: updateForm.location || undefined,
        description: updateForm.description || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logistics/seller/shipments"] });
      toast({ title: "Shipment updated successfully" });
      setShowUpdateDialog(null);
      setUpdateForm({ status: "", location: "", description: "" });
    },
    onError: () => toast({ title: "Failed to update shipment", variant: "destructive" }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_transit": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "shipped": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "out_for_delivery": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "customs_clearance": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "packaging": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="link-back-dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          </Link>
          <GradientLogo size="sm" />
          <div className="flex-1">
            <h1 className="text-lg font-bold" data-testid="text-shipping-title">Shipping Management</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-shipment">
            <Plus className="h-4 w-4 mr-1" /> New Shipment
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-shipments">{shipmentsList.length}</p>
                  <p className="text-sm text-muted-foreground">Total Shipments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{deliveredCount}</p>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={overdueCount > 0 ? "border-orange-500" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-8 w-8 ${overdueCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-2xl font-bold" data-testid="text-overdue-count">{overdueCount}</p>
                  <p className="text-sm text-muted-foreground">Needs Update</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {overdueCount > 0 && (
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-700 dark:text-orange-400">Action Required</h3>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    {overdueCount} shipment(s) haven't been updated in over 24 hours.
                    Please update tracking to maintain buyer trust and avoid automatic disputes.
                    Shipments without updates for 5 days will trigger automatic dispute.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your Shipments</CardTitle>
            <CardDescription>Manage and update your active shipments. Update daily to keep buyers informed.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : shipmentsList.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Shipments Yet</h3>
                <p className="text-muted-foreground mb-4">Create a shipment for your confirmed orders to start tracking.</p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-shipment">
                  <Plus className="h-4 w-4 mr-1" /> Create First Shipment
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-3">
                  {shipmentsList.map((shipment: any) => {
                    const progress = getMilestoneProgress(shipment.status);
                    return (
                      <div
                        key={shipment.id}
                        className={`border rounded-lg p-4 ${shipment.needsUpdate ? "border-orange-400 bg-orange-50/50 dark:bg-orange-950/10" : ""}`}
                        data-testid={`shipment-${shipment.id}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">Order #{shipment.orderId}</h4>
                              <Badge className={getStatusColor(shipment.status)}>
                                {getMilestoneLabel(shipment.status)}
                              </Badge>
                              {shipment.needsUpdate && (
                                <Badge variant="destructive" className="text-[10px]">
                                  <AlertTriangle className="h-3 w-3 mr-1" /> Overdue
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">{shipment.trackingNumber}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {shipment.status !== 'delivered' && shipment.status !== 'returned' && !shipment.broadcastedAt && shipment.courierStatus === 'unassigned' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDispatchShipmentId(shipment.id)}
                                disabled={broadcastMutation.isPending}
                                data-testid={`button-dispatch-${shipment.id}`}
                              >
                                <Send className="h-3 w-3 mr-1" /> Notify All Couriers
                              </Button>
                            )}
                            {shipment.broadcastedAt && shipment.courierStatus === 'unassigned' && (
                              <>
                                <Badge variant="outline" className="text-xs flex items-center gap-1 border-amber-400 text-amber-700">
                                  <Clock className="h-3 w-3" /> Awaiting Courier
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => renotifyMutation.mutate(shipment.id)}
                                  disabled={renotifyMutation.isPending}
                                  data-testid={`button-renotify-${shipment.id}`}
                                >
                                  {renotifyMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                                  Re-notify
                                </Button>
                              </>
                            )}
                            {shipment.courierStatus === 'accepted' && shipment.courierId && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1 border-green-400 text-green-700">
                                <CheckCircle className="h-3 w-3" /> {shipment.courierName || "Courier accepted"}
                              </Badge>
                            )}
                            {shipment.status !== 'delivered' && shipment.status !== 'returned' && (
                              <Button
                                size="sm"
                                variant={shipment.needsUpdate ? "default" : "outline"}
                                onClick={() => {
                                  setShowUpdateDialog(shipment.id);
                                  setUpdateForm({ status: "", location: "", description: "" });
                                }}
                                data-testid={`button-update-shipment-${shipment.id}`}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" /> Update
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {(shipment.pickupAddress as any)?.city} → {(shipment.deliveryAddress as any)?.city}
                          </span>
                          {shipment.currentLocation && (
                            <span>Current: {shipment.currentLocation}</span>
                          )}
                          {shipment.estimatedDelivery && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                            </span>
                          )}
                          {shipment.hoursSinceUpdate !== null && (
                            <span className={shipment.needsUpdate ? "text-orange-600 font-medium" : ""}>
                              Last update: {shipment.hoursSinceUpdate}h ago
                            </span>
                          )}
                        </div>

                        {shipment.lastEvent && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-3 py-1.5">
                            Latest: {shipment.lastEvent.description || shipment.lastEvent.status}
                            {shipment.lastEvent.location && ` - ${shipment.lastEvent.location}`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Shipment</DialogTitle>
              <DialogDescription>Enter shipping details for a confirmed order. A tracking number will be generated automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Order ID *</Label>
                <Input
                  type="number"
                  placeholder="Enter order ID"
                  value={createForm.orderId}
                  onChange={(e) => setCreateForm(f => ({ ...f, orderId: e.target.value }))}
                  data-testid="input-order-id"
                />
              </div>
              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2"><Send className="h-4 w-4" /> Pickup Address</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">City *</Label>
                    <Input placeholder="City" value={createForm.pickupCity} onChange={(e) => setCreateForm(f => ({ ...f, pickupCity: e.target.value }))} data-testid="input-pickup-city" />
                  </div>
                  <div>
                    <Label className="text-xs">Country *</Label>
                    <Input placeholder="Country" value={createForm.pickupCountry} onChange={(e) => setCreateForm(f => ({ ...f, pickupCountry: e.target.value }))} data-testid="input-pickup-country" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input placeholder="Street address" value={createForm.pickupAddress} onChange={(e) => setCreateForm(f => ({ ...f, pickupAddress: e.target.value }))} data-testid="input-pickup-address" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input placeholder="Phone number" value={createForm.pickupPhone} onChange={(e) => setCreateForm(f => ({ ...f, pickupPhone: e.target.value }))} data-testid="input-pickup-phone" />
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2"><PackageCheck className="h-4 w-4" /> Delivery Address</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">City *</Label>
                    <Input placeholder="City" value={createForm.deliveryCity} onChange={(e) => setCreateForm(f => ({ ...f, deliveryCity: e.target.value }))} data-testid="input-delivery-city" />
                  </div>
                  <div>
                    <Label className="text-xs">Country *</Label>
                    <Input placeholder="Country" value={createForm.deliveryCountry} onChange={(e) => setCreateForm(f => ({ ...f, deliveryCountry: e.target.value }))} data-testid="input-delivery-country" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Address</Label>
                  <Input placeholder="Street address" value={createForm.deliveryAddress} onChange={(e) => setCreateForm(f => ({ ...f, deliveryAddress: e.target.value }))} data-testid="input-delivery-address" />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input placeholder="Phone number" value={createForm.deliveryPhone} onChange={(e) => setCreateForm(f => ({ ...f, deliveryPhone: e.target.value }))} data-testid="input-delivery-phone" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Weight (kg)</Label>
                  <Input type="number" placeholder="Weight" value={createForm.weightKg} onChange={(e) => setCreateForm(f => ({ ...f, weightKg: e.target.value }))} data-testid="input-weight" />
                </div>
                <div>
                  <Label className="text-xs">Package Type</Label>
                  <Select value={createForm.packageType} onValueChange={(v) => setCreateForm(f => ({ ...f, packageType: v }))}>
                    <SelectTrigger data-testid="select-package-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parcel">Parcel</SelectItem>
                      <SelectItem value="pallet">Pallet</SelectItem>
                      <SelectItem value="container">Container</SelectItem>
                      <SelectItem value="bulk">Bulk Cargo</SelectItem>
                      <SelectItem value="crate">Crate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => createShipmentMutation.mutate()}
                disabled={createShipmentMutation.isPending || !createForm.orderId || !createForm.pickupCity || !createForm.pickupCountry || !createForm.deliveryCity || !createForm.deliveryCountry}
                data-testid="button-submit-shipment"
              >
                {createShipmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Shipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showUpdateDialog !== null} onOpenChange={() => setShowUpdateDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Shipment</DialogTitle>
              <DialogDescription>
                Provide a daily update on the shipment status. Regular updates protect against automatic disputes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>New Status</Label>
                <Select value={updateForm.status} onValueChange={(v) => setUpdateForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-update-status"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {SHIPPING_MILESTONES.map((m) => (
                      <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Current Location</Label>
                <Input
                  placeholder="e.g. Lagos Port, Nigeria"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm(f => ({ ...f, location: e.target.value }))}
                  data-testid="input-update-location"
                />
              </div>
              <div>
                <Label>Description / Notes</Label>
                <Textarea
                  placeholder="Describe what's happening with this shipment..."
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  data-testid="input-update-description"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => showUpdateDialog && updateShipmentMutation.mutate(showUpdateDialog)}
                disabled={updateShipmentMutation.isPending || (!updateForm.status && !updateForm.location && !updateForm.description)}
                data-testid="button-submit-update"
              >
                {updateShipmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Submit Update
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!dispatchShipmentId} onOpenChange={(o) => !o && setDispatchShipmentId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Broadcast to Couriers</DialogTitle>
              <DialogDescription>
                All approved couriers will be notified about this shipment. The first courier to accept it gets the job.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Send className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">First Come, First Served</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      All registered couriers will receive a notification. The first one to accept will be assigned this shipment.
                      If no one picks it up, you can re-send notifications.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => dispatchShipmentId && broadcastMutation.mutate(dispatchShipmentId)}
                disabled={broadcastMutation.isPending}
                data-testid="button-confirm-dispatch"
              >
                {broadcastMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Broadcast to All Couriers
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
