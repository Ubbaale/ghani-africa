import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Award, Star, CheckCircle, Clock, XCircle } from "lucide-react";

const TIERS = [
  { value: "basic", label: "Basic Verification", fee: "$5", benefits: ["Verified Buyer badge", "Access to verified-only products", "Priority support"] },
  { value: "verified", label: "Verified Buyer", fee: "$10", benefits: ["All Basic benefits", "Wholesale pricing access", "Extended BNPL limits", "Direct seller contact"] },
  { value: "premium", label: "Premium Buyer", fee: "$15", benefits: ["All Verified benefits", "Priority order fulfillment", "Dedicated account manager", "Exclusive deals access"] },
];

export default function BuyerVerificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [selectedTier, setSelectedTier] = useState("verified");

  const { data: verification, isLoading } = useQuery({
    queryKey: ["/api/buyer-verification"],
    enabled: !!user,
  });

  const applyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/buyer-verification/apply", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buyer-verification"] });
      toast({ title: "Application Submitted", description: "Your verification is under review" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const v = verification?.data;
  const statusIcons: Record<string, any> = { pending: Clock, approved: CheckCircle, rejected: XCircle };
  const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" };

  if (isLoading) return <div className="container mx-auto p-6"><div className="animate-pulse h-64 bg-gray-200 rounded-lg" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-3xl" data-testid="buyer-verification-page">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-verification-title">Verified Buyer Program</h1>
          <p className="text-muted-foreground">Get verified to unlock wholesale pricing, extended BNPL limits, and seller trust</p>
        </div>
      </div>

      {v ? (
        <Card data-testid="card-verification-status">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              {v.status === "approved" ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full">
                  <Award className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <div className="font-bold text-green-800">Verified Buyer</div>
                    <div className="text-sm text-green-600">Level: {v.verificationLevel}</div>
                  </div>
                </div>
              ) : (
                <Badge className={`text-lg px-4 py-2 ${statusColors[v.status]}`}>
                  {v.status === "pending" ? "Under Review" : "Rejected"}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Business Name:</span> <span className="font-medium">{v.businessName || "N/A"}</span></div>
              <div><span className="text-muted-foreground">Reg Number:</span> <span className="font-medium">{v.businessRegNumber || "N/A"}</span></div>
              <div><span className="text-muted-foreground">Level:</span> <span className="font-medium capitalize">{v.verificationLevel}</span></div>
              <div><span className="text-muted-foreground">Fee:</span> <span className="font-medium">${v.fee}</span></div>
              <div><span className="text-muted-foreground">Applied:</span> <span className="font-medium">{new Date(v.createdAt).toLocaleDateString()}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[v.status]}>{v.status}</Badge></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {TIERS.map((tier) => (
              <Card key={tier.value} className={`cursor-pointer transition-all ${selectedTier === tier.value ? 'border-primary ring-2 ring-primary/20' : ''}`} onClick={() => setSelectedTier(tier.value)} data-testid={`tier-${tier.value}`}>
                <CardContent className="pt-4">
                  <div className="text-center mb-3">
                    <Star className={`h-8 w-8 mx-auto mb-1 ${selectedTier === tier.value ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                    <h3 className="font-semibold">{tier.label}</h3>
                    <div className="text-2xl font-bold text-primary">{tier.fee}</div>
                    <div className="text-xs text-muted-foreground">one-time fee</div>
                  </div>
                  <ul className="space-y-1">
                    {tier.benefits.map((b, i) => (
                      <li key={i} className="text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />{b}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card data-testid="card-apply-form">
            <CardHeader><CardTitle className="text-base">Apply for Verification</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Business Name</label>
                <Input placeholder="Your business or company name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} data-testid="input-business-name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Business Reg Number</label>
                  <Input placeholder="Registration number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} data-testid="input-reg-number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tax ID (Optional)</label>
                  <Input placeholder="Tax identification number" value={taxId} onChange={(e) => setTaxId(e.target.value)} data-testid="input-tax-id" />
                </div>
              </div>
              <Button className="w-full" onClick={() => applyMutation.mutate({ businessName, businessRegNumber: regNumber, taxId, verificationLevel: selectedTier })} disabled={!businessName || applyMutation.isPending} data-testid="button-apply-verification">
                <ShieldCheck className="h-4 w-4 mr-2" /> Apply for {TIERS.find(t => t.value === selectedTier)?.label} - {TIERS.find(t => t.value === selectedTier)?.fee}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
