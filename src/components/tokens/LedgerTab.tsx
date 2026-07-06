import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ArrowUp, ArrowDown, Hand, ChevronLeft, ChevronRight } from "lucide-react";
import { useLedger } from "@/hooks/useTokens";

const PAGE = 15;

export function LedgerTab() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { entries, total, loading } = useLedger({
    search,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
    page,
    pageSize: PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Token tarixi (Ledger)</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Foydalanuvchi ismi..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9 h-9" />
          </div>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="h-9 w-auto" />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="h-9 w-auto" />
          {(from || to || search) && (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); setSearch(""); setPage(1); }}>Tozalash</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foydalanuvchi</TableHead>
                <TableHead>Mahalla</TableHead>
                <TableHead>Turi</TableHead>
                <TableHead>Sabab</TableHead>
                <TableHead className="text-right">Miqdor</TableHead>
                <TableHead className="text-right">Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
              ))}
              {!loading && entries.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Yozuv topilmadi</TableCell></TableRow>
              )}
              {!loading && entries.map((e) => {
                const Icon = e.entry_type === "manual" ? Hand : e.amount > 0 ? ArrowUp : ArrowDown;
                const typeLabel = e.entry_type === "manual" ? "Manual" : e.entry_type === "earn" ? "Mukofot" : "Sarflash";
                const typeCls = e.entry_type === "manual" ? "bg-primary/10 text-primary" : e.amount > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive";
                return (
                  <TableRow key={e.id} className="transition-colors hover:bg-accent/40">
                    <TableCell className="font-medium">{e.citizen?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{e.citizen?.mahalla ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeCls}`}>
                        <Icon className="h-2.5 w-2.5" /> {typeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate">{e.reason}</TableCell>
                    <TableCell className={`text-right font-bold ${e.amount > 0 ? "text-success" : "text-destructive"}`}>
                      {e.amount > 0 ? "+" : ""}{e.amount} MT
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {format(new Date(e.created_at), "dd.MM.yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">Jami: {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
