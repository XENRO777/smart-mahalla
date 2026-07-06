import { useState, useEffect } from "react";
import { assignApplication, type Application, type ApplicationStatus } from "@/lib/applications-api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Loader2, FileText, Calendar, MapPin } from "lucide-react";
import { StatusPill } from "@/components/shared/StatusPill";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: "YANGI", label: "Yangi", color: "bg-info/10 text-info" },
  { value: "JARAYONDA", label: "Jarayonda", color: "bg-warning/10 text-warning" },
  { value: "BAJARILDI", label: "Bajarildi", color: "bg-success/10 text-success" },
  { value: "RAD_ETILDI", label: "Rad etildi", color: "bg-destructive/10 text-destructive" },
];

interface AssignApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onSuccess: () => void;
}

export function AssignApplicationModal({ open, onOpenChange, application, onSuccess }: AssignApplicationModalProps) {
  const [status, setStatus] = useState<ApplicationStatus>("JARAYONDA");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [responsibleNotes, setResponsibleNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens with new application
  useEffect(() => {
    if (application && open) {
      setStatus(application.status === "YANGI" ? "JARAYONDA" : application.status);
      setResponsiblePerson(application.responsiblePerson ?? "");
      setResponsibleNotes(application.responsibleNotes ?? "");
    }
  }, [application, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    setSubmitting(true);
    const result = await assignApplication(application.id, {
      status,
      responsiblePerson: responsiblePerson.trim() || undefined,
      responsibleNotes: responsibleNotes.trim() || undefined,
    });
    setSubmitting(false);

    if (result) {
      onOpenChange(false);
      onSuccess();
    }
  };

  if (!application) return null;

  const statusLabel = application.status === "YANGI" ? "Yangi"
    : application.status === "JARAYONDA" ? "Jarayonda"
    : application.status === "BAJARILDI" ? "Hal qilindi"
    : "Rad etildi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Murojaatni tayinlash
          </DialogTitle>
          <DialogDescription>
            Mas'ul shaxsni belgilang va murojaat holatini yangilang
          </DialogDescription>
        </DialogHeader>

        {/* Application info preview */}
        <div className="rounded-lg bg-secondary/40 p-4 space-y-2 text-sm border">
          <h4 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {application.title}
          </h4>
          <p className="text-muted-foreground text-xs line-clamp-2">{application.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(application.createdAt).toLocaleDateString("uz-UZ")}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {application.mahallaName}
            </span>
            <span>
              Fuqaro: <strong>{application.citizenName}</strong>
            </span>
            <StatusPill status={statusLabel} />
            {application.aiCategory && (
              <Badge variant="secondary" className="text-[10px]">{application.aiCategory}</Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assign-status">Holat</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApplicationStatus)}>
              <SelectTrigger id="assign-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-person">Mas'ul shaxs (F.I.O)</Label>
            <Input
              id="assign-person"
              placeholder="Mas'ul shaxsning to'liq ismini kiriting"
              value={responsiblePerson}
              onChange={(e) => setResponsiblePerson(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-notes">Mas'ul izohi (ixtiyoriy)</Label>
            <Textarea
              id="assign-notes"
              placeholder="Bajarilgan ishlar haqida qisqacha izoh"
              value={responsibleNotes}
              onChange={(e) => setResponsibleNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
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
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saqlanmoqda...</>
              ) : (
                <><UserCheck className="mr-2 h-4 w-4" /> Saqlash</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
