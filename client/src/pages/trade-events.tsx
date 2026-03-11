import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Tag, Star, Leaf, ShoppingBag, Globe, Church, CreditCard, Megaphone } from "lucide-react";
import type { Product } from "@shared/schema";

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  harvest: { icon: Leaf, color: "bg-green-100 text-green-800", label: "Harvest Season" },
  festival: { icon: ShoppingBag, color: "bg-purple-100 text-purple-800", label: "Festival" },
  trade_fair: { icon: Globe, color: "bg-blue-100 text-blue-800", label: "Trade Fair" },
  religious: { icon: Church, color: "bg-orange-100 text-orange-800", label: "Religious" },
};

export default function TradeEventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({ title: "Payment Successful!", description: "Your product promotion is now active at the trade event." });
      window.history.replaceState({}, "", "/trade-events");
    }
    if (params.get("cancelled") === "true") {
      toast({ title: "Payment Cancelled", description: "Your promotion was not created.", variant: "destructive" });
      window.history.replaceState({}, "", "/trade-events");
    }
  }, []);

  const { data: events, isLoading } = useQuery({ queryKey: ["/api/trade-events"] });
  const eventList = events?.data || [];

  const now = new Date();
  const upcoming = eventList.filter((e: any) => new Date(e.startDate) > now);
  const ongoing = eventList.filter((e: any) => new Date(e.startDate) <= now && new Date(e.endDate) >= now);

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="trade-events-page">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-events-title">Trade Events & Seasonal Calendar</h1>
          <p className="text-muted-foreground">Promote your products during peak seasons, festivals, and trade fairs across Africa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const count = eventList.filter((e: any) => e.type === key).length;
          return (
            <Card key={key}>
              <CardContent className="pt-4 text-center">
                <config.icon className="h-6 w-6 mx-auto mb-1 text-primary" />
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{config.label}s</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ongoing.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Happening Now</h2>
          <div className="space-y-4">
            {ongoing.map((event: any) => <EventCard key={event.id} event={event} isOngoing user={user} />)}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />)}</div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-3">Upcoming Events ({upcoming.length})</h2>
          {upcoming.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No upcoming events</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {upcoming.map((event: any) => <EventCard key={event.id} event={event} user={user} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isOngoing, user }: { event: any; isOngoing?: boolean; user: any }) {
  const { toast } = useToast();
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.trade_fair;
  const Icon = config.icon;
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const daysUntil = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const { data: myProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    queryFn: async () => {
      const response = await fetch(`/api/products?sellerId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!user && showPromoteDialog,
  });

  const promoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/service-checkout/event-promotion", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className={isOngoing ? "border-primary border-2" : ""} data-testid={`event-${event.id}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{event.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={config.color}>{config.label}</Badge>
                  {isOngoing && <Badge className="bg-red-100 text-red-800 animate-pulse">Live Now</Badge>}
                  {!isOngoing && daysUntil > 0 && <Badge variant="outline">{daysUntil} days away</Badge>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium flex items-center gap-1"><Tag className="h-3 w-3" />${event.promotionRate}/promotion</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{start.toLocaleDateString()} - {end.toLocaleDateString()}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(event.countries || []).map((c: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{c}</Badge>
              ))}
            </div>
            {user && (
              <div className="mt-3">
                <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" data-testid={`button-promote-${event.id}`}>
                      <Megaphone className="h-4 w-4 mr-1" /> Promote Product - $25
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Promote at {event.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Feature your product during this event for maximum visibility. Cost: <strong>$25.00</strong></p>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Select Product</label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger data-testid="select-promote-product">
                            <SelectValue placeholder="Choose a product..." />
                          </SelectTrigger>
                          <SelectContent>
                            {myProducts.map((p: any) => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => promoteMutation.mutate({ eventId: event.id.toString(), productId: selectedProductId })}
                        disabled={!selectedProductId || promoteMutation.isPending}
                        data-testid="button-confirm-promote"
                      >
                        <CreditCard className="h-4 w-4 mr-2" /> {promoteMutation.isPending ? "Redirecting to payment..." : "Pay $25 & Promote"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
