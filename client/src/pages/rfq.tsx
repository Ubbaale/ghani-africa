import { useState } from "react";
import { GradientLogo } from "@/components/gradient-logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";
import { Loader2, FileText, CheckCircle, ArrowLeft, Send } from "lucide-react";


const rfqSchema = z.object({
  productName: z.string().min(3, "Product name must be at least 3 characters"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Please select a unit"),
  details: z.string().optional(),
  targetPrice: z.coerce.number().optional(),
  currency: z.string().default("USD"),
  country: z.string().optional(),
});

type RfqForm = z.infer<typeof rfqSchema>;

const UNITS = [
  { value: "pieces", label: "Pieces" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "tons", label: "Tons" },
  { value: "boxes", label: "Boxes" },
  { value: "cartons", label: "Cartons" },
  { value: "pallets", label: "Pallets" },
  { value: "containers", label: "Containers" },
  { value: "liters", label: "Liters" },
  { value: "meters", label: "Meters" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "NGN", label: "NGN" },
  { value: "KES", label: "KES" },
  { value: "ZAR", label: "ZAR" },
  { value: "GHS", label: "GHS" },
  { value: "EGP", label: "EGP" },
];

const AFRICAN_COUNTRIES = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", "Ethiopia", "Tanzania",
  "Uganda", "Morocco", "Algeria", "Cameroon", "Ivory Coast", "Senegal", "Zimbabwe",
  "Zambia", "Rwanda", "Angola", "Mozambique", "Tunisia", "DRC", "Mali"
];

export default function RFQ() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<RfqForm>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      productName: "",
      quantity: 1,
      unit: "pieces",
      details: "",
      targetPrice: undefined,
      currency: "USD",
      country: "",
    },
  });

  const createRfqMutation = useMutation({
    mutationFn: async (data: RfqForm) => {
      const res = await apiRequest("POST", "/api/rfq", data);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/rfq"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit request",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RfqForm) => {
    createRfqMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-africa-sand/20 relative">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Request Submitted!</h2>
            <p className="text-muted-foreground">
              Your request for quotation has been submitted successfully. Suppliers will be notified and can respond with their quotes.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setSubmitted(false)} className="w-full" data-testid="button-submit-another">
                Submit Another Request
              </Button>
              <Link href="/browse">
                <Button variant="outline" className="w-full" data-testid="button-browse-products">
                  Browse Products
                </Button>
              </Link>
              {user && (
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full" data-testid="button-view-requests">
                    View My Requests
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-africa-sand/20 relative">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <GradientLogo size="xl" showText={false} linkTo="" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <FileText className="h-6 w-6" />
              Request for Quotation
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Tell suppliers what you need and receive competitive quotes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Organic Cocoa Beans"
                        data-testid="input-product-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="100"
                          data-testid="input-quantity"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Price (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="0.00"
                          data-testid="input-target-price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Country (optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-country">
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Details (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe specifications, quality requirements, delivery preferences..."
                        className="min-h-[100px]"
                        data-testid="input-details"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createRfqMutation.isPending}
                data-testid="button-submit-rfq"
              >
                {createRfqMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>
          </Form>

          {!user && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
              {" "}to track your requests and receive quote notifications
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
