import { useAuth } from "@/hooks/use-auth";
import { Link, useParams, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency-context";
import type { Product, UserProfile, GroupBuy, GroupBuyParticipant } from "@shared/schema";
import {
  ArrowLeft,
  Users,
  Clock,
  Package,
  Share2,
  Copy,
  Check,
  ShoppingCart,
  AlertCircle,
  UserPlus,
  Crown,
} from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX } from "react-icons/si";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect } from "react";

type GroupBuyWithDetails = GroupBuy & {
  product: Product;
  organizer: UserProfile | null;
  participants: (GroupBuyParticipant & { user: UserProfile | null })[];
};

function ShareGroupBuyPopover({ groupBuy }: { groupBuy: GroupBuyWithDetails }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const groupBuyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/group-buy/${groupBuy.id}`
    : `/group-buy/${groupBuy.id}`;
  const shareText = `Join our group buy for ${groupBuy.product.name} and save! Only ${groupBuy.targetQty - groupBuy.currentQty} units left to reach the target.`;
  const encodedUrl = encodeURIComponent(groupBuyUrl);
  const encodedText = encodeURIComponent(shareText);

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(groupBuyUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openShare = (url: string) => {
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-share-group-buy">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <p className="font-medium text-sm">Share this group buy</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={groupBuyUrl}
              className="flex-1 px-2 py-1 text-xs border rounded-md bg-muted"
            />
            <Button size="sm" variant="ghost" onClick={copyLink} data-testid="button-copy-group-buy-link">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://wa.me/?text=${encodedText}%20${encodedUrl}`)}
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
              data-testid="button-share-facebook"
            >
              <SiFacebook className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`)}
              data-testid="button-share-twitter"
            >
              <SiX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeRemaining({ expiresAt }: { expiresAt: string | Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
}

export default function GroupBuyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const [, navigate] = useLocation();
  const [joinQty, setJoinQty] = useState(1);

  const { data: groupBuy, isLoading } = useQuery<GroupBuyWithDetails>({
    queryKey: ["/api/group-buys", id],
    queryFn: async () => {
      const response = await fetch(`/api/group-buys/${id}`);
      if (!response.ok) throw new Error("Failed to fetch group buy");
      return response.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/group-buys/${id}/join`, { quantity: joinQty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-buys", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/group-buys/my"] });
      toast({ title: "Joined Group Buy", description: `You've committed ${joinQty} unit(s) to this group buy.` });
    },
    onError: (err: any) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const msg = err?.message || "Failed to join group buy";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/group-buys/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-buys", id] });
      toast({ title: "Group Buy Cancelled" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel group buy", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <GradientLogo size="sm" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!groupBuy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Group Buy Not Found</h2>
          <Link href="/browse">
            <Button data-testid="button-browse-products">Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.min(100, Math.round((groupBuy.currentQty / groupBuy.targetQty) * 100));
  const unitsRemaining = Math.max(0, groupBuy.targetQty - groupBuy.currentQty);
  const isExpired = new Date(groupBuy.expiresAt) < new Date();
  const isOpen = groupBuy.status === "open" && !isExpired;
  const isFilled = groupBuy.status === "filled";
  const isCancelled = groupBuy.status === "cancelled";
  const isOrganizer = user?.id === groupBuy.organizerId;
  const hasJoined = groupBuy.participants.some(p => p.userId === user?.id);
  const productImages = groupBuy.product.images || [];
  const basePrice = Number(groupBuy.product.price);
  const groupPrice = Number(groupBuy.pricePerUnit);
  const savingsPercent = basePrice > 0 ? Math.round((1 - groupPrice / basePrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <GradientLogo size="sm" />
          </div>
          <ShareGroupBuyPopover groupBuy={groupBuy} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start gap-4">
          <Link href={`/products/${groupBuy.product.id}`}>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {productImages.length > 0 ? (
                <img src={productImages[0]} alt={groupBuy.product.name} className="w-full h-full object-cover" data-testid="img-group-buy-product" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant={isFilled ? "default" : isCancelled || isExpired ? "destructive" : "secondary"}
                data-testid="badge-group-buy-status"
              >
                {isFilled ? "Target Reached" : isCancelled ? "Cancelled" : isExpired ? "Expired" : "Open"}
              </Badge>
              {savingsPercent > 0 && (
                <Badge variant="outline" className="text-primary border-primary" data-testid="badge-savings">
                  Save {savingsPercent}%
                </Badge>
              )}
            </div>
            <Link href={`/products/${groupBuy.product.id}`}>
              <h1 className="text-lg md:text-xl font-bold hover:underline cursor-pointer" data-testid="text-group-buy-product-name">
                {groupBuy.product.name}
              </h1>
            </Link>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <TimeRemaining expiresAt={groupBuy.expiresAt} />
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {groupBuy.participants.length} participant{groupBuy.participants.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <Card data-testid="card-group-buy-progress">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground" data-testid="text-progress-units">
                {groupBuy.currentQty} / {groupBuy.targetQty} units
              </span>
            </div>
            <Progress value={progressPercent} className="h-3 mb-2" data-testid="progress-bar" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-primary" data-testid="text-progress-percent">{progressPercent}% filled</span>
              {isOpen && (
                <span className="text-muted-foreground">{unitsRemaining} units to go</span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card data-testid="card-pricing">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Pricing
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Regular Price</span>
                  <span className="text-sm line-through text-muted-foreground" data-testid="text-regular-price">
                    {formatPrice(basePrice, true, groupBuy.product.currency || "USD")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Group Buy Price</span>
                  <span className="text-lg font-bold text-primary" data-testid="text-group-price">
                    {formatPrice(groupPrice, true, groupBuy.product.currency || "USD")}
                  </span>
                </div>
                {savingsPercent > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">You Save</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatPrice(basePrice - groupPrice, true, groupBuy.product.currency || "USD")} per unit ({savingsPercent}%)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Target Quantity</span>
                  <span className="text-sm font-medium">{groupBuy.targetQty} units</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {isOpen && !hasJoined && (
            <Card data-testid="card-join-group-buy">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Join This Group Buy
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      How many units do you want?
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setJoinQty(Math.max(1, joinQty - 1))}
                        disabled={joinQty <= 1}
                        data-testid="button-decrease-join-qty"
                      >
                        <span className="text-lg font-bold">-</span>
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={unitsRemaining}
                        value={joinQty}
                        onChange={(e) => setJoinQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                        data-testid="input-join-qty"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setJoinQty(joinQty + 1)}
                        disabled={joinQty >= unitsRemaining}
                        data-testid="button-increase-join-qty"
                      >
                        <span className="text-lg font-bold">+</span>
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    Your total: <span className="font-semibold" data-testid="text-join-total">{formatPrice(groupPrice * joinQty, true, groupBuy.product.currency || "USD")}</span>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      joinMutation.mutate();
                    }}
                    disabled={joinMutation.isPending}
                    data-testid="button-join-group-buy"
                  >
                    <Users className="w-4 h-4" />
                    {joinMutation.isPending ? "Joining..." : "Join Group Buy"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {hasJoined && (
            <Card data-testid="card-already-joined">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">You've Joined</p>
                  <p className="text-sm text-muted-foreground">
                    {groupBuy.participants.find(p => p.userId === user?.id)?.quantity} unit(s) committed
                  </p>
                </div>
                <ShareGroupBuyPopover groupBuy={groupBuy} />
              </CardContent>
            </Card>
          )}

          {!isOpen && !hasJoined && (
            <Card data-testid="card-closed-info">
              <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">
                    {isFilled ? "Target Reached" : isCancelled ? "Cancelled" : "Expired"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isFilled
                      ? "This group buy has reached its target quantity."
                      : isCancelled
                      ? "This group buy was cancelled by the organizer."
                      : "This group buy has expired."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card data-testid="card-participants">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participants ({groupBuy.participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {groupBuy.participants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No participants yet. Be the first to join!
              </p>
            ) : (
              <div className="space-y-2">
                {groupBuy.participants.map((participant) => {
                  const isOrganizerParticipant = participant.userId === groupBuy.organizerId;
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-muted/30"
                      data-testid={`participant-${participant.id}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {participant.user?.businessName?.charAt(0) || participant.userId.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">
                              {participant.user?.businessName || "Anonymous Buyer"}
                            </span>
                            {isOrganizerParticipant && (
                              <Crown className="w-3.5 h-3.5 text-yellow-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {participant.user?.country || ""}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" data-testid={`badge-participant-qty-${participant.id}`}>
                        {participant.quantity} unit{participant.quantity !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {isOrganizer && isOpen && (
          <div className="flex justify-center">
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-group-buy"
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Group Buy"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
