import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { Building2, FileText, AlertTriangle, TrendingUp, Loader2, CheckCircle2, XCircle, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, type DashboardStats } from "@/lib/applications-api";

interface DashboardUser {
  full_name?: string;
  email?: string;
  roles?: string[];
  mahalla_id?: string | null;
  mahalla_name?: string | null;
}

interface Props {
  user: DashboardUser;
}

export default function HokimiyatOverview({ user }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const totalPending = (stats?.yangi ?? 0) + (stats?.jarayonda ?? 0);
  const completionRate = stats?.total
    ? Math.round((((stats.bajarilgan ?? 0) + (stats.rad_etilgan ?? 0)) / stats.total) * 100)
    : 0;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Hokimiyat Nazorat Paneli</h1>
        <p className="text-muted-foreground">Tuman bo'yicha umumiy tahliliy ko'rsatkichlar.</p>
      </div>

      {/* Global yuqori darajadagi metrikalar */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Jami Mahallalar"
          value={`${stats?.totalMahallas ?? "..."} ta`}
          change="Sardoba tumani bo'yicha"
          trend="up"
          icon={Building2}
          variant="primary"
        />
        <StatCard
          title="Jami Fuqarolar"
          value={loading ? "..." : `${stats?.citizens_total ?? 0} nafar`}
          change="Tizimda ro'yxatdan o'tgan"
          trend="up"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Tizimdagi Arizalar"
          value={loading ? "..." : `${stats?.total ?? 0} ta`}
          change="Platforma orqali yuborilgan"
          trend="up"
          icon={FileText}
        />
        <StatCard
          title="Faol Arizalar"
          value={loading ? "..." : `${totalPending} ta`}
          change={totalPending > 0 ? "Yangi va jarayondagi" : "Barchasi yakunlangan"}
          trend={totalPending > 0 ? "up" : undefined}
          icon={AlertTriangle}
          variant={totalPending > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Yakunlanish Darajasi"
          value={loading ? "..." : `${completionRate}%`}
          change={stats?.total ? `${stats.bajarilgan + stats.rad_etilgan} / ${stats.total} ta` : "Ma'lumot yo'q"}
          trend={completionRate >= 50 ? "up" : "down"}
          icon={TrendingUp}
          variant={completionRate >= 50 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Status distribution */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Arizalar holati bo'yicha taqsimot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Yangi", value: stats?.yangi ?? 0, color: "text-info", bg: "bg-info/10", icon: Clock },
                  { label: "Jarayonda", value: stats?.jarayonda ?? 0, color: "text-warning", bg: "bg-warning/10", icon: TrendingUp },
                  { label: "Bajarilgan", value: stats?.bajarilgan ?? 0, color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
                  { label: "Rad etilgan", value: stats?.rad_etilgan ?? 0, color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
                ].map((item) => {
                  const Icon = item.icon;
                  const percentage = stats?.total ? Math.round((item.value / stats.total) * 100) : 0;
                  return (
                    <div key={item.label} className={`${item.bg} rounded-lg p-4 text-center`}>
                      <Icon className={`h-5 w-5 mx-auto mb-2 ${item.color}`} />
                      <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground/60">{percentage}%</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Tezkor amallar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/murojaatlar"><FileText className="mr-2 h-4 w-4" /> Barcha arizalar</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/mahallalar"><Building2 className="mr-2 h-4 w-4" /> Mahallalar reytingi</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/kpi"><TrendingUp className="mr-2 h-4 w-4" /> KPI monitoringi</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
