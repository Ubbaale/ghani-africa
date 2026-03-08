import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck, ShieldAlert, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TrustScoreData {
  score: number;
  maxScore: number;
  level: string;
  breakdown: { factor: string; points: number; maxPoints: number; detail: string }[];
}

interface TrustScoreProps {
  sellerId: string;
  compact?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-gray-500";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-100 dark:bg-green-950/40 border-green-200 dark:border-green-800";
  if (score >= 60) return "bg-blue-100 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800";
  if (score >= 40) return "bg-yellow-100 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800";
  return "bg-gray-100 dark:bg-gray-950/40 border-gray-200 dark:border-gray-800";
}

function getScoreIcon(score: number) {
  if (score >= 60) return <ShieldCheck className="h-4 w-4" />;
  if (score >= 40) return <Shield className="h-4 w-4" />;
  return <ShieldAlert className="h-4 w-4" />;
}

export function TrustScore({ sellerId, compact = false }: TrustScoreProps) {
  const { data } = useQuery<TrustScoreData>({
    queryKey: ["/api/sellers", sellerId, "trust-score"],
    queryFn: async () => {
      const res = await fetch(`/api/sellers/${sellerId}/trust-score`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!sellerId,
    staleTime: 60000,
  });

  if (!data) return null;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium cursor-help ${getScoreBg(data.score)} ${getScoreColor(data.score)}`} data-testid={`trust-score-compact-${sellerId}`}>
            {getScoreIcon(data.score)}
            <span>{data.score}/100</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-semibold mb-1">Trust Score: {data.level}</p>
          <p className="text-xs text-muted-foreground">Based on verification, reviews, transactions, account age, and profile completeness</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${getScoreBg(data.score)}`} data-testid={`trust-score-full-${sellerId}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getScoreIcon(data.score)}
          <span className={`text-sm font-semibold ${getScoreColor(data.score)}`}>Trust Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(data.score)}`}>{data.score}</span>
          <span className="text-sm text-muted-foreground">/ {data.maxScore}</span>
        </div>
      </div>

      <Badge variant="outline" className={`mb-3 ${getScoreColor(data.score)}`}>
        <TrendingUp className="h-3 w-3 mr-1" />
        {data.level}
      </Badge>

      <div className="space-y-2">
        {data.breakdown.map((item) => (
          <div key={item.factor} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{item.factor}</span>
              <span className="font-medium">{item.points}/{item.maxPoints}</span>
            </div>
            <Progress value={(item.points / item.maxPoints) * 100} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrustScoreBadge({ sellerId }: { sellerId: string }) {
  const { data } = useQuery<TrustScoreData>({
    queryKey: ["/api/sellers", sellerId, "trust-score"],
    queryFn: async () => {
      const res = await fetch(`/api/sellers/${sellerId}/trust-score`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!sellerId,
    staleTime: 60000,
  });

  if (!data || data.score < 20) return null;

  return (
    <Badge variant="outline" className={`text-xs ${getScoreColor(data.score)} gap-1`} data-testid={`trust-badge-${sellerId}`}>
      {getScoreIcon(data.score)}
      {data.level}
    </Badge>
  );
}
