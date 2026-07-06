import React, { Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy loading orqali performance'ni oshiramiz (Bundle size kichrayadi)
const HokimiyatOverview = React.lazy(() => import("@/components/dashboard/HokimiyatOverview"));
const MahallaOverview = React.lazy(() => import("@/components/dashboard/MahallaOverview"));
const FuqaroOverview = React.lazy(() => import("@/components/dashboard/FuqaroOverview"));

// Rollar uchun TypeScript turi
export type UserRole = "HOKIMIYAT" | "MAHALLA" | "FUQARO";

/**
 * Map internal roles[] to a single dashboard role.
 *   admin               → HOKIMIYAT
 *   rais / kotib        → MAHALLA
 *   everything else     → FUQARO
 */
function deriveDashboardRole(roles: string[]): UserRole {
  if (roles.includes("admin")) return "HOKIMIYAT";
  if (roles.includes("rais") || roles.includes("kotib")) return "MAHALLA";
  return "FUQARO";
}

/**
 * Build a flat user object that the overview components expect.
 */
function buildDashboardUser(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): {
  full_name: string;
  email: string;
  role: UserRole;
  roles: string[];
  mahalla_id: string | null;
  mahalla_name: string | null;
} {
  return {
    full_name: user.full_name,
    email: user.email,
    role: deriveDashboardRole(user.roles),
    roles: user.roles,
    mahalla_id: user.mahalla_id ?? null,
    mahalla_name: user.mahalla_id ?? null, // API may return mahalla_name later
  };
}

export default function Dashboard() {
  const { user, loading: isLoading } = useAuth();

  // ── Auth loading ──
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // ── No user / no role → redirect instruction ──
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-destructive font-medium">
          Foydalanuvchi roli aniqlanmadi. Tizimga qayta kiring.
        </p>
      </div>
    );
  }

  const dashboardUser = buildDashboardUser(user);

  // ── Strategy Pattern ──
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <ErrorBoundary label="Dashboard">
        <Suspense fallback={<DashboardSkeleton />}>
          {(() => {
            switch (dashboardUser.role) {
              case "HOKIMIYAT":
                return <HokimiyatOverview user={dashboardUser} />;
              case "MAHALLA":
                return <MahallaOverview user={dashboardUser} />;
              case "FUQARO":
                return <FuqaroOverview user={dashboardUser} />;
              default:
                return (
                  <div className="text-muted-foreground">
                    Ruxsat berilmagan sahifa.
                  </div>
                );
            }
          })()}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
