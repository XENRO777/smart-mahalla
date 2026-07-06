import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMahallaApplications, type Application } from "@/lib/applications-api";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, Inbox, AlertCircle, Calendar } from "lucide-react";

interface CitizenApplicationsListProps {
  refreshKey: number;
}

export function CitizenApplicationsList({ refreshKey }: CitizenApplicationsListProps) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.mahalla_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMahallaApplications(user.mahalla_id).then((data) => {
      // Filter only this citizen's applications
      const mine = data.filter((a) => a.citizenId === user.id);
      setApps(mine);
      setLoading(false);
    });
  }, [user?.id, user?.mahalla_id, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Hali murojaatlaringiz yo'q</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Yuqoridagi tugma orqali yangi murojaat yuboring</p>
        </CardContent>
      </Card>
    );
  }

  const statusOrder: Record<string, number> = { YANGI: 0, JARAYONDA: 1, BAJARILDI: 2, RAD_ETILDI: 3 };
  const sorted = [...apps].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 99;
    const sb = statusOrder[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-3">
      {sorted.map((app) => (
        <Card
          key={app.id}
          className="cursor-pointer transition-all hover:shadow-elevated"
          onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <h3 className="font-medium text-sm truncate">{app.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(app.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                  <StatusPill status={app.status === "YANGI" ? "Yangi" : app.status === "JARAYONDA" ? "Jarayonda" : app.status === "BAJARILDI" ? "Hal qilindi" : "Rad etildi"} />
                  {app.aiPriority && (
                    <StatusPill status={app.aiPriority} />
                  )}
                  {app.aiProcessingStatus === "pending" && (
                    <span className="text-info text-[11px] animate-pulse">AI tahlil qilinmoqda...</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                {expandedId === app.id ? "Yopish" : "Ko'rish"}
              </Button>
            </div>

            {expandedId === app.id && (
              <div className="mt-3 pt-3 border-t space-y-3 animate-in slide-in-from-top-1 duration-200">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{app.description}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {app.responsiblePerson && (
                    <div>
                      <span className="text-muted-foreground">Mas'ul shaxs:</span>
                      <p className="font-medium">{app.responsiblePerson}</p>
                    </div>
                  )}
                  {app.responsibleNotes && (
                    <div>
                      <span className="text-muted-foreground">Mas'ul izohi:</span>
                      <p className="font-medium">{app.responsibleNotes}</p>
                    </div>
                  )}
                  {app.aiCategory && (
                    <div>
                      <span className="text-muted-foreground">Kategoriya:</span>
                      <p className="font-medium">{app.aiCategory}</p>
                    </div>
                  )}
                  {app.aiSuggestedDepartment && (
                    <div>
                      <span className="text-muted-foreground">Tavsiya etilgan bo'lim:</span>
                      <p className="font-medium">{app.aiSuggestedDepartment}</p>
                    </div>
                  )}
                </div>
                {app.aiProcessingStatus === "failed" && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    AI tahlili mavjud emas
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
