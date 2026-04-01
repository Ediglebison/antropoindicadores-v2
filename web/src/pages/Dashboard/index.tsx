import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ClipboardList, MapPin, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './styles.css'; // Certifique-se de que o seu arquivo de CSS nesta pasta se chama styles.css

interface DashboardStats {
  totalResponses: number;
  totalSurveys: number;
  totalLocations: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({ totalResponses: 0, totalSurveys: 0, totalLocations: 0 });
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [resResponses, resSurveys, resLocations] = await Promise.all([
        api.get('/responses'),
        api.get('/surveys'),
        api.get('/locations')
      ]);

      const responsesData = resResponses.data;

      setStats({
        totalResponses: responsesData.length,
        totalSurveys: resSurveys.data.length,
        totalLocations: resLocations.data.length
      });

      setRecentResponses(responsesData.slice(0, 5));

      // Lógica do Gráfico
      const agrupamento: Record<string, number> = {};
      responsesData.forEach((resp: any) => {
        const titulo = resp.survey?.title || 'Sem título';
        agrupamento[titulo] = (agrupamento[titulo] || 0) + 1;
      });

      const dadosGrafico = Object.keys(agrupamento).map(chave => ({
        name: chave,
        Quantidade: agrupamento[chave]
      }));

      setChartData(dadosGrafico);

    } catch (error) {
      console.error("Erro ao carregar dados do dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Carregando estatísticas...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        {/* SE ESTE TÍTULO ABAIXO APARECER, O CÓDIGO NOVO FUNCIONOU! */}
        <h1>Dashboard Principal</h1>
        <p style={{ color: '#64748b' }}>Visão geral do projeto Antropoindicadores</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-blue">
            <ClipboardList size={28} />
          </div>
          <div className="stat-info">
            <h3>Coletas Realizadas</h3>
            <p>{stats.totalResponses}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper icon-green">
            <MapPin size={28} />
          </div>
          <div className="stat-info">
            <h3>Locais Mapeados</h3>
            <p>{stats.totalLocations}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper icon-purple">
            <FileText size={28} />
          </div>
          <div className="stat-info">
            <h3>Questionários Ativos</h3>
            <p>{stats.totalSurveys}</p>
          </div>
        </div>
      </div>

      {/* ÁREA DO GRÁFICO */}
      <div className="chart-section" style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1e293b', margin: '0 0 1.5rem 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          Respostas por Questionário
        </h2>
        
        {chartData.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center' }}>Não há dados suficientes para gerar o gráfico.</p>
        ) : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="Quantidade" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="recent-activity-section">
        <h2><Activity size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> 
          Últimas Coletas em Campo
        </h2>
        
        {recentResponses.length === 0 ? (
          <p style={{ color: '#64748b' }}>Nenhuma coleta registrada ainda.</p>
        ) : (
          <div className="activity-list">
            {recentResponses.map((resp: any) => (
              <div key={resp.id} className="activity-item">
                <div className="activity-details">
                  <p>
                    <strong>{resp.researcher?.name || 'Pesquisador'}</strong> aplicou o questionário <strong>"{resp.survey?.title}"</strong>
                  </p>
                  <small>
                    <MapPin size={12} style={{ display: 'inline', margin: '0 4px 0 0' }} />
                    {resp.location?.name} [{resp.location?.unique_code}]
                  </small>
                </div>
                <div className="activity-time">
                  {formatDateTime(resp.collected_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}