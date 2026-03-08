import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, UserProfile } from "@shared/schema";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  User,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

type Conversation = {
  partnerId: string;
  partner: UserProfile | null;
  lastMessage: Message;
  unreadCount: number;
};

export default function Messages() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const initialSellerId = searchParams.get("seller");
  
  const [selectedPartner, setSelectedPartner] = useState<string | null>(initialSellerId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedPartner],
    queryFn: async () => {
      if (!selectedPartner) return [];
      const response = await fetch(`/api/messages/${selectedPartner}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!selectedPartner,
    refetchInterval: 5000,
  });

  const { data: selectedPartnerProfile } = useQuery<UserProfile>({
    queryKey: ["/api/sellers", selectedPartner],
    queryFn: async () => {
      const response = await fetch(`/api/sellers/${selectedPartner}`);
      if (!response.ok) throw new Error("Failed to fetch seller");
      return response.json();
    },
    enabled: !!selectedPartner && !conversations.find(c => c.partnerId === selectedPartner)?.partner,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", { receiverId: selectedPartner, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedPartner] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login";
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPartner = conversations.find(c => c.partnerId === selectedPartner)?.partner || selectedPartnerProfile;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <GradientLogo size="sm" />
              <span className="font-bold text-xl text-primary">Messages</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        <aside className="w-80 border-r flex-shrink-0 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm">No conversations yet</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Contact a seller to start chatting
                </p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartner(conv.partnerId)}
                    className={`w-full p-3 rounded-lg flex items-start gap-3 text-left hover-elevate ${
                      selectedPartner === conv.partnerId ? "bg-accent" : ""
                    }`}
                    data-testid={`button-conversation-${conv.partnerId}`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {conv.partner?.businessName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {conv.partner?.businessName || "User"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="flex-shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>

        <main className="flex-1 flex flex-col">
          {selectedPartner ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {currentPartner?.businessName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium" data-testid="text-chat-partner-name">
                    {currentPartner?.businessName || "User"}
                  </p>
                  {currentPartner?.city && (
                    <p className="text-sm text-muted-foreground">
                      {currentPartner.city}, {currentPartner.country}
                    </p>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                        <div className="max-w-xs bg-muted rounded-lg p-3 animate-pulse">
                          <div className="h-4 bg-muted-foreground/20 rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : ""}`}>
                          <div
                            className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                            data-testid={`text-message-${msg.id}`}
                          >
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {new Date(msg.createdAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Select a conversation</h2>
                <p className="text-muted-foreground">
                  Choose a conversation from the list or contact a seller
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
