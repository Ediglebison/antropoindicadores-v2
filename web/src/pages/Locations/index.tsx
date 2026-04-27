import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MapPin, Trash2, Edit2, Plus, X } from 'lucide-react';
// Importe seu arquivo de estilos se houver, ex: import './styles.css';

interface Location {
  id: string;
  name: string;
  unique_code: string;
  city?: string;
  state?: string;
  description?: string;
}

export function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Unificamos todos os campos num único estado, igual ao app mobile!
  const [formData, setFormData] = useState({
    name: '',
    unique_code: '',
    city: '',
    state: 'PA',
    description: ''
  });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/locations/${editingId}`, formData);
        alert('Local atualizado com sucesso!');
      } else {
        await api.post('/locations', formData);
        alert('Local cadastrado com sucesso!');
      }
      
      cancelEdit();
      loadLocations();
    } catch (error: any) {
      console.error("Erro ao salvar local", error.response?.data || error);
      alert('Erro ao salvar os dados.');
    }
  }

  function handleEdit(location: Location) {
    setEditingId(location.id);
    setFormData({
      name: location.name || '',
      unique_code: location.unique_code || '',
      city: location.city || '',
      state: location.state || 'PA',
      description: location.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ name: '', unique_code: '', city: '', state: 'PA', description: '' });
  }

  async function handleDelete(id: string, locationName: string) {
    const confirm = window.confirm(`Tem certeza que deseja excluir o local "${locationName}"?\nEsta ação não pode ser desfeita.`);
    
    if (confirm) {
      try {
        await api.delete(`/locations/${id}`);
        alert('Local excluído com sucesso!');
        loadLocations();
      } catch (error) {
        console.error("Erro ao excluir local", error);
        alert('Erro ao excluir. Verifique se existem questionários vinculados a este local.');
      }
    }
  }

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>Gerenciar Locais / Comunidades</h1>
        <p style={{ color: '#64748b' }}>Cadastre, edite ou remova os locais onde as pesquisas serão aplicadas.</p>
      </div>

      {/* FORMULÁRIO */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
          <MapPin size={20} color="#2563eb" />
          {editingId ? 'Editar Local' : 'Novo Local'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Nome */}
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Nome da Comunidade/Local</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Comunidade Ribeirinha São José"
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            
            {/* Código */}
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Código Único</label>
              <input 
                type="text" 
                value={formData.unique_code}
                onChange={e => setFormData({...formData, unique_code: e.target.value})}
                placeholder="Ex: SJ-01"
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Cidade */}
            <div style={{ flex: '2 1 300px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Cidade</label>
              <input 
                type="text" 
                placeholder="Ex: Castanhal"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {/* UF */}
            <div style={{ flex: '1 1 150px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>UF</label>
              <input 
                type="text" 
                maxLength={2}
                placeholder="PA"
                value={formData.state}
                onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Descrição Adicional</label>
            <textarea 
              placeholder="Pontos de referência ou detalhes..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
            <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingId ? 'Salvar Alterações' : 'Cadastrar Local'}
            </button>
            
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: '0.75rem 1.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <X size={18} /> Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABELA */}
      <div className="table-container" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Local & Código</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Cidade/UF</th>
              <th style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>Descrição</th>
              <th style={{ padding: '1rem', width: '100px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Nenhum local cadastrado. Use o formulário acima para criar o primeiro.
                </td>
              </tr>
            ) : (
              locations.map(loc => (
                <tr key={loc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  
                  {/* Coluna 1: Nome e Código */}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{loc.name}</div>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {loc.unique_code}
                    </span>
                  </td>
                  
                  {/* Coluna 2: Cidade e Estado */}
                  <td style={{ padding: '1rem', color: '#475569' }}>
                    {loc.city ? `${loc.city} - ${loc.state || 'PA'}` : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Não informada</span>}
                  </td>
                  
                  {/* Coluna 3: Descrição */}
                  <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {loc.description ? (
                      loc.description.length > 50 ? `${loc.description.substring(0, 50)}...` : loc.description
                    ) : (
                      <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>
                  
                  {/* Coluna 4: Ações */}
                  <td style={{ padding: '1rem', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <button onClick={() => handleEdit(loc)} title="Editar" style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(loc.id, loc.name)} title="Excluir" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
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