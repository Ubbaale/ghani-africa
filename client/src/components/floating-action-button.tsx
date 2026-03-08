import { Link } from "wouter";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import type { UserProfile } from "@shared/schema";

export function FloatingActionButton() {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  const isBusinessUser = profile?.role === "trader" || profile?.role === "manufacturer";

  if (!user || !isBusinessUser) {
    return null;
  }

  return (
    <Link href="/dashboard?tab=products">
      <Button
        size="lg"
        className="fixed right-4 bottom-20 md:bottom-6 z-40 rounded-full shadow-lg gap-2 px-6"
        data-testid="button-post-product"
      >
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">{t("seller.postProduct")}</span>
      </Button>
    </Link>
  );
}
