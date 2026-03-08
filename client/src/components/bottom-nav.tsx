import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, MessageCircle, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import logoImg from "@assets/IMG_7385_1771959199058.png";

const navItems = [
  { path: "/", icon: null, labelKey: "nav.home", label: "Home", isLogo: true },
  { path: "/browse", icon: Search, labelKey: "nav.browse", label: "Browse", isLogo: false },
  { path: "/cart", icon: ShoppingCart, labelKey: "nav.cart", label: "Cart", isLogo: false },
  { path: "/messages", icon: MessageCircle, labelKey: "nav.chat", label: "Chat", isLogo: false },
  { path: "/dashboard", icon: User, labelKey: "nav.profile", label: "Profile", isLogo: false },
];

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useI18n();
  const { user } = useAuth();

  const { data: cartItems } = useQuery<any[]>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const cartCount = cartItems?.length || 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} data-testid="mobile-bottom-nav">
      <div className="bg-background/95 backdrop-blur-md border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/" && location.startsWith(item.path));
            const translated = t(item.labelKey);
            const translatedLabel = (translated && translated !== item.labelKey) ? translated : item.label;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-xl transition-colors relative",
                  isActive 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {isActive && (
                  <div className="absolute -top-1 w-6 h-1 rounded-full bg-primary" />
                )}
                <div className="relative">
                  {item.isLogo ? (
                    <img
                      src={logoImg}
                      alt="Home"
                      className={cn(
                        "h-6 w-6 rounded-full object-cover transition-all",
                        isActive ? "opacity-100 scale-110" : "opacity-70"
                      )}
                    />
                  ) : item.icon ? (
                    <item.icon className={cn(
                      "h-5 w-5 transition-all",
                      isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                    )} />
                  ) : null}
                  {item.path === "/cart" && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1" data-testid="badge-cart-count">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium leading-tight",
                  isActive && "font-semibold"
                )}>
                  {translatedLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
