import { BarChart3, TrendingUp, Award } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { mahallalar } from "@/lib/mock-data";

export default function KPI() {
  const sorted = [...mahallalar].sort((a, b) => b.healthScore - a.healthScore);
  return (
    <>
      <PageHeader
        title="Mahalla KPI Reytingi"
        description="Hal qilish tezligi, fuqaro qoniqishi va loyiha ishtiroki asosida"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Salomatlik gauge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {sorted.map((m) => (
                <div key={m.id} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold">{m.healthScore}</span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        m.healthScore >= 80 ? "gradient-primary" :
                        m.healthScore >= 70 ? "bg-warning" : "bg-destructive"
                      }`}
                      style={{ height: `${m.healthScore}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    {m.sector}-sek
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-warning" /> Top 3 mahalla
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sorted.slice(0, 3).map((m, i) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{i + 1}. {m.name}</span>
                  <span className="text-success font-bold">{m.healthScore}</span>
                </div>
                <Progress value={m.healthScore} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Barcha mahallalar reytingi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sorted.map((m, i) => (
              <div key={m.id} className="grid grid-cols-12 items-center gap-3">
                <span className="col-span-1 text-sm font-mono text-muted-foreground">#{i + 1}</span>
                <span className="col-span-3 text-sm font-medium truncate">{m.name}</span>
                <div className="col-span-6">
                  <Progress value={m.healthScore} className="h-2" />
                </div>
                <span className="col-span-1 text-sm font-bold text-right">{m.healthScore}</span>
                <span className="col-span-1 text-xs text-success text-right inline-flex items-center justify-end gap-0.5">
                  <TrendingUp className="h-3 w-3" />+{Math.floor(Math.random()*5)+1}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
