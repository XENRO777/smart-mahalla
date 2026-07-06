import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type MahallaOpt = { id: string; nomi: string };

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user, isAdmin } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [mahallaId, setMahallaId] = useState<string>("");
  const [mahallalar, setMahallalar] = useState<MahallaOpt[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [{ data: prof }, { data: mlist }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, mahalla_id").eq("id", user.id).maybeSingle(),
        supabase.from("mahallalar").select("id, nomi").order("nomi"),
      ]);
      setFullName(prof?.full_name ?? "");
      setPhone(prof?.phone ?? "");
      setMahallaId(prof?.mahalla_id ?? "");
      setMahallalar((mlist ?? []) as MahallaOpt[]);
    })();
  }, [open, user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        mahalla_id: mahallaId || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil yangilandi");
    onOpenChange(false);
    // Trigger a refresh so useAuth re-fetches mahalla_id
    window.location.reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil sozlamalari</DialogTitle>
          <DialogDescription>
            Telefon raqami parolni tiklash uchun ishlatiladi. Mahalla tanlash sizning ko'ra oladigan ma'lumotlaringizni belgilaydi.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>F.I.Sh</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Telefon raqami</Label>
            <Input placeholder="+998901234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Mahalla{isAdmin ? "" : " (sizning faoliyat hududingiz)"}</Label>
            <Select value={mahallaId} onValueChange={setMahallaId}>
              <SelectTrigger><SelectValue placeholder="Mahallani tanlang" /></SelectTrigger>
              <SelectContent>
                {mahallalar.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.nomi}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mahallalar.length === 0 && (
              <p className="text-xs text-muted-foreground">Hozircha mahallalar yaratilmagan. Avval admin mahalla qo'shishi kerak.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button className="gradient-primary border-0 text-white" onClick={save} disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
