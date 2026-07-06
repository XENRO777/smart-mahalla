import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const Body = z.object({
  user_id: z.string().uuid(),
  action: z.enum(["update", "delete"]),
  full_name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(6).max(20).optional().nullable(),
  mahalla_id: z.string().uuid().optional().nullable(),
  role: z.enum(["rais", "kotib", "user"]).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { user_id, action, full_name, phone, mahalla_id, role } = parsed.data;

    if (action === "delete") {
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await admin.from("audit_log").insert({
        actor_id: userData.user.id,
        action: "delete_staff",
        target_type: "user",
        target_id: user_id,
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profilePatch: Record<string, unknown> = {};
    if (full_name !== undefined) profilePatch.full_name = full_name;
    if (phone !== undefined) profilePatch.phone = phone;
    if (mahalla_id !== undefined) profilePatch.mahalla_id = mahalla_id;
    if (Object.keys(profilePatch).length > 0) {
      await admin.from("profiles").update(profilePatch).eq("id", user_id);
    }

    if (role) {
      await admin.from("user_roles").delete().eq("user_id", user_id);
      await admin.from("user_roles").insert({ user_id, role });
    }

    await admin.from("audit_log").insert({
      actor_id: userData.user.id,
      action: "update_staff",
      target_type: "user",
      target_id: user_id,
      metadata: { full_name, phone, mahalla_id, role },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
