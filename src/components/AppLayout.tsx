import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, Calendar, AlertTriangle, 
  FileText, Settings, Menu, X, Activity, BrainCircuit, Sun, Moon,
  TrendingUp, FileBarChart, Stethoscope, FlaskConical, LogOut, Heart, MessageCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/biomarcadores', label: 'Biomarcadores', icon: Activity },
  { path: '/exames', label: 'Exames', icon: ClipboardList },
  { path: '/copilot', label: 'AI Copilot', icon: BrainCircuit },
  { path: '/tendencias', label: 'Tendências', icon: TrendingUp },
  { path: '/timeline', label: 'Timeline', icon: Calendar },
  { path: '/riscos', label: 'Riscos', icon: AlertTriangle },
  { path: '/relatorio', label: 'Relatório', icon: FileBarChart },
  { path: '/resumo-consulta', label: 'P/ Consulta', icon: Stethoscope },
  { path: '/lab-reader', label: 'Lab Reader', icon: FlaskConical },
  { path: '/apple-health', label: 'Apple Health', icon: Heart },
  { path: '/resumo', label: 'Resumo', icon: FileText },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('health-cfo-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('health-cfo-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Skip to main content (a11y) */}
      <a href="#main-content" className="skip-to-main">
        Pular para o conteúdo principal
      </a>

      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border no-print">
        <h1 className="text-lg font-bold tracking-tight">Health<span className="text-primary">CFO</span></h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-secondary"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-56 shrink-0 border-r border-border bg-sidebar p-4 no-print`}
        role="navigation"
        aria-label="Navegação principal"
      >
        <h1 className="hidden lg:block text-xl font-bold tracking-tight mb-8 px-2">
          Health<span className="text-primary">CFO</span>
        </h1>
        <nav className="space-y-1" aria-label="Menu principal">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-sidebar-accent text-primary' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
            aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 overflow-y-auto" role="main">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Floating AI Chat button */}
      <AnimatePresence>
        {location.pathname !== '/copilot' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 no-print"
          >
            <Link
              to="/copilot"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              aria-label="Abrir chat com inteligência artificial"
            >
              <MessageCircle className="w-6 h-6" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
