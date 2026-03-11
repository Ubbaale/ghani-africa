import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Plus, Receipt, Package, Globe, File, CreditCard } from "lucide-react";

const DOC_TYPES = [
  { value: "commercial_invoice", label: "Commercial Invoice", icon: Receipt, fee: "$3.00", desc: "Official invoice for customs declaration" },
  { value: "packing_list", label: "Packing List", icon: Package, fee: "$2.00", desc: "Detailed list of shipped items" },
  { value: "certificate_of_origin", label: "Certificate of Origin", icon: Globe, fee: "$5.00", desc: "Proves where goods were manufactured" },
  { value: "proforma_invoice", label: "Proforma Invoice", icon: File, fee: "$2.50", desc: "Preliminary invoice before shipment" },
];

export default function TradeDocumentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("");
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({ title: "Payment Successful!", description: "Your trade document has been generated and is ready for download." });
      window.history.replaceState({}, "", "/trade-documents");
    }
    if (params.get("cancelled") === "true") {
      toast({ title: "Payment Cancelled", description: "Document was not generated.", variant: "destructive" });
      window.history.replaceState({}, "", "/trade-documents");
    }
  }, []);

  const { data: docs, isLoading: docsLoading } = useQuery({
    queryKey: ["/api/trade-documents/order", orderId],
    queryFn: () => fetch(`/api/trade-documents/order/${orderId}`).then(r => r.json()),
    enabled: !!orderId && parseInt(orderId) > 0,
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { orderId: string; type: string }) => {
      const res = await apiRequest("POST", "/api/service-checkout/trade-document", data);
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

  const documents = docs?.data || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="trade-documents-page">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-trade-docs-title">Trade Document Generator</h1>
          <p className="text-muted-foreground">Generate official trade documents for your orders - save time and money on paperwork</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {DOC_TYPES.map((dt) => (
          <Card key={dt.value} className="cursor-pointer hover:border-primary transition-colors" data-testid={`card-doc-type-${dt.value}`}>
            <CardContent className="pt-4 text-center">
              <dt.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h4 className="font-medium text-sm">{dt.label}</h4>
              <p className="text-xs text-muted-foreground mt-1">{dt.desc}</p>
              <Badge variant="secondary" className="mt-2">{dt.fee}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6" data-testid="card-generate-doc">
        <CardHeader><CardTitle className="text-base">Generate New Document</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Order ID</label>
              <Input placeholder="Enter your order number" value={orderId} onChange={(e) => setOrderId(e.target.value)} data-testid="input-order-id" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Document Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-doc-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>{dt.label} ({dt.fee})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => generateMutation.mutate({ orderId, type: selectedType })} disabled={!orderId || !selectedType || generateMutation.isPending} data-testid="button-generate-doc">
              <CreditCard className="h-4 w-4 mr-2" /> {generateMutation.isPending ? "Redirecting to payment..." : `Pay & Generate (${DOC_TYPES.find(d => d.value === selectedType)?.fee || "$3.00"})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {orderId && parseInt(orderId) > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Documents for Order #{orderId}</h2>
          {docsLoading ? (
            <div className="animate-pulse space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-gray-200 rounded" />)}</div>
          ) : documents.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No documents generated for this order yet</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <Card key={doc.id} data-testid={`card-doc-${doc.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">{DOC_TYPES.find(d => d.value === doc.type)?.label || doc.type}</div>
                          <div className="text-sm text-muted-foreground">Doc #{doc.documentNumber} | Fee: ${doc.fee}</div>
                          <div className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{doc.status}</Badge>
                        <Button variant="outline" size="sm" data-testid={`button-view-doc-${doc.id}`}>
                          <Download className="h-4 w-4 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
