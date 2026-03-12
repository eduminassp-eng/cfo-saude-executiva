import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HealthProvider } from "@/contexts/HealthContext";
import { AppLayout } from "@/components/AppLayout";
import { AnimatePresence } from "framer-motion";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Biomarcadores from "./pages/Biomarcadores";
import Exames from "./pages/Exames";
import Configuracoes from "./pages/Configuracoes";
import Copilot from "./pages/Copilot";
import RelatorioExecutivo from "./pages/RelatorioExecutivo";
import LabReader from "./pages/LabReader";
import AppleHealth from "./pages/AppleHealth";
import NotFound from "./pages/NotFound";
import { Activity } from "lucide-react";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3 animate-pulse">
        <Activity className="w-8 h-8 text-primary" />
        <span className="text-xl font-bold">Health<span className="text-primary">CFO</span></span>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/biomarcadores" element={<Biomarcadores />} />
        <Route path="/exames" element={<Exames />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/relatorio" element={<RelatorioExecutivo />} />
        <Route path="/resumo-consulta" element={<Navigate to="/relatorio" replace />} />
        <Route path="/resumo" element={<Navigate to="/relatorio" replace />} />
        <Route path="/tendencias" element={<Navigate to="/biomarcadores?tab=tendencias" replace />} />
        <Route path="/timeline" element={<Navigate to="/exames" replace />} />
        <Route path="/riscos" element={<Navigate to="/" replace />} />
        <Route path="/lab-reader" element={<LabReader />} />
        <Route path="/apple-health" element={<AppleHealth />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <HealthProvider>
      <AppLayout>
        <AnimatedRoutes />
      </AppLayout>
    </HealthProvider>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
