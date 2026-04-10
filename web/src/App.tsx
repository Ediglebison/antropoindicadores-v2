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

import type { JSX } from 'react/jsx-dev-runtime';

// Proteção de Rota Básica (Apenas verifica se tem o token de login)
function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
}

// Proteção de Rota Admin (Verifica se o usuário logado tem cargo de administrador)
function AdminRoute({ children }: { children: JSX.Element }) {
  // Lemos o objeto do usuário que foi salvo no localStorage durante o Login
  const userStorage = localStorage.getItem('user'); 
  
  if (!userStorage) {
    return <Navigate to="/" />; // Se não tiver os dados, volta pro login
  }

  try {
    const user = JSON.parse(userStorage);
    
    if (user.role !== 'ADMIN') {
      alert("Acesso negado: Apenas administradores podem acessar esta página.");
      return <Navigate to="/dashboard" replace />;
    }
    
    return children; // Se for admin, libera o acesso ao componente!
  } catch (error) {
    // Se der qualquer erro ao ler os dados do usuário, expulsa por segurança
    return <Navigate to="/" />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Todas as rotas aqui dentro terão o Menu Lateral e exigem estar logado */}
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          
          {/* ROTAS LIVRES (Pesquisadores comuns e Administradores acessam) */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/responses" element={<Responses />} />

          {/* ROTAS RESTRITAS (APENAS Administradores acessam) */}
          <Route path="/surveys" element={<AdminRoute><SurveyBuilder /></AdminRoute>} />
          <Route path="/researchers" element={<AdminRoute><Researchers /></AdminRoute>} />
          <Route path="/locations" element={<AdminRoute><Locations /></AdminRoute>} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;