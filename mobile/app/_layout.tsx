import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Storage } from '../src/utils/storage';
import { MenuProvider } from '../src/context/MenuContext';

export default function Layout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // 1. Tira a tela de loading inicial do layout (a Index fará o resto)
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 2. O Porteiro Inteligente: Roda toda vez que a tela muda (segments)
  useEffect(() => {
    if (isLoading) return;

    const checkRoute = async () => {
      // Busca a verdade direto do Storage e não de um state antigo!
      const token = await Storage.getItem('auth_token');
      const isUserLoggedIn = !!token; // Retorna true se tiver token, false se não tiver

      const currentSegments = segments as string[];
      const inAuthGroup = currentSegments[0] === '(auth)';
      const isRoot = currentSegments.length === 0 || (currentSegments.length === 1 && currentSegments[0] === 'index');

      // Se estamos na tela inicial (Index), ela própria decidirá para onde ir após o sync
      if (isRoot) {
        return;
      }

      if (!isUserLoggedIn && !inAuthGroup) {
        // Sem crachá e tentando ver o painel? Vai pro login!
        router.replace('/(auth)/login');
      } else if (isUserLoggedIn) {
        // Com crachá e tentando ver o login? Vai pro dashboard!
        if (inAuthGroup) {
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