import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Alert, Modal, 
  ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform 
} from 'react-native';
import { usersAPI } from '../src/services/api';
import SideMenu from './side-menu';
import { Header } from '../src/components/Header';

export default function UsersScreen() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    access_code: '',
    password: '',
    role: 'RESEARCHER', // Padrão: Pesquisador
    is_active: true
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    try {
      const response = await usersAPI.getAll();
      setUsuarios(response || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({ name: '', access_code: '', password: '', role: 'RESEARCHER', is_active: true });
    setIsFormVisible(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      access_code: user.access_code || '',
      password: '', // Deixamos vazio na edição (só preenche se quiser trocar)
      role: user.role || 'RESEARCHER',
      is_active: user.is_active !== undefined ? user.is_active : true
    });
    setIsFormVisible(true);
  };

  const handleSave = async () => {
    // Validações básicas
    if (!formData.name.trim() || !formData.access_code.trim()) {
      Alert.alert('Aviso', 'Nome e Código de Acesso são obrigatórios.');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Aviso', 'A senha é obrigatória para novos usuários.');
      return;
    }

    try {
      setLoading(true);
      
      // Limpa a senha do envio caso esteja editando e não tenha digitado nada novo
      const dataToSend = { ...formData };
      if (editingUser && !dataToSend.password) {
        delete (dataToSend as any).password;
      }
      
      if (editingUser) {
        await usersAPI.update(editingUser.id, dataToSend);
        Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
      } else {
        const gerarUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        await usersAPI.create({ id: gerarUUID(), ...dataToSend });
        Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
      }

      setIsFormVisible(false);
      loadUsuarios();

    } catch (error: any) {
      console.log('\n--- ERRO AO SALVAR USUÁRIO ---');
      console.log('Status:', error.response?.status);
      console.log('Resposta:', JSON.stringify(error.response?.data, null, 2));
      console.log('------------------------------\n');
      Alert.alert('Erro', 'Ocorreu um problema ao salvar o usuário. Olhe o terminal!');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.iconText}>{item.role === 'ADMIN' ? '🛡️' : '👤'}</Text>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.accessCode}>Acesso: {item.access_code}</Text>
          </View>
        </View>
      </View>

      <View style={styles.badgesRow}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {item.role === 'ADMIN' ? 'Administrador' : 'Pesquisador'}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, item.is_active === false ? styles.statusInactive : styles.statusActive]}>
          <Text style={[styles.statusText, item.is_active === false ? styles.statusTextInactive : styles.statusTextActive]}>
            {item.is_active === false ? 'Inativo' : 'Ativo'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => handleEdit(item)}>
          <Text style={styles.actionBtnTextGray}>⚙️ Editar Usuário</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Usuários" subtitle="Gestão de Acessos" />

      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Equipe Registrada</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
            <Text style={styles.addBtnText}>+ Novo</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0052CC" />
          </View>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsuarios(); }} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
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
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput 
                style={styles.input} 
                value={formData.name} 
                onChangeText={(t) => setFormData({...formData, name: t})}
                placeholder="Ex: João da Silva"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Código de Acesso</Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.access_code} 
                    onChangeText={(t) => setFormData({...formData, access_code: t})}
                    placeholder="Ex: JOAO123"
                    autoCapitalize="characters"
                  />
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    Senha {editingUser && <Text style={{fontSize: 11, color: '#94a3b8'}}>(Opcional)</Text>}
                  </Text>
                  <TextInput 
                    style={styles.input} 
                    value={formData.password} 
                    onChangeText={(t) => setFormData({...formData, password: t})}
                    placeholder={editingUser ? "Deixe vazio para manter" : "Senha secreta"}
                    secureTextEntry={true} // 👈 Oculta os caracteres digitados
                  />
                </View>
              </View>

              <Text style={styles.label}>Permissão no Sistema</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[styles.roleOption, formData.role === 'RESEARCHER' && styles.roleSelected]}
                  onPress={() => setFormData({...formData, role: 'RESEARCHER'})}
                >
                  <Text style={[styles.roleOptionText, formData.role === 'RESEARCHER' && styles.roleTextSelected]}>
                    👤 Pesquisador
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.roleOption, formData.role === 'ADMIN' && styles.roleSelected]}
                  onPress={() => setFormData({...formData, role: 'ADMIN'})}
                >
                  <Text style={[styles.roleOptionText, formData.role === 'ADMIN' && styles.roleTextSelected]}>
                    🛡️ Administrador
                  </Text>
                </TouchableOpacity>
              </View>

              {editingUser && (
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Usuário Ativo (Permite Login)</Text>
                  <Switch 
                    value={formData.is_active} 
                    onValueChange={(v) => setFormData({...formData, is_active: v})}
                    trackColor={{ false: '#cbd5e1', true: '#bae6fd' }}
                    thumbColor={formData.is_active ? '#0ea5e9' : '#f1f5f9'}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
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

  // Cards
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconText: { fontSize: 24, marginRight: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  accessCode: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '500' },
  
  badgesRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: '#0ea5e9' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusActive: { backgroundColor: '#f0fdf4' },
  statusInactive: { backgroundColor: '#fef2f2' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextActive: { color: '#16a34a' },
  statusTextInactive: { color: '#ef4444' },

  cardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14 },
  actionBtnEdit: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnTextGray: { color: '#475569', fontWeight: '600', fontSize: 13 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  formContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: '#64748b', fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15 },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  
  // Seleção de Permissão
  roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleOption: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', backgroundColor: '#f8fafc' },
  roleSelected: { borderColor: '#0ea5e9', backgroundColor: '#e0f2fe' },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  roleTextSelected: { color: '#0369a1', fontWeight: '700' },

  saveBtn: { backgroundColor: '#0ea5e9', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});