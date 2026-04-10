// app/index.tsx
import { syncData } from '../src/database/sync';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../src/database';
import Survey from '../src/database/models/Survey';

export default function Home() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);

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
  // A mágica do WatermelonDB: Escutando o banco em tempo real!
  useEffect(() => {
    // WatermelonDB só funciona em plataformas nativas (não em web)
    if (!database) {
      console.warn('⚠️ WatermelonDB not available - offline mode disabled');
      return;
    }

    try {
      const colecao = database.collections.get('surveys');
      const observador = colecao.query().observe().subscribe((dados: Survey[]) => {
        setSurveys(dados);
      });

      // Limpa o observador quando sair da tela
      return () => observador.unsubscribe();
    } catch (error) {
      console.error('Error loading surveys from database:', error);
    }
  }, []);

  return (
    <View style={styles.container}>
      {surveys.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma coleta registrada ainda. Vá a campo!</Text>
      ) : (
        <FlatList
          data={surveys}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              <Text style={styles.cardDate}>
                Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
        />
      )}

      {/* Botão de Sincronização */}
      <TouchableOpacity 
        style={{ backgroundColor: '#17a2b8', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}
        onPress={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sincronizar com Servidor 🔄</Text>
        )}
      </TouchableOpacity>

      {/* Botão Flutuante para Nova Coleta */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/nova-coleta')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#999', marginTop: 8 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#0056b3', width: 60, height: 60, 
    borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: 'bold', lineHeight: 34 }
});