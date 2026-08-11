import { synchronize } from '@nozbe/watermelondb/sync';
import type { SyncDatabaseChangeSet, SyncTableChangeSet } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { Storage } from '../utils/storage';

// Lê a URL do arquivo .env
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL;

// Rascunhos (is_draft=true) são locais e nunca devem alcançar o servidor.
// O campo is_draft chega cru no registro de push; se ausente/undefined, é uma resposta completa.
export function isDraftSkippable(record: { is_draft?: boolean }): boolean {
  return record.is_draft === true;
}

function filterDraftResponses(changes: SyncDatabaseChangeSet): SyncDatabaseChangeSet {
  const responseChanges: { responses?: SyncTableChangeSet } = changes;
  if (!responseChanges.responses) {
    return changes;
  }

  return {
    ...changes,
    responses: {
      ...responseChanges.responses,
      created: responseChanges.responses.created.filter((record) => !isDraftSkippable(record)),
      updated: responseChanges.responses.updated.filter((record) => !isDraftSkippable(record)),
    },
  };
}

export async function syncData(onProgress?: (status: string, progressValue?: number) => void) {
  // Verificar se o database está disponível (só em plataformas nativas)
  if (!database) {
    throw new Error('WatermelonDB não está disponível nesta plataforma. Sincronização offline desabilitada.');
  }

  try {
    const token = await Storage.getItem('auth_token');

    if (onProgress) onProgress('Iniciando sincronização...', 10);

    await synchronize({
      database,
      // 1. O CELULAR PUXA OS DADOS DO SERVIDOR
      pullChanges: async ({ lastPulledAt }) => {
        if (onProgress) onProgress('Baixando dados do servidor...', 30);
        const timestamp = lastPulledAt || 0;
        
        const response = await fetch(`${BACKEND_URL}/sync?lastPulledAt=${timestamp}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Erro ao buscar dados do servidor');
        
        const { changes, timestamp: serverTimestamp } = await response.json();
        
        if (onProgress) onProgress('Processando dados recebidos...', 50);
        return { changes, timestamp: serverTimestamp };
      },

      // 2. O CELULAR EMPURRA OS DADOS PARA O SERVIDOR
      pushChanges: async ({ changes, lastPulledAt }) => {
        if (onProgress) onProgress('Enviando dados para o servidor...', 70);
        const timestamp = lastPulledAt || 0;
        
        const completeChanges = filterDraftResponses(changes);
        
        // ADICIONE ESTA LINHA PARA TESTE:
        console.log("🔥 TENTANDO BATER NA URL:", `${BACKEND_URL}/sync?lastPulledAt=${timestamp}`);
        
        const response = await fetch(`${BACKEND_URL}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ changes: completeChanges, lastPulledAt }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar dados para o servidor');
        }
        
        if (onProgress) onProgress('Finalizando envio...', 90);
      },
      
      // Essencial para manter a integridade dos dados
      // migrationsEnabledAtVersion: 1, 
    });
    
    if (onProgress) onProgress('Sincronização concluída com sucesso!', 100);
    return true; // Retorna sucesso
  } catch (error) {
    console.error('Falha na sincronização:', error);
    throw error;
  }
}