import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("send-otp", { body: { phone } });
    setLoading(false);
    if (error || (data as any)?.error) {
      const msg = (data as any)?.message || (data as any)?.error || error?.message;
      return toast.error(msg === "rate_limited" ? "1 daqiqa kuting" : "SMS yuborilmadi: " + msg);
    }
    toast.success("Tasdiqlash kodi telefoningizga yuborildi");
    setStep("verify");
  }

  async function verifyAndReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { phone, code, new_password: newPassword },
    });
    setLoading(false);
    const err = (data as any)?.error || error?.message;
    if (err) {
      const map: Record<string, string> = {
        invalid_code: "Kod noto'g'ri",
        expired: "Kod muddati tugagan, qaytadan so'rang",
        too_many_attempts: "Juda ko'p urinish, biroz kuting",
        weak_password: "Parol kamida 6 ta belgidan iborat bo'lsin",
        no_otp: "Kod topilmadi, qaytadan so'rang",
      };
      return toast.error(map[err] || (data as any)?.message || err);
    }
    toast.success("Parol muvaffaqiyatli o'zgartirildi. Endi tizimga kiring.");
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-2">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Parolni tiklash</CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Telefon raqamingizga tasdiqlash kodi yuboramiz"
              : "Kodni kiriting va yangi parol o'rnating"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqami</Label>
                <Input
                  id="phone" type="tel" required placeholder="+998 90 123 45 67"
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">O'zbekiston raqami formati</p>
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary border-0 text-white">
                {loading ? "Yuborilmoqda..." : "Kod yuborish"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyAndReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Tasdiqlash kodi</Label>
                <Input
                  id="code" inputMode="numeric" maxLength={6} required placeholder="6 xonali kod"
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPwd">Yangi parol</Label>
                <Input
                  id="newPwd" type="password" minLength={6} required
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary border-0 text-white">
                {loading ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>
                Boshqa raqam
              </Button>
            </form>
          )}

          <Link
            to="/auth"
            className="mt-4 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Kirish sahifasiga qaytish
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
