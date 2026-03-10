import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { BottomNav } from "@/components/bottom-nav";
import { FloatingActionButton } from "@/components/floating-action-button";
import { getRandomTheme, applyTheme, type AfricanTheme } from "@/lib/african-themes";
import { CurrencyProvider } from "@/lib/currency-context";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { FacebookPixel } from "@/components/analytics/facebook-pixel";
import { setDefaultMetaTags } from "@/components/seo/meta-tags";
import { OfflineIndicator } from "@/components/offline-indicator";
import NotFound from "@/pages/not-found";
import africaMapBg from "@assets/generated_images/africa_continent_outline_silhouette.png";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import ProductDetail from "@/pages/product-detail";
import Dashboard from "@/pages/dashboard";
import Cart from "@/pages/cart";
import Messages from "@/pages/messages";
import Orders from "@/pages/orders";
import Wallet from "@/pages/wallet";
import Dropship from "@/pages/dropship";
import Shipper from "@/pages/shipper";
import Admin, { AdminResetPassword } from "@/pages/admin";
import Advertising from "@/pages/advertising";
import StorePage from "@/pages/store";
import Subscription from "@/pages/subscription";
import Wishlist from "@/pages/wishlist";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import VerifyEmail from "@/pages/verify-email";
import RFQ from "@/pages/rfq";
import Help from "@/pages/help";
import Suppliers from "@/pages/suppliers";
import TradeAssurance from "@/pages/trade-assurance";
import Sell from "@/pages/sell";
import TradeExpoAdvertise from "@/pages/trade-expo-advertise";
import OrderTracking from "@/pages/order-tracking";
import SellerShipping from "@/pages/seller-shipping";
import PublicTracking from "@/pages/public-tracking";
import TrustSafety from "@/pages/trust-safety";
import SecureTransactions from "@/pages/secure-transactions";
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout-success";
import CheckoutCancel from "@/pages/checkout-cancel";
import GroupBuyPage from "@/pages/group-buy";
import GroupBuyNew from "@/pages/group-buy-new";
import ReferralsPage from "@/pages/referrals";
import BnplPage from "@/pages/bnpl";
import TradeDocumentsPage from "@/pages/trade-documents";
import StorefrontBuilder from "@/pages/storefront-builder";
import StorefrontView from "@/pages/storefront-view";
import CommodityPricesPage from "@/pages/commodity-prices";
import BuyerVerificationPage from "@/pages/buyer-verification";
import CommunityPage from "@/pages/community";
import LogisticsPartnersPage from "@/pages/logistics-partners";
import TradeEventsPage from "@/pages/trade-events";
import AgriExchangePage from "@/pages/agri-exchange";
import LiveShoppingPage from "@/pages/live-shopping";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/browse" component={Browse} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/cart" component={Cart} />
      <Route path="/messages" component={Messages} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id/track" component={OrderTracking} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/dropship" component={Dropship} />
      <Route path="/shipper" component={Shipper} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/reset-password" component={AdminResetPassword} />
      <Route path="/dashboard/advertising" component={Advertising} />
      <Route path="/dashboard/subscription" component={Subscription} />
      <Route path="/dashboard/shipping" component={SellerShipping} />
      <Route path="/store/:slug" component={StorePage} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/rfq" component={RFQ} />
      <Route path="/help" component={Help} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/trade-assurance" component={TradeAssurance} />
      <Route path="/sell" component={Sell} />
      <Route path="/trade-expo-advertise" component={TradeExpoAdvertise} />
      <Route path="/track" component={PublicTracking} />
      <Route path="/trust-safety" component={TrustSafety} />
      <Route path="/secure-transactions" component={SecureTransactions} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/checkout/cancel" component={CheckoutCancel} />
      <Route path="/group-buy/new" component={GroupBuyNew} />
      <Route path="/group-buy/:id" component={GroupBuyPage} />
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/bnpl" component={BnplPage} />
      <Route path="/trade-documents" component={TradeDocumentsPage} />
      <Route path="/storefront-builder" component={StorefrontBuilder} />
      <Route path="/storefront/:slug" component={StorefrontView} />
      <Route path="/commodity-prices" component={CommodityPricesPage} />
      <Route path="/buyer-verification" component={BuyerVerificationPage} />
      <Route path="/community" component={CommunityPage} />
      <Route path="/logistics" component={LogisticsPartnersPage} />
      <Route path="/trade-events" component={TradeEventsPage} />
      <Route path="/agri-exchange" component={AgriExchangePage} />
      <Route path="/live-shopping" component={LiveShoppingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentTheme, setCurrentTheme] = useState<AfricanTheme | null>(null);

  useEffect(() => {
    setDefaultMetaTags();
    
    const theme = getRandomTheme();
    setCurrentTheme(theme);
    
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(theme, isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDarkNow = document.documentElement.classList.contains("dark");
          applyTheme(theme, isDarkNow);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <I18nProvider>
          <CurrencyProvider>
            <GoogleAnalytics />
            <FacebookPixel />
            <OfflineIndicator />
            <div className="min-h-screen bg-background pb-20 md:pb-0 relative mobile-bottom-padding">
            <div 
              className="fixed inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.03] bg-no-repeat bg-center bg-contain z-0"
              style={{ backgroundImage: `url(${africaMapBg})` }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <Router />
              <FloatingActionButton />
              <BottomNav />
            </div>
            {currentTheme && (
              <div 
                className="fixed bottom-20 md:bottom-4 left-4 bg-card/90 backdrop-blur-sm border rounded-md px-3 py-1.5 text-xs text-muted-foreground z-50"
                data-testid="theme-indicator"
              >
                Theme: {currentTheme.country}
              </div>
            )}
            </div>
            <Toaster />
          </CurrencyProvider>
        </I18nProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
