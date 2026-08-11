import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, TextInput, FlatList, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import * as LocationLib from 'expo-location';
import { Q } from '@nozbe/watermelondb';
import { api } from '../src/services/api';
import { database } from '../src/database';
import SideMenu from './side-menu';
import { ScaleCircle } from '../src/components/ScaleCircle';
import { Header } from '../src/components/Header';

interface Survey {
  id: string;
  title: string;
  description: string;
  questions_schema: Question[];
  is_active: boolean;
}

interface Question {
  id: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'scale';
  label: string;
  options?: string;
  required?: boolean;
}

interface Location {
  id: string;
  name: string;
  unique_code: string;
}

interface LocalDraft {
  id: string;
  survey_id: string;
  location_id: string;
  created_at: number;
}

// Dezembro de respostas: uma pergunta está sem resposta quando o valor está
// ausente, é null, é string vazia ou é `false` (bool não marcado). O número 0
// conta como respondida.
export function findUnansweredQuestions(
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

function parseDraftPayload(rawPayload: any): Record<string, any> {
  if (rawPayload === undefined || rawPayload === null || rawPayload === '') {
    return {};
  }
  try {
    const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.error('Erro ao ler data_payload do rascunho:', error);
    return {};
  }
}

function toDraftView(row: any): LocalDraft {
  return {
    id: row.id,
    survey_id: row._raw.survey_id,
    location_id: row._raw.location_id,
    created_at: row._raw.created_at,
  };
}

function formatDraftDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function ColetaPesquisa() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeDraftRow, setActiveDraftRow] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carregamento de dados...');
      
      let loadedLocations: Location[] = [];
      let loadedSurveys: Survey[] = [];

      if (database) {
        // Carrega do banco de dados local (WatermelonDB)
        const locs = await database.collections.get('locations').query().fetch();
        const surs = await database.collections.get('surveys').query().fetch();
        
        loadedLocations = locs.map((l: any) => ({
          id: l.id,
          name: l.name,
          unique_code: l._raw.unique_code,
          city: l._raw.city,
          state: l._raw.state,
          description: l._raw.description
        })) as any[];

        loadedSurveys = surs.map((s: any) => {
          let parsedSchema = [];
          if (s._raw.questions_schema) {
            try {
              parsedSchema = typeof s._raw.questions_schema === 'string' ? JSON.parse(s._raw.questions_schema) : s._raw.questions_schema;
            } catch (e) {
              console.log('Error parsing questions_schema:', e);
            }
          }
          return {
            id: s.id,
            title: s.title,
            description: s.description,
            questions_schema: parsedSchema,
            is_active: s._raw.is_active === 1 || s._raw.is_active === true
          };
        }) as any[];
      } else {
        // Fallback para API
        const [locRes, surRes] = await Promise.all([
          api.get('/locations'),
          api.get('/surveys')
        ]);
        loadedLocations = locRes.data || [];
        loadedSurveys = surRes.data || [];
      }
      
      console.log('✅ Dados carregados:', {
        locations: loadedLocations.length,
        surveys: loadedSurveys.length
      });
      
      setLocations(loadedLocations);
      setSurveys(loadedSurveys.filter((s: Survey) => s.is_active));
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error.response?.status, error.message);
      console.error("📌 Resposta:", error.response?.data);
      Alert.alert(
        'Erro', 
        `Falha ao carregar: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
      loadLocalDrafts();
    }
  }

  async function handleStart() {
    if (!selectedLocationId || !selectedSurveyId) {
      Alert.alert('Atenção', 'Selecione um local e um questionário');
      return;
    }
    
    // Valida se o survey tem perguntas
    const survey = surveys.find(s => s.id === selectedSurveyId);
    if (!survey || !Array.isArray(survey.questions_schema) || survey.questions_schema.length === 0) {
      Alert.alert('Erro', 'Este questionário não tem perguntas configuradas');
      return;
    }

    // Já existe um rascunho para este par? Retoma-o em vez de começar do zero
    const draftRow = await loadDraftForRow(selectedSurveyId, selectedLocationId);
    setActiveDraftRow(draftRow);
    setAnswers(draftRow ? parseDraftPayload(draftRow._raw.data_payload) : {});
    setStep(2);

    // Solicita a localização
    (async () => {
      let { status } = await LocationLib.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permissão de localização negada');
        return;
      }

      try {
        let location = await LocationLib.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        console.log('📍 Localização obtida:', location.coords);
      } catch (error) {
        console.log('Erro ao obter localização:', error);
      }
    })();
  }

  function handleAnswer(questionId: string, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function loadLocalDrafts() {
    if (!database) {
      setDrafts([]);
      return;
    }
    const rows = await database.collections.get('responses')
      .query(Q.where('is_draft', true))
      .fetch();
    setDrafts(rows);
  }

  async function loadDraftForRow(surveyId: string, locationId: string) {
    if (!database) return null;
    const rows = await database.collections.get('responses')
      .query(
        Q.where('survey_id', surveyId),
        Q.where('location_id', locationId),
        Q.where('is_draft', true)
      )
      .fetch();
    return rows[0] || null;
  }

  function resumeDraft(row: any) {
    setActiveDraftRow(row);
    setSelectedSurveyId(row._raw.survey_id);
    setSelectedLocationId(row._raw.location_id);
    setAnswers(parseDraftPayload(row._raw.data_payload));
    setStep(2);
  }

  function goToStepOne() {
    setStep(1);
    setAnswers({});
    setSelectedLocationId('');
    setSelectedSurveyId('');
    setCurrentLocation(null);
    setActiveDraftRow(null);
    loadLocalDrafts();
  }

  async function handleSaveDraft() {
    if (!database) {
      Alert.alert('Atenção', 'Armazenamento local indisponível para salvar o rascunho');
      return;
    }
    setLoading(true);
    try {
      await database.write(async () => {
        if (activeDraftRow) {
          await activeDraftRow.update((row: any) => {
            row.dataPayload = JSON.stringify(answers);
            row.isDraft = true;
          });
        } else {
          await database.collections.get('responses').create((row: any) => {
            row.surveyId = selectedSurveyId;
            row.locationId = selectedLocationId;
            row.dataPayload = JSON.stringify(answers);
            row.isDraft = true;
            if (currentLocation) {
              row.latitude = currentLocation.latitude;
              row.longitude = currentLocation.longitude;
            }
          });
        }
      });
      Alert.alert('Rascunho salvo!', 'Rascunho salvo. Ele aparecerá na lista para retomar depois.');
      goToStepOne();
    } catch (error) {
      console.error('❌ Erro ao salvar rascunho:', error);
      Alert.alert('Erro', 'Falha ao salvar o rascunho. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalize() {
    setLoading(true);
    try {
      if (database) {
        // Cria ou alterna a MESMA linha local para completa (is_draft=false).
        // A linha vai para o bucket `updated` no próximo sync e o backend
        // upserta — inclusive quando este id nunca subiu (rascunho filtrado).
        await database.write(async () => {
          if (activeDraftRow) {
            await activeDraftRow.update((row: any) => {
              row.isDraft = false;
              row.dataPayload = JSON.stringify(answers);
            });
          } else {
            await database.collections.get('responses').create((row: any) => {
              row.surveyId = selectedSurveyId;
              row.locationId = selectedLocationId;
              row.dataPayload = JSON.stringify(answers);
              row.isDraft = false;
              if (currentLocation) {
                row.latitude = currentLocation.latitude;
                row.longitude = currentLocation.longitude;
              }
            });
          }
        });

        // Envio best-effort em background (normal falhar offline)
        api.post('/responses', {
          survey_id: selectedSurveyId,
          location_id: selectedLocationId,
          answers_json: answers,
          ...(currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : {})
        }).catch(err => console.log('Sincronização em background falhou (normal se estiver offline)'));
      } else {
        // Fallback para a Web
        await api.post('/responses', {
          survey_id: selectedSurveyId,
          location_id: selectedLocationId,
          answers_json: answers,
          ...(currentLocation ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude } : {})
        });
      }

      Alert.alert('Sucesso!', 'Questionário salvo com sucesso');
      goToStepOne();
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao salvar o questionário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitForm() {
    const unanswered = findUnansweredQuestions(activeSurvey, answers);

    // Com pergunta faltando: avisa exatamente quais e NÃO envia nada; o
    // "Fechar mesmo assim" apenas salva um rascunho preservando o trabalho.
    if (unanswered.length > 0) {
      Alert.alert(
        'Perguntas sem resposta',
        `As seguintes perguntas não foram respondidas:\n\n${unanswered.map((label) => `• ${label}`).join('\n')}`,
        [
          { text: 'Continuar respondendo', style: 'cancel' },
          { text: 'Fechar mesmo assim', onPress: () => { handleSaveDraft(); } },
        ]
      );
      return;
    }

    handleFinalize();
  }

  const activeSurvey = surveys.find(s => s.id === selectedSurveyId);
  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  if (loading && step === 1) {
    return (
      <View style={styles.fullContainer}>
        <SideMenu />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <SideMenu />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Header title="Coleta de Pesquisa" subtitle="📋 Selecione o local e o questionário" />
      {step === 1 ? (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>📍 Local da Entrevista *</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowLocationModal(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedLocationId 
                  ? locations.find(l => l.id === selectedLocationId)?.name 
                  : 'Selecione um local...'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Modal
              transparent
              visible={showLocationModal}
              onRequestClose={() => setShowLocationModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowLocationModal(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione um Local</Text>
                  <FlatList
                    data={locations}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedLocationId(item.id);
                          setShowLocationModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>
                          {item.name} ({item.unique_code})
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            {selectedLocationId && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Local selecionado:</Text>
                <Text style={styles.selectedValue}>
                  {locations.find(l => l.id === selectedLocationId)?.name}
                </Text>
              </View>
            )}
          </View>

          {/* Dropdown Questionário */}
          <View style={styles.section}>
            <Text style={styles.label}>📝 Questionário *</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowSurveyModal(true)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedSurveyId 
                  ? surveys.find(s => s.id === selectedSurveyId)?.title 
                  : 'Selecione um questionário...'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Modal
              transparent
              visible={showSurveyModal}
              onRequestClose={() => setShowSurveyModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowSurveyModal(false)}
              >
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecione um Questionário</Text>
                  <FlatList
                    data={surveys}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => {
                          setSelectedSurveyId(item.id);
                          setShowSurveyModal(false);
                        }}
                      >
                        <Text style={styles.modalItemText}>
                          {item.title} ({(item.questions_schema || []).length} perguntas)
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>

            {selectedSurveyId && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Questionário selecionado:</Text>
                <Text style={styles.selectedValue}>
                  {surveys.find(s => s.id === selectedSurveyId)?.title}
                </Text>
                <Text style={styles.selectedSubtext}>
                  {(surveys.find(s => s.id === selectedSurveyId)?.questions_schema || []).length} perguntas
                </Text>
              </View>
            )}
          </View>

          {/* Botão Começar */}
          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnPrimary,
              (!selectedLocationId || !selectedSurveyId) && styles.btnDisabled
            ]}
            onPress={handleStart}
            disabled={!selectedLocationId || !selectedSurveyId}
          >
            <Text style={styles.btnText}>Começar Coleta →</Text>
          </TouchableOpacity>

          {/* Rascunhos locais para retomar */}
          <View style={[styles.section, styles.draftsSection]}>
            <Text style={styles.label}>📝 Rascunhos salvos</Text>
            {drafts.length === 0 ? (
              <Text style={styles.draftsEmpty}>Nenhum rascunho salvo ainda.</Text>
            ) : (
              drafts.map((row) => {
                const draft = toDraftView(row);
                const surveyTitle = surveys.find(s => s.id === draft.survey_id)?.title || 'Questionário';
                const locationName = locations.find(l => l.id === draft.location_id)?.name || 'Local';
                return (
                  <TouchableOpacity
                    key={draft.id}
                    style={styles.draftItem}
                    onPress={() => resumeDraft(row)}
                  >
                    <Text style={styles.draftTitle}>{surveyTitle}</Text>
                    <Text style={styles.draftSubtitle}>
                      {locationName} · {formatDraftDate(draft.created_at)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setStep(1)}
          >
            <Text style={styles.backBtn}>← Voltar</Text>
          </TouchableOpacity>

          {activeSurvey && Array.isArray(activeSurvey.questions_schema) && activeSurvey.questions_schema.length > 0 ? (
            activeSurvey.questions_schema.map((question, index) => (
              <View key={question?.id || index} style={styles.question}>
                <Text style={styles.questionLabel}>
                  {index + 1}. {question?.label || 'Pergunta sem título'}
                  {question?.required && <Text style={styles.required}> *</Text>}
                </Text>
                {question && renderQuestionInput(question, answers[question.id], (value) => handleAnswer(question.id, value))}
              </View>
            ))
          ) : (
            <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center', marginVertical: 20 }}>
              ⚠️ Nenhuma pergunta encontrada neste questionário
            </Text>
          )}

          <TouchableOpacity
            style={[styles.btn, styles.btnSuccess, loading && styles.btnDisabled]}
            onPress={handleSubmitForm}
            disabled={loading}
          >
            <Text style={styles.btnText}>
              {loading ? '⏳ Enviando...' : '✓ Enviar Questionário'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnDraft, loading && styles.btnDisabled]}
            onPress={handleSaveDraft}
            disabled={loading}
          >
            <Text style={styles.btnDraftText}>💾 Salvar rascunho</Text>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function renderQuestionInput(
  question: Question,
  value: any,
  onChange: (value: any) => void
) {
  if (!question || !question.type) {
    return (
      <Text style={{ color: '#ef4444' }}>
        ⚠️ Erro ao carregar pergunta
      </Text>
    );
  }

  try {
    switch (question.type) {
    case 'text':
      return (
        <TextInput
          style={styles.input}
          value={value || ''}
          onChangeText={onChange}
          placeholder="Digite sua resposta..."
          placeholderTextColor="#94a3b8"
        />
      );
    case 'number':
      return (
        <TextInput
          style={styles.input}
          value={value ? String(value) : ''}
          onChangeText={(text) => onChange(text === '' ? null : Number(text))}
          placeholder="Digite um número..."
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
        />
      );
    case 'boolean':
      return (
        <View style={styles.booleanGroup}>
          <TouchableOpacity
            style={[
              styles.boolBtn,
              value === true && styles.boolBtnSelected
            ]}
            onPress={() => onChange(true)}
          >
            <Text style={[
              styles.boolBtnText,
              value === true && styles.boolBtnTextSelected
            ]}>
              ✓ Sim
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.boolBtn,
              value === false && styles.boolBtnSelected
            ]}
            onPress={() => onChange(false)}
          >
            <Text style={[
              styles.boolBtnText,
              value === false && styles.boolBtnTextSelected
            ]}>
              ✗ Não
            </Text>
          </TouchableOpacity>
        </View>
      );
    case 'select':
      const options = (question.options || '')
        .split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0);
      
      if (!options || options.length === 0) {
        return (
          <Text style={{ color: '#ef4444', fontSize: 14 }}>
            ⚠️ Opções não configuradas para esta pergunta
          </Text>
        );
      }
      
      return (
        <View style={styles.selectGroup}>
          {options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.selectOption,
                value === option && styles.selectOptionSelected
              ]}
              onPress={() => onChange(option)}
            >
              <View style={[
                styles.radio,
                value === option && styles.radioSelected
              ]}>
                {value === option && <View style={styles.radioDot} />}
              </View>
              <Text style={[
                styles.selectOptionText,
                value === option && styles.selectOptionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    case 'scale':
      return (
        <ScaleCircle
          value={value}
          onChange={onChange}
        />
      );
    default:
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao renderizar pergunta:', error);
    return (
      <Text style={{ color: '#ef4444', fontSize: 14 }}>
        ⚠️ Erro ao renderizar esta pergunta: {String(error).substring(0, 50)}
      </Text>
    );
  }
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backBtn: {
    color: '#0ea5e9',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  picker: {
    height: 50,
    paddingHorizontal: 12,
    color: '#0f172a',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  dropdownArrow: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '75%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemText: {
    fontSize: 15,
    color: '#334155',
  },
  selectedInfo: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  selectedSubtext: {
    fontSize: 13,
    color: '#0c4a6e',
    marginTop: 4,
  },
  question: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  questionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    lineHeight: 22,
  },
  required: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  booleanGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  boolBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  boolBtnSelected: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0ea5e9',
    borderWidth: 2,
  },
  boolBtnText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  boolBtnTextSelected: {
    color: '#0284c7',
    fontWeight: '700',
  },
  selectGroup: {
    gap: 12,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  selectOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
    borderWidth: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  selectOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
  },
  selectOptionTextSelected: {
    color: '#15803d',
    fontWeight: '700',
  },
  scaleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  scaleBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  scaleBtnSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  scaleBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  scaleBtnTextSelected: {
    color: '#ffffff',
  },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnPrimary: {
    backgroundColor: '#0ea5e9',
    marginTop: 24,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSuccess: {
    backgroundColor: '#16a34a',
    marginTop: 24,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnDraft: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 8,
  },
  btnDraftText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  draftsSection: {
    marginTop: 28,
  },
  draftsEmpty: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  draftItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  draftTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  draftSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
});
