import type { JSX } from 'react';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: JSX.Element;
}

export function AdminRoute({ children }: AdminRouteProps) {
  // Pega os dados do usuário logado que salvamos no localStorage no momento do Login
  // IMPORTANTE: Verifique se a sua chave no localStorage tem esse nome mesmo. 
  // Pode ser '@Antropo:user' ou algo parecido.
  const userStorage = localStorage.getItem('@Antropo:user');

  if (!userStorage) {
    return <Navigate to="/" />; // Se não tiver usuário logado, expulsa pro login
  }

  const user = JSON.parse(userStorage);

  // Verifica se a propriedade que define o cargo (role/perfil) é de administrador
  // Ajuste 'admin' para o nome exato que seu banco de dados usa (ex: 'ADMIN', 'administrador')
  if (user.role !== 'admin') {
    alert("Acesso negado: Apenas administradores podem acessar esta página.");
    return <Navigate to="/dashboard" replace />; // Devolve o pesquisador pro dashboard
  }

  // Se passou por tudo, libera a página!
  return children;
}