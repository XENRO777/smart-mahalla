import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) return digits;
  if (digits.startsWith("8") && digits.length === 9) return "99" + digits;
  if (digits.length === 9) return "998" + digits;
  return digits;
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { phone, code, new_password } = await req.json();
    if (!phone || !code || !new_password) {
      return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (typeof new_password !== "string" || new_password.length < 6) {
      return new Response(JSON.stringify({ error: "weak_password", message: "Parol kamida 6 ta belgidan iborat bo'lsin" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const normalized = normalizePhone(phone);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: otp } = await admin
      .from("password_otp")
      .select("*")
      .eq("phone", normalized)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) {
      return new Response(JSON.stringify({ error: "no_otp" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (otp.attempts >= 5) {
      return new Response(JSON.stringify({ error: "too_many_attempts" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const codeHash = await sha256(String(code));
    if (codeHash !== otp.code_hash) {
      await admin.from("password_otp").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
      return new Response(JSON.stringify({ error: "invalid_code" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parolni yangilash (admin API)
    const { error: updErr } = await admin.auth.admin.updateUserById(otp.user_id, { password: new_password });
    if (updErr) {
      return new Response(JSON.stringify({ error: "update_failed", message: updErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("password_otp").update({ consumed: true }).eq("id", otp.id);
    await admin.from("audit_log").insert({
      actor_id: otp.user_id, action: "password_reset", target_type: "user", target_id: otp.user_id,
      metadata: { method: "sms_otp" },
    });

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("verify-otp error:", e);
    return new Response(JSON.stringify({ error: "server_error", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
