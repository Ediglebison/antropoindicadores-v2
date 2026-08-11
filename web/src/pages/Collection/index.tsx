import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { MapPin, FileText, Send, ArrowLeft, ClipboardList, Trash2, Save } from 'lucide-react';
import './styles.css';

interface Location { id: string; name: string; unique_code: string; }
interface Survey { id: string; title: string; questions_schema: any[]; is_active: boolean; }
interface Draft { id: string; survey_id: string; location_id: string; data_payload: Record<string, any>; created_at: string; survey?: { title: string }; location?: { name: string; unique_code: string }; }

// Uma pergunta está sem resposta quando o valor está ausente, é null, é string
// vazia ou é `false` (bool não marcado). O número 0 conta como respondida.
function findUnansweredQuestions(
  survey: Survey | undefined,
  answers: Record<string, any>
): string[] {
  if (!survey || !Array.isArray(survey.questions_schema)) {
    return [];
  }

  const unanswered: string[] = [];
  for (const question of survey.questions_schema) {
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === '' || answer === false) {
      unanswered.push(question.label || question.id);
    }
  }
  return unanswered;
}

// O backend guarda data_payload como objeto jsonb, mas uma linha de rascunho
// pode carregar qualquer coisa — guarda defensiva em ambos os formatos.
function parseDraftPayload(rawPayload: unknown): Record<string, any> {
  if (typeof rawPayload === 'object' && rawPayload !== null && !Array.isArray(rawPayload)) {
    return rawPayload as Record<string, any>;
  }
  if (typeof rawPayload === 'string' && rawPayload !== '') {
    try {
      const parsed = JSON.parse(rawPayload);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.error("Erro ao ler data_payload do rascunho:", error);
    }
  }
  return {};
}

export function Collection() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Dados do Backend
  const [locations, setLocations] = useState<Location[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Seleções do Usuário
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState('');

  // Respostas (Mapeia o ID da pergunta para a resposta digitada/selecionada)
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Rascunho que está sendo trabalhado (null = entrevista nova, sem rascunho)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Títulos das perguntas sem resposta quando o usuário tenta finalizar incompleto
  const [unansweredWarning, setUnansweredWarning] = useState<string[] | null>(null);

  async function loadMyDrafts() {
    try {
      const res = await api.get('/drafts');
      setDrafts(res.data);
    } catch (error) {
      console.error("Erro ao carregar rascunhos", error);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [locRes, surRes, draftsRes] = await Promise.all([
          api.get('/locations'),
          api.get('/surveys'),
          // Falha isolada: um erro nos rascunhos não derruba o resto da tela
          api.get('/drafts').catch((error) => {
            console.error("Erro ao carregar rascunhos", error);
            return { data: [] };
          })
        ]);
        setLocations(locRes.data);
        // Filtra apenas questionários ativos para o pesquisador
        setSurveys(surRes.data.filter((s: Survey) => s.is_active));
        setDrafts(draftsRes.data);
      } catch (error) {
        console.error("Erro ao carregar dados", error);
      }
    }

    loadInitialData();
  }, []);

  function goToStepOne() {
    setStep(1);
    setAnswers({});
    setSelectedLocationId('');
    setSelectedSurveyId('');
    setCurrentDraftId(null);
  }

  function handleStart() {
    if (!selectedLocationId || !selectedSurveyId) {
      return alert("Selecione um local e um questionário para começar.");
    }
    setAnswers({}); // Limpa respostas anteriores
    setCurrentDraftId(null);
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  function resumeDraft(draft: Draft) {
    setCurrentDraftId(draft.id);
    setSelectedSurveyId(draft.survey_id);
    setSelectedLocationId(draft.location_id || '');
    setAnswers(parseDraftPayload(draft.data_payload));
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  // Atualiza o valor de uma resposta específica
  function handleAnswer(questionId: string, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSaveDraft() {
    setLoading(true);
    try {
      if (currentDraftId) {
        await api.patch(`/drafts/${currentDraftId}`, {
          location_id: selectedLocationId || null,
          data_payload: answers
        });
      } else {
        await api.post('/drafts', {
          survey_id: selectedSurveyId,
          location_id: selectedLocationId || null,
          data_payload: answers
        });
      }
      alert("Rascunho salvo! Ele aparecerá na lista para retomar depois.");
      goToStepOne();
      await loadMyDrafts();
    } catch {
      console.error('DraftSaveFailed');
      alert("Erro ao salvar rascunho.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDraft(draftId: string) {
    try {
      await api.delete(`/drafts/${draftId}`);
      await loadMyDrafts();
    } catch {
      console.error('DraftDeleteFailed');
      alert("Erro ao excluir rascunho.");
    }
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();

    // Com pergunta faltando: avisa exatamente quais e NÃO envia nada; o
    // "Fechar mesmo assim" apenas salva um rascunho preservando o trabalho.
    const unansweredTitles = findUnansweredQuestions(activeSurvey, answers);
    if (unansweredTitles.length > 0) {
      setUnansweredWarning(unansweredTitles);
      return;
    }

    setLoading(true);
    try {
      if (currentDraftId) {
        // O finalize consome o data_payload GUARDADO no rascunho — antes de
        // dispará-lo, persiste as respostas atuais para nada se perder.
        await api.patch(`/drafts/${currentDraftId}`, {
          location_id: selectedLocationId,
          data_payload: answers
        });
        await api.post(`/drafts/${currentDraftId}/finalize`);
      } else {
        await api.post('/responses', {
          survey_id: selectedSurveyId,
          location_id: selectedLocationId,
          answers_json: answers // Envia o objeto inteiro de respostas
        });
      }
      alert("Questionário salvo com sucesso!");

      // Volta para a tela inicial para a próxima entrevista
      goToStepOne();
      await loadMyDrafts();
    } catch {
      console.error('ResponseSubmitFailed');
      alert("Erro ao salvar respostas.");
    } finally {
      setLoading(false);
    }
  }

  function formatDraftDate(createdAt: string) {
    const date = new Date(createdAt);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
              <label htmlFor="location-select"><MapPin size={16} /> Local da Entrevista</label>
              <select 
                id="location-select"
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
              <label htmlFor="survey-select"><FileText size={16} /> Questionário a ser aplicado</label>
              <select 
                id="survey-select"
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

          <div className="card" style={{marginTop: '1.5rem'}}>
            <h2 style={{margin: '0 0 1rem 0', color: 'var(--text-title)', fontSize: '1.1rem'}}>
              <ClipboardList size={20} style={{marginRight: 8, verticalAlign: 'middle'}}/> Rascunhos salvos
            </h2>
            {drafts.length === 0 ? (
              <p style={{color: 'var(--text-muted)', margin: 0}}>Nenhum rascunho salvo ainda.</p>
            ) : (
              <ul className="drafts-list">
                {drafts.map(draft => {
                  const surveyTitle = draft.survey?.title || 'Questionário';
                  const locationName = draft.location?.name || 'Local';
                  const locationCode = draft.location?.unique_code || '';
                  return (
                    <li key={draft.id} className="draft-item">
                      <button type="button" className="draft-resume" onClick={() => resumeDraft(draft)}>
                        <strong>{surveyTitle}</strong>{' '}
                        <small>
                          {locationName}{locationCode ? ` [${locationCode}]` : ''} · {formatDraftDate(draft.created_at)}
                        </small>
                      </button>
                      <button
                        type="button"
                        className="draft-delete"
                        onClick={() => handleDeleteDraft(draft.id)}
                        aria-label={`Excluir rascunho de ${surveyTitle}`}
                        title="Excluir rascunho"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {/* PASSO 2: APLICAÇÃO DO QUESTIONÁRIO */}
      {step === 2 && activeSurvey && (
        // noValidate: o término com campos em branco NÃO pode ser bloqueado pela
        // validação nativa do navegador — o fluxo precisa listar os faltantes e
        // oferecer "Fechar mesmo assim" (que apenas salva o rascunho).
        <form onSubmit={handleSubmitForm} noValidate>
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
                  value={answers[q.id] ?? ''}
                  required
                />
              )}

              {q.type === 'number' && (
                <input 
                  type="number" 
                  className="form-control" 
                  onChange={e => handleAnswer(q.id, e.target.value === '' ? null : Number(e.target.value))}
                  value={answers[q.id] ?? ''}
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
                  value={answers[q.id] ?? ''}
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
            style={{padding: '16px', fontSize: '1.1rem'}}
            disabled={loading}
          >
            <Send size={20} /> {loading ? 'Enviando...' : 'Finalizar Entrevista'}
          </button>

          <button 
            type="button" 
            onClick={handleSaveDraft} 
            className="btn btn-outline full-width" 
            style={{padding: '14px', marginTop: '1rem', marginBottom: '3rem'}}
            disabled={loading}
          >
            <Save size={20} /> Salvar rascunho
          </button>
        </form>
      )}

      {/* AVISO DE PERGUNTAS SEM RESPOSTA */}
      {unansweredWarning && (
        <div className="modal-overlay">
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="unanswered-warning-title">
            <div className="modal-header">
              <h3 id="unanswered-warning-title">Perguntas sem resposta</h3>
            </div>
            <div className="modal-body">
              <p>As seguintes perguntas não foram respondidas:</p>
              <ul className="unanswered-list">
                {unansweredWarning.map(title => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
              <p style={{color: 'var(--text-muted)'}}>
                "Fechar mesmo assim" salva apenas um rascunho — nada é enviado como coleta completa.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setUnansweredWarning(null)}
                  autoFocus
                >
                  Continuar respondendo
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setUnansweredWarning(null);
                    handleSaveDraft();
                  }}
                >
                  Fechar mesmo assim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}