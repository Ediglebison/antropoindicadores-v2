import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Image, Alert, Dimensions, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenu } from '../src/context/MenuContext';
import { Storage } from '../src/utils/storage';
import { syncData } from '../src/database/sync';
import { useNetInfo } from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');
const MENU_WIDTH = 280;

export default function SideMenu() {
  const router = useRouter();
  const { isOpen, closeMenu } = useMenu();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [userRole, setUserRole] = useState('RESEARCHER'); // Padrão de segurança: Pesquisador comum
  const netInfo = useNetInfo();

  // 👉 NOVO: Busca quem é o usuário logado assim que o menu é carregado
  useEffect(() => {
    async function loadUserRole() {
      try {
        const userStr = await Storage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          if (userObj && userObj.role) {
            setUserRole(userObj.role);
          }
        }
      } catch (error) {
        console.error('Erro ao ler dados do usuário no menu:', error);
      }
    }
    loadUserRole();
  }, []);

  // Animação do Menu
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -MENU_WIDTH, duration: 300, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  // 👉 NOVO: Array mestre com as regras de permissão (roles)
  const allMenuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: '📊', route: '/dashboard', roles: ['ADMIN', 'RESEARCHER'] },
    { id: 'coleta', label: 'Nova Coleta', icon: '📝', route: '/coleta-pesquisa', roles: ['ADMIN', 'RESEARCHER'] },
    { id: 'resultados', label: 'Resultados', icon: '📈', route: '/results-screen', roles: ['ADMIN', 'RESEARCHER'] },
    { id: 'locais', label: 'Locais', icon: '🗺️', route: '/locations-screen', roles: ['ADMIN', 'RESEARCHER'] },
    
    // Abas restritas apenas para Administradores
    { id: 'questionarios', label: 'Formulários', icon: '📋', route: '/surveys-screen', roles: ['ADMIN'] },
    { id: 'pesquisadores', label: 'Equipe', icon: '👥', route: '/researchers-screen', roles: ['ADMIN'] },
  ];

  // Filtra o menu para mostrar apenas o que a permissão atual permite ver
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      Alert.alert('Sucesso!', 'Dados sincronizados com o servidor.');
    } catch (error) {
      Alert.alert('Ops!', 'Verifique sua internet ou tente novamente mais tarde.');
    } finally {
      setIsSyncing(false);
    }
  };

  async function handleLogout() {
    Alert.alert('Sair', 'Tem certeza que deseja sair da aplicação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
          try {
            await Storage.removeItem('auth_token');
            await Storage.removeItem('user');
            closeMenu();
            router.replace('/(auth)/login' as any);
          } catch (error) {
            console.error('Erro ao logout:', error);
          }
        }
      },
    ]);
  }

  function handleNavigate(route: string) {
    closeMenu();
    setTimeout(() => { router.push(route as any); }, 100);
  }

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]}
      >
        <TouchableOpacity style={styles.overlayTouchable} onPress={closeMenu} activeOpacity={1} />
      </Animated.View>

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}
      >
        <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
          <View style={[styles.menuHeader, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={closeMenu} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
              <Text style={styles.closeIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/android-icon-foreground.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Antropoindicadores</Text>
              {/* Mostra uma etiquetinha com a permissão logada para facilitar a visualização */}
              <Text style={styles.roleSubTitle}>{userRole === 'ADMIN' ? 'Administrador' : 'Pesquisador'}</Text>
            </View>
          </View>

          <View style={styles.menuItemsContainer}>
            {/* Aqui o React renderiza apenas os botões que passaram no filtro */}
            {menuItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleNavigate(item.route)} activeOpacity={0.7}>
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 'auto' }}>
            {/* O botão de Sincronizar fica livre para todos, como você pediu */}
            <TouchableOpacity style={[styles.syncBtn, !netInfo.isConnected && { opacity: 0.7 }]} onPress={handleSync} disabled={isSyncing || !netInfo.isConnected}>
              {isSyncing ? (
                <ActivityIndicator color="#0052CC" size="small" style={{ marginRight: 14, width: 24 }} />
              ) : (
                <Text style={styles.syncIcon}>{netInfo.isConnected ? '🔄' : '📴'}</Text>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.syncText}>{isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}</Text>
                <Text style={{ fontSize: 11, color: netInfo.isConnected ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                  {netInfo.isConnected ? '● Online - Pronto para sync' : '● Offline - Sem conexão'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.logoutBtn, { marginBottom: insets.bottom + 16 }]} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.logoutIcon}>→</Text>
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 10 },
  overlayTouchable: { flex: 1 },
  menuContainer: { position: 'absolute', top: 0, left: 0, width: MENU_WIDTH, height: '100%', backgroundColor: '#ffffff', zIndex: 11, shadowColor: '#0f172a', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 8 },
  menu: { flex: 1, backgroundColor: '#ffffff' },
  menuHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#bfdbfe', backgroundColor: '#3b82f6' },
  closeBtn: { padding: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 20, color: '#ffffff', fontWeight: '600' },
  logoContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  logo: { width: 32, height: 32 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  roleSubTitle: { fontSize: 13, color: '#dbeafe', fontWeight: '600', marginTop: 2 },
  menuItemsContainer: { paddingVertical: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 12, marginVertical: 4, borderRadius: 12 },
  menuItemIcon: { fontSize: 20, marginRight: 14, width: 24, textAlign: 'center' },
  menuItemLabel: { fontSize: 15, fontWeight: '600', color: '#334155', flex: 1 },
  syncBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f8fafc', marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  syncIcon: { fontSize: 18, marginRight: 14, width: 24, textAlign: 'center' },
  syncText: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, paddingHorizontal: 16, paddingVertical: 14, marginVertical: 8, borderRadius: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  logoutIcon: { fontSize: 16, color: '#ef4444', marginRight: 12, fontWeight: '600' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' }
});