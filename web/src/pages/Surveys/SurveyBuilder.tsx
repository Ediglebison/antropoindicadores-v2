import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, CheckCircle, XCircle, Edit2, Power } from 'lucide-react';
import { api } from '../../services/api';
import './styles.css';

// Interface para tipar os dados que vêm do banco
interface Survey {
  id: string;
  title: string;
  description: string;
  questions_schema: Question[];
  is_active: boolean;
  created_at: string;
}

interface Question {
  id: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'scale';
  label: string;
  options?: string;
}

export function SurveyBuilder() {
  // Estados do Formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', type: 'text', label: '' }
  ]);
  
  // NOVO: Guarda o ID do questionário que está sendo editado (null = criando novo)
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado da Lista de Questionários Salvos
  const [savedSurveys, setSavedSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega a lista ao abrir a página
  useEffect(() => {
    fetchSurveys();
  }, []);

  async function fetchSurveys() {
    try {
      const response = await api.get('/surveys');
      setSavedSurveys(response.data);
    } catch (error) {
      console.error("Erro ao buscar questionários", error);
    }
  }

  function addQuestion() {
    const newId = Date.now().toString();
    setQuestions([...questions, { id: newId, type: 'text', label: '' }]);
  }

  function removeQuestion(id: string) {
    setQuestions(questions.filter(q => q.id !== id));
  }

  function updateQuestion(id: string, field: keyof Question, value: string) {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  }

  // ATUALIZADO: Preenche o formulário e salva o ID para edição
  function handleEdit(survey: Survey) {
    setEditingId(survey.id); // Salva o ID para sabermos que é uma atualização
    setTitle(survey.title);
    setDescription(survey.description);
    setQuestions(survey.questions_schema);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ATUALIZADO: Limpa o form e o ID de edição
  function handleClear() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setQuestions([{ id: Date.now().toString(), type: 'text', label: '' }]);
  }

  // ATUALIZADO: Decide se cria (POST) ou atualiza (PUT)
  async function handleSave() {
    if (!title) return alert("O título é obrigatório!");

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        is_active: true,
        questions_schema: questions
      };

      if (editingId) {
        // Se tem ID, atualiza o existente
        await api.put(`/surveys/${editingId}`, payload);
        alert('Questionário atualizado com sucesso!');
      } else {
        // Se não tem ID, cria um novo
        await api.post('/surveys', payload);
        alert('Questionário criado com sucesso!');
      }
      
      handleClear();
      fetchSurveys();
    } catch (error) {
      alert('Erro ao salvar.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // NOVO: Função para Excluir
  // NOVO: Função para Ativar/Desativar em vez de Excluir
  async function handleToggleStatus(survey: Survey, e: React.MouseEvent) {
    e.stopPropagation(); // Impede de abrir a edição
    
    const acao = survey.is_active ? 'desativar' : 'ativar';
    const confirm = window.confirm(`Deseja realmente ${acao} o questionário "${survey.title}"?\n\nQuestionários inativos não aparecerão no tablet do pesquisador para novas coletas.`);
    
    if (confirm) {
      try {
        await api.patch(`/surveys/${survey.id}/toggle`);
        fetchSurveys(); // Recarrega a lista para mostrar o novo status
      } catch (error) {
        console.error("Erro ao alterar status", error);
        alert('Erro ao alterar o status do questionário.');
      }
    }
  }

  return (
    <div className="survey-page">
      {/* --- ÁREA DE CRIAÇÃO --- */}
      <div className="page-header">
        <h1>{editingId ? 'Editando Questionário' : 'Novo Questionário'}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleClear} className="btn btn-outline">
                Novo / Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
                {editingId ? <Edit2 size={18} /> : <Save size={18} />} 
                {loading ? 'Salvando...' : (editingId ? 'Atualizar Questionário' : 'Salvar Questionário')}
            </button>
        </div>
      </div>

      <div className="card">
        <label>Título da Pesquisa</label>
        <input 
          className="form-control" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          placeholder="Ex: Pesquisa de Campo 2026 - Zona Rural"
        />
        <br /><br />
        <label>Descrição</label>
        <textarea 
          className="form-control" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          placeholder="Instruções para o pesquisador..."
          rows={3}
        />
      </div>

      <h3>Estrutura das Perguntas</h3>
      
      {questions.map((q, index) => (
        <div key={q.id} className="question-item">
          <div className="question-header">
            <strong>Pergunta #{index + 1}</strong>
            <button onClick={() => removeQuestion(q.id)} className="btn btn-danger">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid-2-col">
            <div>
              <label>Enunciado</label>
              <input 
                className="form-control" 
                value={q.label}
                onChange={e => updateQuestion(q.id, 'label', e.target.value)}
                placeholder="Ex: Qual a renda familiar?"
              />
            </div>
            
            <div>
              <label>Tipo de Resposta</label>
              <select 
                className="form-control"
                value={q.type}
                onChange={e => updateQuestion(q.id, 'type', e.target.value as any)}
              >
                <option value="text">Texto Livre</option>
                <option value="number">Numérico</option>
                <option value="boolean">Sim/Não</option>
                <option value="select">Múltipla Escolha</option>
                <option value="scale">Escala (1 a 5)</option>
              </select>
            </div>
          </div>

          {q.type === 'select' && (
            <div style={{ marginTop: '1rem' }}>
              <label>Opções (separe por vírgula)</label>
              <input 
                className="form-control"
                value={q.options || ''}
                onChange={e => updateQuestion(q.id, 'options', e.target.value)}
                placeholder="Ex: Opção A, Opção B, Opção C"
              />
            </div>
          )}
        </div>
      ))}

      <button onClick={addQuestion} className="btn btn-outline full-width">
        <Plus size={18} /> Adicionar Nova Pergunta
      </button>

      {/* --- ÁREA DE LISTAGEM --- */}
      <hr className="divider" style={{ margin: '2rem 0' }} />
      
      <h3>Questionários Cadastrados ({savedSurveys.length})</h3>
      
      <div className="surveys-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {savedSurveys.length === 0 && <p className="empty-msg">Nenhum questionário encontrado.</p>}

        {savedSurveys.map(survey => (
            <div 
              key={survey.id} 
              className="survey-card" 
              onClick={() => handleEdit(survey)}
              style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
            >
                <div className="survey-icon" style={{ marginRight: '1rem' }}>
                    <FileText size={28} color="#2563eb" />
                </div>
                
                <div className="survey-info" style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{survey.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>{survey.description || 'Sem descrição definida.'}</p>
                    <small style={{ color: '#94a3b8' }}>
                        {survey.questions_schema.length} perguntas • Criado em {new Date(survey.created_at).toLocaleDateString()}
                    </small>
                </div>
                
                <div className="survey-status" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {survey.is_active ? 
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}><CheckCircle size={14}/> Ativo</span> : 
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}><XCircle size={14}/> Inativo</span>
                    }

                    {/* BOTÃO DE ATIVAR/DESATIVAR (SOFT DELETE) */}
                    <button 
                      onClick={(e) => handleToggleStatus(survey, e)} 
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: survey.is_active ? '#f59e0b' : '#10b981', // Laranja para desativar, Verde para ativar
                        cursor: 'pointer', 
                        padding: '8px' 
                      }}
                      title={survey.is_active ? "Desativar questionário" : "Reativar questionário"}
                    >
                      <Power size={20} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}