import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wheat, Plus, Gavel, ShoppingCart, MapPin, Star, Clock, ArrowUp, Timer } from "lucide-react";

const CROPS = ["Cocoa", "Coffee", "Cashew Nuts", "Cotton", "Maize", "Rice", "Sorghum", "Tea", "Vanilla", "Sesame", "Groundnuts", "Palm Oil", "Cassava", "Yam", "Plantain", "Millet", "Shea Nuts", "Tobacco", "Sugar Cane", "Wheat"];
const UNITS = ["kg", "metric ton", "bags (50kg)", "bags (100kg)", "bushels", "litres"];
const GRADES = [{ value: "A", label: "Grade A - Premium" }, { value: "B", label: "Grade B - Standard" }, { value: "C", label: "Grade C - Economy" }];

export default function AgriExchangePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidQty, setBidQty] = useState("");
  const [bidMsg, setBidMsg] = useState("");
  const [form, setForm] = useState({ cropType: "", variety: "", quantity: "", unit: "kg", pricePerUnit: "", qualityGrade: "B", location: "", isAuction: false });

  const { data: listings, isLoading } = useQuery({ queryKey: ["/api/agri-exchange"] });
  const { data: listingDetail } = useQuery({
    queryKey: ["/api/agri-exchange", selectedListing],
    queryFn: () => fetch(`/api/agri-exchange/${selectedListing}`).then(r => r.json()),
    enabled: !!selectedListing,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/agri-exchange", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agri-exchange"] }); toast({ title: "Listing Created" }); setShowCreateDialog(false); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const bidMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/agri-exchange/${selectedListing}/bid`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/agri-exchange", selectedListing] }); toast({ title: "Bid Submitted" }); setBidAmount(""); setBidMsg(""); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const listingList = listings?.data || [];
  const gradeColors: Record<string, string> = { A: "bg-green-100 text-green-800", B: "bg-blue-100 text-blue-800", C: "bg-yellow-100 text-yellow-800" };

  if (selectedListing && listingDetail?.data) {
    const { listing, bids } = listingDetail.data;
    return (
      <div className="container mx-auto p-6 max-w-3xl" data-testid="agri-listing-detail">
        <Button variant="ghost" className="mb-4" onClick={() => setSelectedListing(null)} data-testid="button-back-agri">Back to Exchange</Button>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-listing-crop">{listing.cropType}</h1>
                {listing.variety && <p className="text-muted-foreground">{listing.variety}</p>}
              </div>
              <div className="flex gap-2">
                <Badge className={gradeColors[listing.qualityGrade] || ""}>{listing.qualityGrade}</Badge>
                {listing.isAuction && <Badge className="bg-orange-100 text-orange-800"><Gavel className="h-3 w-3 mr-1" />Auction</Badge>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div><div className="text-sm text-muted-foreground">Price</div><div className="text-lg font-bold">${parseFloat(listing.pricePerUnit).toFixed(2)}/{listing.unit}</div></div>
              <div><div className="text-sm text-muted-foreground">Quantity</div><div className="text-lg font-bold">{parseFloat(listing.quantity).toLocaleString()} {listing.unit}</div></div>
              <div><div className="text-sm text-muted-foreground">Total Value</div><div className="text-lg font-bold">${(parseFloat(listing.quantity) * parseFloat(listing.pricePerUnit)).toLocaleString()}</div></div>
              <div><div className="text-sm text-muted-foreground">Min Order</div><div className="text-lg font-bold">{listing.minOrderQty} {listing.unit}</div></div>
            </div>
            {listing.location && <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2"><MapPin className="h-3 w-3" />{listing.location}</div>}
            {listing.isAuction && listing.currentBid && (
              <div className="p-3 bg-orange-50 rounded-lg mb-4"><div className="font-semibold">Current Bid: ${parseFloat(listing.currentBid).toFixed(2)}</div>
                {listing.auctionEndDate && <div className="text-sm text-muted-foreground"><Timer className="h-3 w-3 inline mr-1" />Ends: {new Date(listing.auctionEndDate).toLocaleString()}</div>}
              </div>
            )}
          </CardContent>
        </Card>

        <h3 className="font-semibold mb-3">Bids ({bids.length})</h3>
        <div className="space-y-2 mb-6">
          {bids.map((bid: any) => (
            <Card key={bid.id} data-testid={`bid-${bid.id}`}>
              <CardContent className="py-3">
                <div className="flex justify-between items-center">
                  <div><span className="font-medium">${parseFloat(bid.amount).toFixed(2)}</span>{bid.quantity && <span className="text-sm text-muted-foreground ml-2">for {bid.quantity} units</span>}</div>
                  <Badge variant="outline">{bid.status}</Badge>
                </div>
                {bid.message && <p className="text-sm text-muted-foreground mt-1">{bid.message}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {user && (
          <Card>
            <CardHeader><CardTitle className="text-base">Place a Bid</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1 block">Your Bid ($/{listing.unit})</label>
                  <Input type="number" placeholder="0.00" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} data-testid="input-bid-amount" /></div>
                <div><label className="text-sm font-medium mb-1 block">Quantity ({listing.unit})</label>
                  <Input type="number" placeholder="Optional" value={bidQty} onChange={(e) => setBidQty(e.target.value)} data-testid="input-bid-qty" /></div>
              </div>
              <Textarea placeholder="Message to seller (optional)" value={bidMsg} onChange={(e) => setBidMsg(e.target.value)} data-testid="input-bid-message" />
              <Button className="w-full" onClick={() => bidMutation.mutate({ amount: parseFloat(bidAmount), quantity: bidQty ? parseFloat(bidQty) : undefined, message: bidMsg })} disabled={!bidAmount || bidMutation.isPending} data-testid="button-submit-bid">
                <ArrowUp className="h-4 w-4 mr-2" /> Submit Bid
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="agri-exchange-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Wheat className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-agri-title">Agricultural Exchange</h1>
            <p className="text-muted-foreground">Buy and sell African agricultural commodities with quality grading and auctions</p>
          </div>
        </div>
        {user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild><Button data-testid="button-create-listing"><Plus className="h-4 w-4 mr-2" /> List Produce</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>List Agricultural Produce</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Select value={form.cropType} onValueChange={(v) => setForm({...form, cropType: v})}>
                  <SelectTrigger data-testid="select-crop"><SelectValue placeholder="Select crop" /></SelectTrigger>
                  <SelectContent>{CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Variety (e.g., Arabica, Robusta)" value={form.variety} onChange={(e) => setForm({...form, variety: e.target.value})} data-testid="input-variety" />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} data-testid="input-quantity" />
                  <Select value={form.unit} onValueChange={(v) => setForm({...form, unit: v})}>
                    <SelectTrigger data-testid="select-unit"><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Price per unit ($)" value={form.pricePerUnit} onChange={(e) => setForm({...form, pricePerUnit: e.target.value})} data-testid="input-price" />
                  <Select value={form.qualityGrade} onValueChange={(v) => setForm({...form, qualityGrade: v})}>
                    <SelectTrigger data-testid="select-grade"><SelectValue /></SelectTrigger>
                    <SelectContent>{GRADES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input placeholder="Location (e.g., Kumasi, Ghana)" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} data-testid="input-location" />
                <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.cropType || !form.quantity || !form.pricePerUnit || createMutation.isPending} data-testid="button-submit-listing">
                  <Wheat className="h-4 w-4 mr-2" /> Create Listing
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />)}</div>
      ) : listingList.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wheat className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No agricultural listings yet. Be the first to list your produce!</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listingList.map((listing: any) => (
            <Card key={listing.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedListing(listing.id)} data-testid={`card-agri-${listing.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{listing.cropType}</h3>
                    {listing.variety && <p className="text-sm text-muted-foreground">{listing.variety}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Badge className={gradeColors[listing.qualityGrade] || ""}>{listing.qualityGrade}</Badge>
                    {listing.isAuction && <Badge className="bg-orange-100 text-orange-800"><Gavel className="h-3 w-3" /></Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Price:</span> <span className="font-medium">${parseFloat(listing.pricePerUnit).toFixed(2)}/{listing.unit}</span></div>
                  <div><span className="text-muted-foreground">Qty:</span> <span className="font-medium">{parseFloat(listing.quantity).toLocaleString()} {listing.unit}</span></div>
                </div>
                {listing.location && <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</div>}
                {listing.isAuction && listing.currentBid && <div className="text-sm mt-2 text-orange-600 font-medium">Current Bid: ${parseFloat(listing.currentBid).toFixed(2)}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
