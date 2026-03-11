import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, Calendar, AlertTriangle, 
  FileText, Settings, Menu, X, Activity, BrainCircuit, Sun, Moon 
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/biomarcadores', label: 'Biomarcadores', icon: Activity },
  { path: '/exames', label: 'Exames', icon: ClipboardList },
  { path: '/copilot', label: 'AI Copilot', icon: BrainCircuit },
  { path: '/timeline', label: 'Timeline', icon: Calendar },
  { path: '/riscos', label: 'Riscos', icon: AlertTriangle },
  { path: '/resumo', label: 'Resumo', icon: FileText },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
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
      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-border no-print">
        <h1 className="text-lg font-bold tracking-tight">Health<span className="text-primary">CFO</span></h1>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg bg-secondary">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`${mobileOpen ? 'block' : 'hidden'} lg:block w-full lg:w-56 shrink-0 border-r border-border bg-sidebar p-4 no-print`}>
        <h1 className="hidden lg:block text-xl font-bold tracking-tight mb-8 px-2">
          Health<span className="text-primary">CFO</span>
        </h1>
        <nav className="space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active 
                    ? 'bg-sidebar-accent text-primary' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
