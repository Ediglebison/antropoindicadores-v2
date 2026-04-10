import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { Storage } from '../utils/storage';

// Lê a URL do arquivo .env
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:3000';

export async function syncData() {
  // Verificar se o database está disponível (só em plataformas nativas)
  if (!database) {
    throw new Error('WatermelonDB não está disponível nesta plataforma. Sincronização offline desabilitada.');
  }

  try {
    const token = await Storage.getItem('auth_token');

    await synchronize({
      database,
      // 1. O CELULAR PUXA OS DADOS DO SERVIDOR
      pullChanges: async ({ lastPulledAt }) => {
        const timestamp = lastPulledAt || 0;
        
        const response = await fetch(`${BACKEND_URL}/sync?lastPulledAt=${timestamp}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Erro ao buscar dados do servidor');
        
        const { changes, timestamp: serverTimestamp } = await response.json();
        
        return { changes, timestamp: serverTimestamp };
      },

      // 2. O CELULAR EMPURRA OS DADOS PARA O SERVIDOR
      pushChanges: async ({ changes, lastPulledAt }) => {
        const timestamp = lastPulledAt || 0;
        
        // ADICIONE ESTA LINHA PARA TESTE:
        console.log("🔥 TENTANDO BATER NA URL:", `${BACKEND_URL}/sync?lastPulledAt=${timestamp}`);
        
        const response = await fetch(`${BACKEND_URL}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ changes, lastPulledAt }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar dados para o servidor');
        }
      },
      
      // Essencial para manter a integridade dos dados
      // migrationsEnabledAtVersion: 1, 
    });
    
    return true; // Retorna sucesso
  } catch (error) {
    console.error('Falha na sincronização:', error);
    throw error;
  }
}