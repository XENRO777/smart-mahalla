import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, CheckCircle2, Coins, PlusCircle, TrendingUp, Loader2 } from "lucide-react";
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

export default function MahallaOverview({ user }: Props) {
  const mahallaName = user?.mahalla_name ?? "Mahalla";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {stats?.mahallaName ?? mahallaName} boshqaruv paneli
          </h1>
          <p className="text-muted-foreground">Mahalla ko'rsatkichlari va faoliyat monitoringi.</p>
        </div>
        <Button size="lg" className="shadow-md gap-2 w-full sm:w-auto" asChild>
          <Link to="/murojaatlar">
            <PlusCircle className="h-5 w-5" />
            Murojaatlarni boshqarish
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Mahalla Aholisi"
          value={loading ? "..." : `${stats?.citizens_total ?? 0} nafar`}
          change="Ro'yxatga olingan"
          trend="up"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Jami Murojaatlar"
          value={loading ? "..." : `${stats?.total ?? 0} ta`}
          change="Platforma orqali"
          trend="up"
          icon={MessageSquare}
        />
        <StatCard
          title="Yangi Murojaatlar"
          value={loading ? "..." : `${stats?.yangi ?? 0} ta`}
          change={stats?.yangi ? "Yangi murojaatlar mavjud!" : "Barchasi ko'rib chiqilgan"}
          trend={(stats?.yangi ?? 0) > 0 ? "up" : undefined}
          icon={TrendingUp}
          variant="warning"
        />
        <StatCard
          title="Hal Etilgan"
          value={loading ? "..." : `${stats?.bajarilgan ?? 0} ta`}
          change={stats?.bajarilgan ? "Muvaffaqiyatli yakunlangan" : "Hali yo'q"}
          trend="up"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Murojaatlar statistikasi
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
                  { label: "Yangi", value: stats?.yangi ?? 0, color: "text-info" },
                  { label: "Jarayonda", value: stats?.jarayonda ?? 0, color: "text-warning" },
                  { label: "Bajarilgan", value: stats?.bajarilgan ?? 0, color: "text-success" },
                  { label: "Rad etilgan", value: stats?.rad_etilgan ?? 0, color: "text-destructive" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-secondary/40">
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
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
              <Link to="/murojaatlar"><MessageSquare className="mr-2 h-4 w-4" /> Murojaatlar</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/aholi"><Users className="mr-2 h-4 w-4" /> Aholi ro'yxati</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/tokenlar"><Coins className="mr-2 h-4 w-4" /> Tokenlar</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/xodimlar"><Users className="mr-2 h-4 w-4" /> Xodimlar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
