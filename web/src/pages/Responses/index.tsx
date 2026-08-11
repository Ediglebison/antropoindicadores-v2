import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Eye, X, Calendar, MapPin, User as UserIcon, FileText, Download } from 'lucide-react';
import './styles.css';

interface QuestionSchema {
  id: string;
  label?: string;
  type?: string;
}

interface Survey {
  id: string;
  title: string;
  questions_schema: QuestionSchema[];
}

interface Location {
  id: string;
  name: string;
  unique_code: string;
}

interface ResponseData {
  id: string;
  survey_id: string;
  location_id: string;
  data_payload: Record<string, any>;
  collected_at: string;
  survey: { id: string; title: string; questions_schema: QuestionSchema[] };
  location: { name: string; unique_code: string };
  researcher: { name: string };
  latitude?: number;
  longitude?: number;
}

// Célula CSV blindada: aspas duplicadas, quebra de linha achatada e injeção de
// fórmula neutralizada ('=SOMA()' vira texto, não vira fórmula no Excel).
function escapeCSV(value: unknown): string {
  const text = String(value);
  const neutralized = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${neutralized.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
}

// CSV colunar: linha 1 = títulos das perguntas (uma por coluna) derivados do
// schema do questionário selecionado; cada linha é uma resposta com os valores
// alinhados à coluna da pergunta. BOM + ponto-e-vírgula seguem a convenção
// brasileira (o BOM faz o Excel entender os acentos, ç, ã, é).
function buildColumnarCsv(responses: ResponseData[], selectedSurvey: Survey): string {
  const questions = selectedSurvey?.questions_schema;
  if (!Array.isArray(questions) || questions.length === 0) {
    return '';
  }

  const header = questions.map((question) =>
    escapeCSV(question.label || `Pergunta (ID: ${question.id})`)
  ).join(';');

  const rows = responses.map((response) => {
    const payload = response.data_payload ?? {};
    return questions.map((question) => {
      let value = payload[question.id];
      if (question.type === 'boolean') {
        value = value ? 'Sim' : 'Não';
      }
      return escapeCSV(value !== undefined && value !== null ? value : 'Não respondido');
    }).join(';');
  });

  return '\uFEFF' + [header, ...rows].join('\n');
}

export function Responses() {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  useEffect(() => {
    // Os seletores de exportação vivem no efeito do mount porque chamar uma
    // função do escopo do componente que seta estado aqui viola a regra
    // react-hooks/set-state-in-effect do eslint.
    async function loadSelectorData() {
      try {
        const [locRes, surRes] = await Promise.all([
          api.get('/locations'),
          api.get('/surveys'),
        ]);
        setLocations(locRes.data);
        setSurveys(surRes.data);
      } catch {
        console.error('SelectorDataLoadFailed');
      }
    }

    async function loadResponses() {
      try {
        const res = await api.get('/responses');
        setResponses(res.data);
      } catch {
        console.error('ResponsesLoadFailed');
      }
    }

    loadResponses();
    loadSelectorData();
  }, []);

  // Formata a data para o padrão brasileiro
  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Cruza o schema da pergunta com a resposta dada para exibir no Modal
  function renderAnswers(response: ResponseData) {
    if (!response.survey || !response.survey.questions_schema) return <p>Schema não encontrado.</p>;

    return response.survey.questions_schema.map((q: QuestionSchema) => {
      const answer = response.data_payload[q.id];
      let displayValue = answer;

      // Tratamento para exibir 'Sim' ou 'Não' em respostas booleanas
      if (q.type === 'boolean') {
        displayValue = answer ? 'Sim' : 'Não';
      }

      return (
        <div key={q.id} className="answer-item">
          <span className="answer-question">{q.label}</span>
          <span className="answer-value">{displayValue !== undefined && displayValue !== null ? displayValue : 'Não respondido'}</span>
        </div>
      );
    });
  }

  // --- MOTOR DE EXPORTAÇÃO CSV COLUNAR ---
  function exportToCsv(selectedSurveyId: string, selectedLocationId: string) {
    if (!selectedSurveyId || !selectedLocationId) {
      return alert("Selecione um questionário e uma localidade para exportar.");
    }

    const selectedSurvey = surveys.find(survey => survey.id === selectedSurveyId);
    if (!selectedSurvey || !Array.isArray(selectedSurvey.questions_schema) || selectedSurvey.questions_schema.length === 0) {
      return alert("O questionário selecionado não tem perguntas configuradas.");
    }

    const filteredResponses = responses.filter(resp =>
      resp.survey_id === selectedSurveyId && resp.location_id === selectedLocationId
    );

    if (filteredResponses.length === 0) {
      return alert("Não há dados para exportar.");
    }

    const csvContent = buildColumnarCsv(filteredResponses, selectedSurvey);

    // Criar o arquivo virtual e forçar o download no navegador do usuário
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `antropoindicadores_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Resultados das Coletas</h1>

        <button
          className="btn btn-primary"
          onClick={() => exportToCsv(selectedSurveyId, selectedLocationId)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={20} /> Exportar CSV
        </button>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="export-section">
          <div className="input-group">
            <label htmlFor="export-location-select"><MapPin size={16} /> Localidade</label>
            <select
              id="export-location-select"
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

          <div className="input-group">
            <label htmlFor="export-survey-select"><FileText size={16} /> Questionário</label>
            <select
              id="export-survey-select"
              className="form-control"
              value={selectedSurveyId}
              onChange={e => setSelectedSurveyId(e.target.value)}
            >
              <option value="">-- Selecione o Questionário --</option>
              {surveys.map(survey => (
                <option key={survey.id} value={survey.id}>{survey.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Questionário</th>
              <th>Localidade</th>
              <th>Pesquisador</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {responses.length === 0 && (
              <tr><td colSpan={5} style={{textAlign: 'center'}}>Nenhuma coleta registrada ainda.</td></tr>
            )}

            {responses.map(resp => (
              <tr key={resp.id}>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <Calendar size={16} color="#64748b"/>
                    {formatDate(resp.collected_at)}
                  </div>
                </td>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <FileText size={16} color="#64748b"/>
                    {resp.survey?.title || 'Excluído'}
                  </div>
                </td>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <MapPin size={16} color="#dc2626"/>
                    {resp.location?.name} [{resp.location?.unique_code}]
                  </div>
                </td>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <UserIcon size={16} color="#2563eb"/>
                    {resp.researcher?.name}
                  </div>
                </td>
                <td>
                  <button
                    className="btn btn-outline"
                    onClick={() => setSelectedResponse(resp)}
                    title="Ver Respostas"
                  >
                    <Eye size={18} /> Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE DETALHES */}
      {selectedResponse && (
        <div className="modal-overlay" onClick={() => setSelectedResponse(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes da Coleta</h3>
              <button className="btn btn-outline" style={{border: 'none'}} onClick={() => setSelectedResponse(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{marginBottom: '1.5rem', padding: '15px', background: '#f8fafc', borderRadius: '8px'}}>
                <p><strong>Questionário:</strong> {selectedResponse.survey?.title}</p>
                <p><strong>Local:</strong> {selectedResponse.location?.name}</p>
                <p><strong>Data:</strong> {formatDate(selectedResponse.collected_at)}</p>
              </div>

              <h4>Respostas:</h4>
              <div style={{marginTop: '1rem'}}>
                {renderAnswers(selectedResponse)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}