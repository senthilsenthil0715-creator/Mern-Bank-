import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="splash">Sovereign Bank</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Auth mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Auth mode="register" />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
