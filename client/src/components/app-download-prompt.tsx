import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Download, Laptop, Share, Plus } from "lucide-react";
import { SiApple, SiGoogleplay } from "react-icons/si";
import { useI18n } from "@/lib/i18n";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { useToast } from "@/hooks/use-toast";
import appIcon from "@assets/generated_images/ghani_africa_app_icon.png";

type DeviceType = "ios" | "android" | "windows" | "mac" | "other";

function detectDevice(): DeviceType {
  if (typeof window === "undefined") return "other";
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || "";
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }
  if (/android/.test(userAgent)) {
    return "android";
  }
  if (/win/.test(platform) || /windows/.test(userAgent)) {
    return "windows";
  }
  if (/mac/.test(platform)) {
    return "mac";
  }
  return "other";
}

interface AppDownloadPromptProps {
  onClose?: () => void;
}

export function AppDownloadPrompt({ onClose }: AppDownloadPromptProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const { canInstall, isInstalled, isIOS, installApp } = usePWAInstall();
  const [device, setDevice] = useState<DeviceType>("other");
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem("app-download-prompt-dismissed");
    if (hasSeenPrompt) {
      setDismissed(true);
    }
    setDevice(detectDevice());
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("app-download-prompt-dismissed", "true");
    setDismissed(true);
    onClose?.();
  };

  const handleRemindLater = () => {
    setDismissed(true);
    onClose?.();
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const result = await installApp();
      if (result.success) {
        toast({
          title: "App Installed!",
          description: "Ghani Africa has been added to your device.",
        });
        handleDismiss();
      } else if (result.reason === "no-prompt") {
        toast({
          title: "Installation not available",
          description: "Please use your browser's install option or add to home screen.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Installation failed",
        description: "Please try again or use browser menu to install.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already installed or dismissed
  if (dismissed || isInstalled) return null;

  const isMobile = device === "ios" || device === "android";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background/95 to-background/80 backdrop-blur-sm border-t" data-testid="banner-app-download">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-md">
              <img 
                src={appIcon} 
                alt="Ghani Africa App" 
                className="w-full h-full object-cover"
                data-testid="img-app-icon"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold">Install Ghani Africa App</h3>
                <Badge variant="secondary" className="text-xs">Free</Badge>
              </div>
              
              {isIOS ? (
                <div className="text-sm text-muted-foreground mb-3">
                  <p className="mb-2">To install on iOS:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Tap the <Share className="w-3 h-3 inline mx-1" /> Share button below</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to install</li>
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  {isMobile 
                    ? "Install our app for the best shopping experience on the go!"
                    : "Install our app for faster access and notifications!"
                  }
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {canInstall && (
                  <Button 
                    size="sm" 
                    className="gap-2" 
                    onClick={handleInstall}
                    disabled={isInstalling}
                    data-testid="button-install-app"
                  >
                    <Download className={`w-4 h-4 ${isInstalling ? 'animate-pulse' : ''}`} />
                    {isInstalling ? "Installing..." : "Install Now"}
                  </Button>
                )}

                {isIOS && (
                  <Button size="sm" variant="outline" className="gap-2" data-testid="button-ios-share">
                    <Share className="w-4 h-4" />
                    Share to Install
                  </Button>
                )}

                {!canInstall && !isIOS && device === "android" && (
                  <Button size="sm" className="gap-2" onClick={handleInstall} data-testid="button-download-android">
                    <SiGoogleplay className="w-4 h-4" />
                    Install App
                  </Button>
                )}
                
                {!canInstall && !isIOS && (device === "windows" || device === "mac" || device === "other") && (
                  <Button size="sm" className="gap-2" onClick={handleInstall} data-testid="button-download-desktop">
                    <Laptop className="w-4 h-4" />
                    Install App
                  </Button>
                )}

                <Button size="sm" variant="ghost" onClick={handleRemindLater} data-testid="button-remind-later">
                  Maybe Later
                </Button>
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="flex-shrink-0"
              onClick={handleDismiss}
              data-testid="button-close-download-prompt"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AppDownloadSection() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { canInstall, isInstalled, isIOS, installApp } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  
  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const result = await installApp();
      if (result.success) {
        toast({
          title: "App Installed!",
          description: "Ghani Africa has been added to your device.",
        });
      } else if (result.reason === "no-prompt") {
        toast({
          title: "Use browser menu to install",
          description: "Click the install icon in your browser's address bar, or use the menu to 'Install app' or 'Add to Home Screen'.",
        });
      }
    } catch (error) {
      toast({
        title: "Installation failed",
        description: "Please try using your browser's install option.",
        variant: "destructive",
      });
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mx-auto mb-6">
            <img 
              src={appIcon} 
              alt="Ghani Africa App" 
              className="w-full h-full object-cover"
              data-testid="img-section-app-icon"
            />
          </div>
          <Badge variant="secondary" className="mb-4">
            {isInstalled ? "Installed" : "Install Now"}
          </Badge>
          <h2 className="text-3xl font-bold mb-4">Get the Ghani Africa App</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isInstalled 
              ? "You've already installed the app. Enjoy shopping!"
              : "Install our app for instant notifications, faster checkout, and the best shopping experience."
            }
          </p>
          
          {!isInstalled && (
            <div className="mt-6">
              {canInstall ? (
                <Button 
                  size="lg" 
                  className="gap-2" 
                  onClick={handleInstall}
                  disabled={isInstalling}
                  data-testid="button-install-main"
                >
                  <Download className={`w-5 h-5 ${isInstalling ? 'animate-pulse' : ''}`} />
                  {isInstalling ? "Installing..." : "Install App Now"}
                </Button>
              ) : isIOS ? (
                <div className="bg-card rounded-lg p-4 max-w-md mx-auto text-left">
                  <p className="font-medium mb-2">To install on iOS:</p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span>1.</span>
                      <span>Tap the <Share className="w-4 h-4 inline mx-1" /> Share button in Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>2.</span>
                      <span>Scroll and tap <Plus className="w-4 h-4 inline mx-1" /> "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>3.</span>
                      <span>Tap "Add" to complete installation</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  className="gap-2" 
                  onClick={handleInstall}
                  data-testid="button-install-fallback"
                >
                  <Download className="w-5 h-5" />
                  Install App
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover-elevate" data-testid="card-feature-offline">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Works Offline</h3>
              <p className="text-sm text-muted-foreground">
                Browse products even without an internet connection
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-fast">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Laptop className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Instant loading with native app performance
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-feature-home">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Home Screen Access</h3>
              <p className="text-sm text-muted-foreground">
                Launch directly from your home screen like any app
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Available on all devices - iOS, Android, Windows, and Mac
          </p>
        </div>
      </div>
    </section>
  );
}
