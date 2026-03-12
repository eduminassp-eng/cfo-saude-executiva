import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-5 max-w-sm">
        <p className="text-7xl font-black text-primary/20">404</p>
        <h1 className="text-xl font-bold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A página <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> não existe.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
