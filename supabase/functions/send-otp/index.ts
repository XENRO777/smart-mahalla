import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ESKIZ_EMAIL = Deno.env.get("ESKIZ_EMAIL")!;
const ESKIZ_PASSWORD = Deno.env.get("ESKIZ_PASSWORD")!;
const ESKIZ_FROM = Deno.env.get("ESKIZ_FROM") || "4546";

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) return digits;
  if (digits.startsWith("8") && digits.length === 9) return "99" + digits;
  if (digits.length === 9) return "998" + digits;
  return digits;
}

async function getEskizToken(): Promise<string> {
  const fd = new FormData();
  fd.append("email", ESKIZ_EMAIL);
  fd.append("password", ESKIZ_PASSWORD);
  const r = await fetch("https://notify.eskiz.uz/api/auth/login", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok || !j?.data?.token) throw new Error("Eskiz auth failed: " + JSON.stringify(j));
  return j.data.token;
}

async function sendSms(token: string, phone: string, message: string) {
  const fd = new FormData();
  fd.append("mobile_phone", phone);
  fd.append("message", message);
  fd.append("from", ESKIZ_FROM);
  const r = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const j = await r.json();
  if (!r.ok) throw new Error("SMS send failed: " + JSON.stringify(j));
  return j;
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ error: "phone_required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = normalizePhone(phone);
    if (normalized.length < 12) {
      return new Response(JSON.stringify({ error: "invalid_phone" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Telefon bo'yicha foydalanuvchini topish
    const { data: profile } = await admin.from("profiles").select("id").eq("phone", normalized).maybeSingle();
    // Xavfsizlik: agar topilmasa ham success qaytaramiz (account enumeration'dan himoya)
    if (!profile) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Rate limit: oxirgi 60 soniya ichida bormi?
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await admin.from("password_otp").select("*", { count: "exact", head: true }).eq("phone", normalized).gte("created_at", since);
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error: "rate_limited", message: "1 daqiqa kuting" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

    await admin.from("password_otp").insert({
      phone: normalized, user_id: profile.id, code_hash: codeHash, expires_at: expiresAt,
    });

    const token = await getEskizToken();
    await sendSms(token, normalized, `SmartMahalla parol tiklash kodi: ${code}. 5 daqiqa amal qiladi.`);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-otp error:", e);
    return new Response(JSON.stringify({ error: "server_error", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
