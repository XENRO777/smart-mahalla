import { useEffect, useMemo, useState } from "react";
import { Plus, Star, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type StaffRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  mahalla_id: string | null;
  mahalla_name: string | null;
  role: "rais" | "kotib" | "admin" | "user";
};

type Mahalla = { id: string; nomi: string };

const ROLE_LABEL: Record<string, string> = {
  rais: "Rais",
  kotib: "Kotib",
  admin: "Super admin",
  user: "Foydalanuvchi",
};

export default function Xodimlar() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [mahallalar, setMahallalar] = useState<Mahalla[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    mahalla_id: "",
    role: "kotib" as "rais" | "kotib",
  });

  const load = async () => {
    setLoading(true);
    const [{ data: roles }, { data: mahalls }] = await Promise.all([
      supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["rais", "kotib"]),
      supabase.from("mahallalar").select("id, nomi").order("nomi"),
    ]);

    setMahallalar((mahalls ?? []) as Mahalla[]);
    const mahallaMap = new Map((mahalls ?? []).map((m: any) => [m.id, m.nomi]));

    const ids = (roles ?? []).map((r: any) => r.user_id);
    let profiles: any[] = [];
    if (ids.length) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, mahalla_id")
        .in("id", ids);
      profiles = data ?? [];
    }
    const profMap = new Map(profiles.map((p) => [p.id, p]));

    const merged: StaffRow[] = (roles ?? []).map((r: any) => {
      const p = profMap.get(r.user_id) ?? {};
      return {
        id: r.user_id,
        full_name: p.full_name ?? null,
        phone: p.phone ?? null,
        mahalla_id: p.mahalla_id ?? null,
        mahalla_name: p.mahalla_id ? (mahallaMap.get(p.mahalla_id) ?? null) : null,
        role: r.role,
      };
    });
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      email: "",
      password: "",
      full_name: "",
      phone: "",
      mahalla_id: mahallalar[0]?.id ?? "",
      role: "kotib",
    });
    setOpen(true);
  };

  const openEdit = (row: StaffRow) => {
    setEditing(row);
    setForm({
      email: "",
      password: "",
      full_name: row.full_name ?? "",
      phone: row.phone ?? "",
      mahalla_id: row.mahalla_id ?? "",
      role: (row.role === "rais" || row.role === "kotib" ? row.role : "kotib"),
    });
    setOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.functions.invoke("admin-update-staff", {
          body: {
            user_id: editing.id,
            action: "update",
            full_name: form.full_name,
            phone: form.phone || null,
            mahalla_id: form.mahalla_id || null,
            role: form.role,
          },
        });
        if (error) throw error;
        toast.success("Yangilandi");
      } else {
        if (!form.email || !form.password || !form.mahalla_id || !form.full_name) {
          toast.error("Barcha maydonlarni to'ldiring");
          setSaving(false);
          return;
        }
        const { error } = await supabase.functions.invoke("admin-invite-staff", {
          body: {
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            phone: form.phone || null,
            mahalla_id: form.mahalla_id,
            role: form.role,
          },
        });
        if (error) throw error;
        toast.success("Xodim qo'shildi");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: StaffRow) => {
    if (!confirm(`${row.full_name ?? "Xodim"}ni o'chirasizmi?`)) return;
    try {
      const { error } = await supabase.functions.invoke("admin-update-staff", {
        body: { user_id: row.id, action: "delete" },
      });
      if (error) throw error;
      toast.success("O'chirildi");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Xatolik");
    }
  };

  const initials = (name?: string | null) =>
    (name ?? "?")
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <>
      <PageHeader
        title="Xodimlar va Rollar"
        description="Raislar, kotiblar, faollar va inspektorlar"
        actions={
          isAdmin ? (
            <Button
              size="sm"
              className="gradient-primary border-0 text-white"
              onClick={openCreate}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Yangi xodim
            </Button>
          ) : null
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Hali xodimlar yo'q. {isAdmin && "Yuqoridagi tugma orqali qo'shing."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <Card
              key={s.id}
              className="transition-all hover:shadow-elevated hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-white font-bold shadow-glow">
                    {initials(s.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">
                      {s.full_name ?? "—"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABEL[s.role] ?? s.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-bold">5.0</span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {s.mahalla_name ?? "Mahalla biriktirilmagan"}
                </p>

                <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Telefon
                    </p>
                    <p className="text-sm font-semibold">{s.phone ?? "—"}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => remove(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editing && (
              <>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Boshlang'ich parol</Label>
                  <Input
                    type="text"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Kamida 8 ta belgi"
                  />
                </div>
              </>
            )}
            <div>
              <Label>F.I.Sh</Label>
              <Input
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+998..."
              />
            </div>
            <div>
              <Label>Mahalla</Label>
              <Select
                value={form.mahalla_id}
                onValueChange={(v) => setForm({ ...form, mahalla_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {mahallalar.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nomi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v: "rais" | "kotib") =>
                  setForm({ ...form, role: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rais">Rais</SelectItem>
                  <SelectItem value="kotib">Kotib</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={submit}
              disabled={saving}
              className="gradient-primary border-0 text-white"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
