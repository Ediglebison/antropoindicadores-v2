import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, MapPin, Users, LogOut, ClipboardList, Menu, X } from 'lucide-react';
import './styles.css';
import logoImg from '../../assets/ppgeaa_ia.png';

export function DashboardLayout() {
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false); 

  useEffect(() => {
    const userStorage = localStorage.getItem('user');
    if (userStorage) {
      try {
        const user = JSON.parse(userStorage);
        
        if (user.role === 'ADMIN') {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Erro ao ler dados do usuário no menu");
      }
    }
  }, []);

  function handleLogout() {
    localStorage.clear();
    navigate('/');
  }
  
  // Estado para controlar se o menu está visível no mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  // Fecha o menu automaticamente quando clica em um link no mobile
  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="layout-wrapper">
      
      {/* CABEÇALHO MOBILE (Só aparece em telas pequenas) */}
      <header className="mobile-header">
        <button onClick={toggleSidebar} className="menu-btn">
          <Menu size={28} />
        </button>
        <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>Antropoindicadores</span>
        <div style={{ width: 28 }}></div> {/* Espaçador para centralizar o título */}
      </header>

      {/* FUNDO ESCURO (OVERLAY) QUANDO O MENU ESTÁ ABERTO NO MOBILE */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* BARRA LATERAL (MENU) */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/home" onClick={closeSidebar} style={{ display: 'block', width: '100%' }}>
            <img 
              src={logoImg} 
              alt="Logo" 
              className="desktop-logo"
              style={{ width: '100%', maxWidth: '45px', objectFit: 'contain', cursor: 'pointer' }}
            /> 
          </Link>
          
          {/* Botão de fechar (X) dentro do menu mobile */}
          <button className="close-btn mobile-only" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* =========================================
              LINKS PÚBLICOS (Pesquisadores comuns veem)
              ========================================= */}
          <NavLink to="/dashboard" onClick={closeSidebar} className="nav-item">
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/collection" onClick={closeSidebar} className="nav-item">
            <ClipboardList size={20} /> Coleta em Campo
          </NavLink>
          <NavLink to="/responses" onClick={closeSidebar} className="nav-item">
            <ClipboardList size={20} /> Resultados
          </NavLink>

          {/* =========================================
              LINKS RESTRITOS (Apenas Admins veem)
              ========================================= */}
          {isAdmin && (
            <>
              <NavLink to="/surveys" onClick={closeSidebar} className="nav-item">
                <FileText size={20} /> Questionários
              </NavLink>
              <NavLink to="/locations" onClick={closeSidebar} className="nav-item">
                <MapPin size={20} /> Locais
              </NavLink>
              <NavLink to="/researchers" onClick={closeSidebar} className="nav-item">
                <Users size={20} /> Pesquisadores
              </NavLink>
            </>
          )}
        </nav>

        {/* Botão de Sair mantido na base do menu */}
        <button onClick={handleLogout} className="nav-item logout-btn" style={{ marginTop: 'auto', marginBottom: '1rem', marginLeft: '1rem', marginRight: '1rem', width: 'calc(100% - 2rem)' }}>
          <LogOut size={20} /> Sair
        </button>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}