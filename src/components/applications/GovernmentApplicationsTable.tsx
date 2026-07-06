import React, { useEffect, useState, useMemo } from "react";
import { fetchGovernmentApplications, type Application } from "@/lib/applications-api";
import { StatusPill } from "@/components/shared/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";import { Search,
  Filter,
  Download,
  FileText,
  Inbox,
  Calendar,
  MapPin,
  User,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GovernmentApplicationsTableProps {
  refreshKey: number;
}

export function GovernmentApplicationsTable({ refreshKey }: GovernmentApplicationsTableProps) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [mahallaFilter, setMahallaFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchGovernmentApplications().then((data) => {
      setApps(data);
      setLoading(false);
    });
  }, [refreshKey]);

  // Extract unique mahalla names for filter
  const mahallaOptions = useMemo(() => {
    const names = new Set(apps.map((a) => a.mahallaName));
    return Array.from(names).sort();
  }, [apps]);

  // Apply filters
  const filtered = useMemo(() => {
    return apps.filter((app) => {
      // Status filter
      if (statusFilter !== "all") {
        if (app.status !== statusFilter) return false;
      }
      // Mahalla filter
      if (mahallaFilter !== "all") {
        if (app.mahallaName !== mahallaFilter) return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          app.citizenName.toLowerCase().includes(q) ||
          app.title.toLowerCase().includes(q) ||
          app.mahallaName.toLowerCase().includes(q) ||
          (app.responsiblePerson?.toLowerCase().includes(q)) ||
          app.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apps, statusFilter, mahallaFilter, search]);

  // Sort by date descending
  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const total = apps.length;
    const yangi = apps.filter((a) => a.status === "YANGI").length;
    const jarayonda = apps.filter((a) => a.status === "JARAYONDA").length;
    const bajarilgan = apps.filter((a) => a.status === "BAJARILDI").length;
    const rad = apps.filter((a) => a.status === "RAD_ETILDI").length;
    return { total, yangi, jarayonda, bajarilgan, rad };
  }, [apps]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "YANGI": return "Yangi";
      case "JARAYONDA": return "Jarayonda";
      case "BAJARILDI": return "Hal qilindi";
      case "RAD_ETILDI": return "Rad etildi";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Jami", value: stats.total, color: "bg-primary/10 text-primary" },
          { label: "Yangi", value: stats.yangi, color: "bg-info/10 text-info" },
          { label: "Jarayonda", value: stats.jarayonda, color: "bg-warning/10 text-warning" },
          { label: "Bajarilgan", value: stats.bajarilgan, color: "bg-success/10 text-success" },
          { label: "Rad etilgan", value: stats.rad, color: "bg-destructive/10 text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <CardContent className="p-3">
              <p className={`text-lg font-bold ${s.color.split(" ")[1]}`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Fuqaro, mavzu, mahalla yoki mas'ul..."
              className="pl-9 border-0 bg-secondary/60"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/60 border-0">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Holat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="YANGI">Yangi</SelectItem>
              <SelectItem value="JARAYONDA">Jarayonda</SelectItem>
              <SelectItem value="BAJARILDI">Bajarilgan</SelectItem>
              <SelectItem value="RAD_ETILDI">Rad etilgan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mahallaFilter} onValueChange={setMahallaFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-secondary/60 border-0">
              <MapPin className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Mahalla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha mahallalar</SelectItem>
              {mahallaOptions.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {sorted.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">
              {search || statusFilter !== "all" || mahallaFilter !== "all"
                ? "Filtr bo'yicha murojaat topilmadi"
                : "Hali murojaatlar mavjud emas"}
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {search || statusFilter !== "all" || mahallaFilter !== "all"
                ? "Filtrlarni o'zgartirib ko'ring"
                : "Fuqarolar murojaat yuborganda bu yerda ko'rinadi"}
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/40">
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Fuqaro</TableHead>
                <TableHead>Mahalla</TableHead>
                <TableHead className="max-w-[200px]">Mavzu</TableHead>
                <TableHead>Yuborilgan</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Mas'ul shaxs</TableHead>
                <TableHead>AI</TableHead>
                <TableHead className="text-right w-[80px]">Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((app) => {
                const isExpanded = expandedId === app.id;
                return (
                  <React.Fragment key={app.id}>
                    <TableRow className="group hover:bg-muted/30 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {app.id.slice(0, 6)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{app.citizenName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm">{app.mahallaName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate font-medium">{app.title}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(app.createdAt).toLocaleDateString("uz-UZ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={getStatusLabel(app.status)} />
                      </TableCell>
                      <TableCell>
                        {app.responsiblePerson ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-success shrink-0" />
                            <span className="text-sm">{app.responsiblePerson}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.aiProcessingStatus === "done" && app.aiCategory ? (
                          <Badge variant="secondary" className="text-[10px]">{app.aiCategory}</Badge>
                        ) : app.aiProcessingStatus === "pending" ? (
                          <span className="text-[11px] text-info animate-pulse">Tahlil...</span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${app.id}-detail`} className="bg-secondary/20">
                        <TableCell colSpan={9} className="p-4">
                          <div className="animate-in slide-in-from-top-1 duration-200 space-y-3">
                            <p className="text-sm whitespace-pre-wrap">{app.description}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground block">Fuqaro</span>
                                <p className="font-medium">{app.citizenName}</p>
                                {app.citizenPhone && (
                                  <p className="text-muted-foreground">{app.citizenPhone}</p>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Mahalla</span>
                                <p className="font-medium">{app.mahallaName}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Yuborilgan sana</span>
                                <p className="font-medium">{new Date(app.createdAt).toLocaleString("uz-UZ")}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block">Holat</span>
                                <StatusPill status={getStatusLabel(app.status)} />
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
                              {app.aiPriority && (
                                <div>
                                  <span className="text-muted-foreground block">AI ustuvorlik</span>
                                  <StatusPill status={app.aiPriority} />
                                </div>
                              )}
                              {app.aiSuggestedDepartment && (
                                <div>
                                  <span className="text-muted-foreground block">AI tavsiyasi</span>
                                  <p className="font-medium">{app.aiSuggestedDepartment}</p>
                                </div>
                              )}
                              {app.aiSummary && (
                                <div className="col-span-4">
                                  <span className="text-muted-foreground block">AI xulosa</span>
                                  <p className="text-sm italic">{app.aiSummary}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>                        </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
