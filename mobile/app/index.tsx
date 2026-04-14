import { View, Text, ActivityIndicator, StyleSheet, Alert, Animated } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Storage } from '../src/utils/storage';
import { syncData } from '../src/database/sync';
import NetInfo from '@react-native-community/netinfo';

export default function Index() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Verificando conexão...');
  const [isError, setIsError] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    async function initializeApp() {
      const maxRetries = 10;
      const delayMs = 1000; // 1 segundo entre tentativas
      let attempt = 0;
      let syncSuccess = false;
      let lastError: any = null;

      while (attempt < maxRetries && !syncSuccess) {
        attempt++;
        try {
          if (attempt === 1) {
            setStatus('Verificando conexão com a internet...');
          } else {
            setStatus(`Tentando reconectar... (Tentativa ${attempt}/${maxRetries})`);
          }
          
          const netInfo = await NetInfo.fetch();

          if (!netInfo.isConnected) {
            throw new Error('Sem conexão com a internet.');
          }

          // 2. Sincronizar dados
          setStatus(attempt === 1 ? 'Sincronizando dados com o servidor...' : `Sincronizando... (Tentativa ${attempt}/${maxRetries})`);
          
          // Passamos o setStatus para atualizar o andamento durante o sync
          await syncData((progressStatus) => {
            setStatus(progressStatus);
          });

          syncSuccess = true;
          setStatus('Sincronização concluída com sucesso!');
          
          // Aguarda 1 segundo para o usuário ler a mensagem de sucesso
          setTimeout(() => {
            proceedToNextScreen();
          }, 1000);

        } catch (error: any) {
          lastError = error;
          console.log(`Falha na tentativa ${attempt}:`, error.message);
          
          if (attempt < maxRetries) {
            // Aguarda antes de tentar de novo
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      if (!syncSuccess) {
        console.error('Erro na inicialização após tentativas:', lastError);
        setIsError(true);
        setStatus(`Aviso: ${lastError?.message || 'Falha ao conectar com o servidor.'}\n\nO aplicativo continuará em modo offline com os dados salvos.`);
        
        // Se der erro após as tentativas, avisar o usuário mas permitir prosseguir
        Alert.alert(
          'Modo Offline',
          'Não foi possível sincronizar os dados com o servidor após 10 segundos de tentativas. Você poderá usar o aplicativo com os dados armazenados localmente.',
          [
            {
              text: 'Continuar',
              onPress: () => proceedToNextScreen(),
            }
          ]
        );
      }
    }

    initializeApp();
  }, []);

  async function proceedToNextScreen() {
    try {
      const token = await Storage.getItem('auth_token');
      if (token) {
        router.replace('/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (e) {
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Antropoindicadores</Text>
        
        {!isError && (
          <ActivityIndicator size="large" color="#0ea5e9" style={styles.loader} />
        )}
        
        <Text style={[styles.statusText, isError && styles.errorText]}>
          {status}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 10,
  },
});
