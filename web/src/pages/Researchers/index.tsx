import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { UserPlus, Trash2, Shield, User as UserIcon, Pencil, X } from 'lucide-react'; // Importe Pencil e X
//import './styles.css'; // Crie um arquivo CSS básico ou use o global

interface UserData {
  id: string;
  name: string;
  access_code: string;
  role: string;
}

export function Researchers() {
  const [users, setUsers] = useState<any[]>([]);
  // Estado do formulário
  const [formData, setFormData] = useState({ name: '', access_code: '', password: '', role: 'RESEARCHER' });
  
  // Estado para controlar se estamos editando alguém (null = criando)
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao carregar usuários", error);
    }
  }

  // Função unificada para Salvar (Criar ou Editar)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        // MODO EDIÇÃO
        await api.patch(`/users/${editingId}`, formData);
        alert('Dados atualizados com sucesso!');
      } else {
        // MODO CRIAÇÃO
        await api.post('/users', formData);
        alert('Usuário cadastrado!');
      }
      
      handleCancelEdit(); // Limpa o form
      loadUsers(); // Recarrega a lista
    } catch (error) {
      alert('Erro ao salvar. Verifique se o código já existe.');
    }
  }

  // Prepara o formulário para editar
  function handleEdit(user: UserData) {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      access_code: user.access_code,
      password: '', // Senha começa vazia (só preenche se quiser mudar)
      role: user.role
    });
    // Rola a página para o topo (formulário)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cancela a edição e limpa o form
  function handleCancelEdit() {
    setEditingId(null);
    setFormData({ name: '', access_code: '', password: '', role: 'RESEARCHER' });
  }

  async function handleDelete(id: string) {
    if(!confirm("Tem certeza que deseja remover este usuário?")) return;
    await api.delete(`/users/${id}`);
    loadUsers();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gestão de Pesquisadores</h1>
      </div>

      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            {editingId && (
                <button onClick={handleCancelEdit} className="btn btn-outline btn-danger">
                    <X size={16} /> Cancelar Edição
                </button>
            )}
        </div>

        <form onSubmit={handleSubmit} className="grid-2-col">
          <div className="input-group">
            <label>Nome Completo</label>
            <input 
                className="form-control" 
                placeholder="Nome Completo" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
            />
          </div>

          <div className="input-group">
            <label>Código de Acesso</label>
            <input 
                className="form-control" 
                placeholder="Login (ex: PESQ-01)" 
                value={formData.access_code}
                onChange={e => setFormData({...formData, access_code: e.target.value.toUpperCase()})}
                required
            />
          </div>

          <div className="input-group">
            <label>Senha {editingId && '(Deixe em branco para manter a atual)'}</label>
            <input 
                className="form-control" 
                type="password"
                placeholder={editingId ? "Nova senha (opcional)" : "Senha inicial"} 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required={!editingId} // Obrigatório apenas na criação
            />
          </div>

          <div className="input-group">
            <label>Permissão</label>
            <select 
                className="form-control"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
            >
                <option value="RESEARCHER">Pesquisador (Apenas Coleta)</option>
                <option value="ADMIN">Administrador (Acesso Total)</option>
            </select>
          </div>
          
          <div style={{gridColumn: '1 / -1', marginTop: 10}}>
            <button type="submit" className="btn btn-primary full-width">
              {editingId ? <Pencil size={18} /> : <UserPlus size={18} />} 
              {editingId ? ' Salvar Alterações' : ' Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </div>

      <h3>Equipe Cadastrada</h3>
      <div className="surveys-list">
        {users.map(u => (
          <div key={u.id} className="survey-card" style={{ cursor: 'default' }}>
             <div className="survey-icon">
                {u.role === 'ADMIN' ? <Shield size={24} color="#eab308" /> : <UserIcon size={24} color="#2563eb" />}
             </div>
             
             <div className="survey-info">
                <h4>{u.name}</h4>
                <p>Login: <strong>{u.access_code}</strong></p>
                <small className={u.role === 'ADMIN' ? 'badge badge-warning' : 'badge badge-success'}>
                  {u.role === 'ADMIN' ? 'Administrador' : 'Pesquisador'}
                </small>
             </div>

             <div style={{display: 'flex', gap: 10}}>
                {/* Botão de Editar */}
                <button onClick={() => handleEdit(u)} className="btn btn-outline" title="Editar">
                   <Pencil size={16} />
                </button>
                
                {/* Botão de Excluir */}
                <button onClick={() => handleDelete(u.id)} className="btn btn-danger" title="Excluir">
                   <Trash2 size={16} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}