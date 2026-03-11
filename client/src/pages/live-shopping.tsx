import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Video, Plus, Play, Clock, Users, ShoppingBag, Calendar, Radio, Eye, DollarSign, CreditCard } from "lucide-react";

export default function LiveShoppingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({ title: "Payment Successful!", description: "Your live shopping session has been scheduled and paid for." });
      queryClient.invalidateQueries({ queryKey: ["/api/live-sessions"] });
      window.history.replaceState({}, "", "/live-shopping");
    }
    if (params.get("cancelled") === "true") {
      toast({ title: "Payment Cancelled", description: "Your session was not scheduled.", variant: "destructive" });
      window.history.replaceState({}, "", "/live-shopping");
    }
  }, []);

  const { data: sessions, isLoading } = useQuery({ queryKey: ["/api/live-sessions"] });
  const { data: sessionDetail } = useQuery({
    queryKey: ["/api/live-sessions", selectedSession],
    queryFn: () => fetch(`/api/live-sessions/${selectedSession}`).then(r => r.json()),
    enabled: !!selectedSession,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/service-checkout/live-session", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/live-sessions/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/live-sessions"] }); toast({ title: "Session Updated" }); },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const sessionList = sessions?.data || [];
  const liveSessions = sessionList.filter((s: any) => s.status === "live");
  const scheduled = sessionList.filter((s: any) => s.status === "scheduled");
  const ended = sessionList.filter((s: any) => s.status === "ended");

  const statusConfig: Record<string, { color: string; icon: any }> = {
    scheduled: { color: "bg-blue-100 text-blue-800", icon: Clock },
    live: { color: "bg-red-100 text-red-800 animate-pulse", icon: Radio },
    ended: { color: "bg-gray-100 text-gray-800", icon: Video },
  };

  if (selectedSession && sessionDetail?.data) {
    const { session, products } = sessionDetail.data;
    const config = statusConfig[session.status] || statusConfig.scheduled;
    return (
      <div className="container mx-auto p-6 max-w-3xl" data-testid="live-session-detail">
        <Button variant="ghost" className="mb-4" onClick={() => setSelectedSession(null)}>Back to Live Shopping</Button>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-session-title">{session.title}</h1>
                <p className="text-muted-foreground mt-1">{session.description}</p>
              </div>
              <Badge className={config.color}><config.icon className="h-3 w-3 mr-1" />{session.status}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
              <div><Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><div className="font-bold">{session.viewerCount || 0}</div><div className="text-xs text-muted-foreground">Viewers</div></div>
              <div><ShoppingBag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><div className="font-bold">{products.length}</div><div className="text-xs text-muted-foreground">Products</div></div>
              <div><DollarSign className="h-5 w-5 mx-auto mb-1 text-muted-foreground" /><div className="font-bold">${session.fee}</div><div className="text-xs text-muted-foreground">Session Fee</div></div>
            </div>

            {session.status === "scheduled" && user && session.sellerId === user.id && (
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => updateMutation.mutate({ id: session.id, data: { status: "live", startedAt: new Date() } })} data-testid="button-go-live">
                  <Play className="h-4 w-4 mr-2" /> Go Live
                </Button>
              </div>
            )}
            {session.status === "live" && user && session.sellerId === user.id && (
              <Button variant="destructive" className="w-full mt-4" onClick={() => updateMutation.mutate({ id: session.id, data: { status: "ended", endedAt: new Date() } })} data-testid="button-end-session">
                End Session
              </Button>
            )}
          </CardContent>
        </Card>

        {session.status === "live" && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-4">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-white">
                  <Radio className="h-12 w-12 mx-auto mb-2 animate-pulse text-red-500" />
                  <div className="font-bold text-lg">LIVE</div>
                  <div className="text-sm opacity-70">Video streaming will be available when integrated with a live streaming provider</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {products.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Featured Products</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p: any) => (
                <Card key={p.id} data-testid={`session-product-${p.id}`}>
                  <CardContent className="py-3">
                    <div className="font-medium">Product #{p.productId}</div>
                    {p.specialPrice && <div className="text-sm text-red-600 font-bold">Live Price: ${p.specialPrice}</div>}
                    {p.stock > 0 && <div className="text-xs text-muted-foreground">{p.stock} in stock</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="live-shopping-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Video className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-live-title">Live Video Shopping</h1>
            <p className="text-muted-foreground">Watch sellers showcase products live and grab exclusive deals</p>
          </div>
        </div>
        {user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild><Button data-testid="button-schedule-live"><Plus className="h-4 w-4 mr-2" /> Schedule Live</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule Live Shopping Session</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Session title" value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-session-title" />
                <Textarea placeholder="What will you be showcasing?" value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-session-desc" />
                <div>
                  <label className="text-sm font-medium mb-1 block">Schedule Date & Time</label>
                  <Input type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} data-testid="input-scheduled-date" />
                </div>
                <div className="p-3 bg-muted rounded-lg text-sm"><DollarSign className="h-4 w-4 inline mr-1" />Session fee: <strong>$10.00</strong> (charged when going live)</div>
                <Button className="w-full" onClick={() => createMutation.mutate({ title, description, scheduledAt: scheduledDate || undefined })} disabled={!title || createMutation.isPending} data-testid="button-create-session">
                  <CreditCard className="h-4 w-4 mr-2" /> {createMutation.isPending ? "Redirecting to payment..." : "Pay $10 & Schedule Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {liveSessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Radio className="h-5 w-5 text-red-500 animate-pulse" /> Live Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveSessions.map((session: any) => (
              <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow border-red-200" onClick={() => setSelectedSession(session.id)} data-testid={`live-session-${session.id}`}>
                <CardContent className="pt-4">
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-3">
                    <Radio className="h-8 w-8 text-red-500 animate-pulse" />
                  </div>
                  <h3 className="font-semibold">{session.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{session.viewerCount || 0}</span>
                    <Badge className="bg-red-100 text-red-800 animate-pulse">LIVE</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />)}</div>
      ) : (
        <>
          {scheduled.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Upcoming Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduled.map((session: any) => (
                  <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSession(session.id)} data-testid={`scheduled-session-${session.id}`}>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold">{session.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{session.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString() : "TBD"}</span>
                        <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {ended.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Past Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ended.map((session: any) => (
                  <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow opacity-75" onClick={() => setSelectedSession(session.id)} data-testid={`ended-session-${session.id}`}>
                    <CardContent className="pt-4">
                      <h3 className="font-semibold">{session.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{session.viewerCount || 0} viewers</span>
                        <Badge variant="outline">Ended</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {sessionList.length === 0 && (
            <Card><CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-3">No live sessions yet. Schedule one to showcase your products!</p>
              <p className="text-sm text-muted-foreground">Live sessions cost <strong>$10 per session</strong> and let you showcase products to buyers in real-time.</p>
              {user && (
                <Button className="mt-4" onClick={() => setShowCreateDialog(true)} data-testid="button-schedule-empty-state">
                  <Plus className="h-4 w-4 mr-2" /> Schedule Your First Live Session - $10
                </Button>
              )}
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}
