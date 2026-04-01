import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './styles.css';
import { Eye, EyeOff } from 'lucide-react';
import logoImg from '../../assets/ppgeaa_ia.png';

export function Login() {
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  
  // Controla a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false); 
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        access_code: accessCode, 
        password: password 
      });

      const { access_token, user } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/dashboard');

    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Acesso negado. Verifique suas credenciais.');
      } else {
        setError('Erro de conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Nova Área de Cabeçalho Centralizada */}
        <div className="login-header">
          <img src={logoImg} alt="Logo Antropoindicadores" className="login-logo" />
          <h1>Antropoindicadores</h1>
          <p>Painel de Gestão de Pesquisa</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="code">Código de Acesso</label>
            <input 
              id="code"
              type="text" 
              placeholder="Digite seu código"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div style={{ position: 'relative' }}>
              <input 
                /* Alterna entre text e password baseado no estado */
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                placeholder="Sua senha secreta" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                /* Dá um espaço na direita para o texto não ficar por baixo do ícone */
                style={{ paddingRight: '40px' }} 
              />
              
              {/* BOTÃO DE MOSTRAR/OCULTAR SENHA */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar na Plataforma'}
          </button>
        </form>
      </div>
    </div>
  );
}