import apiClient, { getErrorMessage, type ApiResponse } from "./api";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types – mirroring API response shape
// ──────────────────────────────────────────────

export interface DashboardStats {
  total_population: number;
  total_population_change: string;
  total_population_trend: "up" | "down";

  active_mahallas: number;
  total_mahallas: number;
  mahalla_coverage_pct: number;

  new_appeals_today: number;
  new_appeals_change: string;
  new_appeals_trend: "up" | "down";

  distributed_tokens: number;
  tokens_change: string;
  tokens_trend: "up" | "down";
}

export interface MahallaHealth {
  id: string;
  nomi: string;
  sektor: number;
  health_score: number;
  resolved: number;
  pending: number;
}

export interface AiAlert {
  id: number;
  level: "warning" | "info" | "success";
  title: string;
  text: string;
}

export interface RecentAppeal {
  id: string;
  citizen_name: string;
  subject: string;
  source: string;
  status: string;
  date: string;
}

export interface DashboardData {
  stats: DashboardStats;
  mahallalar: MahallaHealth[];
  ai_alerts: AiAlert[];
  recent_appeals: RecentAppeal[];
}

// ──────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────

export const dashboardApi = {
  /**
   * Fetch all dashboard data in a single request.
   * GET /dashboard
   */
  getDashboard() {
    return apiClient.get<ApiResponse<DashboardData>>("/dashboard");
  },
};

// ──────────────────────────────────────────────
// High-level data hook helpers
// ──────────────────────────────────────────────

/**
 * Fetch dashboard data with error handling.
 * Returns null on failure (toast shown).
 */
export async function fetchDashboard(): Promise<DashboardData | null> {
  try {
    const res = await dashboardApi.getDashboard();
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Dashboard ma'lumotlarini yuklashda xatolik"));
    return null;
  }
}
