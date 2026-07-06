import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/shared/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { NewApplicationModal } from "@/components/applications/NewApplicationModal";
import { CitizenApplicationsList } from "@/components/applications/CitizenApplicationsList";
import { MahallaApplicationsList } from "@/components/applications/MahallaApplicationsList";
import { GovernmentApplicationsTable } from "@/components/applications/GovernmentApplicationsTable";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { fetchAppeals, type PaginatedAppeals } from "@/lib/appeals-api";
import {
  PlusCircle,
  FileText,
  LayoutDashboard,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

// ──────────────────────────────────────────────
// Role helpers
// ──────────────────────────────────────────────
type AppRole = "FUQARO" | "MAHALLA" | "HOKIMIYAT";

function deriveRole(roles: string[]): AppRole {
  if (roles.includes("admin")) return "HOKIMIYAT";
  if (roles.includes("rais") || roles.includes("kotib")) return "MAHALLA";
  return "FUQARO";
}

function getRoleTitle(role: AppRole): string {
  switch (role) {
    case "FUQARO": return "Mening Murojaatlarim";
    case "MAHALLA": return "Mahalla Murojaatlari";
    case "HOKIMIYAT": return "Barcha Murojaatlar";
  }
}

function getRoleDescription(role: AppRole): string {
  switch (role) {
    case "FUQARO": return "Siz yuborgan murojaatlar va ularning holati";
    case "MAHALLA":
      return "Mahallangizga tushgan fuqaro murojaatlarini boshqarish";
    case "HOKIMIYAT":
      return "Barcha mahallalar bo'yicha murojaatlar monitoringi";
  }
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export default function Murojaatlar() {
  const { roles, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "applications";
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const role = deriveRole(roles);
  const isCitizen = role === "FUQARO";

  const refresh = () => setRefreshKey((k) => k + 1);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 bg-secondary/50 rounded animate-pulse" />
        <div className="h-64 bg-secondary/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header — different for each role */}
      <PageHeader
        title={getRoleTitle(role)}
        description={getRoleDescription(role)}
        actions={
          <>
            {/* Citizens can submit new applications */}
            {isCitizen && (
              <Button
                size="sm"
                className="gradient-primary border-0 text-white shadow-md"
                onClick={() => setNewModalOpen(true)}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                Yangi murojaat
              </Button>
            )}
          </>
        }
      />

      {/* Role-specific tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
        <TabsList className="mb-4">
          <TabsTrigger value="applications" className="flex items-center gap-1.5">
            {role === "HOKIMIYAT" ? (
              <LayoutDashboard className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {role === "FUQARO"
              ? "Mening arizalarim"
              : role === "MAHALLA"
                ? "Mahalla arizalari"
                : "Barcha arizalar"}
          </TabsTrigger>
          {/* Mahalla and Hokimiyat can also see external appeals */}
          {!isCitizen && (
            <TabsTrigger value="external" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Tashqi murojaatlar
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Applications tab (role-based) ─── */}
        <TabsContent value="applications" className="mt-0">
          <ErrorBoundary label="Arizalar">
            {isCitizen ? (
              <CitizenApplicationsList refreshKey={refreshKey} />
            ) : role === "MAHALLA" ? (
              <MahallaApplicationsList refreshKey={refreshKey} />
            ) : (
              <GovernmentApplicationsTable refreshKey={refreshKey} />
            )}
          </ErrorBoundary>
        </TabsContent>

        {/* ─── External appeals tab (for mahalla staff & hokimiyat) ─── */}
        {!isCitizen && (
          <TabsContent value="external" className="mt-0">
            <ErrorBoundary label="Tashqi murojaatlar">
              <ExternalAppealsView />
            </ErrorBoundary>
          </TabsContent>
        )}
      </Tabs>

      {/* New Application Modal (for FUQARO) */}
      {isCitizen && (
        <NewApplicationModal
          open={newModalOpen}
          onOpenChange={setNewModalOpen}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// External appeals (preserved from original page)
// ──────────────────────────────────────────────

const EXTERNAL_TABS = [
  { value: "all", label: "Barchasi" },
  { value: "new", label: "Yangi" },
  { value: "progress", label: "Jarayonda" },
  { value: "resolved", label: "Hal qilingan" },
  { value: "rejected", label: "Rad etilgan" },
] as const;

function ExternalAppealsView() {
  const [data, setData] = useState<PaginatedAppeals | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAppeals(tab, search).then((result) => {
      if (cancelled) return;
      setData(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tab, search]);

  const appeals = data?.items ?? [];
  const counts = data?.counts ?? {
    all: 0,
    new: 0,
    progress: 0,
    resolved: 0,
    rejected: 0,
  };

  return (
    <>
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          {EXTERNAL_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}{" "}
              <span className="ml-1.5 text-xs opacity-60">
                {counts[t.value as keyof typeof counts]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="p-3 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Murojaat ID, mavzu yoki fuqaro..."
            className="pl-9 border-0 bg-secondary/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-1.5 h-4 w-4" /> Filtr
        </Button>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>ID</TableHead>
              <TableHead>Mavzu</TableHead>
              <TableHead>Fuqaro</TableHead>
              <TableHead>Manba</TableHead>
              <TableHead>Muhimlik</TableHead>
              <TableHead>Mas'ul</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="space-y-3 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : appeals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  Murojaat topilmadi
                </TableCell>
              </TableRow>
            ) : (
              appeals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.id}</TableCell>
                  <TableCell className="font-medium text-sm max-w-xs truncate">
                    {a.subject}
                  </TableCell>
                  <TableCell className="text-sm">{a.citizen_name}</TableCell>
                  <TableCell>
                    <StatusPill status={a.source} />
                  </TableCell>
                  <TableCell>
                    <StatusPill status={a.priority} />
                  </TableCell>
                  <TableCell className="text-sm">{a.assignee}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.date}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Ko'rish
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
