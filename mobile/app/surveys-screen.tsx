import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Modal, 
  ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform
} from 'react-native';
import { surveysAPI } from '../src/services/api';
import SideMenu from './side-menu';
import { Header } from '../src/components/Header';

// Tipos de perguntas disponíveis no sistema
const QUESTION_TYPES = [
  { id: 'text', label: 'Texto Curto' },
  { id: 'long_text', label: 'Texto Longo' },
  { id: 'number', label: 'Número' },
  { id: 'scale', label: 'Escala (1 a 5)' },
  { id: 'boolean', label: 'Sim/Não' }
];

export default function SurveysScreen() {
  const [questionarios, setQuestionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null); 
  const [isFormVisible, setIsFormVisible] = useState(false); 
  const [editingSurvey, setEditingSurvey] = useState<any>(null); 

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: true,
    questions_schema: [] as any[] // Agora o estado guarda as questões!
  });

  useEffect(() => {
    loadQuestionarios();
  }, []);

  async function loadQuestionarios() {
    try {
      const response = await surveysAPI.getAll(); 
      setQuestionarios(response || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os questionários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleAddNew = () => {
    setEditingSurvey(null);
    setFormData({ title: '', description: '', is_active: true, questions_schema: [] });
    setIsFormVisible(true);
  };

  const handleEdit = (survey: any) => {
    setEditingSurvey(survey);
    setFormData({
      title: survey.title,
      description: survey.description,
      is_active: survey.is_active,
      // Se não tiver questões salvas, garante que inicie como array vazio
      questions_schema: survey.questions_schema || [] 
    });
    setIsFormVisible(true);
  };

  // 👉 FUNÇÕES DE GERENCIAMENTO DE QUESTÕES
  const addQuestion = () => {
    const newQuestion = { 
      id: Date.now().toString(), // ID único baseado na hora para a questão
      label: '', 
      type: 'text' 
    };
    setFormData(prev => ({
      ...prev,
      questions_schema: [...prev.questions_schema, newQuestion]
    }));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updatedQuestions = [...formData.questions_schema];
    updatedQuestions[index][field] = value;
    setFormData({ ...formData, questions_schema: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    Alert.alert('Remover', 'Tem certeza que deseja remover esta questão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => {
          const updatedQuestions = formData.questions_schema.filter((_, i) => i !== index);
          setFormData({ ...formData, questions_schema: updatedQuestions });
        }
      }
    ]);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Aviso', 'O título é obrigatório.');
      return;
    }

    // Valida se as questões inseridas não estão com o texto vazio
    const hasEmptyQuestions = formData.questions_schema.some(q => !q.label.trim());
    if (hasEmptyQuestions) {
      Alert.alert('Aviso', 'Existem questões sem título. Preencha ou remova-as.');
      return;
    }

    try {
      setLoading(true);
      
      if (editingSurvey) {
        await surveysAPI.update(editingSurvey.id, formData);
        Alert.alert('Sucesso', 'Questionário atualizado!');
      } else {
        const gerarUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        await surveysAPI.create({ 
          id: gerarUUID(), 
          ...formData 
        });
        Alert.alert('Sucesso', 'Questionário criado!');
      }
      
      setIsFormVisible(false);
      loadQuestionarios();
      
    } catch (error: any) {
      console.log('\n--- ERRO AO SALVAR QUESTIONÁRIO ---');
      console.log('Status:', error.response?.status);
      console.log('Resposta:', JSON.stringify(error.response?.data, null, 2));
      console.log('-----------------------------------\n');
      Alert.alert('Erro', 'Não foi possível salvar os dados. Olhe o terminal!');
    } finally {
      setLoading(false);
    }
  };

  const traduzirTipoQuestao = (tipo: string) => {
    const tipoEncontrado = QUESTION_TYPES.find(q => q.id === tipo);
    return tipoEncontrado ? tipoEncontrado.label : tipo;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.iconText}>📄</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>
        <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
          <Text style={[styles.statusText, item.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
            {item.is_active ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>

      <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtnView} onPress={() => setSelectedSurvey(item)}>
          <Text style={styles.actionBtnTextBlue}>Ver Questões ({item.questions_schema?.length || 0})</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
          <Text style={styles.actionBtnTextGray}>⚙️ Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Questionários" subtitle="Gestão de Pesquisas" />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Lista de Pesquisas</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
            <Text style={styles.addBtnText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={questionarios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadQuestionarios} />}
        />
      </View>

      {/* MODAL DE FORMULÁRIO (CADASTRAR / EDITAR) */}
      <Modal visible={isFormVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSurvey ? 'Editar Questionário' : 'Novo Questionário'}</Text>
              <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              
              {/* Informações Básicas */}
              <Text style={styles.label}>Título do Questionário</Text>
              <TextInput 
                style={styles.input} 
                value={formData.title} 
                onChangeText={(t) => setFormData({...formData, title: t})}
                placeholder="Ex: Censo Demográfico 2026"
              />

              <Text style={styles.label}>Descrição</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                multiline 
                value={formData.description}
                onChangeText={(t) => setFormData({...formData, description: t})}
                placeholder="Descreva o objetivo desta pesquisa..."
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Status (Ativo para coleta)</Text>
                <Switch 
                  value={formData.is_active} 
                  onValueChange={(v) => setFormData({...formData, is_active: v})}
                  trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
                  thumbColor={formData.is_active ? '#0ea5e9' : '#f1f5f9'}
                />
              </View>

              <View style={styles.divider} />

              {/* Construtor de Questões */}
              <View style={styles.questionsHeader}>
                <Text style={styles.sectionTitle}>Questões ({formData.questions_schema.length})</Text>
                <TouchableOpacity style={styles.addQuestionBtn} onPress={addQuestion}>
                  <Text style={styles.addQuestionBtnText}>+ Adicionar Pergunta</Text>
                </TouchableOpacity>
              </View>

              {formData.questions_schema.map((questao, index) => (
                <View key={questao.id} style={styles.questionEditorBox}>
                  <View style={styles.questionEditorHeader}>
                    <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeQuestion(index)}>
                      <Text style={styles.removeQuestionText}>Remover 🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput 
                    style={styles.input} 
                    value={questao.label} 
                    onChangeText={(text) => updateQuestion(index, 'label', text)}
                    placeholder="Digite a sua pergunta aqui..."
                  />

                  <Text style={styles.subLabel}>Tipo de Resposta:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                    {QUESTION_TYPES.map((typeOption) => {
                      const isSelected = questao.type === typeOption.id;
                      return (
                        <TouchableOpacity 
                          key={typeOption.id}
                          style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                          onPress={() => updateQuestion(index, 'type', typeOption.id)}
                        >
                          <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                            {typeOption.label}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>
              ))}

              {formData.questions_schema.length === 0 && (
                <Text style={styles.emptyQuestionsText}>
                  Nenhuma pergunta adicionada. Clique no botão acima para começar.
                </Text>
              )}

            </ScrollView>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Salvar Questionário</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DE VISUALIZAÇÃO */}
      <Modal visible={!!selectedSurvey} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
           <View style={styles.viewContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Estrutura da Pesquisa</Text>
                <TouchableOpacity onPress={() => setSelectedSurvey(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.surveyTitleBig}>{selectedSurvey?.title}</Text>
                <Text style={styles.surveyDescBig}>{selectedSurvey?.description}</Text>
                
                <Text style={styles.sectionTitle}>Perguntas:</Text>
                {selectedSurvey?.questions_schema?.length > 0 ? (
                  selectedSurvey.questions_schema.map((q: any, i: number) => (
                    <View key={i} style={styles.qItem}>
                      <Text style={styles.qLabel}>{i+1}. {q.label}</Text>
                      <View style={styles.qTypeBadge}>
                        <Text style={styles.qTypeText}>{traduzirTipoQuestao(q.type)}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyQuestionsText}>Este questionário está vazio.</Text>
                )}
              </ScrollView>
           </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, paddingHorizontal: 16 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  addBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  
  // Cards Principais
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconText: { fontSize: 18, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: '#dcfce7' },
  statusInactive: { backgroundColor: '#f1f5f9' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextActive: { color: '#16a34a' },
  statusTextInactive: { color: '#64748b' },
  descriptionText: { fontSize: 13, color: '#64748b', marginBottom: 15 },
  cardActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtnView: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#f0f9ff', borderRadius: 6 },
  actionBtnEdit: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#f8fafc', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnTextBlue: { color: '#0369a1', fontWeight: '700', fontSize: 13 },
  actionBtnTextGray: { color: '#475569', fontWeight: '600', fontSize: 13 },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  viewContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  closeBtn: { padding: 4, backgroundColor: '#f1f5f9', borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 16, color: '#64748b', fontWeight: '700' },
  
  // Inputs Formulário
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15, backgroundColor: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 20 },
  
  // Construtor de Questões
  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  addQuestionBtn: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#bae6fd' },
  addQuestionBtnText: { color: '#0284c7', fontWeight: '600', fontSize: 13 },
  questionEditorBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 },
  questionEditorHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  questionNumber: { fontWeight: '700', color: '#0ea5e9' },
  removeQuestionText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  
  // Chips de Tipos
  typeSelector: { flexDirection: 'row', marginBottom: 4 },
  typeChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  typeChipSelected: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  typeChipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  typeChipTextSelected: { color: '#fff', fontWeight: '700' },
  
  emptyQuestionsText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginVertical: 20 },

  formActions: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 10 },
  saveBtn: { padding: 16, alignItems: 'center', borderRadius: 8, backgroundColor: '#0ea5e9' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  
  // Visualização View Modal
  surveyTitleBig: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  surveyDescBig: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 24 },
  qItem: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  qLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 8 },
  qTypeBadge: { alignSelf: 'flex-start', backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  qTypeText: { fontSize: 11, fontWeight: '600', color: '#475569' }
});