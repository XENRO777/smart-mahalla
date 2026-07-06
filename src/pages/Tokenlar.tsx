import { useMemo, useState } from "react";
import { Coins, Trophy, Plus, Zap, Hand, AlertTriangle, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTokenRules, useCitizens, type TokenRule } from "@/hooks/useTokens";
import { RuleDialog } from "@/components/tokens/RuleDialog";
import { ManualTokenDialog } from "@/components/tokens/ManualTokenDialog";
import { LeaderboardTab } from "@/components/tokens/LeaderboardTab";
import { LedgerTab } from "@/components/tokens/LedgerTab";
import { AnalyticsTab } from "@/components/tokens/AnalyticsTab";

export default function Tokenlar() {
  const { isAdmin } = useAuth();
  const { rules, loading: rulesLoading } = useTokenRules();
  const { citizens } = useCitizens();
  const [ruleOpen, setRuleOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TokenRule | null>(null);

  const totalTokens = useMemo(() => citizens.reduce((s, c) => s + c.tokens, 0), [citizens]);
  const activeUsers = useMemo(() => citizens.filter((c) => c.tokens > 0).length, [citizens]);
  const suspicious = useMemo(() => citizens.filter((c) => c.is_suspicious).length, [citizens]);

  async function toggleRule(rule: TokenRule, value: boolean) {
    if (!isAdmin) return toast.error("Faqat admin tahrirlay oladi");
    const { error } = await supabase.from("token_rules").update({ is_active: value }).eq("id", rule.id);
    if (error) toast.error(error.message);
    else toast.success(value ? "Qoida yoqildi" : "Qoida o'chirildi");
  }

  function handleEditRule(r: TokenRule) {
    if (!isAdmin) return toast.error("Faqat admin tahrirlay oladi");
    setEditingRule(r); setRuleOpen(true);
  }

  function handleNewRule() {
    if (!isAdmin) return toast.error("Faqat admin yangi qoida qo'sha oladi");
    setEditingRule(null); setRuleOpen(true);
  }

  return (
    <>
      <PageHeader
        title="Mahalla Tokenlari (MT)"
        description="Faol fuqarolar uchun rag'batlantirish tizimi"
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => isAdmin ? setManualOpen(true) : toast.error("Faqat admin")}>
              <Hand className="mr-1.5 h-4 w-4" /> Token berish / ayirish
            </Button>
            <Button size="sm" className="gradient-primary border-0 text-white" onClick={handleNewRule}>
              <Plus className="mr-1.5 h-4 w-4" /> Yangi qoida
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Aylanmadagi tokenlar" value={`${totalTokens.toLocaleString()} MT`} change="Real-time" trend="up" icon={Coins} variant="primary" />
        <StatCard title="Faol foydalanuvchilar" value={activeUsers.toString()} change={`${citizens.length} jami`} trend="up" icon={Zap} variant="success" />
        <StatCard title="Faol qoidalar" value={rules.filter((r) => r.is_active).length.toString()} change={`${rules.length} jami`} trend="up" icon={Trophy} variant="warning" />
        <StatCard title="Shubhali holatlar" value={suspicious.toString()} change="Anti-fraud" trend={suspicious > 0 ? "down" : "up"} icon={AlertTriangle} variant={suspicious > 0 ? "warning" : "success"} />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="ledger">Token tarixi</TabsTrigger>
          <TabsTrigger value="analytics">Analitika</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Avtomatik mukofot qoidalari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rulesLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                {!rulesLoading && rules.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">Qoidalar yo'q. Yangi qoida qo'shing.</p>
                )}
                {rules.map((r) => (
                  <div key={r.id} className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/40 ${!r.is_active ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.action_name}</p>
                        <p className="text-xs text-muted-foreground">Kunlik limit: {r.daily_limit} • <span className="font-mono">{r.action_key}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-success/10 text-success text-xs font-bold px-2.5 py-1">+{r.token_amount} MT</span>
                      <Switch checked={r.is_active} onCheckedChange={(v) => toggleRule(r, v)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRule(r)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <LeaderboardTab />
          </div>
        </TabsContent>

        <TabsContent value="ledger"><LedgerTab /></TabsContent>
        <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
      </Tabs>

      <RuleDialog open={ruleOpen} onOpenChange={setRuleOpen} rule={editingRule} />
      <ManualTokenDialog open={manualOpen} onOpenChange={setManualOpen} />
    </>
  );
}
