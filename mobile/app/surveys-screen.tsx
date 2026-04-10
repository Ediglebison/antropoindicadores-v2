import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { surveysAPI } from '../src/services/api';
import SideMenu from './side-menu';
import { Header } from './components/Header';

export default function SurveysScreen() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    try {
      const response = await surveysAPI.getAllSurveys();
      if (response && response.data) {
        setSurveys(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar questionários:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SideMenu />
        <Header title="Questionários" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0052CC" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Questionários" subtitle="📄 Lista de questionários ativos" />
      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.surveyCard}>
            <Text style={styles.surveyTitle}>{item.title}</Text>
            <Text style={styles.surveyDescription}>{item.description}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>Nenhum questionário encontrado</Text>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  surveyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  surveyDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
