import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID;

export function FacebookPixel() {
  const [location] = useLocation();

  useEffect(() => {
    if (!FB_PIXEL_ID) return;

    const script = document.createElement("script");
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${FB_PIXEL_ID}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement("noscript");
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1"/>`;
    document.body.appendChild(noscript);

    return () => {
      document.head.removeChild(script);
      document.body.removeChild(noscript);
    };
  }, []);

  useEffect(() => {
    if (!FB_PIXEL_ID || !window.fbq) return;
    
    window.fbq("track", "PageView");
  }, [location]);

  return null;
}

export function fbTrackEvent(eventName: string, params?: Record<string, unknown>) {
  if (!FB_PIXEL_ID || !window.fbq) return;
  
  window.fbq("track", eventName, params);
}

export function fbTrackPurchase(value: number, currency: string = "USD") {
  fbTrackEvent("Purchase", { value, currency });
}

export function fbTrackAddToCart(productId: number, productName: string, value: number) {
  fbTrackEvent("AddToCart", {
    content_ids: [productId],
    content_name: productName,
    value,
    currency: "USD",
  });
}

export function fbTrackViewContent(productId: number, productName: string, value: number) {
  fbTrackEvent("ViewContent", {
    content_ids: [productId],
    content_name: productName,
    value,
    currency: "USD",
  });
}

export function fbTrackSearch(searchString: string) {
  fbTrackEvent("Search", { search_string: searchString });
}

export function fbTrackLead() {
  fbTrackEvent("Lead");
}

export function fbTrackCompleteRegistration() {
  fbTrackEvent("CompleteRegistration");
}
