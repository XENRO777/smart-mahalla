import apiClient, { getErrorMessage, type ApiResponse } from "./api";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type ApplicationStatus = "YANGI" | "JARAYONDA" | "BAJARILDI" | "RAD_ETILDI";

export type AiProcessingStatus = "pending" | "done" | "failed";

export interface Application {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string | null;
  mahallaId: string;
  mahallaName: string;
  title: string;
  description: string;
  status: ApplicationStatus;
  responsiblePerson: string | null;
  responsibleNotes: string | null;
  createdAt: string;
  // AI fields
  aiCategory: string | null;
  aiSummary: string | null;
  aiPriority: string | null;
  aiSuggestedDepartment: string | null;
  aiProcessingStatus: AiProcessingStatus | null;
}

export interface SubmitApplicationPayload {
  mahallaId: string;
  title: string;
  description: string;
}

export interface AssignApplicationPayload {
  responsiblePerson?: string;
  status?: ApplicationStatus;
  responsibleNotes?: string;
}

// ──────────────────────────────────────────────
// API calls
// ──────────────────────────────────────────────

export const applicationsApi = {
  /** Citizen submits a new application */
  submit(payload: SubmitApplicationPayload) {
    return apiClient.post<ApiResponse<Application>>("/applications", payload);
  },

  /** Mahalla admin fetches applications for their mahalla */
  getByMahalla(mahallaId: string) {
    return apiClient.get<ApiResponse<Application[]>>(`/applications/mahalla/${mahallaId}`);
  },

  /** Mahalla admin assigns responsible person and/or updates status */
  assign(id: string, payload: AssignApplicationPayload) {
    return apiClient.put<ApiResponse<Application>>(`/applications/${id}/assign`, payload);
  },

  /** Hokimiyat fetches ALL applications across all mahallas */
  getGovernment() {
    return apiClient.get<ApiResponse<Application[]>>("/applications/government");
  },
};

// ──────────────────────────────────────────────
// Dashboard stats types
// ──────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  yangi: number;
  jarayonda: number;
  bajarilgan: number;
  rad_etilgan: number;
  citizens_total: number;
  role: "FUQARO" | "MAHALLA" | "HOKIMIYAT";
  mahalla_id?: string;
  mahallaName?: string;
  totalMahallas?: number;
}

// ──────────────────────────────────────────────
// High-level helpers (with error handling)
// ──────────────────────────────────────────────

export async function submitApplication(
  payload: SubmitApplicationPayload,
): Promise<Application | null> {
  try {
    const res = await applicationsApi.submit(payload);
    toast.success(res.data.message);
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Arizani yuborishda xatolik"));
    return null;
  }
}

export async function fetchMahallaApplications(
  mahallaId: string,
): Promise<Application[]> {
  try {
    const res = await applicationsApi.getByMahalla(mahallaId);
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Arizalarni yuklashda xatolik"));
    return [];
  }
}

export async function assignApplication(
  id: string,
  payload: AssignApplicationPayload,
): Promise<Application | null> {
  try {
    const res = await applicationsApi.assign(id, payload);
    toast.success("Murojaat yangilandi");
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Murojaatni yangilashda xatolik"));
    return null;
  }
}

export async function fetchGovernmentApplications(): Promise<Application[]> {
  try {
    const res = await applicationsApi.getGovernment();
    return res.data.data;
  } catch (err) {
    toast.error(getErrorMessage(err, "Arizalarni yuklashda xatolik"));
    return [];
  }
}

/** Fetch dashboard stats based on user role */
export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  try {
    const res = await apiClient.get<ApiResponse<DashboardStats>>("/applications/stats");
    return res.data.data;
  } catch (err) {
    // Silent fail for dashboard stats — they're non-critical
    console.warn("[dashboard] Failed to fetch stats:", getErrorMessage(err));
    return null;
  }
}
