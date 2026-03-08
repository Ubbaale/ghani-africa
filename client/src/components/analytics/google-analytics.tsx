import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const [location] = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}', {
        page_path: window.location.pathname,
      });
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;
    
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: location,
    });
  }, [location]);

  return null;
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

export function trackPurchase(transactionId: string, value: number, currency: string = "USD") {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag("event", "purchase", {
    transaction_id: transactionId,
    value: value,
    currency: currency,
  });
}

export function trackAddToCart(productId: number, productName: string, price: number) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag("event", "add_to_cart", {
    items: [{
      item_id: productId,
      item_name: productName,
      price: price,
    }],
  });
}

export function trackProductView(productId: number, productName: string, price: number) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag("event", "view_item", {
    items: [{
      item_id: productId,
      item_name: productName,
      price: price,
    }],
  });
}

export function trackSearch(searchTerm: string) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag("event", "search", {
    search_term: searchTerm,
  });
}

export function trackSignUp(method: string = "replit") {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag("event", "sign_up", {
    method: method,
  });
}
