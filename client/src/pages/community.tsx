import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Plus, Eye, MessageCircle, ArrowLeft, Pin, Lock, Lightbulb, Shield, TrendingUp, Globe, Truck, CreditCard, Search, Award, Send } from "lucide-react";

const ICONS: Record<string, any> = { lightbulb: Lightbulb, shield: Shield, "trending-up": TrendingUp, globe: Globe, truck: Truck, "credit-card": CreditCard, search: Search, award: Award };

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: categories } = useQuery({ queryKey: ["/api/forum/categories"] });
  const { data: posts } = useQuery({
    queryKey: ["/api/forum/posts", selectedCategory],
    queryFn: () => fetch(`/api/forum/posts${selectedCategory ? `?categoryId=${selectedCategory}` : ''}`).then(r => r.json()),
  });
  const { data: postDetail } = useQuery({
    queryKey: ["/api/forum/posts", selectedPost],
    queryFn: () => fetch(`/api/forum/posts/${selectedPost}`).then(r => r.json()),
    enabled: !!selectedPost,
  });

  const createPostMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/forum/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts"] });
      toast({ title: "Post Created" });
      setShowCreateDialog(false);
      setNewPostTitle("");
      setNewPostContent("");
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const replyMutation = useMutation({
    mutationFn: (data: { postId: number; content: string }) => apiRequest("POST", `/api/forum/posts/${data.postId}/replies`, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forum/posts", selectedPost] });
      setReplyContent("");
      toast({ title: "Reply Posted" });
    },
    onError: (error: any) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const catList = categories?.data || [];
  const postList = posts?.data || [];

  if (selectedPost && postDetail?.data) {
    const { post, replies } = postDetail.data;
    return (
      <div className="container mx-auto p-6 max-w-3xl" data-testid="forum-post-detail">
        <Button variant="ghost" className="mb-4" onClick={() => setSelectedPost(null)} data-testid="button-back-to-forum"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Forum</Button>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 mb-2">
              {post.isPinned && <Pin className="h-4 w-4 text-orange-500" />}
              {post.isLocked && <Lock className="h-4 w-4 text-red-500" />}
              <h1 className="text-xl font-bold" data-testid="text-post-title">{post.title}</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views} views</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.replyCount} replies</span>
            </div>
            <div className="prose max-w-none"><p>{post.content}</p></div>
          </CardContent>
        </Card>

        <h3 className="font-semibold mb-3">Replies ({replies.length})</h3>
        <div className="space-y-3 mb-6">
          {replies.map((reply: any) => (
            <Card key={reply.id} data-testid={`reply-${reply.id}`}>
              <CardContent className="py-4">
                <p className="text-sm">{reply.content}</p>
                <div className="text-xs text-muted-foreground mt-2">{new Date(reply.createdAt).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {user && !post.isLocked && (
          <Card>
            <CardContent className="pt-4">
              <Textarea placeholder="Write your reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="mb-3" data-testid="input-reply-content" />
              <Button onClick={() => replyMutation.mutate({ postId: post.id, content: replyContent })} disabled={!replyContent || replyMutation.isPending} data-testid="button-submit-reply">
                <Send className="h-4 w-4 mr-2" /> Post Reply
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="community-page">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-community-title">Business Community</h1>
            <p className="text-muted-foreground">Connect with fellow African traders, share knowledge, and grow together</p>
          </div>
        </div>
        {user && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-post"><Plus className="h-4 w-4 mr-2" /> New Post</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Post</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger data-testid="select-post-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{catList.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Post title" value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} data-testid="input-post-title" />
                <Textarea placeholder="Share your thoughts, tips, or questions..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} rows={5} data-testid="input-post-content" />
                <Button className="w-full" onClick={() => createPostMutation.mutate({ categoryId: newPostCategory, title: newPostTitle, content: newPostContent })} disabled={!newPostTitle || !newPostContent || !newPostCategory || createPostMutation.isPending} data-testid="button-submit-post">
                  Post to Community
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="space-y-1">
            <Button variant={!selectedCategory ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onClick={() => setSelectedCategory(null)} data-testid="category-all">All Topics</Button>
            {catList.map((cat: any) => {
              const Icon = ICONS[cat.icon] || MessageSquare;
              return (
                <Button key={cat.id} variant={selectedCategory === cat.id ? "secondary" : "ghost"} size="sm" className="w-full justify-start" onClick={() => setSelectedCategory(cat.id)} data-testid={`category-${cat.id}`}>
                  <Icon className="h-4 w-4 mr-2" /> <span className="truncate">{cat.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-3">
          {postList.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p className="text-muted-foreground">No posts yet. Be the first to start a discussion!</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {postList.map((post: any) => (
                <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPost(post.id)} data-testid={`post-${post.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-2">
                      {post.isPinned && <Pin className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />}
                      <div className="flex-1">
                        <h3 className="font-medium">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{post.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.replyCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
