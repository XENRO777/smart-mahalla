import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { TokenRule } from "@/hooks/useTokens";

const schema = z.object({
  action_name: z.string().trim().min(2, "Kamida 2 ta belgi").max(120),
  action_key: z.string().trim().min(2).max(60).regex(/^[a-z0-9_]+$/i, "Faqat harf, raqam va _"),
  token_amount: z.number().int().min(1, "1 dan kam emas").max(10000),
  daily_limit: z.number().int().min(1).max(100),
  is_active: z.boolean(),
});

export function RuleDialog({
  open, onOpenChange, rule,
}: { open: boolean; onOpenChange: (v: boolean) => void; rule?: TokenRule | null }) {
  const [actionName, setActionName] = useState("");
  const [actionKey, setActionKey] = useState("");
  const [tokenAmount, setTokenAmount] = useState(10);
  const [dailyLimit, setDailyLimit] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setActionName(rule?.action_name ?? "");
      setActionKey(rule?.action_key ?? "");
      setTokenAmount(rule?.token_amount ?? 10);
      setDailyLimit(rule?.daily_limit ?? 1);
      setIsActive(rule?.is_active ?? true);
    }
  }, [open, rule]);

  async function handleSave() {
    const parsed = schema.safeParse({
      action_name: actionName, action_key: actionKey,
      token_amount: tokenAmount, daily_limit: dailyLimit, is_active: isActive,
    });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0].message);
    }
    setSaving(true);
    const payload = parsed.data as Required<typeof parsed.data>;
    const { error } = rule
      ? await supabase.from("token_rules").update(payload).eq("id", rule.id)
      : await supabase.from("token_rules").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(rule ? "Qoida yangilandi" : "Qoida qo'shildi");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? "Qoidani tahrirlash" : "Yangi qoida"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Action nomi</Label>
            <Input value={actionName} onChange={(e) => setActionName(e.target.value)} placeholder="Subbotnikda qatnashish" />
          </div>
          <div className="space-y-1.5">
            <Label>Action kaliti (lotin)</Label>
            <Input value={actionKey} onChange={(e) => setActionKey(e.target.value)} placeholder="subbotnik" disabled={!!rule} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Token miqdori</Label>
              <Input type="number" min={1} value={tokenAmount} onChange={(e) => setTokenAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Kunlik limit</Label>
              <Input type="number" min={1} value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Holat</p>
              <p className="text-xs text-muted-foreground">{isActive ? "Faol" : "Nofaol"}</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-white">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
