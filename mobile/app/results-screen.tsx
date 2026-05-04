import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { responsesAPI } from '../src/services/api';
import { database } from '../src/database';
import SideMenu from './side-menu';
import { Header } from '../src/components/Header';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function ResultsScreen() {
  const router = useRouter();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadResultados();
  }, []);

  async function loadResultados() {
    try {
      if (database) {
        const resps = await database.collections.get('responses').query().fetch();
        const loadedResponses = resps.map((r: any) => ({
          id: r.id,
          survey_id: r._raw.survey_id,
          location_id: r._raw.location_id,
          data_payload: r._raw.data_payload,
          created_at: r._raw.created_at,
          // Mock data if relationships aren't loaded locally yet for the UI
          survey: { title: `Survey ID: ${r._raw.survey_id}` },
          location: { name: `Location ID: ${r._raw.location_id}` },
        }));
        setResultados(loadedResponses as any);

        responsesAPI.getAll().then(res => {
          if (res && res.length > 0) setResultados(res);
        }).catch(err => console.log('Offline for API responses fetch'));
      } else {
        const response = await responsesAPI.getAll();
        setResultados(response || []);
      }
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
      Alert.alert('Ops!', 'Não foi possível carregar os resultados das coletas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadResultados();
  };

  const handleExportCSV = async () => {
      if (!resultados || resultados.length === 0) {
        Alert.alert('Aviso', 'Não há dados para exportar.');
        return;
      }

      try {
        // 1. Montamos o Cabeçalho do arquivo CSV com a etiqueta UTF-8 (\uFEFF)
        let csvString = '\uFEFFID,Data,Questionário,Local,Pesquisador,Respostas\n';

        // 2. Varremos todos os itens da lista para criar as linhas
        resultados.forEach((item: any) => {
          const id = item.id || '';
          const data = formatarData(item.collected_at || item.created_at);
          const questionario = item.survey?.title || 'Sem Nome';
          const local = item.location?.name || 'Não Informado';
          const pesquisador = item.researcher?.name || 'Admin';
          
          // Aqui usamos a sua própria função de formatação para deixar as respostas legíveis!
          // Vai ficar algo como: "Q1: Teste | Q2: 5 | Q3: 123"
          const respostasArray = getRespostasFormatadas(item);
          const respostasTexto = respostasArray.map((r: any) => `${r.label}: ${r.valor}`).join(' | ');

          // Colocamos aspas duplas em volta de cada texto. 
          // Isso impede que uma vírgula escrita pelo usuário quebre a coluna do CSV.
          const linha = [
            `"${id}"`,
            `"${data}"`,
            `"${questionario}"`,
            `"${local}"`,
            `"${pesquisador}"`,
            `"${respostasTexto}"`
          ].join(',');

          csvString += linha + '\n';
        });

        // 3. Criamos o arquivo físico na memória temporária do celular
        const fileUri = FileSystem.documentDirectory + 'resultados_coletas.csv';
        
        // Removemos a configuração extra, pois o UTF-8 já é o padrão!
        await FileSystem.writeAsStringAsync(fileUri, csvString);

        // 4. Chamamos a tela nativa de compartilhamento do iOS/Android
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Resultados',
            UTI: 'public.comma-separated-values-text' // Necessário para o iOS reconhecer o formato
          });
        } else {
          Alert.alert('Ops!', 'O compartilhamento de arquivos não está disponível neste dispositivo.');
        }

      } catch (error) {
        console.error('Erro ao exportar CSV:', error);
        Alert.alert('Erro', 'Ocorreu um problema ao gerar o arquivo CSV.');
      }
    };

  const formatarData = (dataString: string) => {
    if (!dataString) return 'Data não informada';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).replace(',', ' às');
    } catch (e) {
      return dataString;
    }
  };

  // 👉 A MÁGICA ACONTECE AQUI: Cruzando os IDs com as Labels (Q1, Q2)
  const getRespostasFormatadas = (item: any) => {
    // Pegamos as respostas exatas que vimos no seu Log
    const rawAnswers = item?.data_payload || item?.answers_json || {};
    if (!rawAnswers) return [];

    try {
      let respostasObj = typeof rawAnswers === 'string' ? JSON.parse(rawAnswers) : rawAnswers;
      if (typeof respostasObj === 'string') respostasObj = JSON.parse(respostasObj);

      const schema = item?.survey?.questions_schema;

      // Se o backend mandou o mapa das perguntas (questions_schema), traduzimos os IDs para "Q1", "Q2"
      if (schema && Array.isArray(schema)) {
        return schema.map((pergunta: any) => {
          const valorDaResposta = respostasObj[pergunta.id];
          return {
            label: pergunta.label || `Pergunta (ID: ${pergunta.id})`,
            valor: valorDaResposta !== undefined && valorDaResposta !== null ? String(valorDaResposta) : 'Não respondido'
          };
        });
      } else {
        // Se por acaso não vier o mapa, mostramos os IDs puros para não ficar em branco
        return Object.entries(respostasObj).map(([key, value]) => ({
          label: `ID: ${key}`,
          valor: String(value)
        }));
      }
    } catch (e) {
      console.error('Erro ao formatar respostas:', e);
      return [];
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.iconText}>📄</Text>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.survey?.title || 'Questionário Sem Nome'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>📅 Data/Hora:</Text>
        {/* Ajustado para collected_at que vimos no Log */}
        <Text style={styles.infoValue}>{formatarData(item.collected_at || item.created_at)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>📍 Localidade:</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {item.location?.name || 'Local Não Identificado'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>👤 Pesquisador:</Text>
        {/* Ajustado para researcher.name que vimos no Log */}
        <Text style={styles.infoValue}>{item.researcher?.name || 'Admin'}</Text>
      </View>

      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={() => setSelectedItem(item)}
      >
        <Text style={styles.detailsBtnIcon}>👁️</Text>
        <Text style={styles.detailsBtnText}>Ver Detalhes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Resultados" subtitle="Resultados das Coletas" />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Histórico de Coletas</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
            <Text style={styles.exportBtnIcon}>📥</Text>
            <Text style={styles.exportBtnText}>CSV</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0052CC" />
            <Text style={styles.loadingText}>Carregando resultados...</Text>
          </View>
        ) : resultados.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Nenhuma coleta encontrada.</Text>
          </View>
        ) : (
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0052CC']} />
            }
          />
        )}
      </View>

      <Modal
        visible={!!selectedItem}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Coleta</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryText}>
                      <Text style={styles.summaryLabel}>Questionário: </Text>
                      {selectedItem.survey?.title}
                    </Text>
                    <Text style={styles.summaryText}>
                      <Text style={styles.summaryLabel}>Local: </Text>
                      {selectedItem.location?.name}
                    </Text>
                    <Text style={styles.summaryText}>
                      <Text style={styles.summaryLabel}>Data: </Text>
                      {formatarData(selectedItem.collected_at)}
                    </Text>
                  </View>

                  <Text style={styles.responsesTitle}>Respostas:</Text>

                  {getRespostasFormatadas(selectedItem).length > 0 ? (
                    getRespostasFormatadas(selectedItem).map((resposta, index) => (
                      <View key={index} style={styles.answerBlock}>
                        <Text style={styles.questionLabel}>{resposta.label}</Text>
                        <View style={styles.answerBox}>
                          <Text style={styles.answerText}>{resposta.valor}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noAnswersText}>Nenhuma resposta registrada.</Text>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a'
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8
  },
  exportBtnIcon: {
    marginRight: 6,
    fontSize: 16
  },
  exportBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  listContainer: {
    paddingBottom: 24
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconText: {
    fontSize: 20,
    marginRight: 10
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#0f172a', 
    flex: 1 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#f1f5f9', 
    marginBottom: 12 
  },
  infoRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 8, 
    alignItems: 'center' 
  },
  infoLabel: { 
    fontSize: 13, 
    color: '#64748b', 
    flex: 1 
  },
  infoValue: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#334155', 
    flex: 2, 
    textAlign: 'right' 
  },
  detailsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingVertical: 10, 
    marginTop: 12 
  },
  detailsBtnIcon: { 
    marginRight: 6, 
    fontSize: 14 
  },
  detailsBtnText: { 
    color: '#475569', 
    fontWeight: '600', 
    fontSize: 13 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)', 
    justifyContent: 'center', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 24, 
    maxHeight: '80%', 
    shadowColor: '#0f172a', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 24, 
    elevation: 10 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  closeBtn: { 
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20
  },
  closeBtnText: { 
    fontSize: 16, 
    color: '#64748b', 
    fontWeight: '700' 
  },
  summaryBox: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  summaryText: { 
    fontSize: 14, 
    color: '#475569', 
    marginBottom: 8, 
    lineHeight: 20 
  },
  summaryLabel: { 
    fontWeight: '700', 
    color: '#0f172a' 
  },
  responsesTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0f172a', 
    marginBottom: 16 
  },
  answerBlock: { 
    marginBottom: 16 
  },
  questionLabel: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#334155', 
    marginBottom: 8 
  },
  answerBox: { 
    backgroundColor: '#ffffff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 10, 
    padding: 14 
  },
  answerText: { 
    fontSize: 15, 
    color: '#0f172a' 
  },
  noAnswersText: { 
    fontSize: 14, 
    color: '#94a3b8', 
    fontStyle: 'italic', 
    textAlign: 'center', 
    marginTop: 20 
  }
});