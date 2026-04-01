import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Eye, X, Calendar, MapPin, User as UserIcon, FileText, Download } from 'lucide-react';
import './styles.css';

interface ResponseData {
  id: string;
  data_payload: Record<string, any>;
  collected_at: string;
  survey: { id: string; title: string; questions_schema: any[] };
  location: { name: string; unique_code: string };
  researcher: { name: string };
}

export function Responses() {
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);

  useEffect(() => {
    loadResponses();
  }, []);

  async function loadResponses() {
    try {
      const res = await api.get('/responses');
      setResponses(res.data);
    } catch (error) {
      console.error("Erro ao carregar respostas", error);
    }
  }

  // Formata a data para o padrão brasileiro
  function formatDate(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // Cruza o schema da pergunta com a resposta dada para exibir no Modal
  function renderAnswers(response: ResponseData) {
    if (!response.survey || !response.survey.questions_schema) return <p>Schema não encontrado.</p>;

    return response.survey.questions_schema.map((q: any) => {
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

  // --- MOTOR DE EXPORTAÇÃO PARA EXCEL/CSV ---
  function exportToCSV() {
    if (responses.length === 0) {
      return alert("Não há dados para exportar.");
    }

    // 1. Definir o cabeçalho das colunas
    const headers = ['Data/Hora', 'Questionário', 'Comunidade/Local', 'Cód. Local', 'Pesquisador', 'Respostas Detalhadas'];

    // 2. Montar as linhas cruzando as perguntas com as respostas
    const rows = responses.map(resp => {
      const dataHora = formatDate(resp.collected_at);
      const questionario = resp.survey?.title || 'Sem título';
      const local = resp.location?.name || '';
      const codLocal = resp.location?.unique_code || '';
      const pesquisador = resp.researcher?.name || '';

      // Transforma o JSON de respostas em um texto corrido legível (Pergunta: Resposta | Pergunta: Resposta)
      let respostasTexto = '';
      if (resp.survey?.questions_schema) {
        respostasTexto = resp.survey.questions_schema.map((q: any) => {
          let answer = resp.data_payload[q.id];
          if (q.type === 'boolean') answer = answer ? 'Sim' : 'Não';
          return `${q.label}: ${answer ?? 'Não respondido'}`;
        }).join('  |  ');
      }

      // Função para blindar o texto, evitando que quebras de linha quebrem a planilha
      const escapeCSV = (str: string) => `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;

      // Usamos ponto-e-vírgula (;) porque o Excel no Brasil usa vírgula para decimais
      return [
        escapeCSV(dataHora),
        escapeCSV(questionario),
        escapeCSV(local),
        escapeCSV(codLocal),
        escapeCSV(pesquisador),
        escapeCSV(respostasTexto)
      ].join(';');
    });

    // 3. Juntar tudo e criar o arquivo virtual
    // O '\uFEFF' garante que o Excel entenda os acentos (ç, ã, é) corretamente
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 4. Forçar o download no navegador do usuário
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
          onClick={exportToCSV}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Download size={20} /> Exportar CSV
        </button>
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