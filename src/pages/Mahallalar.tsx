import { useEffect, useState } from "react";
import { Plus, Search, MapPin, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mahallalarApi,
  createMahalla,
  updateMahalla,
  deleteMahalla,
  type Mahalla,
  type MahallaCreatePayload,
} from "@/lib/mahallalar-api";

export default function Mahallalar() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<Mahalla[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Mahalla | null>(null);
  const [form, setForm] = useState({ nomi: "", tuman: "", sektor: "", rais_name: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await mahallalarApi.list();
      setItems(res.data.data ?? []);
    } catch {
      toast.error("Mahallalarni yuklashda xatolik");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ nomi: "", tuman: "", sektor: "", rais_name: "" });
    setOpen(true);
  }

  function openEdit(m: Mahalla) {
    setEditing(m);
    setForm({
      nomi: m.nomi ?? "",
      tuman: m.tuman ?? "",
      sektor: m.sektor ?? "",
      rais_name: m.rais_name ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.nomi.trim()) { toast.error("Mahalla nomi kerak"); return; }
    const payload: MahallaCreatePayload = {
      nomi: form.nomi.trim(),
      tuman: form.tuman.trim() || null,
      sektor: form.sektor.trim() || null,
      rais_name: form.rais_name.trim() || null,
    };
    setSaving(true);
    let ok: boolean;
    if (editing) {
      ok = await updateMahalla(editing.id, payload);
    } else {
      ok = await createMahalla(payload);
    }
    setSaving(false);
    if (ok) {
      setOpen(false);
      load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Mahallani o'chirishni tasdiqlaysizmi?")) return;
    const ok = await deleteMahalla(id);
    if (ok) load();
  }

  const filtered = items.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [m.nomi, m.tuman, m.sektor, m.rais_name].filter(Boolean).some((v) =>
      String(v).toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageHeader
        title="Mahallalar va Raislar"
        description={`${items.length} ta mahalla ro'yxatda`}
        actions={
          isAdmin ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary border-0 text-white" onClick={openCreate}>
                  <Plus className="mr-1.5 h-4 w-4" /> Yangi mahalla qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Mahallani tahrirlash" : "Yangi mahalla yaratish"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Mahalla nomi *</Label>
                    <Input
                      placeholder="masalan, Yangi Bog' MFY"
                      value={form.nomi}
                      onChange={(e) => setForm({ ...form, nomi: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Tuman</Label>
                      <Input
                        placeholder="Yunusobod"
                        value={form.tuman}
                        onChange={(e) => setForm({ ...form, tuman: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Sektor</Label>
                      <Input
                        placeholder="9"
                        value={form.sektor}
                        onChange={(e) => setForm({ ...form, sektor: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Rais (F.I.Sh)</Label>
                    <Input
                      placeholder="Karimov A.K."
                      value={form.rais_name}
                      onChange={(e) => setForm({ ...form, rais_name: e.target.value })}
                    />
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
          ) : null
        }
      />

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Mahalla yoki rais qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Hech qanday mahalla topilmadi.
          {isAdmin && <div className="mt-2">Yangi mahalla qo'shish uchun yuqoridagi tugmadan foydalaning.</div>}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <Card key={m.id} className="group transition-all hover:shadow-elevated hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-white font-bold shadow-glow">
                    {m.sektor ?? "—"}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(m.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold leading-tight">{m.nomi}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {m.tuman ?? "—"}{m.sektor ? ` · ${m.sektor}-sektor` : ""}
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/40 p-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-[10px] font-bold">
                    {(m.rais_name ?? "—").split(" ").map((s) => s[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground leading-none">Rais</p>
                    <p className="text-xs font-medium truncate">{m.rais_name ?? "Tayinlanmagan"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
