import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HealthProvider } from "@/contexts/HealthContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Biomarcadores from "./pages/Biomarcadores";
import Exames from "./pages/Exames";
import Timeline from "./pages/Timeline";
import Riscos from "./pages/Riscos";
import Resumo from "./pages/Resumo";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HealthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/exames" element={<Exames />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/riscos" element={<Riscos />} />
              <Route path="/resumo" element={<Resumo />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </HealthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
