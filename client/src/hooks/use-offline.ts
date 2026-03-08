import { useState, useEffect, useCallback } from "react";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const cacheProductForOffline = useCallback((productId: number) => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "CACHE_PRODUCT",
        url: `/api/products/${productId}`,
      });
    }
  }, []);

  const getSavedProducts = useCallback((): number[] => {
    try {
      const saved = localStorage.getItem("ghani-saved-offline");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  const saveProductOffline = useCallback(
    (productId: number) => {
      cacheProductForOffline(productId);
      const saved = getSavedProducts();
      if (!saved.includes(productId)) {
        saved.push(productId);
        localStorage.setItem("ghani-saved-offline", JSON.stringify(saved));
      }
    },
    [cacheProductForOffline, getSavedProducts],
  );

  const removeProductOffline = useCallback(
    (productId: number) => {
      const saved = getSavedProducts().filter((id: number) => id !== productId);
      localStorage.setItem("ghani-saved-offline", JSON.stringify(saved));
    },
    [getSavedProducts],
  );

  const isProductSaved = useCallback(
    (productId: number): boolean => {
      return getSavedProducts().includes(productId);
    },
    [getSavedProducts],
  );

  return {
    isOnline,
    saveProductOffline,
    removeProductOffline,
    isProductSaved,
    getSavedProducts,
  };
}
