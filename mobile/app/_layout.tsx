// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Storage } from '../src/utils/storage';
import { MenuProvider } from '../src/context/MenuContext';

export default function Layout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await Storage.getItem('auth_token');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  }

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
        <Stack 
          initialRouteName={isLoggedIn ? 'dashboard' : '(auth)/login'}
          screenOptions={{ headerShown: false }}
        >
          {!isLoggedIn ? (
            <Stack.Screen
              name="(auth)/login"
              options={{
                headerShown: false
              }}
            />
          ) : (
            <>
              
            </>
          )}
        </Stack>
      </MenuProvider>
    </SafeAreaProvider>
  );
}