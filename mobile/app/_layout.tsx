import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Storage } from '../src/utils/storage';
import { MenuProvider } from '../src/context/MenuContext';
import { syncData } from '../src/database/sync';

export default function Layout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // 1. Roda apenas uma vez para tirar a tela de loading inicial e tentar o sync
  useEffect(() => {
    setIsLoading(false);

    // Tenta sincronizar os dados em background (silenciosamente) na inicialização
    const attemptSync = async () => {
      const token = await Storage.getItem('auth_token');
      if (token) {
        try {
          console.log('🔄 Iniciando sincronização em background...');
          await syncData();
          console.log('✅ Sincronização inicial concluída com sucesso.');
        } catch (error: any) {
          console.log('⚠️ Sincronização inicial pulada ou falhou:', error.message);
        }
      }
    };
    attemptSync();
  }, []);

  // 2. O Porteiro Inteligente: Roda toda vez que a tela muda (segments)
  useEffect(() => {
    if (isLoading) return;

    const checkRoute = async () => {
      // Busca a verdade direto do Storage e não de um state antigo!
      const token = await Storage.getItem('auth_token');
      const isUserLoggedIn = !!token; // Retorna true se tiver token, false se não tiver

      const inAuthGroup = segments[0] === '(auth)';
      const isRoot = segments.length === 0 || (segments.length === 1 && segments[0] === 'index');

      if (!isUserLoggedIn && !inAuthGroup) {
        // Sem crachá e tentando ver o painel? Vai pro login!
        router.replace('/(auth)/login');
      } else if (isUserLoggedIn) {
        // Com crachá e tentando ver o login? Vai pro dashboard!
        if (inAuthGroup || isRoot) {
          router.replace('/dashboard');
        }
      }
    };

    checkRoute();
  }, [segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#0056b3" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <MenuProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </MenuProvider>
    </SafeAreaProvider>
  );
}