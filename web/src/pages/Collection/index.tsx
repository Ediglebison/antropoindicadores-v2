import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MapPin, FileText, Send, ArrowLeft, ClipboardList } from 'lucide-react';
import './styles.css';

interface Location { id: string; name: string; unique_code: string; }
interface Survey { id: string; title: string; questions_schema: any[]; is_active: boolean; }

export function Collection() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Dados do Backend
  const [locations, setLocations] = useState<Location[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  // Seleções do Usuário
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  
  // Respostas (Mapeia o ID da pergunta para a resposta digitada/selecionada)
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [locRes, surRes] = await Promise.all([
        api.get('/locations'),
        api.get('/surveys')
      ]);
      setLocations(locRes.data);
      // Filtra apenas questionários ativos para o pesquisador
      setSurveys(surRes.data.filter((s: Survey) => s.is_active));
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    }
  }

  function handleStart() {
    if (!selectedLocationId || !selectedSurveyId) {
      return alert("Selecione um local e um questionário para começar.");
    }
    setAnswers({}); // Limpa respostas anteriores
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  // Atualiza o valor de uma resposta específica
  function handleAnswer(questionId: string, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("Finalizar e enviar questionário?")) return;

    setLoading(true);
    try {
      const payload = {
        survey_id: selectedSurveyId,
        location_id: selectedLocationId,
        answers_json: answers // Envia o objeto inteiro de respostas
      };

      await api.post('/responses', payload); // Envia para o backend
      alert("Questionário salvo com sucesso!");
      
      // Volta para a tela inicial para a próxima entrevista
      setStep(1);
      setAnswers({});
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar respostas.");
    } finally {
      setLoading(false);
    }
  }

  // Encontra o questionário completo baseado no ID selecionado
  const activeSurvey = surveys.find(s => s.id === selectedSurveyId);

  return (
    <div className="collection-container">
      {/* PASSO 1: CONFIGURAÇÃO */}
      {step === 1 && (
        <>
          <div className="page-header">
            <h1><ClipboardList size={28} style={{marginRight: 10, verticalAlign: 'middle'}}/> Coleta em Campo</h1>
          </div>

          <div className="card">
            <div className="input-group">
              <label><MapPin size={16} /> Local da Entrevista</label>
              <select 
                className="form-control"
                value={selectedLocationId}
                onChange={e => setSelectedLocationId(e.target.value)}
              >
                <option value="">-- Selecione a Localidade --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>[{loc.unique_code}] {loc.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{marginTop: '1.5rem'}}>
              <label><FileText size={16} /> Questionário a ser aplicado</label>
              <select 
                className="form-control"
                value={selectedSurveyId}
                onChange={e => setSelectedSurveyId(e.target.value)}
              >
                <option value="">-- Selecione o Questionário --</option>
                {surveys.map(sur => (
                  <option key={sur.id} value={sur.id}>{sur.title}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleStart} 
              className="btn btn-primary full-width" 
              style={{marginTop: '2rem', padding: '15px'}}
            >
              Iniciar Entrevista
            </button>
          </div>
        </>
      )}

      {/* PASSO 2: APLICAÇÃO DO QUESTIONÁRIO */}
      {step === 2 && activeSurvey && (
        <form onSubmit={handleSubmitForm}>
          <div className="step-header">
            <button type="button" onClick={() => setStep(1)} className="back-btn">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 style={{margin: 0, color: 'var(--text-title)'}}>{activeSurvey.title}</h2>
              <small style={{color: 'var(--text-muted)'}}>Preencha todas as informações abaixo</small>
            </div>
          </div>

          {activeSurvey.questions_schema.map((q: any, index: number) => (
            <div key={q.id} className="question-block">
              <label className="question-label">
                {index + 1}. {q.label}
              </label>

              {/* RENDERIZAÇÃO DINÂMICA BASEADA NO TIPO DA PERGUNTA */}
              
              {q.type === 'text' && (
                <input 
                  type="text" 
                  className="form-control" 
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  value={answers[q.id] || ''}
                  required
                />
              )}

              {q.type === 'number' && (
                <input 
                  type="number" 
                  className="form-control" 
                  onChange={e => handleAnswer(q.id, Number(e.target.value))}
                  value={answers[q.id] || ''}
                  required
                />
              )}

              {q.type === 'boolean' && (
                <div className="radio-group">
                  <label className="radio-option">
                    <input type="radio" name={q.id} onChange={() => handleAnswer(q.id, true)} required /> Sim
                  </label>
                  <label className="radio-option">
                    <input type="radio" name={q.id} onChange={() => handleAnswer(q.id, false)} required /> Não
                  </label>
                </div>
              )}

              {q.type === 'select' && (
                <select 
                  className="form-control" 
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  value={answers[q.id] || ''}
                  required
                >
                  <option value="">-- Escolha uma opção --</option>
                  {q.options?.split(',').map((opt: string) => (
                    <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                  ))}
                </select>
              )}

              {/* NOSSA NOVA ESCALA DE 1 A 5 */}
              {q.type === 'scale' && (
                <div className="pizza-container">
                  {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} className={`pizza-slice slice-${num}`}>
                      <input 
                        type="radio" 
                        id={`${q.id}-${num}`}
                        name={q.id} 
                        value={num} 
                        onChange={() => handleAnswer(q.id, num)} 
                        required
                      />
                      <label 
                        htmlFor={`${q.id}-${num}`} 
                        className={`pizza-content ${answers[q.id] === num ? 'selected' : ''}`}
                      >
                        <span className="pizza-number">{num}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button 
            type="submit" 
            className="btn btn-primary full-width" 
            style={{padding: '16px', fontSize: '1.1rem', marginBottom: '3rem'}}
            disabled={loading}
          >
            <Send size={20} /> {loading ? 'Enviando...' : 'Finalizar Entrevista'}
          </button>
        </form>
      )}
    </div>
  );
}