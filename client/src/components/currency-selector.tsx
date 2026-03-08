import { useCurrency } from "@/lib/currency-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MapPin, Check, Globe } from "lucide-react";

export function CurrencySelector() {
  const { currency, setCurrency, currencies, isDetecting, detectCurrency, detectedLocation } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" data-testid="button-currency-selector">
          {isDetecting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Globe className="w-3 h-3" />
              <span className="font-medium">{currency.code}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
        <DropdownMenuLabel>
          {detectedLocation ? (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Detected: {detectedLocation.country}
                {detectedLocation.city ? `, ${detectedLocation.city}` : ""}
              </span>
            </div>
          ) : (
            "Select Currency"
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => {
            localStorage.removeItem("preferredCurrency");
            localStorage.removeItem("detectedLocation");
            sessionStorage.removeItem("currencyDetected");
            detectCurrency();
          }}
          disabled={isDetecting}
          data-testid="button-detect-currency"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {isDetecting ? "Detecting..." : "Re-detect my location"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {currencies.map((c) => (
          <DropdownMenuItem
            key={`${c.code}-${c.country || 'default'}`}
            onClick={() => setCurrency(c)}
            className="flex items-center justify-between"
            data-testid={`currency-option-${c.code}`}
          >
            <span>
              {c.symbol} {c.name} ({c.code})
            </span>
            {currency.code === c.code && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
