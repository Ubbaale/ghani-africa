import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone, Share2, Mail, BarChart3, Clock, Play, Pause, Trash2,
  Copy, MessageCircle, Facebook, Linkedin, RefreshCw, Loader2,
  Zap, Send, Users, TrendingUp, Globe, Smartphone, ChevronDown, ChevronUp
} from "lucide-react";

function TwitterIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}

export default function MarketingHub() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ["/api/admin/marketing/stats"],
  });

  const { data: automationsData, isLoading: automationsLoading } = useQuery({
    queryKey: ["/api/admin/marketing/automations"],
  });

  const { data: socialPostsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/admin/marketing/social-posts"],
  });

  const { data: generatedContent } = useQuery({
    queryKey: ["/api/admin/marketing/social-content"],
  });

  const { data: whatsappTemplates } = useQuery({
    queryKey: ["/api/admin/marketing/whatsapp-templates"],
  });

  const generatePostsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/marketing/social-posts/generate-and-save", { type: "all" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/social-posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
      toast({ title: "Content generated and saved!" });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/marketing/automations/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/automations"] });
      toast({ title: "Automation updated" });
    },
  });

  const runAutomationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/marketing/automations/${id}/run-now`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/automations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
      toast({ title: "Automation executed!" });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const sendDigestMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/marketing/send-digest"),
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/stats"] });
      toast({ title: "Digest sent!", description: `${data.sent} emails sent, ${data.failed} failed` });
    },
    onError: (error: any) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/marketing/social-posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/social-posts"] });
      toast({ title: "Post deleted" });
    },
  });

  const stats = statsData?.data;
  const automations = automationsData?.data || [];
  const savedPosts = socialPostsData?.data || [];
  const generated = generatedContent?.data || [];
  const templates = whatsappTemplates?.data || [];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard!` });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "twitter": return <TwitterIcon className="h-4 w-4" />;
      case "whatsapp": return <MessageCircle className="h-4 w-4" />;
      case "instagram": return <Smartphone className="h-4 w-4" />;
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      case "tiktok": return <Smartphone className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "facebook": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "twitter": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "whatsapp": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "instagram": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      case "linkedin": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "tiktok": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredGenerated = selectedPlatform === "all"
    ? generated
    : generated.filter((p: any) => p.platform === selectedPlatform);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2" data-testid="text-marketing-title">
            <Megaphone className="h-6 w-6 text-primary" />
            Marketing Hub
          </h2>
          <p className="text-muted-foreground mt-1">Automated traffic generation and promotion tools for African markets</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Mail className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold" data-testid="text-total-emails">{stats.totalEmailsSent}</div>
              <div className="text-xs text-muted-foreground">Emails Sent</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <div className="text-2xl font-bold" data-testid="text-active-automations">{stats.activeAutomations}</div>
              <div className="text-xs text-muted-foreground">Active Automations</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Share2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold" data-testid="text-social-posts">{stats.totalSocialPosts}</div>
              <div className="text-xs text-muted-foreground">Social Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <div className="text-2xl font-bold" data-testid="text-emails-7d">{stats.emailsLast7d}</div>
              <div className="text-xs text-muted-foreground">Emails (7 days)</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="automations">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="automations" data-testid="tab-automations">
            <Zap className="h-4 w-4 mr-1" /> Automations
          </TabsTrigger>
          <TabsTrigger value="social" data-testid="tab-social-content">
            <Share2 className="h-4 w-4 mr-1" /> Social Content
          </TabsTrigger>
          <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">
            <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp Broadcast
          </TabsTrigger>
          <TabsTrigger value="saved" data-testid="tab-saved-posts">
            <BarChart3 className="h-4 w-4 mr-1" /> Saved Posts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Marketing Automations</h3>
              <p className="text-sm text-muted-foreground">Set-and-forget campaigns that run automatically</p>
            </div>
            <Button
              onClick={() => sendDigestMutation.mutate()}
              disabled={sendDigestMutation.isPending}
              variant="outline"
              data-testid="button-send-digest"
            >
              {sendDigestMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Send Digest Now
            </Button>
          </div>

          {automationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : automations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No automations yet. They will be auto-created on next engine run.</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    apiRequest("POST", "/api/admin/marketing/automations", {
                      name: "Weekly Trade Digest",
                      type: "email_digest",
                      isActive: true,
                      intervalHours: 168,
                      nextRunAt: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString(),
                      config: { description: "Sends weekly email digest" },
                    }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/admin/marketing/automations"] }));
                  }}
                  data-testid="button-create-automation"
                >
                  Create Default Automations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {automations.map((auto: any) => (
                <Card key={auto.id} data-testid={`automation-${auto.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{auto.name}</h4>
                          <Badge variant={auto.isActive ? "default" : "secondary"}>
                            {auto.isActive ? "Active" : "Paused"}
                          </Badge>
                          <Badge variant="outline">{auto.type.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(auto.config as any)?.description || `Runs every ${auto.intervalHours} hours`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Every {auto.intervalHours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {auto.totalSent || 0} sent
                          </span>
                          {auto.lastRunAt && (
                            <span>Last: {new Date(auto.lastRunAt).toLocaleDateString()}</span>
                          )}
                          {auto.nextRunAt && (
                            <span>Next: {new Date(auto.nextRunAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAutomationMutation.mutate(auto.id)}
                          disabled={runAutomationMutation.isPending}
                          data-testid={`button-run-automation-${auto.id}`}
                        >
                          {runAutomationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Switch
                          checked={auto.isActive}
                          onCheckedChange={(checked) =>
                            toggleAutomationMutation.mutate({ id: auto.id, isActive: checked })
                          }
                          data-testid={`switch-automation-${auto.id}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="social" className="space-y-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-lg">Social Media Content Generator</h3>
              <p className="text-sm text-muted-foreground">Ready-to-post content for all platforms. Copy and paste to your social accounts.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-36" data-testid="select-platform-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">X (Twitter)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => generatePostsMutation.mutate()}
                disabled={generatePostsMutation.isPending}
                data-testid="button-generate-save-posts"
              >
                {generatePostsMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Generate & Save All
              </Button>
            </div>
          </div>

          {filteredGenerated.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Share2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No content generated yet. Add products to your marketplace, then content will be auto-generated.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredGenerated.map((post: any, idx: number) => (
                <Card key={idx} data-testid={`social-post-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <Badge className={getPlatformColor(post.platform)}>
                          {post.platform}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{post.contentType.replace(/_/g, " ")}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(post.content + (post.hashtags ? "\n\n" + post.hashtags : ""), post.platform)}
                        data-testid={`button-copy-post-${idx}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{post.title}</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-line max-h-32 overflow-hidden relative">
                      {post.content}
                      {post.content.length > 200 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                      )}
                    </div>
                    {post.hashtags && (
                      <p className="text-xs text-blue-500 mt-2 cursor-pointer" onClick={() => copyToClipboard(post.hashtags, "Hashtags")}>
                        {post.hashtags}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4 mt-4">
          <div>
            <h3 className="font-semibold text-lg">WhatsApp Broadcast Templates</h3>
            <p className="text-sm text-muted-foreground">Pre-made messages to share in business groups and broadcast lists. Copy and send to grow your network.</p>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Loading templates...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {templates.map((template: any, idx: number) => (
                <Card key={idx} data-testid={`whatsapp-template-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">{template.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.targetAudience}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(template.message, template.name)}
                          data-testid={`button-copy-template-${idx}`}
                        >
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            window.open(`https://wa.me/?text=${encodeURIComponent(template.message)}`, "_blank");
                          }}
                          data-testid={`button-share-template-${idx}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" /> Share
                        </Button>
                      </div>
                    </div>
                    <div
                      className="text-sm whitespace-pre-line bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer"
                      onClick={() => setExpandedPost(expandedPost === idx ? null : idx)}
                    >
                      {expandedPost === idx ? template.message : template.message.substring(0, 200) + (template.message.length > 200 ? "..." : "")}
                      {template.message.length > 200 && (
                        <span className="text-green-600 ml-1">
                          {expandedPost === idx ? <ChevronUp className="h-3 w-3 inline" /> : <ChevronDown className="h-3 w-3 inline" />}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Saved Social Posts</h3>
              <p className="text-sm text-muted-foreground">Generated posts saved for your records</p>
            </div>
          </div>

          {postsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : savedPosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No saved posts. Use "Generate & Save All" to create and save posts.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {savedPosts.slice(0, 50).map((post: any) => (
                <div key={post.id} className="border rounded-lg p-3 flex items-start justify-between" data-testid={`saved-post-${post.id}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getPlatformIcon(post.platform)}
                      <Badge className={`${getPlatformColor(post.platform)} text-xs`}>{post.platform}</Badge>
                      <Badge variant={post.status === "posted" ? "default" : post.status === "draft" ? "outline" : "secondary"} className="text-xs">
                        {post.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(post.content + (post.hashtags ? "\n\n" + post.hashtags : ""), "Post")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePostMutation.mutate(post.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
