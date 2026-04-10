import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/services/api';
import { Storage } from '../src/utils/storage';
import { useMenu } from '../src/context/MenuContext';
import SideMenu from './side-menu';
import { Header } from './components/Header';

export default function DashboardScreen() {
  const router = useRouter();
  const { openMenu } = useMenu();
  const [stats, setStats] = useState({
    totalColetas: 0,
    totalLocais: 0,
    totalQuestionarios: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function handleLogout() {
    try {
      await Storage.removeItem('auth_token');
      await Storage.removeItem('user');
      router.replace('/(auth)/login' as any);
    } catch (error) {
      console.error('Erro ao logout:', error);
    }
  }

  async function loadStats() {
    setLoading(true);
    try {
      const [locRes, surRes, respRes] = await Promise.all([
        api.get('/locations'),
        api.get('/surveys'),
        api.get('/responses'),
      ]);

      setStats({
        totalColetas: respRes.data?.length || 0,
        totalLocais: locRes.data?.length || 0,
        totalQuestionarios: surRes.data?.length || 0,
      });
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SideMenu />
      
      {/* Header */}
      <Header title="Antropoindicadores" subtitle="Dashboard Principal" />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Título da Página */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Dashboard Principal</Text>
          <Text style={styles.pageSubtitle}>
            Visão geral do projeto Antropoindicadores
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <View style={styles.cardsContainer}>
              {/* Card 1: Coletas Realizadas */}
              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Text style={styles.icon}>📋</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>COLETAS REALIZADAS</Text>
                  <Text style={styles.cardNumber}>{stats.totalColetas}</Text>
                </View>
              </View>

              {/* Card 2: Locais Mapeados */}
              <View style={styles.card}>
                <View style={[styles.cardIcon, styles.cardIcon2]}>
                  <Text style={styles.icon}>📍</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>LOCAIS MAPEADOS</Text>
                  <Text style={styles.cardNumber}>{stats.totalLocais}</Text>
                </View>
              </View>

              {/* Card 3: Questionários Ativos */}
              <View style={styles.card}>
                <View style={[styles.cardIcon, styles.cardIcon3]}>
                  <Text style={styles.icon}>📄</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>QUESTIONÁRIOS ATIVOS</Text>
                  <Text style={styles.cardNumber}>{stats.totalQuestionarios}</Text>
                </View>
              </View>
            </View>

            {/* Gráfico Placeholder */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Respostas por Questionário</Text>
              
              <View style={styles.chart}>
                {/* Eixo Y */}
                <View style={styles.yAxis}>
                  <Text style={styles.yLabel}>4</Text>
                  <Text style={styles.yLabel}>3</Text>
                  <Text style={styles.yLabel}>2</Text>
                  <Text style={styles.yLabel}>1</Text>
                </View>

                {/* Barras */}
                <View style={styles.barsContainer}>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { height: '50%' }]} />
                  </View>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { height: '75%' }]} />
                  </View>
                  <View style={styles.bar}>
                    <View style={[styles.barFill, { height: '40%' }]} />
                  </View>
                </View>
              </View>

              {/* Labels do Gráfico */}
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>Pesquisa 1</Text>
                <Text style={styles.chartLabel}>Pesquisa 2</Text>
                <Text style={styles.chartLabel}>Pesquisa 3</Text>
              </View>
            </View>

            {/* Card de Ação */}
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('coleta-pesquisa' as any)}
            >
              <Text style={styles.actionCardTitle}>🎯 Iniciar Nova Coleta</Text>
              <Text style={styles.actionCardText}>
                Clique aqui para começar uma nova coleta de dados em campo
              </Text>
              <Text style={styles.actionCardArrow}>→</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Title
  titleSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#666666',
  },

  // Cards
  cardsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon2: {
    backgroundColor: '#e8f5e9',
  },
  cardIcon3: {
    backgroundColor: '#f3e5f5',
  },
  icon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Chart
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    height: 150,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yLabel: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: 12,
    paddingLeft: 8,
  },
  bar: {
    flex: 1,
    backgroundColor: '#e3e3e3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    backgroundColor: '#0052CC',
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 38,
  },
  chartLabel: {
    fontSize: 12,
    color: '#999999',
    flex: 1,
    textAlign: 'center',
  },

  // Action Card
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0052CC',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionCardText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  actionCardArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
    fontSize: 28,
    color: '#0052CC',
    fontWeight: '300',
  },
});
