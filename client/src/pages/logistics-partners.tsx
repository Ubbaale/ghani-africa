import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Globe, DollarSign, Clock, Package } from "lucide-react";

export default function LogisticsPartnersPage() {
  const { data: partners, isLoading } = useQuery({ queryKey: ["/api/logistics-partners"] });

  const partnerList = partners?.data || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="logistics-partners-page">
      <div className="flex items-center gap-3 mb-6">
        <Truck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-logistics-title">Logistics Partners</h1>
          <p className="text-muted-foreground">Trusted shipping partners across Africa - book directly and track your shipments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center"><Package className="h-8 w-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{partnerList.length}</div><div className="text-sm text-muted-foreground">Shipping Partners</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Globe className="h-8 w-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">20+</div><div className="text-sm text-muted-foreground">African Countries</div></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">5-10%</div><div className="text-sm text-muted-foreground">Commission per Booking</div></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="space-y-4">
          {partnerList.map((partner: any) => (
            <Card key={partner.id} className="hover:shadow-md transition-shadow" data-testid={`card-partner-${partner.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{partner.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(partner.services || []).map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Base Rate</div>
                    <div className="font-medium">${partner.baseRate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" />Per Kg</div>
                    <div className="font-medium">${partner.ratePerKg}/kg</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Delivery</div>
                    <div className="font-medium">{partner.estimatedDays} days</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Commission</div>
                    <div className="font-medium">{partner.commissionRate}%</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm text-muted-foreground mb-1">Countries Served</div>
                  <div className="flex flex-wrap gap-1">
                    {(partner.countries || []).map((c: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
