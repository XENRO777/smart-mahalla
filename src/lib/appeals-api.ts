import apiClient, { getErrorMessage, type ApiResponse } from "./api";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Appeal {
  id: string;
  citizen_name: string;
  subject: string;
  source: string;
  status: string;
  priority: string;
  assignee: string;
  date: string;
}

export interface PaginatedAppeals {
  items: Appeal[];
  total: number;
  /** Counts per status for tab badges */
  counts: {
    all: number;
    new: number;
    progress: number;
    resolved: number;
    rejected: number;
  };
}

// ──────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────

export const appealsApi = {
  /**
   * Get paginated appeal list with optional search & status filter.
   * GET /appeals?tab=all&search=...
   */
  list(params: { tab?: string; search?: string } = {}) {
    return apiClient.get<ApiResponse<PaginatedAppeals>>("/appeals", {
      params: {
        ...(params.tab && params.tab !== "all" ? { status: params.tab } : {}),
        ...(params.search ? { search: params.search } : {}),
      },
    });
  },
};

// ──────────────────────────────────────────────
// High-level helpers
// ──────────────────────────────────────────────

export async function fetchAppeals(
  tab: string,
  search: string,
): Promise<PaginatedAppeals | null> {
  try {
    const res = await appealsApi.list({ tab, search: search || undefined });
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Murojaatlarni yuklashda xatolik"));
    return null;
  }
}
