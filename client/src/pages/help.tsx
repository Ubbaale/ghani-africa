import { useState } from "react";
import { Link } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  HelpCircle,
  ShoppingCart,
  CreditCard,
  Truck,
  Shield,
  MessageCircle,
  Users,
  Store,
  FileText,
  Mail,
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  Send,
  Clock,
  Reply,
  Inbox,
} from "lucide-react";

const HELP_CATEGORIES = [
  {
    id: "buying",
    title: "Buying on Ghani Africa",
    icon: ShoppingCart,
    description: "How to browse, order, and pay for products",
  },
  {
    id: "selling",
    title: "Selling on Ghani Africa",
    icon: Store,
    description: "Setting up your store and managing products",
  },
  {
    id: "payments",
    title: "Payments & Wallet",
    icon: CreditCard,
    description: "Payment methods, wallet, and transactions",
  },
  {
    id: "shipping",
    title: "Shipping & Delivery",
    icon: Truck,
    description: "Delivery options, tracking, and logistics",
  },
  {
    id: "security",
    title: "Security & Trust",
    icon: Shield,
    description: "Account security and trade assurance",
  },
  {
    id: "account",
    title: "Account & Profile",
    icon: Users,
    description: "Managing your account settings",
  },
];

const FAQ_DATA = [
  {
    category: "buying",
    questions: [
      {
        q: "How do I place an order?",
        a: "Browse products, add items to your cart, and proceed to checkout. You can pay using your wallet balance or other payment methods.",
      },
      {
        q: "Can I buy from sellers in other African countries?",
        a: "Yes! Ghani Africa connects buyers and sellers across all African countries. You can filter products by country and arrange cross-border shipping.",
      },
      {
        q: "How do I contact a seller?",
        a: "Click the 'Message Seller' button on any product page or seller's store to start a conversation.",
      },
      {
        q: "What is the Request for Quotation (RFQ) feature?",
        a: "RFQ allows you to describe what you need and receive competitive quotes from multiple suppliers. Great for bulk orders or specific requirements.",
      },
    ],
  },
  {
    category: "selling",
    questions: [
      {
        q: "How do I start selling?",
        a: "Register an account, select 'Trader' or 'Manufacturer' as your role, complete your profile, and start listing products from your dashboard.",
      },
      {
        q: "What are the seller subscription tiers?",
        a: "We offer Free, Verified Seller ($19/mo), Highly Recommended ($49/mo), and Enterprise ($149/mo) tiers with varying commission rates and features.",
      },
      {
        q: "How do I get the Verified Seller badge?",
        a: "Subscribe to a paid tier and complete our verification process. This builds trust with buyers and reduces your commission rate.",
      },
      {
        q: "How do I manage my store?",
        a: "Access your Seller Dashboard to manage products, view orders, respond to messages, and track your sales analytics.",
      },
    ],
  },
  {
    category: "payments",
    questions: [
      {
        q: "How does the wallet work?",
        a: "Your wallet holds your funds for purchases and sales. Add funds via bank transfer, mobile money, or card. Withdraw anytime to your linked account.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We support credit/debit cards, bank transfers, mobile money (M-Pesa, etc.), and wallet balance.",
      },
      {
        q: "How do I withdraw my earnings?",
        a: "Go to your Wallet page, click 'Withdraw', enter the amount, and select your withdrawal method. Processing takes 1-3 business days.",
      },
      {
        q: "What are the transaction fees?",
        a: "Commission rates vary by subscription tier: Free (8%), Verified (5%), Highly Recommended (3%), Enterprise (1.5%).",
      },
    ],
  },
  {
    category: "shipping",
    questions: [
      {
        q: "How is shipping handled?",
        a: "Sellers arrange shipping and provide tracking information. You can track your order status in the Orders section.",
      },
      {
        q: "Can I ship internationally within Africa?",
        a: "Yes! Many sellers offer cross-border shipping. Shipping costs and times vary by destination.",
      },
      {
        q: "What if my order doesn't arrive?",
        a: "Contact the seller first. If unresolved, open a dispute through the order page and our team will help mediate.",
      },
    ],
  },
  {
    category: "security",
    questions: [
      {
        q: "How does Trade Assurance protect me?",
        a: "Payments are held in escrow until you confirm receipt. If there's an issue, our dispute resolution team will help.",
      },
      {
        q: "How do I report a suspicious seller?",
        a: "Click the 'Report' button on the seller's profile or contact our support team directly.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes, all transactions are encrypted and we never store your full card details. We use industry-standard security.",
      },
    ],
  },
  {
    category: "account",
    questions: [
      {
        q: "How do I update my profile?",
        a: "Go to Dashboard > Profile to update your personal information, business details, and preferences.",
      },
      {
        q: "How do I change my password?",
        a: "Use the 'Forgot Password' option on the login page or update it in your account settings.",
      },
      {
        q: "Can I switch between buyer and seller accounts?",
        a: "Your account supports both. To sell, simply go to Dashboard and start adding products.",
      },
    ],
  },
];

export default function Help() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    email: user?.email || "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Success",
        description: "Your inquiry has been submitted. We'll get back to you soon!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit your inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject || formData.message.trim().length < 10) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and ensure message is at least 10 characters.",
        variant: "destructive",
      });
      return;
    }
    contactMutation.mutate(formData);
  };

  const handleResetForm = () => {
    setFormData({
      name: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
      email: user?.email || "",
      phone: "",
      subject: "",
      message: "",
    });
    setSubmitted(false);
  };

  const filteredFAQs = selectedCategory
    ? FAQ_DATA.filter((f) => f.category === selectedCategory)
    : FAQ_DATA;

  const searchFilteredFAQs = searchQuery
    ? filteredFAQs.map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (q) =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.questions.length > 0)
    : filteredFAQs;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <GradientLogo size="sm" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Help Center
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">How can we help you?</h2>
            <p className="text-muted-foreground">
              Search our knowledge base or browse by category
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-help"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {HELP_CATEGORIES.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-colors hover-elevate ${
                  selectedCategory === category.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
                data-testid={`card-category-${category.id}`}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <category.icon className="h-8 w-8 mx-auto text-primary" />
                  <h3 className="font-semibold text-sm">{category.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold">
              {selectedCategory
                ? HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.title
                : "Frequently Asked Questions"}
            </h3>

            {searchFilteredFAQs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results found. Try a different search term or browse by category.
                </CardContent>
              </Card>
            ) : (
              searchFilteredFAQs.map((category) => (
                <div key={category.category} className="space-y-2">
                  {!selectedCategory && (
                    <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
                      {HELP_CATEGORIES.find((c) => c.id === category.category)?.title}
                    </h4>
                  )}
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((faq, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${category.category}-${idx}`}
                        className="border rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-left" data-testid={`faq-${category.category}-${idx}`}>
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            )}
          </div>

          {user && <MyInquiries />}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Still need help?
              </CardTitle>
              <CardDescription>
                Our support team is here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Email Support</p>
                    <p className="text-xs text-muted-foreground">support@ghaniafrica.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Phone Support</p>
                    <p className="text-xs text-muted-foreground">+234 800 123 4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Head Office</p>
                    <p className="text-xs text-muted-foreground">Lagos, Nigeria</p>
                  </div>
                </div>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        data-testid="input-contact-name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        data-testid="input-contact-email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+234 800 123 4567"
                        value={formData.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Select value={formData.subject} onValueChange={(value) => handleFormChange("subject", value)}>
                        <SelectTrigger id="subject" data-testid="select-contact-subject">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                          <SelectItem value="Product Question">Product Question</SelectItem>
                          <SelectItem value="Order Issue">Order Issue</SelectItem>
                          <SelectItem value="Shipping & Delivery">Shipping & Delivery</SelectItem>
                          <SelectItem value="Payment Problem">Payment Problem</SelectItem>
                          <SelectItem value="Account Help">Account Help</SelectItem>
                          <SelectItem value="Seller Support">Seller Support</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your inquiry in detail (minimum 10 characters)..."
                      value={formData.message}
                      onChange={(e) => handleFormChange("message", e.target.value)}
                      data-testid="textarea-contact-message"
                      required
                      minLength={10}
                      className="min-h-32"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length} characters (minimum 10)
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="button-submit-inquiry"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Inquiry
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" data-testid="text-inquiry-success">
                      Thank you for your inquiry!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We've received your message and will get back to you within 24-48 hours.
                    </p>
                  </div>
                  <Button
                    onClick={handleResetForm}
                    variant="outline"
                    className="w-full"
                  >
                    Submit Another Inquiry
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

type UserInquiry = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  adminRepliedAt: string | null;
  createdAt: string;
};

function MyInquiries() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ success: boolean; data: UserInquiry[] }>({
    queryKey: ["/api/my-inquiries"],
  });

  const inquiries = data?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (inquiries.length === 0) return null;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      new: "destructive",
      in_progress: "default",
      resolved: "secondary",
      closed: "outline",
    };
    const labels: Record<string, string> = {
      new: "Pending",
      in_progress: "In Progress",
      resolved: "Answered",
      closed: "Closed",
    };
    return <Badge variant={variants[status] || "outline"} data-testid={`badge-my-inquiry-status-${status}`}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <Card data-testid="card-my-inquiries">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          My Inquiries
          {inquiries.some(i => i.status === "resolved" && i.adminReply) && (
            <Badge variant="secondary" className="ml-1" data-testid="badge-has-replies">
              New replies
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Track your past support requests and responses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            className="border rounded-lg p-4 space-y-2 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setExpanded(expanded === inquiry.id ? null : inquiry.id)}
            data-testid={`card-my-inquiry-${inquiry.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm" data-testid={`text-my-inquiry-subject-${inquiry.id}`}>{inquiry.subject}</span>
                  {getStatusBadge(inquiry.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(inquiry.createdAt)}
                </p>
              </div>
              {inquiry.adminReply && (
                <Reply className="h-4 w-4 text-green-600 shrink-0 mt-1" />
              )}
            </div>

            {expanded === inquiry.id && (
              <div className="mt-3 space-y-3 pt-3 border-t">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your message:</p>
                  <p className="text-sm whitespace-pre-wrap" data-testid={`text-my-inquiry-message-${inquiry.id}`}>{inquiry.message}</p>
                </div>
                {inquiry.adminReply ? (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                      <Reply className="h-3 w-3" />
                      Support Response
                      {inquiry.adminRepliedAt && (
                        <span className="font-normal"> — {formatDate(inquiry.adminRepliedAt)}</span>
                      )}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap" data-testid={`text-my-inquiry-reply-${inquiry.id}`}>
                      {inquiry.adminReply}
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Awaiting response from our support team
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
