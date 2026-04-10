import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenu } from '../src/context/MenuContext';
import { Storage } from '../src/utils/storage';
import { syncData } from '../src/database/sync';

const { width } = Dimensions.get('window');
const MENU_WIDTH = 280;

export default function SideMenu() {
  const router = useRouter();
  const { isOpen, closeMenu } = useMenu();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isSyncing, setIsSyncing] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      route: '/dashboard',
    },
    {
      id: 'coleta',
      label: 'Coleta em Campo',
      icon: '📋',
      route: '/coleta-pesquisa',
    },
    {
      id: 'resultados',
      label: 'Resultados',
      icon: '📈',
      route: '/results-screen',
    },
    {
      id: 'questionarios',
      label: 'Questionários',
      icon: '📄',
      route: '/surveys-screen',
    },
    {
      id: 'locais',
      label: 'Locais',
      icon: '📍',
      route: '/locations-screen',
    },
    {
      id: 'pesquisadores',
      label: 'Pesquisadores',
      icon: '👤',
      route: '/researchers-screen',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

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
      { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
      {
        text: 'Sair',
        onPress: async () => {
          try {
            await Storage.removeItem('auth_token');
            await Storage.removeItem('user');
            closeMenu();
            router.replace('/(auth)/login' as any);
          } catch (error) {
            console.error('Erro ao logout:', error);
          }
        },
        style: 'destructive',
      },
    ]);
  }

  function handleNavigate(route: string) {
    closeMenu();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  }

  return (
    <>
      {/* Overlay - Fecha o menu ao clicar fora */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.overlay,
          {
            opacity: overlayAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={closeMenu}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Menu Slider */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.menuContainer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView style={styles.menu} showsVerticalScrollIndicator={false}>
          {/* Header do Menu */}
          <View style={[styles.menuHeader, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={closeMenu}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
              activeOpacity={0.7}
            >
              <Text style={styles.closeIcon}>←</Text>
            </TouchableOpacity>
            <Image
              source={require('../assets/images/android-icon-foreground.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Antropoindicadores</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItemsContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 'auto' }}>
            {/* Sync */}
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleSync}
              activeOpacity={0.7}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color="#0052CC" size="small" style={{ marginRight: 14, width: 24 }} />
              ) : (
                <Text style={styles.syncIcon}>🔄</Text>
              )}
              <Text style={styles.syncText}>{isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={[styles.logoutBtn, { marginBottom: insets.bottom + 16 }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 10,
  },
  overlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menu: {
    flex: 1,
    backgroundColor: '#fff',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#0056b3',
  },
  closeBtn: {
    padding: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuItemsContainer: {
    paddingVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  syncIcon: {
    fontSize: 18,
    marginRight: 14,
    width: 24,
    textAlign: 'center',
  },
  syncText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0052CC',
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginVertical: 8,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  logoutIcon: {
    fontSize: 16,
    color: '#ef4444',
    marginRight: 12,
    fontWeight: '300',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ef4444',
  },
});
