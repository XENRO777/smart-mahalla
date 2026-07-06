import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { PlusCircle, MessageSquare, ShieldCheck, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, type DashboardStats } from "@/lib/applications-api";

interface DashboardUser {
  full_name?: string;
  email?: string;
  roles?: string[];
  mahalla_id?: string | null;
}

interface Props {
  user: DashboardUser;
}

export default function FuqaroOverview({ user }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDashboardStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const totalApps = stats?.total ?? 0;
  const activeApps = (stats?.yangi ?? 0) + (stats?.jarayonda ?? 0);
  const doneApps = stats?.bajarilgan ?? 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Xush kelibsiz, {user?.full_name ?? "Foydalanuvchi"}!
          </h1>
          <p className="text-muted-foreground">Mahallangiz raqamli tizimidan foydalaning.</p>
        </div>

        {/* Fuqaro uchun eng kerakli call-to-action — hozir ishlaydi */}
        <Button size="lg" className="shadow-md gap-2 w-full sm:w-auto" asChild>
          <Link to="/murojaatlar">
            <PlusCircle className="h-5 w-5" />
            Yangi Murojaat Yo'llash
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Mening Murojaatlarim"
          value={loading ? "..." : `${totalApps} ta`}
          change={
            loading
              ? "Yuklanmoqda..."
              : activeApps > 0
                ? `${activeApps} ta faol, ${doneApps} ta bajarilgan`
                : "Hali murojaat yo'q"
          }
          trend={activeApps > 0 ? "up" : undefined}
          icon={MessageSquare}
          variant="primary"
        />
        <StatCard
          title="Faol Murojaatlar"
          value={loading ? "..." : `${activeApps} ta`}
          change={activeApps > 0 ? "Ko'rib chiqilmoqda" : "Barchasi hal qilingan"}
          trend={activeApps > 0 ? "up" : undefined}
          icon={ShieldCheck}
          variant={activeApps > 0 ? "warning" : "success"}
        />
        <StatCard
          title="Mahalla Statusingiz"
          value="Faol Fuqaro"
          change={totalApps > 0 ? `${totalApps} ta murojaat yuborilgan` : "Hali murojaat yo'q"}
          trend="up"
          icon={Coins}
          variant="success"
        />
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Mahallangizdagi Oxirgi E'lonlar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="border-b pb-3">
                <span className="text-xs text-muted-foreground">Bugun, 10:00</span>
                <p className="font-medium text-sm">
                  Ertaga mahallamizda hashar tashkil qilinadi. Faol ishtirok eting va tokenlarga ega bo'ling!
                </p>
              </li>
              <li>
                <span className="text-xs text-muted-foreground">Kecha</span>
                <p className="font-medium text-sm">
                  Ichimlik suvi tarmog'idagi ta'mirlash ishlari muvaffaqiyatli yakunlandi.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
