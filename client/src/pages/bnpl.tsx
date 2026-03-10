import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";

export default function BnplPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/bnpl/plans"],
    enabled: !!user,
  });

  const { data: eligibility } = useQuery({
    queryKey: ["/api/bnpl/eligibility"],
    enabled: !!user,
  });

  const payMutation = useMutation({
    mutationFn: (paymentId: number) => apiRequest("POST", `/api/bnpl/payments/${paymentId}/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bnpl/plans"] });
      toast({ title: "Payment recorded", description: "Your installment has been marked as paid" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    defaulted: "bg-red-100 text-red-800",
  };

  const planList = plans?.data || [];
  const elig = eligibility?.data;

  if (isLoading) return <div className="container mx-auto p-6" data-testid="bnpl-loading"><div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}</div></div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="bnpl-page">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-bnpl-title">Buy Now, Pay Later</h1>
          <p className="text-muted-foreground">Split your purchases into easy monthly installments</p>
        </div>
      </div>

      {elig && (
        <Card className="mb-6" data-testid="card-bnpl-eligibility">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Your BNPL Status</h3>
                <p className="text-sm text-muted-foreground">
                  {elig.eligible ? `Eligible for up to $${elig.maxAmount} in BNPL orders` : elig.reason}
                </p>
              </div>
              <Badge className={elig.eligible ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {elig.eligible ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div><div className="text-lg font-bold">{elig.activePlans}</div><div className="text-xs text-muted-foreground">Active Plans</div></div>
              <div><div className="text-lg font-bold">3</div><div className="text-xs text-muted-foreground">Max Plans</div></div>
              <div><div className="text-lg font-bold">${elig.maxAmount}</div><div className="text-xs text-muted-foreground">Available Limit</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <Card><CardContent className="pt-4 text-center"><DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" /><h4 className="font-medium">Choose BNPL at Checkout</h4><p className="text-sm text-muted-foreground">Select "Buy Now, Pay Later" when placing your order</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" /><h4 className="font-medium">Pay in Installments</h4><p className="text-sm text-muted-foreground">Split into 3, 6, or 12 monthly payments with low interest</p></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" /><h4 className="font-medium">Get Your Items Now</h4><p className="text-sm text-muted-foreground">Receive your products immediately while paying over time</p></CardContent></Card>
        </div>
      </div>

      <div className="mb-2 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Payment Plans ({planList.length})</h2>
      </div>

      {planList.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No BNPL plans yet. Choose "Buy Now, Pay Later" at checkout to get started.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {planList.map((plan: any) => (
            <PlanCard key={plan.id} plan={plan} onPay={(id: number) => payMutation.mutate(id)} isPaying={payMutation.isPending} statusColors={statusColors} />
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Interest Rates</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border rounded-lg p-3"><div className="text-xl font-bold text-green-600">3%</div><div className="text-sm">3 months</div></div>
            <div className="border rounded-lg p-3"><div className="text-xl font-bold text-blue-600">4.5%</div><div className="text-sm">6 months</div></div>
            <div className="border rounded-lg p-3"><div className="text-xl font-bold text-orange-600">6%</div><div className="text-sm">12 months</div></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanCard({ plan, onPay, isPaying, statusColors }: any) {
  const { data: details } = useQuery({
    queryKey: ["/api/bnpl/plans", plan.id],
  });

  const payments = details?.data?.payments || [];
  const progress = plan.installments > 0 ? ((plan.paidInstallments || 0) / plan.installments) * 100 : 0;
  const nextPayment = payments.find((p: any) => p.status === "pending");

  return (
    <Card data-testid={`card-bnpl-plan-${plan.id}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold">Plan #{plan.id}</div>
            <div className="text-sm text-muted-foreground">Order #{plan.orderId || "N/A"} | {plan.installments} installments</div>
          </div>
          <Badge className={statusColors[plan.status] || ""}>{plan.status}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
          <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">${plan.totalAmount}</span></div>
          <div><span className="text-muted-foreground">Per Month:</span> <span className="font-medium">${plan.installmentAmount}</span></div>
          <div><span className="text-muted-foreground">Interest:</span> <span className="font-medium">{plan.interestRate}%</span></div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{plan.paidInstallments || 0} of {plan.installments} paid</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {plan.status === "active" && nextPayment && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <div className="text-sm font-medium">Next Payment: ${nextPayment.amount}</div>
              <div className="text-xs text-muted-foreground">Due: {new Date(nextPayment.dueDate).toLocaleDateString()}</div>
            </div>
            <Button size="sm" onClick={() => onPay(nextPayment.id)} disabled={isPaying} data-testid={`button-pay-${nextPayment.id}`}>
              Pay Now
            </Button>
          </div>
        )}

        {plan.status === "completed" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">All installments paid - Plan completed!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
