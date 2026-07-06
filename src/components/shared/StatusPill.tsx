import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  Yangi: "bg-info/10 text-info border-info/20",
  Jarayonda: "bg-warning/10 text-warning border-warning/20",
  "Hal qilindi": "bg-success/10 text-success border-success/20",
  "Rad etildi": "bg-destructive/10 text-destructive border-destructive/20",
  Yuqori: "bg-destructive/10 text-destructive border-destructive/20",
  "O'rta": "bg-warning/10 text-warning border-warning/20",
  Past: "bg-muted text-muted-foreground border-border",
  Faol: "bg-success/10 text-success border-success/20",
  Ishsiz: "bg-destructive/10 text-destructive border-destructive/20",
  Talaba: "bg-info/10 text-info border-info/20",
  Pensioner: "bg-accent text-accent-foreground border-accent",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
      variants[status] || "bg-secondary text-secondary-foreground border-border"
    )}>
      {status}
    </span>
  );
}
