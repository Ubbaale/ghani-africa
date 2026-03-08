import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number;
  country?: string;
}

interface LocationInfo {
  country: string;
  countryCode: string;
  city?: string;
  isAfrican: boolean;
}

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (currency: CurrencyInfo) => void;
  currencies: CurrencyInfo[];
  isLoading: boolean;
  isDetecting: boolean;
  detectedLocation: LocationInfo | null;
  detectCurrency: () => Promise<void>;
  formatPrice: (price: number, showOriginal?: boolean, sourceCurrency?: string) => string;
  formatOriginalPrice: (price: number, currencyCode: string) => string;
  convertPrice: (priceUSD: number) => { display: string; amount: number; symbol: string };
}

const DEFAULT_CURRENCY: CurrencyInfo = {
  code: "USD",
  name: "US Dollar",
  symbol: "$",
  rateToUSD: 1,
};

const CurrencyContext = createContext<CurrencyContextType | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyInfo>(DEFAULT_CURRENCY);
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<LocationInfo | null>(null);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch("/api/currencies");
        const result = await response.json();
        if (result.success && result.data) {
          const uniqueCurrencies = Array.from(
            new Map(result.data.map((c: CurrencyInfo) => [c.code, c])).values()
          ) as CurrencyInfo[];
          setCurrencies([DEFAULT_CURRENCY, ...uniqueCurrencies]);
        }
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("preferredCurrency");
    const savedLocation = localStorage.getItem("detectedLocation");
    if (savedCurrency) {
      try {
        const parsed = JSON.parse(savedCurrency);
        setCurrencyState(parsed);
        setHasAutoDetected(true);
      } catch {
        localStorage.removeItem("preferredCurrency");
      }
    }
    if (savedLocation) {
      try {
        setDetectedLocation(JSON.parse(savedLocation));
      } catch {
        localStorage.removeItem("detectedLocation");
      }
    }
  }, []);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("preferredCurrency");
    const sessionDetected = sessionStorage.getItem("currencyDetected");
    if (!hasAutoDetected && !savedCurrency && !sessionDetected && !isLoading && currencies.length > 1) {
      detectCurrency();
    }
  }, [currencies, isLoading, hasAutoDetected]);

  const setCurrency = (newCurrency: CurrencyInfo) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("preferredCurrency", JSON.stringify(newCurrency));
    setHasAutoDetected(true);
  };

  const detectCurrency = async (): Promise<void> => {
    setIsDetecting(true);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(`/api/geo/detect?timezone=${encodeURIComponent(tz)}`);
      const result = await response.json();

      if (result.success && result.data) {
        const { country, countryCode, city, isAfrican, currency: detectedCurrencyData } = result.data;
        
        const locationInfo: LocationInfo = { country, countryCode, city, isAfrican };
        setDetectedLocation(locationInfo);
        localStorage.setItem("detectedLocation", JSON.stringify(locationInfo));

        if (detectedCurrencyData && isAfrican) {
          let finalCurrency: CurrencyInfo = { ...detectedCurrencyData, country };
          let finalCountry = country;

          try {
            const profileRes = await fetch("/api/profile");
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData?.country && profileData.country.toLowerCase() !== country.toLowerCase()) {
                const profileCurrRes = await fetch(`/api/currencies/country/${encodeURIComponent(profileData.country)}`);
                const profileCurrResult = await profileCurrRes.json();
                if (profileCurrResult.success && profileCurrResult.data) {
                  finalCurrency = { ...profileCurrResult.data, country: profileData.country };
                  finalCountry = profileData.country;
                }
              }
            }
          } catch {}

          setCurrency(finalCurrency);
          sessionStorage.setItem("currencyDetected", "true");

          toast({
            title: `Location: ${finalCountry}`,
            description: `Prices now shown in ${finalCurrency.name} (${finalCurrency.symbol})`,
          });
          setIsDetecting(false);
          setHasAutoDetected(true);
          return;
        }
      }
    } catch (error) {
      console.error("IP geolocation failed, trying GPS fallback:", error);
    }

    const tryProfileFallback = async () => {
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData?.country) {
            const currencyResponse = await fetch(`/api/currencies/country/${encodeURIComponent(profileData.country)}`);
            const currencyResult = await currencyResponse.json();
            if (currencyResult.success && currencyResult.data) {
              const detectedCurrency = { ...currencyResult.data, country: profileData.country };
              setCurrency(detectedCurrency);
              sessionStorage.setItem("currencyDetected", "true");
              toast({
                title: `Profile location: ${profileData.country}`,
                description: `Prices shown in ${detectedCurrency.name} (${detectedCurrency.symbol})`,
              });
            }
          }
        }
      } catch {}
    };

    if (navigator.geolocation) {
      return new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const geoResponse = await fetch(`/api/geo/countries?lat=${latitude}&lng=${longitude}`);
              const geoResult = await geoResponse.json();

              if (geoResult.success && geoResult.data?.detectedCountry) {
                const countryName = geoResult.data.detectedCountry.name;
                const countryCode = geoResult.data.detectedCountry.code;

                const locationInfo: LocationInfo = { country: countryName, countryCode, isAfrican: true };
                setDetectedLocation(locationInfo);
                localStorage.setItem("detectedLocation", JSON.stringify(locationInfo));

                const currencyResponse = await fetch(`/api/currencies/country/${encodeURIComponent(countryName)}`);
                const currencyResult = await currencyResponse.json();

                if (currencyResult.success && currencyResult.data) {
                  const detectedCurrency = {
                    ...currencyResult.data,
                    country: countryName,
                  };
                  setCurrency(detectedCurrency);
                  sessionStorage.setItem("currencyDetected", "true");

                  toast({
                    title: `Location: ${countryName}`,
                    description: `Prices now shown in ${detectedCurrency.name} (${detectedCurrency.symbol})`,
                  });
                }
              } else {
                await tryProfileFallback();
              }
            } catch (error) {
              console.error("GPS currency detection failed:", error);
              await tryProfileFallback();
            } finally {
              setIsDetecting(false);
              setHasAutoDetected(true);
              resolve();
            }
          },
          async () => {
            await tryProfileFallback();
            setIsDetecting(false);
            setHasAutoDetected(true);
            sessionStorage.setItem("currencyDetected", "true");
            resolve();
          },
          { timeout: 10000, maximumAge: 300000 }
        );
      });
    }

    await tryProfileFallback();
    setIsDetecting(false);
    setHasAutoDetected(true);
    sessionStorage.setItem("currencyDetected", "true");
  };

  const convertPrice = (priceUSD: number): { display: string; amount: number; symbol: string } => {
    if (currency.code === "USD") {
      return { 
        display: `$${priceUSD.toFixed(2)}`, 
        amount: priceUSD,
        symbol: "$"
      };
    }
    const converted = priceUSD * currency.rateToUSD;
    return { 
      display: `${currency.symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 
      amount: converted,
      symbol: currency.symbol
    };
  };

  const toUSD = (price: number, fromCurrency: string): number => {
    if (fromCurrency === "USD") return price;
    const sourceCurr = currencies.find(c => c.code === fromCurrency);
    if (!sourceCurr || !sourceCurr.rateToUSD) return price;
    return price / sourceCurr.rateToUSD;
  };

  const formatOriginalPrice = (price: number, currencyCode: string): string => {
    if (currencyCode === "USD") {
      return `$${price.toFixed(2)}`;
    }
    const curr = currencies.find(c => c.code === currencyCode);
    const symbol = curr?.symbol || currencyCode;
    const hasCents = price % 1 !== 0;
    const priceUSD = curr ? price / curr.rateToUSD : price;
    return `${symbol}${price.toLocaleString(undefined, { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: hasCents ? 2 : 0 })} (~USD $${priceUSD.toFixed(2)})`;
  };

  const formatPrice = (price: number, showOriginal = true, sourceCurrency?: string): string => {
    const priceUSD = sourceCurrency ? toUSD(price, sourceCurrency) : price;
    const converted = convertPrice(priceUSD);

    if (sourceCurrency && sourceCurrency !== "USD" && sourceCurrency !== currency.code) {
      const srcCurr = currencies.find(c => c.code === sourceCurrency);
      const srcSymbol = srcCurr?.symbol || sourceCurrency;
      const hasCents = price % 1 !== 0;
      const originalDisplay = `${srcSymbol}${price.toLocaleString(undefined, { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 })}`;
      if (showOriginal) {
        return `${converted.display} (~USD $${priceUSD.toFixed(2)})`;
      }
      return converted.display;
    }

    if (showOriginal && currency.code !== "USD") {
      return `${converted.display} (~USD $${priceUSD.toFixed(2)})`;
    }
    return converted.display;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencies,
        isLoading,
        isDetecting,
        detectedLocation,
        detectCurrency,
        formatPrice,
        formatOriginalPrice,
        convertPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
