import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Store, Palette, Eye, Save, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

const THEMES = [
  { name: "Savanna Gold", primary: "#D4A574", secondary: "#2D5016", bg: "#FEF7ED" },
  { name: "Ocean Blue", primary: "#1E6B9A", secondary: "#0D3B66", bg: "#EBF5FB" },
  { name: "Forest Green", primary: "#2D5016", secondary: "#1A3409", bg: "#F0F7EC" },
  { name: "Sunset Red", primary: "#C44536", secondary: "#7D2E2E", bg: "#FDF0EE" },
  { name: "Royal Purple", primary: "#6B3FA0", secondary: "#3D1F6D", bg: "#F5F0FA" },
  { name: "Earth Brown", primary: "#8B6914", secondary: "#5C4A11", bg: "#FAF5E8" },
];

export default function StorefrontBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(0);

  const { data: storefront, isLoading } = useQuery({
    queryKey: ["/api/my-storefront"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/storefronts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-storefront"] });
      toast({ title: "Storefront Created!", description: "Your branded store is ready to customize" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/storefronts/${sf?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-storefront"] });
      toast({ title: "Storefront Updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sf = storefront?.data;

  if (isLoading) return <div className="container mx-auto p-6"><div className="animate-pulse h-64 bg-gray-200 rounded-lg" /></div>;

  if (!sf) {
    return (
      <div className="container mx-auto p-6 max-w-2xl" data-testid="storefront-create-page">
        <div className="text-center mb-8">
          <Store className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2" data-testid="text-storefront-title">Create Your Branded Storefront</h1>
          <p className="text-muted-foreground">Build a professional online store that represents your brand. Stand out from the crowd.</p>
          <Badge variant="secondary" className="mt-2">Starting from $15/month</Badge>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Store Name</label>
              <Input placeholder="e.g., Accra Gold Trading" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-store-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Store Description</label>
              <Textarea placeholder="Describe your business and what you sell..." value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-store-description" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Choose Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((theme, i) => (
                  <div key={i} className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${selectedTheme === i ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`} onClick={() => setSelectedTheme(i)} data-testid={`theme-option-${i}`}>
                    <div className="flex gap-1 mb-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.primary }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.secondary }} />
                    </div>
                    <div className="text-xs font-medium">{theme.name}</div>
                  </div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => createMutation.mutate({ name, description, theme: THEMES[selectedTheme] })} disabled={!name || createMutation.isPending} data-testid="button-create-storefront">
              <Store className="h-4 w-4 mr-2" /> Create Storefront - $15/month
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="storefront-builder-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-storefront-name">{sf.name}</h1>
            <p className="text-sm text-muted-foreground">/{sf.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation(`/storefront/${sf.slug}`)} data-testid="button-preview-storefront">
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>
          <Badge className={sf.isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
            {sf.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base"><Palette className="h-4 w-4 inline mr-2" />Store Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Store Name</label>
              <Input defaultValue={sf.name} onBlur={(e) => updateMutation.mutate({ name: e.target.value })} data-testid="input-edit-store-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea defaultValue={sf.description || ""} onBlur={(e) => updateMutation.mutate({ description: e.target.value })} data-testid="input-edit-store-desc" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Publish Store</div>
                <div className="text-xs text-muted-foreground">Make your store visible to buyers</div>
              </div>
              <Switch checked={sf.isPublished} onCheckedChange={(checked) => updateMutation.mutate({ isPublished: checked })} data-testid="switch-publish" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Theme</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((theme, i) => {
                const currentTheme = sf.theme as any;
                const isSelected = currentTheme?.primary === theme.primary;
                return (
                  <div key={i} className={`cursor-pointer rounded-lg p-3 border-2 transition-all ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}`} onClick={() => updateMutation.mutate({ theme })} data-testid={`edit-theme-${i}`}>
                    <div className="flex gap-1 mb-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.primary }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.secondary }} />
                    </div>
                    <div className="text-xs font-medium">{theme.name}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Store URL</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> /storefront/{sf.slug}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">Monthly Fee</div>
              <div className="text-sm text-muted-foreground">${sf.monthlyFee}/month</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
