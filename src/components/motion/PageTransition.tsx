import { motion } from 'framer-motion';
import { ReactNode, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route order mirrors the sidebar nav.
 * Navigating DOWN the list → slide from right/bottom.
 * Navigating UP → slide from left/top.
 */
const routeOrder = [
  '/',
  '/biomarcadores',
  '/exames',
  '/copilot',
  '/tendencias',
  '/timeline',
  '/riscos',
  '/relatorio',
  '/resumo-consulta',
  '/lab-reader',
  '/apple-health',
  '/resumo',
  '/configuracoes',
];

function getRouteIndex(path: string) {
  const idx = routeOrder.indexOf(path);
  return idx === -1 ? routeOrder.length : idx;
}

// Module-level previous path tracker so all PageTransition instances share direction
let prevPath: string | null = null;

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const currentIndex = getRouteIndex(location.pathname);
  const directionRef = useRef(0);

  useEffect(() => {
    if (prevPath !== null) {
      const prevIndex = getRouteIndex(prevPath);
      directionRef.current = currentIndex >= prevIndex ? 1 : -1;
    }
    prevPath = location.pathname;
  }, [location.pathname, currentIndex]);

  const direction = directionRef.current;

  // Horizontal slide for desktop feel, subtle vertical for depth
  const offsetX = direction * 60;
  const offsetY = direction * 8;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, x: offsetX, y: offsetY, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -offsetX * 0.5, y: -offsetY * 0.5, scale: 0.98 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.25 },
      }}
    >
      {children}
    </motion.div>
  );
}
