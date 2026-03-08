import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck, CheckCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";

interface TradeAssuranceBadgeProps {
  sellerId: string;
  compact?: boolean;
  showLink?: boolean;
}

export function TradeAssuranceBadge({ sellerId, compact = false, showLink = true }: TradeAssuranceBadgeProps) {
  const { data } = useQuery<{ eligible: boolean; verified: boolean; protectionTier: string; coverageLimit: number; trustScore: number; trustLevel: string }>({
    queryKey: ["/api/seller", sellerId, "trade-assurance"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/${sellerId}/trade-assurance`, { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!sellerId,
    staleTime: 120000,
  });

  if (!data?.eligible) return null;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-help" data-testid={`ta-badge-compact-${sellerId}`}>
            <ShieldCheck className="h-3 w-3" />
            <span>Protected</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="font-semibold text-xs">Trade Assurance</p>
          <p className="text-[10px] text-muted-foreground">{data.protectionTier} protection up to ${data.coverageLimit.toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const content = (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" data-testid={`ta-badge-full-${sellerId}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Trade Assurance</span>
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-300">
            {data.protectionTier}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-500">
            Coverage up to ${data.coverageLimit.toLocaleString()}
          </span>
          {data.verified && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-500">
              <CheckCircle className="h-2.5 w-2.5" /> Verified
            </span>
          )}
        </div>
      </div>
      {showLink && (
        <div className="text-[10px] text-emerald-600 dark:text-emerald-500 underline">Learn more</div>
      )}
    </div>
  );

  if (showLink) {
    return <Link href="/trade-assurance">{content}</Link>;
  }

  return content;
}

interface TradeAssuranceProductBadgeProps {
  sellerId: string;
}

export function TradeAssuranceProductBadge({ sellerId }: TradeAssuranceProductBadgeProps) {
  const { data } = useQuery<{ eligible: boolean; protectionTier: string }>({
    queryKey: ["/api/seller", sellerId, "trade-assurance"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/${sellerId}/trade-assurance`, { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!sellerId,
    staleTime: 120000,
  });

  if (!data?.eligible) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-flex items-center gap-1" data-testid={`ta-product-badge-${sellerId}`}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs font-medium">Trade Assurance Protected</p>
        <p className="text-[10px] text-muted-foreground">{data.protectionTier} buyer protection</p>
      </TooltipContent>
    </Tooltip>
  );
}
