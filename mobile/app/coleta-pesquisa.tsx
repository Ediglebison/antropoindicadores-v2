import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, TextInput, FlatList, Modal } from 'react-native';
import { api } from '../src/services/api';
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

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      console.log('🔍 Iniciando carregamento de dados...');
      
      const [locRes, surRes] = await Promise.all([
        api.get('/locations'),
        api.get('/surveys')
      ]);
      
      console.log('✅ Dados carregados:', {
        locations: locRes.data?.length,
        surveys: surRes.data?.length
      });
      
      setLocations(locRes.data || []);
      setSurveys((surRes.data || []).filter((s: Survey) => s.is_active));
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error.response?.status, error.message);
      console.error("📌 Resposta:", error.response?.data);
      Alert.alert(
        'Erro', 
        `Falha ao carregar: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleStart() {
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
    
    setAnswers({});
    setStep(2);
  }

  function handleAnswer(questionId: string, value: any) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmitForm() {
    setLoading(true);
    try {
      await api.post('/responses', {
        survey_id: selectedSurveyId,
        location_id: selectedLocationId,
        answers_json: answers
      });
      
      Alert.alert('Sucesso!', 'Questionário enviado com sucesso');
      setStep(1);
      setAnswers({});
      setSelectedLocationId('');
      setSelectedSurveyId('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao enviar o questionário. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

          <View style={{ height: 20 }} />
        </View>
      )}
    </ScrollView>
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
});
