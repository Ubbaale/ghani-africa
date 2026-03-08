import { useState } from "react";
import { Link, useLocation } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from "@/components/language-selector";

import { Eye, EyeOff, Loader2, CheckCircle, ShoppingBag, Store, Factory, ArrowLeft } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["consumer", "trader", "manufacturer"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const ROLE_OPTIONS = [
  {
    value: "consumer" as const,
    title: "Buyer / Consumer",
    description: "I want to shop and buy products",
    icon: ShoppingBag,
    features: ["Browse products across Africa", "Compare prices and deals", "Track your orders"],
  },
  {
    value: "trader" as const,
    title: "Business / Trader",
    description: "I want to sell and trade products",
    icon: Store,
    features: ["Create your online store", "List and sell products", "Access wholesale pricing"],
  },
  {
    value: "manufacturer" as const,
    title: "Manufacturer / Supplier",
    description: "I produce or supply products",
    icon: Factory,
    features: ["Connect with bulk buyers", "Offer wholesale pricing", "Enable dropshipping"],
  },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [step, setStep] = useState<"role" | "details">("role");

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "consumer",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...registerData } = data;
      const res = await apiRequest("POST", "/api/auth/register", registerData);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresVerification && data.email) {
        setLocation(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setRegistrationSuccess(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const selectedRole = form.watch("role");

  if (registrationSuccess) {
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
            <h2 className="text-xl font-semibold">Check Your Email</h2>
            <p className="text-muted-foreground">
              We've sent a verification link to your email address. Please click the link to verify your account.
            </p>
            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-africa-sand/20 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <GradientLogo size="xl" showText={false} linkTo="" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {step === "role" ? "How will you use Ghani Africa?" : "Create Your Account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {step === "role" 
                ? "Select your account type to get started" 
                : "Complete your registration details"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === "role" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {ROLE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedRole === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => form.setValue("role", option.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover-elevate ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                      data-testid={`button-role-${option.value}`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold mb-1">{option.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                      <ul className="space-y-1">
                        {option.features.map((feature, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <Button
                onClick={() => setStep("details")}
                className="w-full"
                data-testid="button-continue-to-details"
              >
                Continue
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("role")}
                  className="mb-2"
                  data-testid="button-back-to-role"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change account type
                </Button>
                
                <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3 mb-4">
                  {(() => {
                    const option = ROLE_OPTIONS.find(r => r.value === selectedRole);
                    const Icon = option?.icon || ShoppingBag;
                    return (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{option?.title}</p>
                          <p className="text-xs text-muted-foreground">{option?.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            data-testid="input-first-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            data-testid="input-last-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 8 characters"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          )}
          {step === "details" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-login">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
