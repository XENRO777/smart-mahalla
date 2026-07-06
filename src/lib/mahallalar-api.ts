import apiClient, { getErrorMessage, type ApiResponse } from "./api";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Mahalla {
  id: string;
  nomi: string;
  tuman: string | null;
  sektor: string | null;
  rais_name: string | null;
}

export interface MahallaCreatePayload {
  nomi: string;
  tuman?: string | null;
  sektor?: string | null;
  rais_name?: string | null;
}

// ──────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────

export const mahallalarApi = {
  /**
   * List all mahallalar.
   * GET /mahallalar
   */
  list() {
    return apiClient.get<ApiResponse<Mahalla[]>>("/mahallalar");
  },

  /**
   * Get a single mahalla by ID.
   * GET /mahallalar/:id
   */
  get(id: string) {
    return apiClient.get<ApiResponse<Mahalla>>(`/mahallalar/${id}`);
  },

  /**
   * Create a new mahalla.
   * POST /mahallalar
   */
  create(payload: MahallaCreatePayload) {
    return apiClient.post<ApiResponse<Mahalla>>("/mahallalar", payload);
  },

  /**
   * Update an existing mahalla.
   * PUT /mahallalar/:id
   */
  update(id: string, payload: MahallaCreatePayload) {
    return apiClient.put<ApiResponse<Mahalla>>(`/mahallalar/${id}`, payload);
  },

  /**
   * Delete a mahalla.
   * DELETE /mahallalar/:id
   */
  delete(id: string) {
    return apiClient.delete<ApiResponse<void>>(`/mahallalar/${id}`);
  },
};

// ──────────────────────────────────────────────
// High-level helpers
// ──────────────────────────────────────────────

/**
 * Fetch all mahallalar. Returns null on failure (toast shown).
 */
export async function fetchMahallalar(): Promise<Mahalla[] | null> {
  try {
    const res = await mahallalarApi.list();
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Mahallalarni yuklashda xatolik"));
    return null;
  }
}

/**
 * Create a mahalla. Returns true on success.
 */
export async function createMahalla(payload: MahallaCreatePayload): Promise<boolean> {
  try {
    await mahallalarApi.create(payload);
    toast.success("Mahalla qo'shildi");
    return true;
  } catch (err) {
    toast.error(getErrorMessage(err, "Mahalla qo'shishda xatolik"));
    return false;
  }
}

/**
 * Update a mahalla. Returns true on success.
 */
export async function updateMahalla(id: string, payload: MahallaCreatePayload): Promise<boolean> {
  try {
    await mahallalarApi.update(id, payload);
    toast.success("Yangilandi");
    return true;
  } catch (err) {
    toast.error(getErrorMessage(err, "Mahallani yangilashda xatolik"));
    return false;
  }
}

/**
 * Delete a mahalla. Returns true on success.
 */
export async function deleteMahalla(id: string): Promise<boolean> {
  try {
    await mahallalarApi.delete(id);
    toast.success("O'chirildi");
    return true;
  } catch (err) {
    toast.error(getErrorMessage(err, "Mahallani o'chirishda xatolik"));
    return false;
  }
}
