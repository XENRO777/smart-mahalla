import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { submitApplication } from "@/lib/applications-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle, Loader2 } from "lucide-react";

interface NewApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewApplicationModal({ open, onOpenChange, onSuccess }: NewApplicationModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    const result = await submitApplication({
      mahallaId: user?.mahalla_id ?? "",
      title: title.trim(),
      description: description.trim(),
    });
    setSubmitting(false);

    if (result) {
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Yangi Murojaat
          </DialogTitle>
          <DialogDescription>
            Mahallangizga tegishli murojaatni yuboring. Ma'lumotlaringiz avtomatik qo'shiladi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-filled user info (read-only) */}
          <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fuqaro:</span>
              <span className="font-medium">{user?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mahalla:</span>
              <span className="font-medium">{user?.mahalla_id ?? "Noma'lum"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Mavzu</Label>
            <Input
              id="title"
              placeholder="Murojaat mavzusini kiriting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea
              id="description"
              placeholder="Murojaatingizni batafsil tavsiflang"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              className="gradient-primary border-0 text-white"
              disabled={!title.trim() || !description.trim() || submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuborilmoqda...</>
              ) : (
                <><PlusCircle className="mr-2 h-4 w-4" /> Yuborish</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
