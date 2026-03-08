import { useState } from "react";
import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  FileCheck,
  Warehouse,
  Globe,
  PackageCheck,
  Loader2,
  Shield,
} from "lucide-react";
import { SHIPPING_MILESTONES, getMilestoneIndex, getMilestoneProgress, getMilestoneLabel } from "@shared/shipping";

const milestoneIcons: Record<string, any> = {
  order_confirmed: CheckCircle,
  packaging: Package,
  shipped: Truck,
  in_transit: Globe,
  customs_clearance: FileCheck,
  local_hub: Warehouse,
  out_for_delivery: Truck,
  delivered: PackageCheck,
};

export default function PublicTracking() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingNumber.trim()) return;
    setIsLoading(true);
    setError(null);
    setTrackingData(null);

    try {
      const res = await fetch(`/api/logistics/public/track/${trackingNumber.trim()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Tracking number not found");
      } else {
        setTrackingData(data.data);
      }
    } catch {
      setError("Failed to look up tracking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentMilestoneIdx = trackingData ? getMilestoneIndex(trackingData.status) : -1;
  const progress = trackingData ? getMilestoneProgress(trackingData.status) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-back-home">
              <ArrowLeft className="h-4 w-4 mr-1" /> Home
            </Button>
          </Link>
          <GradientLogo size="sm" />
          <div className="flex-1">
            <h1 className="text-lg font-bold" data-testid="text-tracking-title">Track Your Shipment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-3">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Ghani Africa Shipment Tracking</CardTitle>
            <CardDescription>Enter your tracking number to see real-time shipment updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 max-w-lg mx-auto">
              <Input
                placeholder="Enter tracking number (e.g. PAIDM...)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-lg h-12"
                data-testid="input-tracking-number"
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading || !trackingNumber.trim()}
                className="h-12 px-6"
                data-testid="button-track"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5 mr-1" />}
                Track
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">Not Found</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {trackingData && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipment Status
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Tracking: <code className="font-mono" data-testid="text-result-tracking">{trackingData.trackingNumber}</code>
                      {trackingData.courierName && ` | Courier: ${trackingData.courierName}`}
                    </CardDescription>
                  </div>
                  <Badge className="text-sm px-3 py-1" data-testid="text-result-status">
                    {getMilestoneLabel(trackingData.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Delivery Progress</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                      data-testid="progress-bar-public"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{trackingData.priority || "Standard"}</p>
                  </div>
                  {trackingData.estimatedDelivery && (
                    <div>
                      <p className="text-muted-foreground">Estimated Delivery</p>
                      <p className="font-medium">{new Date(trackingData.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  )}
                  {trackingData.actualDelivery && (
                    <div>
                      <p className="text-muted-foreground">Delivered On</p>
                      <p className="font-medium text-green-600">{new Date(trackingData.actualDelivery).toLocaleDateString()}</p>
                    </div>
                  )}
                  {trackingData.currentLocation && (
                    <div>
                      <p className="text-muted-foreground">Current Location</p>
                      <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {trackingData.currentLocation}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-0">
                  {SHIPPING_MILESTONES.map((milestone, idx) => {
                    const Icon = milestoneIcons[milestone.key] || Circle;
                    const isCompleted = idx <= currentMilestoneIdx;
                    const isCurrent = idx === currentMilestoneIdx;
                    const matchingEvent = trackingData.events?.find((e: any) => e.status === milestone.key);

                    return (
                      <div key={milestone.key} className="flex items-start gap-4" data-testid={`public-milestone-${milestone.key}`}>
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 border-2 ${
                            isCompleted ? "bg-primary border-primary text-primary-foreground" :
                            isCurrent ? "border-primary text-primary bg-primary/10" :
                            "border-muted-foreground/30 text-muted-foreground/30"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < SHIPPING_MILESTONES.length - 1 && (
                            <div className={`w-0.5 h-8 ${isCompleted ? "bg-primary" : "bg-muted-foreground/20"}`} />
                          )}
                        </div>
                        <div className={`pb-6 ${isCompleted ? "" : "opacity-50"}`}>
                          <p className={`font-medium text-sm ${isCurrent ? "text-primary" : ""}`}>
                            {milestone.label}
                            {isCurrent && <Badge variant="secondary" className="ml-2 text-[10px]">Current</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground">{milestone.description}</p>
                          {matchingEvent?.timestamp && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(matchingEvent.timestamp).toLocaleString()}
                              {matchingEvent.location && ` - ${matchingEvent.location}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {trackingData.events && trackingData.events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-5 w-5" />
                    Detailed Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trackingData.events.map((event: any, idx: number) => (
                      <div key={idx} className="flex gap-3" data-testid={`public-event-${idx}`}>
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                          {idx < trackingData.events.length - 1 && <div className="w-0.5 h-full bg-muted-foreground/20 min-h-[20px]" />}
                        </div>
                        <div className="pb-3">
                          <p className="font-medium text-sm">{event.description || getMilestoneLabel(event.status)}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {event.timestamp && <span>{new Date(event.timestamp).toLocaleString()}</span>}
                            {event.location && (
                              <>
                                <span>-</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-bold mb-1">Ghani Africa Buyer Protection</h3>
                <p className="text-sm text-muted-foreground">
                  All purchases on Ghani Africa are protected by our escrow payment system.
                  Your payment is held securely until you confirm delivery.
                  Shipments are monitored for regular updates, and automatic dispute resolution
                  is triggered if a seller fails to provide timely tracking updates.
                </p>
                <Link href="/trade-assurance">
                  <Button variant="ghost" className="px-0 mt-1" data-testid="link-learn-protection">
                    Learn more about Trade Assurance →
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
