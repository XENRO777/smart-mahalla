import { useEffect, useState } from "react";
import { Plus, Search, Download, Coins } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/shared/StatusPill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCitizens, createCitizen, type Citizen, type CitizenCreatePayload } from "@/lib/citizens-api";
import { mahallalarApi, type Mahalla } from "@/lib/mahallalar-api";

const PAGE_SIZE = 20;

export default function Aholi() {
  const { isAdmin, isMahallaStaff, mahallaId } = useAuth();
  const canWrite = isAdmin || isMahallaStaff;

  const [rows, setRows] = useState<Citizen[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [mahallalar, setMahallalar] = useState<Mahalla[]>([]);
  const [mahallaLoading, setMahallaLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    pinfl: "",
    birth_year: "",
    household: "",
    notebook: "",
    phone: "",
    status: "oddiy",
    mahalla_id: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const result = await fetchCitizens(page, PAGE_SIZE, search);
    if (result) {
      setRows(result.items);
      setCount(result.total);
    }
    setLoading(false);
  }

  async function loadMahallalar() {
    setMahallaLoading(true);
    try {
      const res = await mahallalarApi.list();
      setMahallalar(res.data.data ?? []);
    } catch {
      // Silently fail
    }
    setMahallaLoading(false);
  }

  useEffect(() => { load(); }, [page, search]);
  useEffect(() => { loadMahallalar(); }, []);

  function openCreate() {
    setForm({
      full_name: "", pinfl: "", birth_year: "", household: "",
      notebook: "", phone: "", status: "oddiy",
      mahalla_id: isAdmin ? "" : (mahallaId ?? ""),
    });
    setOpen(true);
  }

  async function save() {
    if (!form.full_name.trim()) { toast.error("F.I.Sh kerak"); return; }
    const target_mahalla_id = isAdmin ? (form.mahalla_id || null) : (mahallaId || null);
    if (!target_mahalla_id && !isAdmin) {
      toast.error("Sizning profilingizga mahalla biriktirilmagan");
      return;
    }
    const mahallaName = mahallalar.find((m) => m.id === target_mahalla_id)?.nomi ?? null;

    setSaving(true);
    const payload: CitizenCreatePayload = {
      full_name: form.full_name.trim(),
      pinfl: form.pinfl.trim() || null,
      birth_year: form.birth_year ? parseInt(form.birth_year, 10) : null,
      household: form.household.trim() || null,
      phone: form.phone.trim() || null,
      notebook: form.notebook.trim() || null,
      status: form.status,
      mahalla_id: target_mahalla_id,
    };
    const ok = await createCitizen(payload);
    setSaving(false);
    if (ok) {
      setOpen(false);
      setPage(0);
      load();
    }
  }

  function exportCsv() {
    const header = ["F.I.Sh", "PINFL", "Yosh", "Xonadon", "Mahalla", "Holat", "Daftar", "Tokenlar"];
    const lines = [header.join(",")].concat(
      rows.map((c) => [
        c.full_name,
        c.pinfl ?? "",
        c.birth_year ? new Date().getFullYear() - c.birth_year : "",
        c.household ?? "",
        c.mahalla ?? "",
        c.status,
        c.notebook ?? "",
        c.tokens,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "aholi.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Aholi ro'yxati"
        description="Fuqarolar va xonadonlar bazasi (CRM)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" /> Excel
            </Button>
            {canWrite && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-primary border-0 text-white" onClick={openCreate}>
                    <Plus className="mr-1.5 h-4 w-4" /> Yangi fuqaro qo'shish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yangi fuqaro qo'shish</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-2">
                      <Label>F.I.Sh *</Label>
                      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>PINFL</Label>
                        <Input value={form.pinfl} onChange={(e) => setForm({ ...form, pinfl: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tug'ilgan yili</Label>
                        <Input type="number" value={form.birth_year} onChange={(e) => setForm({ ...form, birth_year: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Xonadon</Label>
                        <Input value={form.household} onChange={(e) => setForm({ ...form, household: e.target.value })} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Telefon</Label>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Daftar</Label>
                      <Input placeholder="Ayollar daftari, Yoshlar daftari..." value={form.notebook} onChange={(e) => setForm({ ...form, notebook: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Holat</Label>
                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oddiy">Oddiy</SelectItem>
                            <SelectItem value="faol">Faol</SelectItem>
                            <SelectItem value="kam_taminlangan">Kam ta'minlangan</SelectItem>
                            <SelectItem value="nogiron">Nogiron</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Mahalla</Label>
                        {isAdmin ? (
                          <Select value={form.mahalla_id} onValueChange={(v) => setForm({ ...form, mahalla_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                            <SelectContent>
                              {mahallalar.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nomi}</SelectItem>
                              ))}
                              {mahallaLoading && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">Yuklanmoqda...</div>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            disabled
                            value={mahallalar.find((m) => m.id === mahallaId)?.nomi ?? "Profilda mahalla yo'q"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
                    <Button className="gradient-primary border-0 text-white" onClick={save} disabled={saving}>
                      {saving ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <Card className="p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ism, PINFL yoki xonadon bo'yicha qidirish..."
            className="pl-9 border-0 bg-secondary/60"
            value={search}
            onChange={(e) => { setPage(0); setSearch(e.target.value); }}
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/40">
              <TableHead>F.I.Sh</TableHead>
              <TableHead>PINFL</TableHead>
              <TableHead>Yosh</TableHead>
              <TableHead>Xonadon</TableHead>
              <TableHead>Mahalla</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Daftar</TableHead>
              <TableHead className="text-right">Tokenlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="space-y-3 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Fuqaro topilmadi</TableCell></TableRow>
            ) : rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                      {c.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <span className="font-medium text-sm">{c.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.pinfl ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.birth_year ? new Date().getFullYear() - c.birth_year : "—"}</TableCell>
                <TableCell className="font-mono text-xs">{c.household ?? "—"}</TableCell>
                <TableCell className="text-sm">{c.mahalla ?? "—"}</TableCell>
                <TableCell><StatusPill status={c.status as any} /></TableCell>
                <TableCell>
                  {c.notebook ? <span className="text-xs text-muted-foreground">{c.notebook}</span> : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Coins className="h-3 w-3 text-warning" /> {c.tokens}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>{count === 0 ? "0" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, count)}`} / {count} fuqaro</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Oldingi</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Keyingi</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
