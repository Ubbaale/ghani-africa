import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Copy, Share2, Users, Gift, TrendingUp, MessageCircle, Loader2 } from "lucide-react";

export default function ReferralsPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: codeData, isLoading: codeLoading } = useQuery({
    queryKey: ["/api/referrals/my-code"],
    enabled: !!user,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/referrals/stats"],
    enabled: !!user,
  });

  const referralCode = codeData?.code;
  const stats = statsData?.stats;
  const referralsList = statsData?.referrals || [];
  const baseUrl = window.location.origin;
  const referralLink = referralCode ? `${baseUrl}?ref=${referralCode}` : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!` });
  };

  const shareOnWhatsApp = () => {
    const message = `Join me on Ghani Africa - Africa's #1 marketplace!\n\nSign up with my referral link and we both earn rewards:\n${referralLink}\n\nGhani Africa connects buyers and sellers across all 54 African countries with secure payments, mobile money, and wholesale pricing.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareOnTwitter = () => {
    const text = `Join Ghani Africa - Africa's leading digital marketplace! Sign up with my referral link: ${referralLink} #GhaniAfrica #AfricanTrade`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Referral Program</h1>
        <p className="text-muted-foreground">Please log in to access your referral dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <Gift className="h-10 w-10 mx-auto mb-3 text-primary" />
        <h1 className="text-3xl font-bold" data-testid="text-referral-title">Refer & Earn</h1>
        <p className="text-muted-foreground mt-2">Invite friends and business contacts to Ghani Africa and earn rewards when they join!</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-3xl font-bold" data-testid="text-total-referrals">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground">Total Invites</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-3xl font-bold" data-testid="text-converted-referrals">{stats?.converted || 0}</div>
            <div className="text-sm text-muted-foreground">Signed Up</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <div className="text-3xl font-bold" data-testid="text-total-earnings">${stats?.totalEarnings || "0.00"}</div>
            <div className="text-sm text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with anyone. When they sign up, you both benefit!</CardDescription>
        </CardHeader>
        <CardContent>
          {codeLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm break-all" data-testid="text-referral-link">
                  {referralLink || "Generating..."}
                </div>
                <Button
                  onClick={() => copyToClipboard(referralLink, "Referral link")}
                  disabled={!referralLink}
                  data-testid="button-copy-referral-link"
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-primary/10 rounded-lg px-4 py-2 text-center">
                  <span className="text-xs text-muted-foreground">Your Code: </span>
                  <span className="font-bold text-lg tracking-wider" data-testid="text-referral-code">{referralCode || "..."}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(referralCode || "", "Referral code")}
                  disabled={!referralCode}
                  data-testid="button-copy-referral-code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={shareOnWhatsApp} className="bg-green-600 hover:bg-green-700" data-testid="button-share-whatsapp">
                  <MessageCircle className="h-4 w-4 mr-1" /> Share on WhatsApp
                </Button>
                <Button onClick={shareOnFacebook} className="bg-blue-600 hover:bg-blue-700" data-testid="button-share-facebook">
                  Share on Facebook
                </Button>
                <Button onClick={shareOnTwitter} className="bg-gray-800 hover:bg-gray-900" data-testid="button-share-twitter">
                  Share on X
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-1">Share Your Link</h4>
              <p className="text-sm text-muted-foreground">Copy your unique referral link and share it with friends, family, and business contacts</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-1">They Sign Up</h4>
              <p className="text-sm text-muted-foreground">When someone signs up using your link, they get a welcome bonus and you get credit</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-1">Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">When your referral makes their first purchase, you earn a reward!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {referralsList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>Track the status of people you've invited</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referralsList.filter((r: any) => r.referredEmail || r.referredUserId).map((ref: any) => (
                <div key={ref.id} className="flex items-center justify-between border rounded-lg p-3" data-testid={`referral-${ref.id}`}>
                  <div>
                    <div className="font-medium">{ref.referredEmail || "Anonymous User"}</div>
                    <div className="text-xs text-muted-foreground">
                      Invited: {new Date(ref.createdAt).toLocaleDateString()}
                      {ref.convertedAt && ` | Converted: ${new Date(ref.convertedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Badge variant={
                    ref.status === "rewarded" ? "default" :
                    ref.status === "first_purchase" ? "default" :
                    ref.status === "signed_up" ? "secondary" : "outline"
                  }>
                    {ref.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
