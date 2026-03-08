import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { GradientLogo } from "@/components/gradient-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Wallet as WalletIcon, Plus, ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useCurrency } from "@/lib/currency-context";

export default function Wallet() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const isFunded = searchParams.get("funded") === "true";
  const sessionId = searchParams.get("session_id");
  const isCancelled = searchParams.get("cancelled") === "true";

  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showCancelBanner, setShowCancelBanner] = useState(false);
  const completedRef = useRef(false);

  const { data: walletData, isLoading: walletLoading } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/wallets/balance"],
    enabled: !!user,
  });

  const { data: txData, isLoading: txLoading } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/wallets/transactions"],
    enabled: !!user,
  });

  useEffect(() => {
    if (isFunded && sessionId && !completedRef.current) {
      completedRef.current = true;
      (async () => {
        try {
          await apiRequest("POST", "/api/wallets/fund/complete", { sessionId });
          queryClient.invalidateQueries({ queryKey: ["/api/wallets/balance"] });
          queryClient.invalidateQueries({ queryKey: ["/api/wallets/transactions"] });
          setShowSuccessBanner(true);
          setTimeout(() => setShowSuccessBanner(false), 10000);
        } catch (error) {
          console.error("Failed to complete funding:", error);
        }
      })();
    }
    if (isCancelled) {
      setShowCancelBanner(true);
      setTimeout(() => setShowCancelBanner(false), 8000);
    }
  }, [isFunded, sessionId, isCancelled]);

  const fundMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/wallets/fund", { amount });
      return await response.json();
    },
    onSuccess: (data: { url: string }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to start funding", variant: "destructive" });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; method: string; destination: string }) => {
      const response = await apiRequest("POST", "/api/wallets/withdraw", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets/transactions"] });
      toast({ title: "Success", description: "Withdrawal request submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to process withdrawal", variant: "destructive" });
    },
  });

  const wallet = walletData?.data;
  const transactions = txData?.data || [];
  const walletBalance = wallet ? parseFloat(wallet.balance || '0') : 0;

  const totalIn = transactions
    .filter((t: any) => t.type === 'deposit' || t.type === 'credit' || t.type === 'sale')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);

  const totalOut = transactions
    .filter((t: any) => t.type === 'withdrawal' || t.type === 'debit' || t.type === 'purchase')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <WalletIcon className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("wallet.balance")}</h2>
        <p className="text-muted-foreground text-center">Please log in to view your wallet</p>
        <Link href="/dashboard">
          <a className="text-primary hover:underline">{t("welcome.login")}</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold">{t("nav.wallet")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        {showSuccessBanner && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">Funds Added Successfully!</p>
                <p className="text-sm text-green-600 dark:text-green-400">Your wallet has been topped up via Stripe.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {showCancelBanner && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="font-medium text-amber-800 dark:text-amber-200">Payment cancelled. No funds were added.</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/80">{t("wallet.balance")}</CardDescription>
            <CardTitle className="text-4xl font-bold" data-testid="text-wallet-balance">
              {walletLoading ? (
                <Skeleton className="h-10 w-40 bg-primary-foreground/20" />
              ) : (
                formatPrice(walletBalance)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                data-testid="button-add-funds"
                onClick={() => setShowFundDialog(true)}
              >
                <Plus className="h-4 w-4" />
                {t("wallet.addFunds")}
              </Button>
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                data-testid="button-withdraw"
                disabled={walletBalance <= 0}
                onClick={() => {
                  toast({ title: "Withdrawals", description: "Withdrawal requests are processed within 2-3 business days. Contact support for assistance." });
                }}
              >
                <ArrowUpRight className="h-4 w-4" />
                {t("wallet.withdraw")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">{t("wallet.transactions")}</h2>
          
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("common.noResults")}</p>
                <p className="text-sm text-muted-foreground mt-1">Your transactions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isCredit = tx.type === 'deposit' || tx.type === 'credit' || tx.type === 'sale';
                const amount = parseFloat(tx.amount || '0');
                return (
                  <Card key={tx.id} data-testid={`card-transaction-${tx.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${isCredit ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"}`}>
                          {isCredit ? (
                            <ArrowDownLeft className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tx.description || tx.referenceType || tx.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                        <div className={`font-semibold ${isCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {isCredit ? "+" : "-"}{formatPrice(amount, false)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-950">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total In</p>
                  <p className="font-semibold" data-testid="text-total-in">{formatPrice(totalIn)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-950">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Out</p>
                  <p className="font-semibold" data-testid="text-total-out">{formatPrice(totalOut)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Funds to Wallet
            </DialogTitle>
            <DialogDescription>
              Enter the amount you'd like to add. You'll be redirected to Stripe for secure payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fund-amount">Amount (USD)</Label>
              <Input
                id="fund-amount"
                type="number"
                min="1"
                max="10000"
                step="0.01"
                placeholder="Enter amount (e.g., 50.00)"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                data-testid="input-fund-amount"
              />
            </div>
            <div className="flex gap-2">
              {[10, 25, 50, 100, 500].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setFundAmount(preset.toString())}
                  data-testid={`button-preset-${preset}`}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const amount = parseFloat(fundAmount);
                if (!amount || amount < 1 || amount > 10000) {
                  toast({ title: "Invalid Amount", description: "Please enter an amount between $1 and $10,000", variant: "destructive" });
                  return;
                }
                fundMutation.mutate(amount);
              }}
              disabled={fundMutation.isPending}
              data-testid="button-confirm-fund"
            >
              {fundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Stripe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
