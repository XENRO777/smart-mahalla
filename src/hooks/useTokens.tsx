import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TokenRule = {
  id: string;
  action_name: string;
  action_key: string;
  token_amount: number;
  daily_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Citizen = {
  id: string;
  full_name: string;
  mahalla: string | null;
  phone: string | null;
  status: string;
  tokens: number;
  is_suspicious: boolean;
};

export type LedgerEntry = {
  id: string;
  citizen_id: string;
  amount: number;
  entry_type: "earn" | "spend" | "manual";
  reason: string;
  rule_id: string | null;
  performed_by: string | null;
  created_at: string;
  citizen?: { full_name: string; mahalla: string | null };
};

export function useTokenRules() {
  const [rules, setRules] = useState<TokenRule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("token_rules").select("*").order("created_at", { ascending: false });
    setRules((data as TokenRule[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase.channel(`rules-rt-${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "token_rules" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  return { rules, loading, refresh };
}

export function useCitizens() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("citizens").select("*").order("tokens", { ascending: false });
    setCitizens((data as Citizen[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase.channel(`citizens-rt-${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "citizens" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  return { citizens, loading, refresh };
}

export function useLedger(filters: { search?: string; from?: string; to?: string; page: number; pageSize: number }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("token_ledger")
      .select("*, citizen:citizens(full_name, mahalla)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.from) q = q.gte("created_at", filters.from);
    if (filters.to) q = q.lte("created_at", filters.to);

    const start = (filters.page - 1) * filters.pageSize;
    q = q.range(start, start + filters.pageSize - 1);

    const { data, count } = await q;
    let rows = (data as LedgerEntry[]) ?? [];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      rows = rows.filter((r) => r.citizen?.full_name?.toLowerCase().includes(s));
    }
    setEntries(rows);
    setTotal(count ?? 0);
    setLoading(false);
  }, [filters.search, filters.from, filters.to, filters.page, filters.pageSize]);

  useEffect(() => {
    refresh();
    const ch = supabase.channel(`ledger-rt-${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "token_ledger" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  return { entries, total, loading, refresh };
}
