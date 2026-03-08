import { useQuery } from "@tanstack/react-query";
import { Shield, CreditCard, Truck, PackageCheck, UserCheck, Wallet, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MILESTONES = [
  { key: "PAID", label: "Payment Secured", icon: CreditCard, description: "Funds held safely in escrow" },
  { key: "SHIPPED", label: "Shipped", icon: Truck, description: "Order dispatched by seller" },
  { key: "DELIVERED", label: "Delivered", icon: PackageCheck, description: "Package received by buyer" },
  { key: "CONFIRMED", label: "Confirmed", icon: UserCheck, description: "Buyer confirmed receipt" },
  { key: "RELEASED", label: "Funds Released", icon: Wallet, description: "Payment released to seller" },
];

interface EscrowTrackerProps {
  orderId: number;
  orderStatus: string;
  compact?: boolean;
}

export function EscrowTracker({ orderId, orderStatus, compact = false }: EscrowTrackerProps) {
  const { data: escrowData } = useQuery<{ status: string; milestones: string[] }>({
    queryKey: ["/api/escrow/status", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/escrow/status/${orderId}`, { credentials: "include" });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!orderId,
    staleTime: 30000,
  });

  const milestones = escrowData?.milestones || [];
  const escrowStatus = escrowData?.status || "PENDING";

  const getActiveMilestoneIndex = () => {
    if (escrowStatus === "REFUNDED") return -1;
    if (escrowStatus === "RELEASED" || milestones.includes("RELEASED")) return 4;
    if (milestones.includes("CONFIRMED")) return 3;
    if (milestones.includes("DELIVERED") || orderStatus === "delivered") return 2;
    if (milestones.includes("SHIPPED") || orderStatus === "shipped") return 1;
    if (milestones.includes("PAID") || escrowStatus === "HELD") return 0;
    return -1;
  };

  const activeIndex = getActiveMilestoneIndex();

  if (escrowStatus === "REFUNDED") {
    return (
      <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800" data-testid="escrow-refunded">
        <Shield className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Funds refunded to buyer</span>
      </div>
    );
  }

  if (!escrowData) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2" data-testid={`escrow-compact-${orderId}`}>
        <Shield className="h-3.5 w-3.5 text-green-600" />
        <span className="text-xs text-green-700 dark:text-green-400 font-medium">
          Escrow Protected
        </span>
        <div className="flex gap-0.5">
          {MILESTONES.map((m, i) => (
            <div
              key={m.key}
              className={`w-2 h-2 rounded-full ${
                i <= activeIndex
                  ? "bg-green-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
              title={m.label}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800 p-4" data-testid={`escrow-tracker-${orderId}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Escrow Protection Active</span>
        <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-400 ml-auto">
          {escrowStatus}
        </Badge>
      </div>

      <div className="relative">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-green-500 transition-all duration-500"
          style={{ width: activeIndex >= 0 ? `${(activeIndex / (MILESTONES.length - 1)) * 100}%` : '0%' }}
        />

        <div className="relative flex justify-between">
          {MILESTONES.map((milestone, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = milestone.icon;

            return (
              <div key={milestone.key} className="flex flex-col items-center" style={{ width: '20%' }}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400"
                  } ${isCurrent ? "ring-2 ring-green-300 ring-offset-1" : ""}`}
                  data-testid={`milestone-${milestone.key.toLowerCase()}`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span className={`text-xs mt-1 text-center font-medium ${
                  isCompleted ? "text-green-700 dark:text-green-400" : "text-gray-400"
                }`}>
                  {milestone.label}
                </span>
                <span className="text-[10px] text-muted-foreground text-center hidden sm:block mt-0.5">
                  {milestone.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
