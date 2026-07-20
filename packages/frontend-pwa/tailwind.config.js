/** @type {import('tailwindcss').Config} */
/**
 * ESTRATEGIA DE RUTAS OMNIDIRECCIONALES PARA NPM WORKSPACES:
 *
 * En un monorepo gestionado con npm workspaces, los scripts globales (`npm run dev`
 * desde la raíz `/SalonOS`) ejecutan los procesos hijos con `cwd` apuntando a la raíz
 * del workspace, NO a la carpeta del paquete individual. Tailwind CSS resuelve los globs
 * del arreglo `content` de forma relativa al directorio de trabajo actual (cwd).
 *
 * Si solo se declaran rutas locales (`./src/**`), Tailwind busca en `/SalonOS/src/`
 * (inexistente) en lugar de `/SalonOS/packages/frontend-pwa/src/`, resultando en cero
 * clases detectadas y una PWA sin estilos.
 *
 * La solución es declarar AMBOS conjuntos de rutas:
 *   - Rutas locales (`./index.html`, `./src/**`) → funcionan al ejecutar desde el paquete.
 *   - Rutas cruzadas (`./packages/frontend-pwa/...`) → funcionan al ejecutar desde la raíz.
 *
 * Tailwind ignora silenciosamente los globs que no resuelven a ningún archivo, por lo que
 * no hay penalización por declarar rutas redundantes; siempre se cubren ambos escenarios.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './packages/frontend-pwa/index.html',
    './packages/frontend-pwa/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-base': '#0F0F0F',
        'bg-card': '#1A1A1A',
        'bg-elevated': '#2A2A2A',
        gold: '#D4AF37',
        'gold-hover': '#B8960C',
        'gold-light': '#F5E27A',
        'text-primary': '#F5F5F5',
        'text-secondary': '#A0A0A0',
        'text-muted': '#6B7280',
        success: '#16A34A',
        danger: '#DC2626',
      },
      borderColor: {
        gold: 'rgba(212, 175, 55, 0.2)',
        light: 'rgba(245, 245, 245, 0.1)',
      },
      boxShadow: {
        'gold-sm': '0 2px 8px rgba(212, 175, 55, 0.15)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.25)',
        glow: '0 0 20px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
};
