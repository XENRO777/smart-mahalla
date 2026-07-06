import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { useCitizens } from "@/hooks/useTokens";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--accent-foreground))"];

export function AnalyticsTab() {
  const { citizens } = useCitizens();
  const [byAction, setByAction] = useState<{ name: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("token_ledger")
        .select("amount, rule_id, token_rules(action_name)")
        .eq("entry_type", "earn");
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        const name = r.token_rules?.action_name ?? "Boshqa";
        map[name] = (map[name] ?? 0) + r.amount;
      });
      setByAction(Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total));
      setLoading(false);
    })();
  }, []);

  const distribution = useMemo(() => {
    const buckets = { Lider: 0, Faol: 0, Oddiy: 0 };
    citizens.forEach((c) => {
      if (c.tokens >= 1000) buckets.Lider++;
      else if (c.tokens >= 500) buckets.Faol++;
      else buckets.Oddiy++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [citizens]);

  const activeVsInactive = useMemo(() => {
    const active = citizens.filter((c) => c.tokens > 0).length;
    return [{ name: "Faol", value: active }, { name: "Nofaol", value: citizens.length - active }];
  }, [citizens]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Eng ko'p mukofotlangan amallar</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          {loading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byAction}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Token taqsimoti (status bo'yicha)</CardTitle></CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {distribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-3"><CardTitle className="text-base">Faol va nofaol foydalanuvchilar</CardTitle></CardHeader>
        <CardContent className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeVsInactive} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
