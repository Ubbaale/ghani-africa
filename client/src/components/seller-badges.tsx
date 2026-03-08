import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Award } from "lucide-react";

interface SellerBadgesData {
  hasVerifiedBadge: boolean;
  isHighlyRecommended: boolean;
  tier: string;
  memberSince: string | null;
}

interface SellerBadgesProps {
  sellerId: string;
  compact?: boolean;
}

export function SellerBadges({ sellerId, compact = false }: SellerBadgesProps) {
  const { data: badges } = useQuery<SellerBadgesData>({
    queryKey: ["/api/seller", sellerId, "badges"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/${sellerId}/badges`);
      if (!res.ok) return { hasVerifiedBadge: false, isHighlyRecommended: false, tier: 'free', memberSince: null };
      return res.json();
    },
    enabled: !!sellerId,
    staleTime: 60000,
  });

  if (!badges || (!badges.hasVerifiedBadge && !badges.isHighlyRecommended)) {
    return null;
  }

  if (compact) {
    return (
      <span className="inline-flex gap-1.5" data-testid={`seller-badges-${sellerId}`}>
        {badges.hasVerifiedBadge && (
          <Badge variant="outline" className="text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 gap-1 text-xs" data-testid={`badge-verified-${sellerId}`}>
            <BadgeCheck className="w-3 h-3" />
            Verified
          </Badge>
        )}
        {badges.isHighlyRecommended && (
          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 gap-1 text-xs" data-testid={`badge-recommended-${sellerId}`}>
            <Award className="w-3 h-3" />
            Recommended
          </Badge>
        )}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" data-testid={`seller-badges-${sellerId}`}>
      {badges.hasVerifiedBadge && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800" data-testid={`badge-verified-${sellerId}`}>
          <BadgeCheck className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-800 dark:text-green-400">Verified Seller</span>
        </div>
      )}
      {badges.isHighlyRecommended && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800" data-testid={`badge-recommended-${sellerId}`}>
          <Award className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-medium text-amber-800 dark:text-amber-400">Highly Recommended</span>
        </div>
      )}
    </div>
  );
}

export function useSellerBadges(sellerId: string | undefined) {
  return useQuery<SellerBadgesData>({
    queryKey: ["/api/seller", sellerId, "badges"],
    queryFn: async () => {
      const res = await fetch(`/api/seller/${sellerId}/badges`);
      if (!res.ok) return { hasVerifiedBadge: false, isHighlyRecommended: false, tier: 'free', memberSince: null };
      return res.json();
    },
    enabled: !!sellerId,
    staleTime: 60000,
  });
}
