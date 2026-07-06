import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Crown, Star } from "lucide-react";
import { useCitizens } from "@/hooks/useTokens";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type Period = "daily" | "weekly" | "all";

function StatusBadge({ tokens }: { tokens: number }) {
  const { label, cls, Icon } =
    tokens >= 1000
      ? { label: "Lider", cls: "bg-warning/15 text-warning", Icon: Crown }
      : tokens >= 500
      ? { label: "Faol", cls: "bg-primary/15 text-primary", Icon: Star }
      : { label: "Oddiy", cls: "bg-muted text-muted-foreground", Icon: Trophy };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      <Icon className="h-2.5 w-2.5" /> {label}
    </span>
  );
}

export function LeaderboardTab() {
  const { citizens, loading } = useCitizens();
  const [period, setPeriod] = useState<Period>("all");
  const [periodMap, setPeriodMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (period === "all") return;
    const since = new Date();
    if (period === "daily") since.setHours(0, 0, 0, 0);
    else since.setDate(since.getDate() - 7);

    supabase
      .from("token_ledger")
      .select("citizen_id, amount")
      .gte("created_at", since.toISOString())
      .then(({ data }) => {
        const m: Record<string, number> = {};
        (data ?? []).forEach((r: any) => { m[r.citizen_id] = (m[r.citizen_id] ?? 0) + r.amount; });
        setPeriodMap(m);
      });
  }, [period]);

  const ranked = useMemo(() => {
    if (period === "all") return [...citizens].sort((a, b) => b.tokens - a.tokens);
    return citizens
      .map((c) => ({ ...c, periodTokens: periodMap[c.id] ?? 0 }))
      .filter((c) => c.periodTokens > 0)
      .sort((a, b) => b.periodTokens - a.periodTokens);
  }, [citizens, period, periodMap]);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" /> Eng faol aholi
        </CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-8">
            <TabsTrigger value="daily" className="text-xs h-6">Kunlik</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs h-6">Haftalik</TabsTrigger>
            <TabsTrigger value="all" className="text-xs h-6">Umumiy</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        {!loading && ranked.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Bu davrda token harakati yo'q</p>
        )}
        {ranked.slice(0, 10).map((c: any, i) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent/40">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i === 0 ? "bg-warning text-warning-foreground" :
              i === 1 ? "bg-muted text-foreground" :
              i === 2 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{c.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.mahalla}</p>
            </div>
            <StatusBadge tokens={c.tokens} />
            <span className="text-sm font-bold text-warning shrink-0">
              {period === "all" ? c.tokens : `+${c.periodTokens}`}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
