import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Landmark, Home, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";

type EntryType = "hokimiyat" | "mahalla" | "fuqaro";

const ENTRY_META: Record<EntryType, { label: string; icon: any; desc: string; allowSignup: boolean }> = {
  hokimiyat: { label: "Hokimiyat", icon: Landmark, desc: "Tizim boshqaruvchisi (super admin) uchun kirish", allowSignup: false },
  mahalla:   { label: "Mahalla Admin", icon: Home, desc: "Rais yoki kotib uchun kirish", allowSignup: false },
  fuqaro:    { label: "Fuqaro", icon: UserIcon, desc: "Oddiy foydalanuvchilar uchun kirish va ro'yxatdan o'tish", allowSignup: true },
};

type MahallaOpt = { id: string; nomi: string };

export default function Auth() {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [entry, setEntry] = useState<EntryType>("fuqaro");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mahallaId, setMahallaId] = useState<string>("");
  const [mahallalar, setMahallalar] = useState<MahallaOpt[]>([]);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (entry === "fuqaro" && mode === "signup" && mahallalar.length === 0) {
      apiClient.get("/mahallalar").then((res) => {
        setMahallalar(res.data?.data ?? []);
      }).catch(() => {
        // Silently fail – the dropdown will show "Yuklanmoqda..."
      });
    }
  }, [entry, mode, mahallalar.length]);

  // Reset to login mode when switching to a non-signup entry type
  useEffect(() => {
    if (!ENTRY_META[entry].allowSignup) setMode("login");
  }, [entry]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      // Error toast is already shown inside useAuth.login()
    } finally {
      setLoading(false);
    }
  }

  const [pinfl, setPinfl] = useState("");
  const [household, setHousehold] = useState("");
  const [birthYear, setBirthYear] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!mahallaId) {
      toast.error("Iltimos, mahallani tanlang");
      return;
    }
    setLoading(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        mahalla_id: mahallaId,
        pinfl,
        household,
        birth_year: birthYear ? parseInt(birthYear, 10) : undefined,
      });
      navigate("/", { replace: true });
    } catch {
      // Error toast is already shown inside useAuth.register()
    } finally {
      setLoading(false);
    }
  }

  const meta = ENTRY_META[entry];
  const Icon = meta.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">SmartMahalla tizimiga kirish</CardTitle>
            <CardDescription className="mt-1">Foydalanuvchi turini tanlang</CardDescription>
          </div>

          {/* Entry type selector */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(Object.keys(ENTRY_META) as EntryType[]).map((key) => {
              const m = ENTRY_META[key];
              const I = m.icon;
              const active = entry === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEntry(key)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:bg-accent/40"
                  )}
                >
                  <I className="h-4 w-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
            <Icon className="h-3.5 w-3.5" /> {meta.desc}
          </p>
        </CardHeader>

        <CardContent>
          {meta.allowSignup ? (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Kirish</TabsTrigger>
                <TabsTrigger value="signup">Ro'yxatdan o'tish</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  loading={loading} onSubmit={handleLogin}
                />
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">F.I.O. *</Label>
                    <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="pinfl">PINFL</Label>
                      <Input
                        id="pinfl"
                        placeholder="14 raqam"
                        maxLength={14}
                        value={pinfl}
                        onChange={(e) => setPinfl(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthYear">Tug'ilgan yili</Label>
                      <Input
                        id="birthYear"
                        type="number"
                        placeholder="1990"
                        min={1900}
                        max={new Date().getFullYear()}
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="mahalla">Mahalla *</Label>
                      <Select value={mahallaId} onValueChange={setMahallaId}>
                        <SelectTrigger id="mahalla">
                          <SelectValue placeholder="Tanlang" />
                        </SelectTrigger>
                        <SelectContent>
                          {mahallalar.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.nomi}</SelectItem>
                          ))}
                          {mahallalar.length === 0 && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">Mahallalar yuklanmoqda...</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="household">Manzil (xonadon)</Label>
                      <Input
                        id="household"
                        placeholder="Ko'cha, uy raqami"
                        value={household}
                        onChange={(e) => setHousehold(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email *</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Parol *</Label>
                    <Input id="password2" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gradient-primary border-0 text-white">
                    {loading ? "Yaratilmoqda..." : "Ro'yxatdan o'tish"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <div>
              <div className="rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground mb-4">
                {entry === "hokimiyat"
                  ? "Hokimiyat hisobi faqat tizim boshqaruvchisi tomonidan beriladi. Ro'yxatdan o'tish yopiq."
                  : "Mahalla admin hisobi (rais/kotib) faqat hokimiyat tomonidan beriladi. Ro'yxatdan o'tish yopiq."}
              </div>
              <LoginForm
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                loading={loading} onSubmit={handleLogin}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm({
  email, setEmail, password, setPassword, loading, onSubmit,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  loading: boolean; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Parol</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Parolni unutdingizmi?
          </Link>
        </div>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full gradient-primary border-0 text-white">
        {loading ? "Kirilmoqda..." : "Kirish"}
      </Button>
    </form>
  );
}
