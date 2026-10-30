import { Routes, Route, Navigate } from 'react-router-dom';
import BookingPage from './pages/booking/BookingPage';
import LoginPage from './pages/admin/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AgendaPage from './pages/admin/AgendaPage';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { FinanceDashboard } from './pages/admin/FinanceDashboard';
import ClientasPage from './pages/admin/ClientasPage';
import ConfigPage from './pages/admin/ConfigPage';

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <p className="text-text-muted text-lg">🚧 {label} — Próximamente</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public booking flow */}
      <Route path="/reservar" element={<BookingPage />} />

      {/* Admin login (public) */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* Protected admin routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AgendaPage />} />
          <Route path="finanzas" element={<FinanceDashboard />} />
          <Route path="clientas" element={<ClientasPage />} />
          <Route path="inventario" element={<ComingSoon label="Inventario" />} />
          <Route path="config" element={<ConfigPage />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/reservar" replace />} />
    </Routes>
  );
}

export default App;
