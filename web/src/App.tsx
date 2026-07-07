import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/Layout';
import { SurveyBuilder } from './pages/Surveys/SurveyBuilder';
import { Researchers } from './pages/Researchers';
import { Locations } from './pages/Locations';
import { Collection } from './pages/Collection';
import { Responses } from './pages/Responses';
import { Dashboard } from './pages/Dashboard';
import { useAuth } from './contexts';

import type { JSX } from 'react/jsx-dev-runtime';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  return user ? children : <Navigate to="/" />;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/" />;
  if (user.role !== 'ADMIN') {
    alert("Acesso negado: Apenas administradores podem acessar esta página.");
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/responses" element={<Responses />} />

          <Route path="/surveys" element={<AdminRoute><SurveyBuilder /></AdminRoute>} />
          <Route path="/researchers" element={<AdminRoute><Researchers /></AdminRoute>} />
          <Route path="/locations" element={<AdminRoute><Locations /></AdminRoute>} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;