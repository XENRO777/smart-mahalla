import { RefreshCw, CheckCircle2, Loader2, Plug } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrations } from "@/lib/mock-data";

export default function Integratsiya() {
  return (
    <>
      <PageHeader
        title="Tashqi integratsiyalar"
        description="MyGov, E-Mahalla, OneID va boshqa davlat tizimlari"
        actions={<Button size="sm" variant="outline"><Plug className="mr-1.5 h-4 w-4" /> Yangi ulash</Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {integrations.map((i) => (
          <Card key={i.id} className="transition-all hover:shadow-elevated hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-primary text-white font-bold shadow-glow">
                  {i.name.slice(0, 2).toUpperCase()}
                </div>
                {i.status === "active" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success text-[11px] font-medium px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Faol
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-info/10 text-info text-[11px] font-medium px-2 py-0.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Sinxron
                  </span>
                )}
              </div>
              <h3 className="font-semibold">{i.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{i.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-md bg-secondary/60 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Ma'lumotlar</p>
                  <p className="text-sm font-bold">{i.count.toLocaleString()}</p>
                </div>
                <div className="rounded-md bg-secondary/60 p-2">
                  <p className="text-[10px] uppercase text-muted-foreground">Oxirgi</p>
                  <p className="text-[11px] font-medium leading-tight pt-0.5">{i.lastSync}</p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full mt-4">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Yangilash
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
