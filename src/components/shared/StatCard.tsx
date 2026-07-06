import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
}

export function StatCard({ title, value, change, trend, icon: Icon, variant = "default" }: StatCardProps) {
  const iconStyles = {
    default: "bg-secondary text-secondary-foreground",
    primary: "gradient-primary text-white shadow-glow",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[variant];

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-elevated hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <div className={cn("inline-flex items-center gap-1 text-xs font-medium",
                trend === "up" ? "text-success" : "text-destructive")}>
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {change}
              </div>
            )}
          </div>
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110", iconStyles)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
