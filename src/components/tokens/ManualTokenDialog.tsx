import { useState, useMemo } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCitizens } from "@/hooks/useTokens";
import { Search } from "lucide-react";

const schema = z.object({
  citizen_id: z.string().uuid("Foydalanuvchi tanlang"),
  amount: z.number().int().min(-100000).max(100000).refine((v) => v !== 0, "Miqdor 0 bo'lmasin"),
  reason: z.string().trim().min(3, "Sababni yozing").max(500),
});

export function ManualTokenDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { citizens } = useCitizens();
  const [search, setSearch] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return citizens.filter((c) => c.full_name.toLowerCase().includes(s)).slice(0, 8);
  }, [citizens, search]);

  const selected = citizens.find((c) => c.id === citizenId);

  async function handleSave() {
    const parsed = schema.safeParse({ citizen_id: citizenId, amount, reason });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { data, error } = await supabase.rpc("manual_token", {
      _citizen_id: parsed.data.citizen_id,
      _amount: parsed.data.amount,
      _reason: parsed.data.reason,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    const res = data as any;
    if (!res?.success) return toast.error(res?.error === "forbidden" ? "Faqat admin amal qila oladi" : res?.error);
    toast.success(`${amount > 0 ? "+" : ""}${amount} MT muvaffaqiyatli yozildi`);
    onOpenChange(false);
    setCitizenId(""); setAmount(10); setReason(""); setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token berish / ayirish</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Foydalanuvchi</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={selected ? selected.full_name : search}
                onChange={(e) => { setSearch(e.target.value); setCitizenId(""); }}
                placeholder="Ism bo'yicha qidiring..."
                className="pl-9"
              />
            </div>
            {!selected && search && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border bg-popover">
                {filtered.length === 0 && <p className="p-3 text-xs text-muted-foreground">Topilmadi</p>}
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setCitizenId(c.id); setSearch(""); }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span>{c.full_name}</span>
                    <span className="text-xs text-muted-foreground">{c.mahalla}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Miqdor (manfiy son ayirish uchun)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Sabab</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={handleSave} disabled={saving || !citizenId} className="gradient-primary border-0 text-white">
            {saving ? "Yuborilmoqda..." : "Tasdiqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
