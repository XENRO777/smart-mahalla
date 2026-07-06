import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AppLayout from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Mahallalar from "./pages/Mahallalar";
import Aholi from "./pages/Aholi";
import Murojaatlar from "./pages/Murojaatlar";
import Xodimlar from "./pages/Xodimlar";
import AI from "./pages/AI";
import Tokenlar from "./pages/Tokenlar";
import KPI from "./pages/KPI";
import Integratsiya from "./pages/Integratsiya";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary label="Auth">
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                element={
                  <ProtectedRoute>
                    <ErrorBoundary label="Sahifa">
                      <AppLayout />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/mahallalar" element={<Mahallalar />} />
                <Route path="/aholi" element={<Aholi />} />
                <Route path="/murojaatlar" element={<Murojaatlar />} />
                <Route path="/xodimlar" element={<Xodimlar />} />
                <Route path="/ai" element={<AI />} />
                <Route path="/tokenlar" element={<Tokenlar />} />
                <Route path="/kpi" element={<KPI />} />
                <Route path="/integratsiya" element={<Integratsiya />} />
              </Route>
              <Route path="*" element={
                <ErrorBoundary label="NotFound">
                  <NotFound />
                </ErrorBoundary>
              } />
            </Routes>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
