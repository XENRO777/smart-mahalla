import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMahallaApplications,
  type Application,
} from "@/lib/applications-api";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AssignApplicationModal } from "./AssignApplicationModal";
import {
  Search,
  FileText,
  Inbox,
  Calendar,
  MapPin,
  UserCheck,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

interface MahallaApplicationsListProps {
  refreshKey: number;
}

export function MahallaApplicationsList({ refreshKey }: MahallaApplicationsListProps) {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const loadApps = () => {
    if (!user?.mahalla_id) return;
    setLoading(true);
    fetchMahallaApplications(user.mahalla_id).then((data) => {
      setApps(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadApps();
  }, [user?.mahalla_id, refreshKey]);

  const filtered = apps.filter((app) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      app.title.toLowerCase().includes(q) ||
      app.citizenName.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      (app.responsiblePerson?.toLowerCase().includes(q))
    );
  });

  // Sort: pending first, then by date descending
  const statusOrder: Record<string, number> = { YANGI: 0, JARAYONDA: 1, BAJARILDI: 2, RAD_ETILDI: 3 };
  const sorted = [...filtered].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 99;
    const sb = statusOrder[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAssign = (app: Application) => {
    setSelectedApp(app);
    setAssignModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Search bar */}
      <Card className="p-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Mavzu, fuqaro yoki mas'ul shaxs bo'yicha qidirish..."
            className="pl-9 border-0 bg-secondary/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">
              {search ? "Qidiruv bo'yicha murojaat topilmadi" : "Hali murojaatlar mavjud emas"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search ? "Boshqa so'z bilan urinib ko'ring" : "Fuqarolar murojaat yuborganda bu yerda ko'rinadi"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((app) => {
            const statusLabel = app.status === "YANGI" ? "Yangi"
              : app.status === "JARAYONDA" ? "Jarayonda"
              : app.status === "BAJARILDI" ? "Hal qilindi"
              : "Rad etildi";
            const isExpanded = expandedId === app.id;
            const isNew = app.status === "YANGI";

            return (
              <Card
                key={app.id}
                className={`transition-all hover:shadow-elevated ${
                  isNew ? "ring-1 ring-primary/20" : ""
                }`}
              >
                <CardContent className="p-4">
                  {/* Main row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className={`h-4 w-4 shrink-0 ${isNew ? "text-primary" : "text-muted-foreground"}`} />
                        <h3 className="font-medium text-sm truncate">{app.title}</h3>
                        {isNew && (
                          <Badge variant="default" className="h-5 text-[10px] px-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                            Yangi
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {app.citizenName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(app.createdAt).toLocaleDateString("uz-UZ")}
                        </span>
                        <StatusPill status={statusLabel} />
                        {app.aiPriority && <StatusPill status={app.aiPriority} />}
                        {app.responsiblePerson && (
                          <span className="flex items-center gap-1 text-success">
                            <UserCheck className="h-3 w-3" />
                            {app.responsiblePerson}
                          </span>
                        )}
                        {app.aiProcessingStatus === "pending" && (
                          <span className="text-info text-[11px] animate-pulse">AI tahlil...</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={isNew ? "default" : "outline"}
                        size="sm"
                        className={isNew ? "gradient-primary border-0 text-white h-8 text-xs" : "h-8 text-xs"}
                        onClick={() => handleAssign(app)}
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                        {isNew ? "Tayinlash" : "O'zgartirish"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3 animate-in slide-in-from-top-1 duration-200">
                      {/* Description */}
                      <div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{app.description}</p>
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Fuqaro</span>
                          <p className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {app.citizenName}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Mahalla</span>
                          <p className="font-medium flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {app.mahallaName}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Yuborilgan sana</span>
                          <p className="font-medium">
                            {new Date(app.createdAt).toLocaleString("uz-UZ")}
                          </p>
                        </div>
                        {app.responsiblePerson && (
                          <div>
                            <span className="text-muted-foreground block">Mas'ul shaxs</span>
                            <p className="font-medium flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-success" />
                              {app.responsiblePerson}
                            </p>
                          </div>
                        )}
                        {app.responsibleNotes && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Mas'ul izohi</span>
                            <p className="font-medium">{app.responsibleNotes}</p>
                          </div>
                        )}
                        {app.aiCategory && (
                          <div>
                            <span className="text-muted-foreground block">AI kategoriya</span>
                            <p className="font-medium">{app.aiCategory}</p>
                          </div>
                        )}
                        {app.aiSuggestedDepartment && (
                          <div>
                            <span className="text-muted-foreground block">AI tavsiyasi</span>
                            <p className="font-medium">{app.aiSuggestedDepartment}</p>
                          </div>
                        )}
                        {app.aiSummary && (
                          <div className="col-span-2 sm:col-span-3">
                            <span className="text-muted-foreground block">AI xulosa</span>
                            <p className="text-sm italic">{app.aiSummary}</p>
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
            );
          })}
        </div>
      )}

      {/* Assign modal */}
      <AssignApplicationModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        application={selectedApp}
        onSuccess={() => {
          loadApps();
          setExpandedId(null);
        }}
      />
    </>
  );
}
