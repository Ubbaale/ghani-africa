import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Bell, BellOff, Leaf, Gem, DollarSign, MapPin } from "lucide-react";

const CATEGORY_ICONS: Record<string, any> = { Agriculture: Leaf, Minerals: Gem };

export default function CommodityPricesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alertCommodity, setAlertCommodity] = useState("");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState("below");

  const { data: commodities, isLoading } = useQuery({ queryKey: ["/api/commodities"] });
  const { data: alerts } = useQuery({ queryKey: ["/api/price-alerts"], enabled: !!user });

  const createAlertMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/price-alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
      toast({ title: "Alert Created", description: "You'll be notified when the price changes" });
      setAlertCommodity("");
      setAlertPrice("");
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/price-alerts/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] }); },
  });

  const prices = commodities?.data || [];
  const alertList = alerts?.data || [];
  const categories = [...new Set(prices.map((p: any) => p.category))];
  const [filterCat, setFilterCat] = useState("all");
  const filtered = filterCat === "all" ? prices : prices.filter((p: any) => p.category === filterCat);

  return (
    <div className="container mx-auto p-6 max-w-5xl" data-testid="commodity-prices-page">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-commodity-title">African Commodity Prices</h1>
          <p className="text-muted-foreground">Track real-time prices for key African commodities and raw materials</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant={filterCat === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCat("all")} data-testid="filter-all">All</Button>
        {categories.map((cat: string) => (
          <Button key={cat} variant={filterCat === cat ? "default" : "outline"} size="sm" onClick={() => setFilterCat(cat)} data-testid={`filter-${cat}`}>{cat}</Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filtered.map((commodity: any) => {
            const Icon = CATEGORY_ICONS[commodity.category] || DollarSign;
            return (
              <Card key={commodity.id} className="hover:shadow-md transition-shadow" data-testid={`card-commodity-${commodity.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{commodity.commodity}</h3>
                        <Badge variant="secondary" className="text-xs">{commodity.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold">${parseFloat(commodity.price).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">per {commodity.unit}</div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{commodity.country}</span>
                    <span>{commodity.source}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {user && (
        <>
          <Card className="mb-6" data-testid="card-create-alert">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Set Price Alert</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Commodity</label>
                  <Select value={alertCommodity} onValueChange={setAlertCommodity}>
                    <SelectTrigger data-testid="select-alert-commodity"><SelectValue placeholder="Select commodity" /></SelectTrigger>
                    <SelectContent>{prices.map((p: any) => <SelectItem key={p.id} value={p.commodity}>{p.commodity}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <label className="text-sm font-medium mb-1 block">Direction</label>
                  <Select value={alertDirection} onValueChange={setAlertDirection}>
                    <SelectTrigger data-testid="select-alert-direction"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below">Below</SelectItem>
                      <SelectItem value="above">Above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <label className="text-sm font-medium mb-1 block">Target Price ($)</label>
                  <Input type="number" placeholder="0.00" value={alertPrice} onChange={(e) => setAlertPrice(e.target.value)} data-testid="input-alert-price" />
                </div>
                <Button onClick={() => createAlertMutation.mutate({ commodity: alertCommodity, targetPrice: parseFloat(alertPrice), direction: alertDirection })} disabled={!alertCommodity || !alertPrice} data-testid="button-create-alert">Set Alert</Button>
              </div>
            </CardContent>
          </Card>

          {alertList.length > 0 && (
            <Card data-testid="card-alerts-list">
              <CardHeader><CardTitle className="text-base">Your Alerts ({alertList.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertList.map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`alert-${alert.id}`}>
                      <div>
                        <span className="font-medium">{alert.commodity}</span>
                        <span className="text-sm text-muted-foreground ml-2">{alert.direction} ${parseFloat(alert.targetPrice).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={alert.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{alert.isActive ? "Active" : "Triggered"}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => deleteAlertMutation.mutate(alert.id)} data-testid={`delete-alert-${alert.id}`}><BellOff className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
