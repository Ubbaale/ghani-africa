import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { GradientLogo } from "@/components/gradient-logo";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LanguageSelector } from "@/components/language-selector";

import { Loader2, CheckCircle, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const searchParams = new URLSearchParams(search);
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!email) {
      setLocation("/register");
    }
  }, [email, setLocation]);

  const verifyMutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", {
        email,
        code: verificationCode,
      });
      return res.json();
    },
    onSuccess: () => {
      setVerified(true);
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully. You can now log in.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-code", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Code Sent",
        description: "A new verification code has been sent to your email.",
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not send verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      verifyMutation.mutate(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split("");
      setCode(newCode);
      verifyMutation.mutate(pastedData);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-africa-sand/20 relative">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Email Verified</h2>
            <p className="text-muted-foreground">
              Your email has been verified successfully. You can now log in to your account.
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <GradientLogo size="xl" showText={false} linkTo="" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Enter the 6-digit code sent to
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{email}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold"
                disabled={verifyMutation.isPending}
                data-testid={`input-code-${index}`}
              />
            ))}
          </div>

          {verifyMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              The code expires in 15 minutes
            </p>
            <Button
              variant="outline"
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="gap-2"
              data-testid="button-resend-code"
            >
              {resendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Resend Code
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/register")}
              className="text-sm"
              data-testid="button-back-to-register"
            >
              Use a different email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
