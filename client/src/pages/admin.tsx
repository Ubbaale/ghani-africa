import { useLocation, Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Product, Order, Dispute, Advertisement, Category, AdminNotification, ActivityLog } from "@shared/schema";
import {
  Users,
  UserCheck,
  UserX,
  MessageCircle,
  Shield,
  Search,
  ArrowLeft,
  Ban,
  CheckCircle,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  AlertTriangle,
  Megaphone,
  FolderTree,
  LayoutDashboard,
  DollarSign,
  Eye,
  EyeOff,
  Star,
  Trash2,
  Edit,
  Plus,
  XCircle,
  Clock,
  TrendingUp,
  Lock,
  LogOut,
  Loader2,
  UserCog,
  Key,
  CalendarDays,
  Globe,
  ExternalLink,
  Send,
  UserPlus,
  Upload,
  Truck,
  Bell,
  Activity,
  CheckCheck,
  Filter,
  CreditCard,
  UserPlus2,
  RefreshCw,
  Inbox,
  Reply,
  MessageSquare,
  Phone,
  Building2,
} from "lucide-react";
import { useState } from "react";

type AdminSession = {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  isAuthenticated: boolean;
  isSuperAdmin?: boolean;
};

type AdminAccount = {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

type AdminStats = {
  users: number;
  products: number;
  orders: number;
  disputes: number;
  advertisements: number;
  revenue: string;
};

type ProductWithSeller = Product & { seller: UserProfile | null };
type OrderWithUsers = Order & { buyer: UserProfile | null; seller: UserProfile | null };
type DisputeWithUsers = Dispute & { initiator: UserProfile | null; respondent: UserProfile | null };
type AdvertisementWithProduct = Advertisement & { product: Product; seller: UserProfile | null };

function AdminLoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/forgot-password", { email: resetEmail });
    },
    onSuccess: () => {
      toast({ title: "If the email exists, a reset link has been sent" });
      setShowForgotPassword(false);
      setResetEmail("");
    },
    onError: () => {
      toast({ title: "Failed to send reset email", variant: "destructive" });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/login", { username, password });
    },
    onSuccess: () => {
      toast({ title: "Login successful" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      onLoginSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error?.message || "Invalid credentials",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Please enter username and password", variant: "destructive" });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-admin-username"
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-admin-password"
                  disabled={loginMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
            <div className="text-center mt-2">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-sm"
                onClick={() => setShowForgotPassword(true)}
                data-testid="button-forgot-password"
              >
                Forgot password?
              </Button>
            </div>
          </form>
          
          {showForgotPassword && (
            <div className="mt-4 p-4 border rounded-md bg-muted/50">
              <p className="text-sm font-medium mb-2">Reset Password</p>
              <p className="text-xs text-muted-foreground mb-3">
                Enter your admin email to receive a password reset link
              </p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  data-testid="input-reset-email"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => forgotPasswordMutation.mutate()}
                    disabled={!resetEmail || forgotPasswordMutation.isPending}
                    data-testid="button-send-reset"
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: adminSession, isLoading: sessionLoading } = useQuery<AdminSession>({
    queryKey: ["/api/admin/session"],
    select: (data: any) => data.data,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const isAuthenticated = adminSession?.isAuthenticated === true;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [notificationTypeFilter, setNotificationTypeFilter] = useState("all");

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
      toast({ title: "Logged out successfully" });
    },
  });

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: users, isLoading: usersLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithSeller[]>({
    queryKey: ["/api/admin/products"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithUsers[]>({
    queryKey: ["/api/admin/orders"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: disputes, isLoading: disputesLoading } = useQuery<DisputeWithUsers[]>({
    queryKey: ["/api/admin/disputes"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: advertisements, isLoading: adsLoading } = useQuery<AdvertisementWithProduct[]>({
    queryKey: ["/api/admin/advertisements"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: tradeExpoAds, isLoading: expoAdsLoading } = useQuery<{ success: boolean; data: Array<{ id: number; organizerName: string; organizerEmail: string; eventName: string; eventDescription: string; location: string; eventDate: string; countryCode: string; websiteUrl: string; packageType: string; price: number; duration: number; status: string; stripeSessionId: string | null; stripePaymentId: string | null; startDate: string | null; endDate: string | null; createdAt: string }> }>({
    queryKey: ["/api/admin/trade-expo-ads"],
    enabled: !!adminSession?.isAuthenticated,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery<{ data: AdminNotification[]; unreadCount: number }>({
    queryKey: ["/api/admin/notifications"],
    enabled: isAuthenticated,
    select: (data: any) => ({ data: data.data, unreadCount: data.unreadCount }),
  });

  const { data: activityLogs, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
    enabled: isAuthenticated,
    select: (data: any) => data.data,
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  const markAllNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, verificationLevel }: { userId: string; role?: string; verificationLevel?: string }) => {
      const body: any = {};
      if (role) body.role = role;
      if (verificationLevel) body.verificationLevel = verificationLevel;
      return apiRequest("PATCH", `/api/admin/users/${userId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, content }: { userId: string; content: string }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/message`, { content });
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      setMessageDialogOpen(false);
      setMessageContent("");
      setSelectedUser(null);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/admin/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({ title: "Product updated" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product deleted" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ id, resolution, notes }: { id: number; resolution: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/admin/disputes/${id}`, { resolution, resolutionNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Dispute resolved" });
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/admin/advertisements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      toast({ title: "Advertisement updated" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/advertisements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Advertisement deleted" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; icon?: string }) => {
      return apiRequest("POST", `/api/admin/categories`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category created" });
      setCategoryDialogOpen(false);
      setNewCategoryName("");
      setNewCategorySlug("");
      setNewCategoryIcon("");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Category deleted" });
    },
  });

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={() => {}} />;
  }

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      searchQuery === "" ||
      u.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      active: "default",
      paid: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
      expired: "outline",
      open: "secondary",
      under_review: "default",
      resolved: "default",
      escalated: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin": return "destructive";
      case "manufacturer": return "default";
      case "trader": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <GradientLogo size="sm" />
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {adminSession?.displayName && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Welcome, {adminSession.displayName}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-admin-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-12 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-overview">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-users">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-products">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-orders">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden md:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-disputes">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden md:inline">Disputes</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-ads">
              <Megaphone className="h-4 w-4" />
              <span className="hidden md:inline">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-emails">
              <Mail className="h-4 w-4" />
              <span className="hidden md:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="expos" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-expos">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden md:inline">Expos</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-categories">
              <FolderTree className="h-4 w-4" />
              <span className="hidden md:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="dropship" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-dropship">
              <Truck className="h-4 w-4" />
              <span className="hidden md:inline">Dropship</span>
            </TabsTrigger>
            <TabsTrigger value="shippers" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-shippers">
              <Truck className="h-4 w-4" />
              <span className="hidden md:inline">Shippers</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 text-xs md:text-sm relative" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
              {(notificationsData?.unreadCount ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] leading-none px-1.5 py-0.5" data-testid="badge-unread-count">
                  {notificationsData!.unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-1 text-xs md:text-sm relative" data-testid="tab-inquiries">
              <Inbox className="h-4 w-4" />
              <span className="hidden md:inline">Inquiries</span>
            </TabsTrigger>
            <TabsTrigger value="trade" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-trade">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Trade & Tax</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-activity">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-security">
              <Key className="h-4 w-4" />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="outreach" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-outreach">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Outreach</span>
            </TabsTrigger>
            {adminSession?.isSuperAdmin && (
              <TabsTrigger value="admins" className="flex items-center gap-1 text-xs md:text-sm" data-testid="tab-admins">
                <UserCog className="h-4 w-4" />
                <span className="hidden md:inline">Admins</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-users">{stats?.users || 0}</p>
                      <p className="text-sm text-muted-foreground">Users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-products">{stats?.products || 0}</p>
                      <p className="text-sm text-muted-foreground">Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-orders">{stats?.orders || 0}</p>
                      <p className="text-sm text-muted-foreground">Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-disputes">{stats?.disputes || 0}</p>
                      <p className="text-sm text-muted-foreground">Disputes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-ads">{stats?.advertisements || 0}</p>
                      <p className="text-sm text-muted-foreground">Ads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-revenue">${parseFloat(stats?.revenue || '0').toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {ordersLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    ) : orders?.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No orders yet</p>
                    ) : (
                      <div className="space-y-3">
                        {orders?.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-md border">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.buyer?.businessName || 'Unknown'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.totalAmount}</p>
                              {getStatusBadge(order.status || 'pending')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Open Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {disputesLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    ) : disputes?.filter(d => d.status === 'open').length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No open disputes</p>
                    ) : (
                      <div className="space-y-3">
                        {disputes?.filter(d => d.status === 'open').slice(0, 5).map((dispute) => (
                          <div key={dispute.id} className="flex items-center justify-between p-3 rounded-md border">
                            <div>
                              <p className="font-medium">Dispute #{dispute.id}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">{dispute.reason}</p>
                            </div>
                            {getStatusBadge(dispute.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage all users, roles, and account status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, country, city, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-48" data-testid="select-role-filter">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="consumer">Consumer</SelectItem>
                      <SelectItem value="trader">Trader</SelectItem>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-96">
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : filteredUsers?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No users found</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredUsers?.map((u) => (
                        <div
                          key={u.id}
                          className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-md border ${
                            u.isDisabled ? "bg-muted/50 opacity-75" : "bg-card"
                          }`}
                          data-testid={`card-user-${u.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {u.businessName?.charAt(0) || u.id.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{u.businessName || "Unnamed User"}</span>
                                <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                                {u.isDisabled && <Badge variant="destructive">Disabled</Badge>}
                                {u.verificationLevel === "verified" && <Badge className="bg-green-600 text-white text-xs">Verified</Badge>}
                                {u.verificationLevel === "trusted" && <Badge className="bg-blue-600 text-white text-xs">Trusted</Badge>}
                                {u.verificationLevel === "pending" && <Badge className="bg-yellow-500 text-white text-xs animate-pulse">Pending Verification</Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {u.country && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {u.country}
                                  </span>
                                )}
                                {u.city && <span>- {u.city}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Select
                              value={u.role}
                              onValueChange={(role) => updateRoleMutation.mutate({ userId: u.id, role })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="consumer">Consumer</SelectItem>
                                <SelectItem value="trader">Trader</SelectItem>
                                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>

                            <Select
                              value={u.verificationLevel || "basic"}
                              onValueChange={(level) => updateRoleMutation.mutate({ userId: u.id, verificationLevel: level })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                                <SelectItem value="trusted">Trusted</SelectItem>
                              </SelectContent>
                            </Select>

                            <Dialog open={messageDialogOpen && selectedUser?.id === u.id} onOpenChange={(open) => {
                              setMessageDialogOpen(open);
                              if (open) setSelectedUser(u);
                              else setSelectedUser(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    Send Message to {u.businessName || "User"}
                                  </DialogTitle>
                                </DialogHeader>
                                <Textarea
                                  placeholder="Type your message here..."
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                  rows={4}
                                />
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    onClick={() => sendMessageMutation.mutate({ userId: u.id, content: messageContent })}
                                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                                  >
                                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant={u.isDisabled ? "default" : "destructive"}
                              size="sm"
                              onClick={() => toggleStatusMutation.mutate(u.id)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {u.isDisabled ? <UserCheck className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                              {u.isDisabled ? "Enable" : "Disable"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Management
                </CardTitle>
                <CardDescription>Moderate products, toggle visibility and featured status</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {productsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : products?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No products found</div>
                  ) : (
                    <div className="space-y-3">
                      {products?.map((product) => (
                        <div
                          key={product.id}
                          className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-md border ${
                            !product.isActive ? "bg-muted/50 opacity-75" : "bg-card"
                          }`}
                          data-testid={`card-product-${product.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{product.name}</span>
                                {product.isFeatured && <Badge variant="default"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                                {!product.isActive && <Badge variant="outline">Inactive</Badge>}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>${product.price}</span>
                                <span>-</span>
                                <span>{product.seller?.businessName || 'Unknown Seller'}</span>
                                <span>-</span>
                                <span>{product.country}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateProductMutation.mutate({ id: product.id, data: { isActive: !product.isActive } })}
                              title={product.isActive ? "Deactivate" : "Activate"}
                            >
                              {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateProductMutation.mutate({ id: product.id, data: { isFeatured: !product.isFeatured } })}
                              title={product.isFeatured ? "Remove Featured" : "Make Featured"}
                            >
                              <Star className={`h-4 w-4 ${product.isFeatured ? "fill-amber-500 text-amber-500" : ""}`} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Management
                </CardTitle>
                <CardDescription>View and manage all orders</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : orders?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No orders found</div>
                  ) : (
                    <div className="space-y-3">
                      {orders?.map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-md border bg-card"
                          data-testid={`card-order-${order.id}`}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">Order #{order.id}</span>
                              {getStatusBadge(order.status || 'pending')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Buyer: {order.buyer?.businessName || 'Unknown'}</span>
                              <span className="mx-2">|</span>
                              <span>Seller: {order.seller?.businessName || 'Unknown'}</span>
                            </div>
                            <div className="text-sm font-medium mt-1">
                              Total: ${order.totalAmount} {order.currency}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={order.status || 'pending'}
                              onValueChange={(status) => updateOrderMutation.mutate({ id: order.id, status })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Dispute Resolution
                </CardTitle>
                <CardDescription>Review and resolve disputes between buyers and sellers</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {disputesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : disputes?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No disputes found</div>
                  ) : (
                    <div className="space-y-3">
                      {disputes?.map((dispute) => (
                        <div
                          key={dispute.id}
                          className="p-4 rounded-md border bg-card space-y-3"
                          data-testid={`card-dispute-${dispute.id}`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Dispute #{dispute.id}</span>
                              {getStatusBadge(dispute.status)}
                            </div>
                            <span className="text-sm text-muted-foreground">Order #{dispute.orderId}</span>
                          </div>
                          <div className="text-sm">
                            <p><strong>Reason:</strong> {dispute.reason}</p>
                            {dispute.description && <p className="text-muted-foreground mt-1">{dispute.description}</p>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Initiator: {dispute.initiator?.businessName || 'Unknown'}</span>
                            <span>Respondent: {dispute.respondent?.businessName || 'Unknown'}</span>
                          </div>
                          {dispute.status === 'open' && (
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                onClick={() => resolveDisputeMutation.mutate({ id: dispute.id, resolution: 'REFUND_BUYER' })}
                                disabled={resolveDisputeMutation.isPending}
                              >
                                Refund Buyer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveDisputeMutation.mutate({ id: dispute.id, resolution: 'RELEASE_SELLER' })}
                                disabled={resolveDisputeMutation.isPending}
                              >
                                Release to Seller
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => resolveDisputeMutation.mutate({ id: dispute.id, resolution: 'PARTIAL_REFUND' })}
                                disabled={resolveDisputeMutation.isPending}
                              >
                                Partial Refund
                              </Button>
                            </div>
                          )}
                          {dispute.resolution && (
                            <div className="pt-2 border-t">
                              <Badge variant="default">{dispute.resolution}</Badge>
                              {dispute.resolutionNotes && <p className="text-sm text-muted-foreground mt-1">{dispute.resolutionNotes}</p>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Advertisement Management
                </CardTitle>
                <CardDescription>Manage sponsored product advertisements</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {adsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : advertisements?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No advertisements found</div>
                  ) : (
                    <div className="space-y-3">
                      {advertisements?.map((ad) => (
                        <div
                          key={ad.id}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-md border bg-card"
                          data-testid={`card-ad-${ad.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                              {ad.product.images?.[0] ? (
                                <img src={ad.product.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                              ) : (
                                <Megaphone className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{ad.product.name}</span>
                                {getStatusBadge(ad.status)}
                                <Badge variant="outline">{ad.packageType}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>{ad.seller?.businessName || 'Unknown'}</span>
                                <span className="mx-2">|</span>
                                <span>{ad.impressions || 0} views</span>
                                <span className="mx-2">|</span>
                                <span>{ad.clicks || 0} clicks</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Select
                              value={ad.status}
                              onValueChange={(status) => updateAdMutation.mutate({ id: ad.id, data: { status } })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteAdMutation.mutate(ad.id)}
                              disabled={deleteAdMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emails" className="space-y-6">
            <EmailCampaignsTab />
          </TabsContent>

          <TabsContent value="expos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Trade Expo Advertisements
                </CardTitle>
                <CardDescription>Manage trade expo banner advertisements on the homepage ticker</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {expoAdsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : !tradeExpoAds?.data?.length ? (
                    <p className="text-center text-muted-foreground py-8">No trade expo ads submitted yet</p>
                  ) : (
                    <div className="space-y-4">
                      {tradeExpoAds.data.map((ad) => (
                        <Card key={ad.id} className="border">
                          <CardContent className="pt-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg" data-testid={`text-expo-name-${ad.id}`}>{ad.eventName}</h3>
                                  <Badge variant={
                                    ad.status === 'active' ? 'default' :
                                    ad.status === 'pending' ? 'secondary' :
                                    ad.status === 'expired' ? 'outline' : 'destructive'
                                  } data-testid={`badge-expo-status-${ad.id}`}>
                                    {ad.status}
                                  </Badge>
                                  <Badge variant="outline">{ad.packageType}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{ad.eventDescription}</p>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ad.location}</span>
                                  <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{ad.eventDate}</span>
                                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{ad.countryCode}</span>
                                  <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />${ad.price}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                  <span>Organizer: {ad.organizerName} ({ad.organizerEmail})</span>
                                  {ad.websiteUrl && (
                                    <a href={ad.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                      <ExternalLink className="w-3.5 h-3.5" /> Website
                                    </a>
                                  )}
                                </div>
                                {ad.startDate && ad.endDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Active: {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {ad.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={async () => {
                                        try {
                                          await apiRequest("PATCH", `/api/admin/trade-expo-ads/${ad.id}`, { status: "active" });
                                          queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-expo-ads"] });
                                          queryClient.invalidateQueries({ queryKey: ["/api/trade-expo-ads/active"] });
                                          toast({ title: "Expo ad approved" });
                                        } catch (e) {
                                          toast({ title: "Error", description: "Failed to approve", variant: "destructive" });
                                        }
                                      }}
                                      data-testid={`button-approve-expo-${ad.id}`}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={async () => {
                                        try {
                                          await apiRequest("PATCH", `/api/admin/trade-expo-ads/${ad.id}`, { status: "rejected" });
                                          queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-expo-ads"] });
                                          toast({ title: "Expo ad rejected" });
                                        } catch (e) {
                                          toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
                                        }
                                      }}
                                      data-testid={`button-reject-expo-${ad.id}`}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                  </>
                                )}
                                {ad.status === 'active' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await apiRequest("PATCH", `/api/admin/trade-expo-ads/${ad.id}`, { status: "expired" });
                                        queryClient.invalidateQueries({ queryKey: ["/api/admin/trade-expo-ads"] });
                                        queryClient.invalidateQueries({ queryKey: ["/api/trade-expo-ads/active"] });
                                        toast({ title: "Expo ad deactivated" });
                                      } catch (e) {
                                        toast({ title: "Error", description: "Failed to deactivate", variant: "destructive" });
                                      }
                                    }}
                                    data-testid={`button-deactivate-expo-${ad.id}`}
                                  >
                                    <EyeOff className="w-4 h-4 mr-1" /> Deactivate
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5" />
                    Category Management
                  </CardTitle>
                  <CardDescription>Manage product categories</CardDescription>
                </div>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-category">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => {
                            setNewCategoryName(e.target.value);
                            setNewCategorySlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                          }}
                          placeholder="Category name"
                          data-testid="input-category-name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Slug</label>
                        <Input
                          value={newCategorySlug}
                          onChange={(e) => setNewCategorySlug(e.target.value)}
                          placeholder="category-slug"
                          data-testid="input-category-slug"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Icon (optional)</label>
                        <Input
                          value={newCategoryIcon}
                          onChange={(e) => setNewCategoryIcon(e.target.value)}
                          placeholder="Icon name or URL"
                          data-testid="input-category-icon"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={() => createCategoryMutation.mutate({
                          name: newCategoryName,
                          slug: newCategorySlug,
                          icon: newCategoryIcon || undefined,
                        })}
                        disabled={!newCategoryName.trim() || !newCategorySlug.trim() || createCategoryMutation.isPending}
                        data-testid="button-create-category"
                      >
                        {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {categoriesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : categories?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No categories found</div>
                  ) : (
                    <div className="space-y-2">
                      {categories?.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 rounded-md border bg-card"
                          data-testid={`card-category-${category.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                              {category.icon || <FolderTree className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div>
                              <span className="font-medium">{category.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">/{category.slug}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                            disabled={deleteCategoryMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dropship Applications Tab */}
          <TabsContent value="dropship" className="space-y-6">
            <DropshipApplicationsPanel />
          </TabsContent>

          {/* Shipper Applications Tab */}
          <TabsContent value="shippers" className="space-y-6">
            <ShipperApplicationsPanel />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications
                    </CardTitle>
                    <CardDescription>Admin alerts and system notifications</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAllNotificationsReadMutation.mutate()}
                    disabled={markAllNotificationsReadMutation.isPending || (notificationsData?.unreadCount ?? 0) === 0}
                    data-testid="button-mark-all-read"
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={notificationTypeFilter} onValueChange={setNotificationTypeFilter}>
                    <SelectTrigger className="w-48" data-testid="select-notification-filter">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="new_order">New Order</SelectItem>
                      <SelectItem value="payment_received">Payment Received</SelectItem>
                      <SelectItem value="dispute_opened">Dispute Opened</SelectItem>
                      <SelectItem value="dispute_resolved">Dispute Resolved</SelectItem>
                      <SelectItem value="refund_issued">Refund Issued</SelectItem>
                      <SelectItem value="shipment_stale">Shipment Stale</SelectItem>
                      <SelectItem value="new_user">New User</SelectItem>
                      <SelectItem value="subscription_change">Subscription Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[500px]">
                  {notificationsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (() => {
                    const filtered = (notificationsData?.data || []).filter(
                      (n) => notificationTypeFilter === "all" || n.type === notificationTypeFilter
                    );
                    return filtered.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground" data-testid="text-no-notifications">
                        No notifications found
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filtered.map((notification) => {
                          const severityColors: Record<string, string> = {
                            info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                            warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                            critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                          };
                          const typeIcons: Record<string, typeof ShoppingCart> = {
                            new_order: ShoppingCart,
                            payment_received: CreditCard,
                            dispute_opened: AlertTriangle,
                            dispute_resolved: CheckCircle,
                            refund_issued: RefreshCw,
                            shipment_stale: Truck,
                            new_user: UserPlus2,
                            subscription_change: Star,
                          };
                          const TypeIcon = typeIcons[notification.type] || Bell;
                          return (
                            <div
                              key={notification.id}
                              className={`flex items-start gap-3 p-4 rounded-md border ${!notification.isRead ? "bg-muted/50" : ""}`}
                              data-testid={`notification-item-${notification.id}`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <TypeIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium" data-testid={`text-notification-title-${notification.id}`}>
                                    {notification.title}
                                  </p>
                                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${severityColors[notification.severity] || severityColors.info}`} data-testid={`badge-severity-${notification.id}`}>
                                    {notification.severity}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1" data-testid={`text-notification-message-${notification.id}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1" data-testid={`text-notification-time-${notification.id}`}>
                                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markNotificationReadMutation.mutate(notification.id)}
                                  disabled={markNotificationReadMutation.isPending}
                                  data-testid={`button-mark-read-${notification.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-6">
            <InquiriesTab />
          </TabsContent>

          <TabsContent value="trade" className="space-y-6">
            <TradeManagementTab />
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>Recent system and user activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {activityLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (activityLogs || []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-no-activity">
                      No activity logs found
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-4">
                        {(activityLogs || []).map((log) => {
                          const actionIcons: Record<string, typeof Activity> = {
                            order_placed: ShoppingCart,
                            payment_received: CreditCard,
                            invoice_issued: DollarSign,
                            shipped: Truck,
                            delivered: CheckCircle,
                            dispute_opened: AlertTriangle,
                            dispute_resolved: CheckCircle,
                            refund_issued: RefreshCw,
                            escrow_held: Lock,
                            escrow_released: DollarSign,
                          };
                          const actorBadgeVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                            buyer: "outline",
                            seller: "secondary",
                            admin: "destructive",
                            system: "default",
                          };
                          const ActionIcon = actionIcons[log.action] || Activity;
                          return (
                            <div key={log.id} className="relative pl-10" data-testid={`activity-item-${log.id}`}>
                              <div className="absolute left-2 top-1 flex items-center justify-center w-5 h-5 rounded-full bg-background border">
                                <ActionIcon className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <div className="p-3 rounded-md border">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium" data-testid={`text-activity-desc-${log.id}`}>
                                    {log.description}
                                  </p>
                                  <Badge
                                    variant={actorBadgeVariants[log.actorType] || "outline"}
                                    className="text-xs"
                                    data-testid={`badge-actor-${log.id}`}
                                  >
                                    {log.actorType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span data-testid={`text-activity-action-${log.id}`}>{log.action.replace(/_/g, " ")}</span>
                                  {log.orderId && <span>Order #{log.orderId}</span>}
                                  <span data-testid={`text-activity-time-${log.id}`}>
                                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab - Password Change */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your admin account password</CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="outreach" className="space-y-6">
            <ManufacturerOutreachTab />
          </TabsContent>

          {/* Admin Accounts Tab - Super Admin Only */}
          {adminSession?.isSuperAdmin && (
            <TabsContent value="admins" className="space-y-6">
              <AdminAccountsTab currentAdminId={adminSession.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

type EmailCampaign = {
  id: number;
  subject: string;
  content: string;
  recipientType: string;
  customEmails: string | null;
  status: string;
  totalRecipients: number | null;
  sentCount: number | null;
  failedCount: number | null;
  createdBy: string | null;
  sentAt: string | null;
  createdAt: string;
};

type EmailContact = {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  tags: string | null;
  isActive: boolean;
  addedBy: string | null;
  createdAt: string;
};

function EmailCampaignsTab() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"campaigns" | "contacts" | "recipients">("campaigns");
  const [showComposer, setShowComposer] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [customEmails, setCustomEmails] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactTags, setContactTags] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const { data: campaignsData } = useQuery<{ success: boolean; data: EmailCampaign[] }>({
    queryKey: ["/api/admin/email-campaigns"],
  });
  const campaigns = campaignsData?.data || [];

  const { data: contactsData } = useQuery<{ success: boolean; data: EmailContact[] }>({
    queryKey: ["/api/admin/email-contacts"],
  });
  const contacts = contactsData?.data || [];

  const { data: recipientsData } = useQuery<{ success: boolean; data: { email: string; name: string | null; source: string }[]; total: number }>({
    queryKey: ["/api/admin/email-recipients"],
  });
  const recipients = recipientsData?.data || [];

  const { data: statsData } = useQuery<{ success: boolean; data: { total: number; last24h: number; last7d: number } }>({
    queryKey: ["/api/admin/promo-email-stats"],
  });
  const stats = statsData?.data;

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/email-campaigns", {
        subject: campaignSubject,
        content: campaignContent,
        recipientType,
        customEmails: recipientType === "custom" ? customEmails : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-campaigns"] });
      toast({ title: "Campaign created successfully" });
      setShowComposer(false);
      setCampaignSubject("");
      setCampaignContent("");
      setRecipientType("all");
      setCustomEmails("");
    },
    onError: () => toast({ title: "Failed to create campaign", variant: "destructive" }),
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/email-campaigns/${id}/send`);
    },
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-email-stats"] });
      toast({ title: `Campaign sent: ${data.sent} delivered, ${data.failed} failed out of ${data.total}` });
    },
    onError: () => toast({ title: "Failed to send campaign", variant: "destructive" }),
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/email-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-campaigns"] });
      toast({ title: "Campaign deleted" });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/email-contacts", {
        email: contactEmail,
        name: contactName || null,
        company: contactCompany || null,
        tags: contactTags || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-recipients"] });
      toast({ title: "Contact added" });
      setContactEmail("");
      setContactName("");
      setContactCompany("");
      setContactTags("");
    },
    onError: () => toast({ title: "Failed to add contact (may already exist)", variant: "destructive" }),
  });

  const bulkAddMutation = useMutation({
    mutationFn: async () => {
      const lines = bulkEmails.split("\n").filter(l => l.trim());
      const emails = lines.map(line => {
        const parts = line.split(",").map(s => s.trim());
        return { email: parts[0], name: parts[1] || null, company: parts[2] || null };
      });
      return apiRequest("POST", "/api/admin/email-contacts/bulk", { emails });
    },
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-recipients"] });
      toast({ title: `Bulk import: ${data.added} added, ${data.skipped} skipped` });
      setBulkEmails("");
      setShowBulkAdd(false);
    },
    onError: () => toast({ title: "Bulk import failed", variant: "destructive" }),
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/email-contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-recipients"] });
      toast({ title: "Contact removed" });
    },
  });

  const sendAutoRecommendationsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/send-promotional-emails");
    },
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-email-stats"] });
      toast({ title: `Auto recommendations: ${data.sent} sent, ${data.skipped} skipped, ${data.failed} failed` });
    },
    onError: () => toast({ title: "Failed to send auto recommendations", variant: "destructive" }),
  });

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.last24h || 0}</p>
                <p className="text-sm text-muted-foreground">Last 24 Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.last7d || 0}</p>
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{recipients.length}</p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={activeSubTab === "campaigns" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("campaigns")}
          data-testid="subtab-campaigns"
        >
          <Send className="h-4 w-4 mr-1" /> Campaigns
        </Button>
        <Button
          variant={activeSubTab === "contacts" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("contacts")}
          data-testid="subtab-contacts"
        >
          <UserPlus className="h-4 w-4 mr-1" /> Email Contacts
        </Button>
        <Button
          variant={activeSubTab === "recipients" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveSubTab("recipients")}
          data-testid="subtab-recipients"
        >
          <Users className="h-4 w-4 mr-1" /> All Recipients
        </Button>
      </div>

      {activeSubTab === "campaigns" && (
        <>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowComposer(true)} data-testid="button-new-campaign">
              <Plus className="h-4 w-4 mr-1" /> New Campaign
            </Button>
            <Button
              variant="outline"
              onClick={() => sendAutoRecommendationsMutation.mutate()}
              disabled={sendAutoRecommendationsMutation.isPending}
              data-testid="button-send-auto-recommendations"
            >
              {sendAutoRecommendationsMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Star className="h-4 w-4 mr-1" />}
              Send Auto Recommendations
            </Button>
          </div>

          {showComposer && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Compose Email Campaign</CardTitle>
                <CardDescription>Create a promotional email to send to your users. Use {"{{name}}"} to personalize with recipient name.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-subject">Subject Line</Label>
                  <Input
                    id="campaign-subject"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="e.g. New products just arrived on Ghani Africa!"
                    data-testid="input-campaign-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-content">Email Content (HTML supported)</Label>
                  <Textarea
                    id="campaign-content"
                    value={campaignContent}
                    onChange={(e) => setCampaignContent(e.target.value)}
                    placeholder="Write your email content here... Use HTML tags for formatting. Use {{name}} for personalization."
                    rows={10}
                    data-testid="input-campaign-content"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select value={recipientType} onValueChange={setRecipientType}>
                    <SelectTrigger data-testid="select-recipient-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users & Contacts ({recipients.length})</SelectItem>
                      <SelectItem value="subscribers">Subscribed Users Only</SelectItem>
                      <SelectItem value="custom">Custom Email List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {recipientType === "custom" && (
                  <div className="space-y-2">
                    <Label>Custom Emails (comma-separated)</Label>
                    <Textarea
                      value={customEmails}
                      onChange={(e) => setCustomEmails(e.target.value)}
                      placeholder="email1@example.com, email2@example.com"
                      rows={3}
                      data-testid="input-custom-emails"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => createCampaignMutation.mutate()}
                    disabled={createCampaignMutation.isPending || !campaignSubject || !campaignContent}
                    data-testid="button-save-campaign"
                  >
                    {createCampaignMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Save Campaign
                  </Button>
                  <Button variant="outline" onClick={() => setShowComposer(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>View and manage your promotional email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No campaigns yet. Click "New Campaign" to create one.</p>
              ) : (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border rounded-lg p-4" data-testid={`campaign-${campaign.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{campaign.subject}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{campaign.content.replace(/<[^>]*>/g, '').substring(0, 150)}...</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <Badge variant={campaign.status === "sent" ? "default" : campaign.status === "sending" ? "secondary" : campaign.status === "draft" ? "outline" : "destructive"}>
                              {campaign.status}
                            </Badge>
                            <span>To: {campaign.recipientType === "all" ? "All Users & Contacts" : campaign.recipientType === "subscribers" ? "Subscribers" : "Custom List"}</span>
                            {campaign.sentAt && <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>}
                            {campaign.totalRecipients && campaign.totalRecipients > 0 && (
                              <span>{campaign.sentCount}/{campaign.totalRecipients} delivered</span>
                            )}
                            <span>Created by: {campaign.createdBy || "admin"}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-4">
                          {campaign.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => sendCampaignMutation.mutate(campaign.id)}
                              disabled={sendCampaignMutation.isPending}
                              data-testid={`button-send-campaign-${campaign.id}`}
                            >
                              {sendCampaignMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                              Send
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                            disabled={deleteCampaignMutation.isPending}
                            data-testid={`button-delete-campaign-${campaign.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeSubTab === "contacts" && (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Add Email Contact</CardTitle>
              <CardDescription>Add professional emails for promotional communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Email address *"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  data-testid="input-contact-email"
                />
                <Input
                  placeholder="Name (optional)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  data-testid="input-contact-name"
                />
                <Input
                  placeholder="Company (optional)"
                  value={contactCompany}
                  onChange={(e) => setContactCompany(e.target.value)}
                  data-testid="input-contact-company"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => addContactMutation.mutate()}
                    disabled={addContactMutation.isPending || !contactEmail}
                    className="flex-1"
                    data-testid="button-add-contact"
                  >
                    {addContactMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => setShowBulkAdd(!showBulkAdd)} data-testid="button-bulk-add">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {showBulkAdd && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                  <Label className="text-sm font-semibold">Bulk Import (one per line: email, name, company)</Label>
                  <Textarea
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    placeholder={"john@company.com, John Doe, ACME Corp\njane@business.com, Jane Smith, TradeNet"}
                    rows={5}
                    className="mt-2"
                    data-testid="input-bulk-emails"
                  />
                  <Button
                    onClick={() => bulkAddMutation.mutate()}
                    disabled={bulkAddMutation.isPending || !bulkEmails.trim()}
                    className="mt-2"
                    size="sm"
                    data-testid="button-import-bulk"
                  >
                    {bulkAddMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    Import Contacts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Contacts ({contacts.length})</CardTitle>
              <CardDescription>Professional email contacts for promotional communications</CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No contacts added yet. Add emails above or use bulk import.</p>
              ) : (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between border rounded-lg p-3" data-testid={`contact-${contact.id}`}>
                        <div>
                          <p className="font-medium text-sm">{contact.email}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {contact.name && <span>{contact.name}</span>}
                            {contact.company && <span>- {contact.company}</span>}
                            {contact.tags && <Badge variant="outline" className="text-[10px] px-1">{contact.tags}</Badge>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteContactMutation.mutate(contact.id)}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeSubTab === "recipients" && (
        <Card>
          <CardHeader>
            <CardTitle>All Email Recipients ({recipients.length})</CardTitle>
            <CardDescription>Combined list of registered users (opted-in) and admin-added contacts who will receive promotional emails</CardDescription>
          </CardHeader>
          <CardContent>
            {recipients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recipients available.</p>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-1">
                  {recipients.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50" data-testid={`recipient-${idx}`}>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{r.email}</p>
                          {r.name && <p className="text-xs text-muted-foreground">{r.name}</p>}
                        </div>
                      </div>
                      <Badge variant={r.source === "registered" ? "default" : "secondary"} className="text-xs">
                        {r.source === "registered" ? "Registered User" : "Contact"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { toast } = useToast();

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/change-password", { currentPassword, newPassword });
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to change password", 
        description: error?.message || "Please try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    
    changePasswordMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            data-testid="input-current-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            data-testid="input-new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          data-testid="input-confirm-password"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={changePasswordMutation.isPending}
        data-testid="button-change-password"
      >
        {changePasswordMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Changing...
          </>
        ) : (
          "Change Password"
        )}
      </Button>
    </form>
  );
}

function AdminAccountsTab({ currentAdminId }: { currentAdminId: number }) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newIsSuperAdmin, setNewIsSuperAdmin] = useState(false);
  const [resetPasswordAdminId, setResetPasswordAdminId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const { data: admins, isLoading } = useQuery<AdminAccount[]>({
    queryKey: ["/api/admin/accounts"],
  });

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/accounts", {
        username: newUsername,
        password: newPassword,
        displayName: newDisplayName || undefined,
        email: newEmail || undefined,
        isSuperAdmin: newIsSuperAdmin,
      });
    },
    onSuccess: () => {
      toast({ title: "Admin account created" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
      setIsCreateDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setNewEmail("");
      setNewIsSuperAdmin(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create admin", 
        description: error?.message,
        variant: "destructive" 
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/accounts/${id}`, { isActive: !isActive });
    },
    onSuccess: () => {
      toast({ title: "Admin status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update status", description: error?.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      return apiRequest("POST", `/api/admin/accounts/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: "Password reset successfully" });
      setResetPasswordAdminId(null);
      setResetPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to reset password", description: error?.message, variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/accounts/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Admin deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accounts"] });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete admin", description: error?.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Admin Accounts
            </CardTitle>
            <CardDescription>Manage administrator accounts</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-admin">
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Admin Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="admin_username"
                    data-testid="input-new-admin-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    data-testid="input-new-admin-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Optional"
                    data-testid="input-new-admin-displayname"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="For password recovery"
                    data-testid="input-new-admin-email"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isSuperAdmin"
                    checked={newIsSuperAdmin}
                    onChange={(e) => setNewIsSuperAdmin(e.target.checked)}
                    className="h-4 w-4"
                    data-testid="checkbox-super-admin"
                  />
                  <Label htmlFor="isSuperAdmin">Super Admin (can manage other admins)</Label>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() => createAdminMutation.mutate()}
                  disabled={!newUsername || !newPassword || newPassword.length < 8 || createAdminMutation.isPending}
                  data-testid="button-create-admin"
                >
                  {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : admins?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No admin accounts found</div>
          ) : (
            <div className="space-y-3">
              {admins?.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 rounded-md border bg-card"
                  data-testid={`card-admin-${admin.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{admin.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{admin.displayName || admin.username}</span>
                        {admin.isSuperAdmin && (
                          <Badge variant="default" className="text-xs">Super Admin</Badge>
                        )}
                        {!admin.isActive && (
                          <Badge variant="destructive" className="text-xs">Disabled</Badge>
                        )}
                        {admin.id === currentAdminId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{admin.username}
                        {admin.email && <span className="ml-2">{admin.email}</span>}
                      </div>
                      {admin.lastLoginAt && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Last login: {new Date(admin.lastLoginAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {admin.id !== currentAdminId && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Dialog open={resetPasswordAdminId === admin.id} onOpenChange={(open) => {
                        if (!open) {
                          setResetPasswordAdminId(null);
                          setResetPassword("");
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setResetPasswordAdminId(admin.id)}
                            data-testid={`button-reset-password-${admin.id}`}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password for {admin.username}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>New Password</Label>
                              <Input
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                data-testid="input-reset-password"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={() => resetPasswordMutation.mutate({ id: admin.id, newPassword: resetPassword })}
                              disabled={resetPassword.length < 8 || resetPasswordMutation.isPending}
                              data-testid="button-confirm-reset"
                            >
                              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant={admin.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleStatusMutation.mutate({ id: admin.id, isActive: admin.isActive })}
                        disabled={toggleStatusMutation.isPending}
                        data-testid={`button-toggle-status-${admin.id}`}
                      >
                        {admin.isActive ? (
                          <>
                            <Ban className="h-4 w-4 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Enable
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this admin account?")) {
                            deleteAdminMutation.mutate(admin.id);
                          }
                        }}
                        disabled={deleteAdminMutation.isPending}
                        data-testid={`button-delete-admin-${admin.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DropshipApplicationsPanel() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: applications, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/dropship/applications', statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all"
        ? '/api/admin/dropship/applications'
        : `/api/admin/dropship/applications?status=${statusFilter}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      return data.data || [];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/dropship/applications/${id}/decide`, {
        status,
        notes: adminNotes,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      });
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: `Application ${vars.status}` });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith?.('/api/admin/dropship/applications') || query.queryKey[0] === '/api/admin/dropship/applications' });
      setSelectedApp(null);
      setAdminNotes("");
      setRejectionReason("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/dropship/applications/${id}/revoke`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Application revoked" });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith?.('/api/admin/dropship/applications') || query.queryKey[0] === '/api/admin/dropship/applications' });
      setSelectedApp(null);
    },
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      revoked: "bg-orange-100 text-orange-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Dropship Applications
          </CardTitle>
          <CardDescription>Review and manage dropshipping applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {["submitted", "approved", "rejected", "revoked", "all"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-dropship-${s}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !applications?.length ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-applications">
              No {statusFilter === "all" ? "" : statusFilter} applications found.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-application-${app.id}`}>
                  <CardContent className="p-4" onClick={() => { setSelectedApp(app); setAdminNotes(""); setRejectionReason(""); }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{app.companyName?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium" data-testid={`text-company-${app.id}`}>{app.companyName || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.applicationType} &middot; User: {app.userId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(app.status)}
                        {app.submittedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <p className="font-medium" data-testid="text-detail-company">{selectedApp.companyName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedApp.applicationType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>{statusBadge(selectedApp.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fulfillment Capacity</Label>
                  <p className="font-medium">{selectedApp.fulfillmentCapacity || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Avg Lead Time</Label>
                  <p className="font-medium">{selectedApp.avgLeadTimeDays ? `${selectedApp.avgLeadTimeDays} days` : "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Experience Level</Label>
                  <p className="font-medium">{selectedApp.experienceLevel || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="font-medium">{selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleString() : "Not yet"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="font-medium">{selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString() : "N/A"}</p>
                </div>
                {selectedApp.decidedAt && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Decided</Label>
                    <p className="font-medium">{new Date(selectedApp.decidedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedApp.decidedBy && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Decided By</Label>
                    <p className="font-medium">{selectedApp.decidedBy}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Business Description</Label>
                <p className="text-sm">{selectedApp.businessDescription || "N/A"}</p>
              </div>

              {selectedApp.countriesServed?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Countries Served</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApp.countriesServed.map((c: string) => (
                      <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.website && (
                <div>
                  <Label className="text-xs text-muted-foreground">Website</Label>
                  <a href={selectedApp.website} target="_blank" rel="noopener" className="text-sm text-primary hover:underline flex items-center gap-1">
                    {selectedApp.website} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {selectedApp.referenceLinks && (
                <div>
                  <Label className="text-xs text-muted-foreground">References</Label>
                  <p className="text-sm">{selectedApp.referenceLinks}</p>
                </div>
              )}

              {selectedApp.adminNotes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                  <p className="text-sm">{selectedApp.adminNotes}</p>
                </div>
              )}

              {selectedApp.rejectionReason && (
                <div>
                  <Label className="text-xs text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm text-red-600">{selectedApp.rejectionReason}</p>
                </div>
              )}

              {selectedApp.status === 'submitted' && (
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Optional notes about this application..."
                      data-testid="input-admin-notes"
                    />
                  </div>
                  <div>
                    <Label>Rejection Reason (if rejecting)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      data-testid="input-rejection-reason"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => decideMutation.mutate({ id: selectedApp.id, status: 'approved' })}
                      disabled={decideMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-approve"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          toast({ title: "Please provide a rejection reason", variant: "destructive" });
                          return;
                        }
                        decideMutation.mutate({ id: selectedApp.id, status: 'rejected' });
                      }}
                      disabled={decideMutation.isPending}
                      data-testid="button-reject"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedApp.status === 'approved' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revokeMutation.mutate(selectedApp.id)}
                    disabled={revokeMutation.isPending}
                    data-testid="button-revoke"
                  >
                    {revokeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Revoke Access
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ShipperApplicationsPanel() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: applications, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/shipper/applications', statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all"
        ? '/api/admin/shipper/applications'
        : `/api/admin/shipper/applications?status=${statusFilter}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      return data.data || [];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/shipper/applications/${id}/decide`, {
        status,
        notes: adminNotes,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      });
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: `Application ${vars.status}` });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.includes?.('/api/admin/shipper/applications') });
      setSelectedApp(null);
      setAdminNotes("");
      setRejectionReason("");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/admin/shipper/applications/${id}/revoke`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Shipper access revoked" });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.includes?.('/api/admin/shipper/applications') });
      setSelectedApp(null);
    },
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      revoked: "bg-orange-100 text-orange-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipper Applications
          </CardTitle>
          <CardDescription>Review and manage courier/shipper applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {["submitted", "approved", "rejected", "revoked", "all"].map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-shipper-${s}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !applications?.length ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-shipper-apps">
              No {statusFilter === "all" ? "" : statusFilter} shipper applications found.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-shipper-app-${app.id}`}>
                  <CardContent className="p-4" onClick={() => { setSelectedApp(app); setAdminNotes(""); setRejectionReason(""); }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{app.companyName?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{app.companyName || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">
                            {app.companyType} &middot; Fleet: {app.fleetSize || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {statusBadge(app.status)}
                        {app.submittedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedApp} onOpenChange={(o) => !o && setSelectedApp(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipper Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{selectedApp.companyName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company Type</Label>
                  <p className="font-medium">{selectedApp.companyType || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>{statusBadge(selectedApp.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fleet Size</Label>
                  <p className="font-medium">{selectedApp.fleetSize || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Experience</Label>
                  <p className="font-medium">{selectedApp.experienceYears ? `${selectedApp.experienceYears} years` : "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Insurance</Label>
                  <p className="font-medium">{selectedApp.hasInsurance ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedApp.contactPhone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedApp.contactEmail || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="font-medium">{selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleString() : "Not yet"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="font-medium">{selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>

              {selectedApp.vehicleTypes?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle Types</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApp.vehicleTypes.map((v: string) => (
                      <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.serviceRegions?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Service Regions</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApp.serviceRegions.map((r: string) => (
                      <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApp.businessDescription && (
                <div>
                  <Label className="text-xs text-muted-foreground">Business Description</Label>
                  <p className="text-sm">{selectedApp.businessDescription}</p>
                </div>
              )}

              {selectedApp.adminNotes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                  <p className="text-sm">{selectedApp.adminNotes}</p>
                </div>
              )}

              {selectedApp.rejectionReason && (
                <div>
                  <Label className="text-xs text-muted-foreground">Rejection Reason</Label>
                  <p className="text-sm text-red-600">{selectedApp.rejectionReason}</p>
                </div>
              )}

              {selectedApp.status === 'submitted' && (
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label>Admin Notes</Label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Optional notes about this application..."
                      data-testid="input-shipper-admin-notes"
                    />
                  </div>
                  <div>
                    <Label>Rejection Reason (if rejecting)</Label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      data-testid="input-shipper-rejection-reason"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => decideMutation.mutate({ id: selectedApp.id, status: 'approved' })}
                      disabled={decideMutation.isPending}
                      data-testid="button-approve-shipper"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          toast({ title: "Please provide a rejection reason", variant: "destructive" });
                          return;
                        }
                        decideMutation.mutate({ id: selectedApp.id, status: 'rejected' });
                      }}
                      disabled={decideMutation.isPending}
                      data-testid="button-reject-shipper"
                    >
                      {decideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {selectedApp.status === 'approved' && (
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revokeMutation.mutate(selectedApp.id)}
                    disabled={revokeMutation.isPending}
                    data-testid="button-revoke-shipper"
                  >
                    {revokeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Revoke Access
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/reset-password", { token, newPassword });
    },
    onSuccess: () => {
      toast({ title: "Password reset successfully! Please login with your new password." });
      setLocation("/admin");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to reset password", 
        description: error?.message || "The reset link may have expired",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    resetPasswordMutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/admin")} data-testid="button-back-to-login">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Key className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  data-testid="input-new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                data-testid="input-confirm-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={resetPasswordMutation.isPending}
              data-testid="button-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type ContactInquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  adminRepliedAt: string | null;
  adminRepliedBy: number | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

function InquiriesTab() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  const { data: inquiriesData, isLoading } = useQuery<{ success: boolean; data: ContactInquiry[]; newCount: number }>({
    queryKey: ["/api/admin/inquiries", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/admin/inquiries" : `/api/admin/inquiries?status=${statusFilter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch inquiries");
      return response.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/inquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Status updated" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: number; reply: string }) => {
      return apiRequest("POST", `/api/admin/inquiries/${id}/reply`, { reply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Reply sent", description: "The user has been notified via email." });
      setReplyDialogOpen(false);
      setReplyText("");
      setSelectedInquiry(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    },
  });

  const inquiries = inquiriesData?.data || [];
  const newCount = inquiriesData?.newCount || 0;

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "new": return "destructive";
      case "in_progress": return "default";
      case "resolved": return "secondary";
      case "closed": return "outline";
      default: return "outline";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Contact Inquiries
                {newCount > 0 && (
                  <Badge variant="destructive" data-testid="badge-new-inquiries">{newCount} new</Badge>
                )}
              </CardTitle>
              <CardDescription>Manage and respond to user inquiries submitted through the contact form</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-inquiry-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No inquiries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inquiry) => (
                <Card key={inquiry.id} className="border" data-testid={`card-inquiry-${inquiry.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm" data-testid={`text-inquiry-name-${inquiry.id}`}>{inquiry.name}</span>
                          <Badge variant={getStatusBadgeVariant(inquiry.status)} data-testid={`badge-inquiry-status-${inquiry.id}`}>
                            {inquiry.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(inquiry.createdAt)}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground" data-testid={`text-inquiry-subject-${inquiry.id}`}>{inquiry.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{inquiry.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />{inquiry.email}
                          </span>
                          {inquiry.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />{inquiry.phone}
                            </span>
                          )}
                        </div>
                        {inquiry.adminReply && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                              <Reply className="h-3 w-3" /> Admin Reply
                              {inquiry.adminRepliedAt && <span className="font-normal"> - {formatDate(inquiry.adminRepliedAt)}</span>}
                            </p>
                            <p className="text-sm text-green-800 dark:text-green-300">{inquiry.adminReply}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {inquiry.status !== "resolved" && inquiry.status !== "closed" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInquiry(inquiry);
                              setReplyText("");
                              setReplyDialogOpen(true);
                            }}
                            data-testid={`button-reply-${inquiry.id}`}
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        )}
                        {inquiry.status === "new" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "in_progress" })}
                            data-testid={`button-mark-progress-${inquiry.id}`}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </Button>
                        )}
                        {inquiry.status !== "closed" && inquiry.adminReply && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "closed" })}
                            data-testid={`button-close-${inquiry.id}`}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reply to Inquiry
            </DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-sm font-medium">{selectedInquiry.name} - {selectedInquiry.subject}</p>
                <p className="text-sm text-muted-foreground">{selectedInquiry.message}</p>
                <p className="text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 inline mr-1" />{selectedInquiry.email}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Your Reply</Label>
                <Textarea
                  placeholder="Type your response here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-32"
                  data-testid="textarea-admin-reply"
                />
                <p className="text-xs text-muted-foreground">
                  This reply will be sent via email to {selectedInquiry.email}
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() => {
                    if (selectedInquiry && replyText.trim().length >= 5) {
                      replyMutation.mutate({ id: selectedInquiry.id, reply: replyText.trim() });
                    } else {
                      toast({ title: "Reply too short", description: "Please write at least 5 characters.", variant: "destructive" });
                    }
                  }}
                  disabled={replyMutation.isPending || replyText.trim().length < 5}
                  data-testid="button-send-reply"
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TradeManagementTab() {
  const { data: taxRatesResponse, isLoading: taxRatesLoading } = useQuery<{
    success: boolean;
    data: Array<{
      id: number;
      countryCode: string;
      countryName: string;
      vatRate: number;
      importDutyRate: number;
      exportDutyRate: number;
      customsProcessingFee: number;
      digitalTaxRate: number;
      currency: string;
      isActive: boolean;
      notes: string | null;
    }>;
  }>({
    queryKey: ["/api/trade/tax-rates"],
  });

  const { data: shippingZonesResponse, isLoading: shippingZonesLoading } = useQuery<{
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      originCountryCode: string;
      destinationCountryCode: string;
      zoneType: "domestic" | "cross_border";
      baseShippingCost: number;
      perKgRate: number;
      estimatedDaysMin: number;
      estimatedDaysMax: number;
      isActive: boolean;
      notes: string | null;
    }>;
  }>({
    queryKey: ["/api/trade/shipping-zones"],
  });

  const taxRates = taxRatesResponse?.data || [];
  const shippingZones = shippingZonesResponse?.data || [];

  const formatPercentage = (value: any) => `${parseFloat(value || 0).toFixed(0)}%`;
  const formatCurrency = (value: any) => `$${parseFloat(value || 0).toFixed(2)}`;
  const getZoneTypeBadgeVariant = (zoneType: string): "default" | "secondary" => {
    return zoneType === "domestic" ? "secondary" : "default";
  };

  return (
    <div className="space-y-6">
      {/* Country Tax Rates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <div>
              <CardTitle>Country Tax Rates</CardTitle>
              <CardDescription>VAT, import duty, export duty, and customs fees by country</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {taxRatesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : taxRates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tax rates available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-tax-rates">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Country</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">VAT Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Import Duty</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Export Duty</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Customs Fee</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Digital Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {taxRates.map((rate) => (
                    <tr key={rate.id} className="border-b hover:bg-muted/50" data-testid={`row-tax-${rate.countryCode}`}>
                      <td className="py-3 px-4 text-sm">
                        <div className="font-medium">{rate.countryName}</div>
                        <div className="text-xs text-muted-foreground">{rate.countryCode}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{formatPercentage(rate.vatRate)}</td>
                      <td className="py-3 px-4 text-sm">{formatPercentage(rate.importDutyRate)}</td>
                      <td className="py-3 px-4 text-sm">{formatPercentage(rate.exportDutyRate)}</td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(rate.customsProcessingFee)}</td>
                      <td className="py-3 px-4 text-sm">{formatPercentage(rate.digitalTaxRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Zones Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <div>
              <CardTitle>Shipping Zones</CardTitle>
              <CardDescription>Shipping routes with costs and estimated delivery times</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shippingZonesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : shippingZones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shipping zones available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-shipping-zones">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Zone Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Base Cost</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Per Kg Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Est. Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingZones.map((zone) => (
                    <tr key={zone.id} className="border-b hover:bg-muted/50" data-testid={`row-zone-${zone.id}`}>
                      <td className="py-3 px-4 text-sm font-medium">{zone.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {zone.originCountryCode} → {zone.destinationCountryCode}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <Badge variant={getZoneTypeBadgeVariant(zone.zoneType)}>
                          {zone.zoneType === "domestic" ? "Domestic" : "Cross Border"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(zone.baseShippingCost)}</td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(zone.perKgRate)}</td>
                      <td className="py-3 px-4 text-sm">
                        {zone.estimatedDaysMin}-{zone.estimatedDaysMax} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ManufacturerOutreachTab() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [newContact, setNewContact] = useState({ email: '', businessName: '', contactPerson: '', country: '', industry: '', notes: '' });
  const [bulkText, setBulkText] = useState('');

  const outreachQueryUrl = (() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (countryFilter !== 'all') params.set('country', countryFilter);
    const qs = params.toString();
    return qs ? `/api/admin/outreach?${qs}` : '/api/admin/outreach';
  })();

  const { data: contacts, isLoading } = useQuery<any>({
    queryKey: ['/api/admin/outreach', statusFilter, countryFilter],
    queryFn: async () => {
      const res = await fetch(outreachQueryUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch outreach contacts');
      return res.json();
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ['/api/admin/outreach/stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/outreach/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/outreach', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Contact added successfully" });
      setNewContact({ email: '', businessName: '', contactPerson: '', country: '', industry: '', notes: '' });
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach/stats'] });
    },
    onError: (err: any) => toast({ title: "Failed to add contact", description: err.message, variant: "destructive" }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (text: string) => {
      const lines = text.split('\n').filter(l => l.trim());
      const contacts = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          email: parts[0] || '',
          businessName: parts[1] || '',
          contactPerson: parts[2] || '',
          country: parts[3] || '',
          industry: parts[4] || '',
        };
      }).filter(c => c.email.includes('@'));
      const res = await apiRequest('POST', '/api/admin/outreach/bulk', { contacts });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: `Import complete: ${data.created} added, ${data.skipped} skipped` });
      setBulkText('');
      setShowBulkImport(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach/stats'] });
    },
    onError: () => toast({ title: "Bulk import failed", variant: "destructive" }),
  });

  const inviteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/outreach/${id}/invite`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invitation email sent!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach/stats'] });
    },
    onError: () => toast({ title: "Failed to send invite", variant: "destructive" }),
  });

  const inviteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/outreach/invite-all');
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: `Invitations sent: ${data.sent} successful, ${data.failed} failed` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach/stats'] });
    },
    onError: () => toast({ title: "Failed to send invitations", variant: "destructive" }),
  });

  const followUpMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/outreach/${id}/follow-up`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.message || "Follow-up sent!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach'] });
    },
    onError: () => toast({ title: "Failed to send follow-up", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/outreach/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Contact removed" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/outreach/stats'] });
    },
    onError: () => toast({ title: "Failed to delete contact", variant: "destructive" }),
  });

  const outreachData = contacts?.data || [];
  const statsData = stats?.data || { total: 0, pending: 0, invited: 0, reminded: 0, signedUp: 0 };

  const countries = [...new Set(outreachData.map((c: any) => c.country).filter(Boolean))].sort();

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-gray-100 text-gray-700",
      invited: "bg-blue-100 text-blue-700",
      reminded: "bg-yellow-100 text-yellow-700",
      signed_up: "bg-green-100 text-green-700",
      unsubscribed: "bg-red-100 text-red-700",
    };
    return <Badge className={styles[status] || "bg-gray-100"} data-testid={`badge-status-${status}`}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold" data-testid="text-outreach-total">{statsData.total}</p>
            <p className="text-sm text-muted-foreground">Total Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600" data-testid="text-outreach-pending">{statsData.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600" data-testid="text-outreach-invited">{statsData.invited}</p>
            <p className="text-sm text-muted-foreground">Invited</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600" data-testid="text-outreach-reminded">{statsData.reminded}</p>
            <p className="text-sm text-muted-foreground">Reminded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600" data-testid="text-outreach-signedUp">{statsData.signedUp}</p>
            <p className="text-sm text-muted-foreground">Signed Up</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Manufacturer Outreach
              </CardTitle>
              <CardDescription>Add and manage manufacturer contacts to invite them to join Ghani Africa</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-contact">
                <Plus className="h-4 w-4 mr-1" /> Add Contact
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowBulkImport(!showBulkImport)} data-testid="button-bulk-import">
                <Upload className="h-4 w-4 mr-1" /> Bulk Import
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => inviteAllMutation.mutate()}
                disabled={inviteAllMutation.isPending || statsData.pending === 0}
                data-testid="button-invite-all"
              >
                {inviteAllMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Invite All Pending ({statsData.pending})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      placeholder="manufacturer@company.com"
                      value={newContact.email}
                      onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                      data-testid="input-outreach-email"
                    />
                  </div>
                  <div>
                    <Label>Business Name</Label>
                    <Input
                      placeholder="Company Ltd."
                      value={newContact.businessName}
                      onChange={e => setNewContact({ ...newContact, businessName: e.target.value })}
                      data-testid="input-outreach-business"
                    />
                  </div>
                  <div>
                    <Label>Contact Person</Label>
                    <Input
                      placeholder="John Doe"
                      value={newContact.contactPerson}
                      onChange={e => setNewContact({ ...newContact, contactPerson: e.target.value })}
                      data-testid="input-outreach-person"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      placeholder="Kenya"
                      value={newContact.country}
                      onChange={e => setNewContact({ ...newContact, country: e.target.value })}
                      data-testid="input-outreach-country"
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input
                      placeholder="Textiles, Agriculture, etc."
                      value={newContact.industry}
                      onChange={e => setNewContact({ ...newContact, industry: e.target.value })}
                      data-testid="input-outreach-industry"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      placeholder="Optional notes"
                      value={newContact.notes}
                      onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
                      data-testid="input-outreach-notes"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addContactMutation.mutate(newContact)}
                    disabled={!newContact.email || addContactMutation.isPending}
                    data-testid="button-save-contact"
                  >
                    {addContactMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    Add Contact
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {showBulkImport && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <Label>Paste contacts (one per line, CSV format: email, business name, contact person, country, industry)</Label>
                <Textarea
                  placeholder={"manufacturer1@company.com, Acme Ltd, John Doe, Kenya, Textiles\nmanufacturer2@company.com, XYZ Corp, Jane Smith, Nigeria, Agriculture"}
                  rows={6}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  data-testid="textarea-bulk-import"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => bulkImportMutation.mutate(bulkText)}
                    disabled={!bulkText.trim() || bulkImportMutation.isPending}
                    data-testid="button-import-contacts"
                  >
                    {bulkImportMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    Import Contacts
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowBulkImport(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-outreach-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="reminded">Reminded</SelectItem>
                <SelectItem value="signed_up">Signed Up</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-40" data-testid="select-outreach-country">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c: string) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : outreachData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No outreach contacts yet. Add manufacturers to start inviting them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Email</th>
                    <th className="text-left py-2 px-3">Business</th>
                    <th className="text-left py-2 px-3 hidden md:table-cell">Contact</th>
                    <th className="text-left py-2 px-3 hidden md:table-cell">Country</th>
                    <th className="text-left py-2 px-3 hidden lg:table-cell">Industry</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3 hidden lg:table-cell">Follow-ups</th>
                    <th className="text-right py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outreachData.map((contact: any) => (
                    <tr key={contact.id} className="border-b hover:bg-muted/50" data-testid={`row-outreach-${contact.id}`}>
                      <td className="py-2 px-3 font-mono text-xs">{contact.email}</td>
                      <td className="py-2 px-3">{contact.businessName || '-'}</td>
                      <td className="py-2 px-3 hidden md:table-cell">{contact.contactPerson || '-'}</td>
                      <td className="py-2 px-3 hidden md:table-cell">{contact.country || '-'}</td>
                      <td className="py-2 px-3 hidden lg:table-cell">{contact.industry || '-'}</td>
                      <td className="py-2 px-3">{getStatusBadge(contact.status)}</td>
                      <td className="py-2 px-3 hidden lg:table-cell">{contact.followUpCount || 0}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {contact.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => inviteMutation.mutate(contact.id)}
                              disabled={inviteMutation.isPending}
                              data-testid={`button-invite-${contact.id}`}
                            >
                              <Send className="h-3 w-3 mr-1" /> Invite
                            </Button>
                          )}
                          {(contact.status === 'invited' || contact.status === 'reminded') && (contact.followUpCount || 0) < 2 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => followUpMutation.mutate(contact.id)}
                              disabled={followUpMutation.isPending}
                              data-testid={`button-followup-${contact.id}`}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" /> Follow Up
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => deleteMutation.mutate(contact.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-outreach-${contact.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
