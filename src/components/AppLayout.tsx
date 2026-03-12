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
  { path: '/lab-reader', label: 'Lab Reader', icon: FlaskConical },
  { path: '/apple-health', label: 'Apple Health', icon: Heart },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

// Bottom tab bar items (mobile - Apple Health style with 5 main tabs)
const mobileTabItems = [
  { path: '/', label: 'Resumo', icon: LayoutDashboard },
  { path: '/biomarcadores', label: 'Dados', icon: Activity },
  { path: '/copilot', label: 'Copilot', icon: BrainCircuit },
  { path: '/tendencias', label: 'Tendências', icon: TrendingUp },
  { path: '/configuracoes', label: 'Mais', icon: Menu },
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

  // Check if current path matches one of the bottom tabs
  const isTabActive = (tabPath: string) => {
    if (tabPath === '/configuracoes') {
      // "More" tab is active for any non-main route
      return !['/','biomarcadores','/copilot','/tendencias'].some(p => location.pathname === p)
        && location.pathname !== '/biomarcadores';
    }
    return location.pathname === tabPath;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Skip to main content (a11y) */}
      <a href="#main-content" className="skip-to-main">
        Pular para o conteúdo principal
      </a>

      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-5 py-3.5 border-b border-border/50 no-print bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <h1 className="text-lg font-bold tracking-tight">
          Health<span className="text-primary">CFO</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-secondary/80"
            aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-secondary/80"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile full-screen nav overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-x-0 top-[57px] bottom-0 z-30 bg-background/95 backdrop-blur-xl overflow-y-auto no-print"
          >
            <nav className="p-4 space-y-1" aria-label="Menu de navegação">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      active 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 mt-4 border-t border-border/50">
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  Sair
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border/50 bg-sidebar p-4 no-print"
        role="navigation"
        aria-label="Navegação principal"
      >
        <h1 className="text-xl font-bold tracking-tight mb-8 px-3">
          Health<span className="text-primary">CFO</span>
        </h1>
        <nav className="space-y-0.5 flex-1" aria-label="Menu principal">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <motion.div key={item.path} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
                <Link
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active 
                      ? 'bg-primary/12 text-primary' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-sidebar-border space-y-0.5">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 w-full"
            aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-destructive/15 hover:text-destructive transition-all duration-200 w-full"
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 overflow-y-auto pb-20 lg:pb-0" role="main">
        <div className="max-w-6xl mx-auto px-4 py-4 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar (Apple Health style) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 no-print safe-area-bottom"
        aria-label="Navegação rápida"
      >
        <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
          {mobileTabItems.map(item => {
            const active = item.path === '/configuracoes'
              ? !['/', '/biomarcadores', '/copilot', '/tendencias'].includes(location.pathname)
              : location.pathname === item.path;
            return (
              <motion.div key={item.path} whileTap={{ scale: 0.85, y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                <Link
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Floating AI Chat button - only on desktop or when not on copilot */}
      <AnimatePresence>
        {location.pathname !== '/copilot' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="hidden lg:block fixed bottom-6 right-6 z-50 no-print"
          >
            <Link
              to="/copilot"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
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
