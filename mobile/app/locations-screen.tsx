import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Modal, 
  ScrollView, TextInput, KeyboardAvoidingView, Platform 
} from 'react-native';
import { locationsAPI } from '../src/services/api';
import SideMenu from './side-menu';
import { Header } from '../src/components/Header';

export default function LocationsScreen() {
  const [localizacoes, setLocalizacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados do Formulário/Modal
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null); // 👉 NOVO: Guarda o local sendo editado

  const [formData, setFormData] = useState({
    name: '',
    unique_code: '',
    city: '',
    state: 'PA',
    description: ''
  });

  useEffect(() => {
    loadLocalizacoes();
  }, []);

  async function loadLocalizacoes() {
    try {
      const response = await locationsAPI.getAll();
      setLocalizacoes(response || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as localizações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // 👉 NOVO: Abre o formulário limpo para Criar
  const handleAddNew = () => {
    setEditingLocation(null);
    setFormData({ name: '', unique_code: '', city: '', state: 'PA', description: '' });
    setIsFormVisible(true);
  };

  // 👉 NOVO: Abre o formulário preenchido para Editar
  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setFormData({
      name: location.name || '',
      unique_code: location.unique_code || '',
      city: location.city || '',
      state: location.state || 'PA',
      description: location.description || ''
    });
    setIsFormVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.unique_code.trim()) {
      Alert.alert('Aviso', 'Nome e Código Único são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      
      if (editingLocation) {
        // 👉 ATUALIZAR LOCAL EXISTENTE
        await locationsAPI.update(editingLocation.id, formData);
        Alert.alert('Sucesso', 'Localização atualizada com sucesso!');
      } else {
        // 👉 CRIAR NOVO LOCAL (Com o gerador de UUID)
        const gerarUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        await locationsAPI.create({
          id: gerarUUID(),
          ...formData
        });
        Alert.alert('Sucesso', 'Localização cadastrada com sucesso!');
      }

      setIsFormVisible(false);
      loadLocalizacoes();

    } catch (error: any) {
      // O nosso Espião de Erros
      console.log('\n--- ERRO AO SALVAR LOCALIZAÇÃO ---');
      console.log('Status:', error.response?.status);
      console.log('Resposta:', JSON.stringify(error.response?.data, null, 2));
      console.log('----------------------------------\n');
      Alert.alert('Erro', 'Ocorreu um problema ao salvar a localização. Olhe o terminal!');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>📍</Text>
        </View>
        <View style={styles.titleBox}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.unique_code}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cidade/UF:</Text>
          <Text style={styles.infoValue}>{item.city || 'Não informada'} - {item.state || 'PA'}</Text>
        </View>
        {item.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
        )}
      </View>

      {/* 👉 NOVO: Botão de Editar no rodapé do Card */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
          <Text style={styles.actionBtnTextGray}>⚙️ Editar Local</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Localizações" subtitle="Gestão de Pontos de Coleta" />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Locais Registrados</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
            <Text style={styles.addBtnText}>+ Novo Local</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0052CC" />
          </View>
        ) : (
          <FlatList
            data={localizacoes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLocalizacoes(); }} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma localização encontrada.</Text>
            }
          />
        )}
      </View>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      <Modal visible={isFormVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.formContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLocation ? 'Editar Localização' : 'Nova Localização'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nome do Local</Text>
              <TextInput 
                style={styles.input} 
                value={formData.name} 
                onChangeText={(t) => setFormData({...formData, name: t})}
                placeholder="Ex: Comunidade Apeú"
              />

              <Text style={styles.label}>Código Único (ID Local)</Text>
              <TextInput 
                style={styles.input} 
                value={formData.unique_code} 
                onChangeText={(t) => setFormData({...formData, unique_code: t})}
                placeholder="Ex: LOC-01"
              />

              <View style={styles.row}>
                <View style={{ flex: 2, marginRight: 10 }}>
                  <Text style={styles.label}>Cidade</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.city} 
                    onChangeText={(t) => setFormData({...formData, city: t})}
                    placeholder="Ex: Castanhal"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>UF</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.state} 
                    maxLength={2}
                    onChangeText={(t) => setFormData({...formData, state: t.toUpperCase()})}
                  />
                </View>
              </View>

              <Text style={styles.label}>Descrição Adicional</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                multiline 
                value={formData.description}
                onChangeText={(t) => setFormData({...formData, description: t})}
                placeholder="Pontos de referência ou detalhes..."
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingLocation ? 'Salvar Alterações' : 'Guardar Localização'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, paddingHorizontal: 16 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  addBtn: { backgroundColor: '#0ea5e9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  listContainer: { paddingBottom: 30 },
  centerContainer: { flex: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' },

  // Estilo dos Cards
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconText: { fontSize: 22 },
  titleBox: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, paddingBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#334155' },
  descriptionText: { fontSize: 13, color: '#64748b', marginTop: 6, fontStyle: 'italic', lineHeight: 18 },

  // Ações do Card
  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtnEdit: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnTextGray: { color: '#475569', fontWeight: '600', fontSize: 13 },

  // Estilo do Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: '#64748b', fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15 },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});