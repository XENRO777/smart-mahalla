import apiClient, { getErrorMessage, type ApiResponse } from "./api";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Citizen {
  id: string;
  full_name: string;
  pinfl: string | null;
  birth_year: number | null;
  household: string | null;
  mahalla: string | null;
  mahalla_id: string | null;
  status: string;
  notebook: string | null;
  tokens: number;
  phone: string | null;
}

export interface CitizenCreatePayload {
  full_name: string;
  pinfl?: string | null;
  birth_year?: number | null;
  household?: string | null;
  phone?: string | null;
  notebook?: string | null;
  status?: string;
  mahalla_id?: string | null;
}

export interface PaginatedCitizens {
  items: Citizen[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ──────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────

export const citizensApi = {
  /**
   * Get paginated citizen list with optional search.
   * GET /citizens?page=0&page_size=20&search=...
   */
  list(params: { page?: number; page_size?: number; search?: string } = {}) {
    return apiClient.get<ApiResponse<PaginatedCitizens>>("/citizens", {
      params: {
        page: params.page ?? 0,
        page_size: params.page_size ?? 20,
        ...(params.search ? { search: params.search } : {}),
      },
    });
  },

  /**
   * Create a new citizen.
   * POST /citizens
   */
  create(payload: CitizenCreatePayload) {
    return apiClient.post<ApiResponse<Citizen>>("/citizens", payload);
  },
};

// ──────────────────────────────────────────────
// High-level helpers
// ──────────────────────────────────────────────

export async function fetchCitizens(
  page: number,
  pageSize: number,
  search: string,
): Promise<PaginatedCitizens | null> {
  try {
    const res = await citizensApi.list({ page, page_size: pageSize, search: search || undefined });
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Fuqarolarni yuklashda xatolik"));
    return null;
  }
}

export async function createCitizen(payload: CitizenCreatePayload): Promise<boolean> {
  try {
    await citizensApi.create(payload);
    toast.success("Fuqaro qo'shildi");
    return true;
  } catch (err) {
    toast.error(getErrorMessage(err, "Fuqaro qo'shishda xatolik"));
    return false;
  }
}
