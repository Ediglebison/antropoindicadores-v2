import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MapPin, Trash2, Edit2, Plus, X } from 'lucide-react';
// Importe seu arquivo de estilos se houver, ex: import './styles.css';

interface Location {
  id: string;
  name: string;
  unique_code: string;
}

export function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  
  // NOVO: Estado para saber se estamos editando alguém (guarda o ID) ou criando novo (null)
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      const response = await api.get('/locations');
      setLocations(response.data);
    } catch (error) {
      console.error("Erro ao carregar locais", error);
    }
  }

  // --- FUNÇÃO ATUALIZADA: SALVAR (CRIAR OU EDITAR) ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        // Se tem um ID em edição, faz um PUT (Atualizar)
        await api.put(`/locations/${editingId}`, {
          name,
          unique_code: uniqueCode
        });
        alert('Local atualizado com sucesso!');
      } else {
        // Se não tem ID, faz um POST (Criar novo)
        await api.post('/locations', {
          name,
          unique_code: uniqueCode
        });
        alert('Local cadastrado com sucesso!');
      }
      
      // Limpa o formulário e recarrega a tabela
      cancelEdit();
      loadLocations();
    } catch (error) {
      console.error("Erro ao salvar local", error);
      alert('Erro ao salvar os dados.');
    }
  }

  // --- NOVA FUNÇÃO: PREPARAR PARA EDITAR ---
  function handleEdit(location: Location) {
    setEditingId(location.id);
    setName(location.name);
    setUniqueCode(location.unique_code);
    // Rola a página para o topo suavemente para o usuário ver o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- NOVA FUNÇÃO: CANCELAR EDIÇÃO ---
  function cancelEdit() {
    setEditingId(null);
    setName('');
    setUniqueCode('');
  }

  // --- NOVA FUNÇÃO: EXCLUIR ---
  async function handleDelete(id: string, locationName: string) {
    // Confirmação nativa do navegador para evitar cliques acidentais
    const confirm = window.confirm(`Tem certeza que deseja excluir o local "${locationName}"?\nEsta ação não pode ser desfeita.`);
    
    if (confirm) {
      try {
        await api.delete(`/locations/${id}`);
        alert('Local excluído com sucesso!');
        loadLocations(); // Atualiza a lista na tela
      } catch (error) {
        console.error("Erro ao excluir local", error);
        alert('Erro ao excluir. Verifique se existem questionários vinculados a este local.');
      }
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gerenciar Locais / Comunidades</h1>
        <p>Cadastre, edite ou remova os locais onde as pesquisas serão aplicadas.</p>
      </div>

      {/* FORMULÁRIO DE CADASTRO / EDIÇÃO */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="#2563eb" />
          {editingId ? 'Editar Local' : 'Novo Local'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome da Comunidade/Local</label>
            <input 
              type="text" 
              className="form-control" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Comunidade Ribeirinha São José"
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Código Único</label>
            <input 
              type="text" 
              className="form-control" 
              value={uniqueCode}
              onChange={e => setUniqueCode(e.target.value)}
              placeholder="Ex: SJ-01"
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
            
            {/* Botão de Cancelar só aparece se estiver editando */}
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: '0.75rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABELA DE LOCAIS */}
      <div className="table-container" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Nome do Local</th>
              <th style={{ padding: '1rem' }}>Código Único</th>
              <th style={{ padding: '1rem', width: '120px', textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Nenhum local cadastrado.</td>
              </tr>
            ) : (
              locations.map(loc => (
                <tr key={loc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>{loc.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 600 }}>
                      {loc.unique_code}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    
                    {/* BOTÃO EDITAR */}
                    <button 
                      onClick={() => handleEdit(loc)}
                      title="Editar"
                      style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                    >
                      <Edit2 size={18} />
                    </button>

                    {/* BOTÃO EXCLUIR */}
                    <button 
                      onClick={() => handleDelete(loc.id, loc.name)}
                      title="Excluir"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={18} />
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}