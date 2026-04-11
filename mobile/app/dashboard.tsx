import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/services/api';
import { Storage } from '../src/utils/storage';
import { useMenu } from '../src/context/MenuContext';
import SideMenu from './side-menu';
import { Header } from '../src/components/Header';

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
    } catch (error: any) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    if (error?.response?.status === 401) {
      Alert.alert('Sessão expirada', 'Faça login novamente.');
      handleLogout();
    }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <SideMenu />
      
      {/* Header */}
      <Header title="Antropoindicadores" subtitle="Painel de Controle" />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Título da Página */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Visão Geral</Text>
          <Text style={styles.pageSubtitle}>
            Métricas e estatísticas do sistema Antropoindicadores
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <View style={styles.cardsContainer}>
              {/* Card 1: Coletas Realizadas */}
              <View style={styles.card}>
                <View style={styles.cardIcon}>
                  <Text style={styles.icon}>📊</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>REGISTROS COLETADOS</Text>
                  <Text style={styles.cardNumber}>{stats.totalColetas}</Text>
                </View>
              </View>

              {/* Card 2: Locais Mapeados */}
              <View style={styles.card}>
                <View style={[styles.cardIcon, styles.cardIcon2]}>
                  <Text style={styles.icon}>🗺️</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>LOCAIS MONITORADOS</Text>
                  <Text style={styles.cardNumber}>{stats.totalLocais}</Text>
                </View>
              </View>

              {/* Card 3: Questionários Ativos */}
              <View style={styles.card}>
                <View style={[styles.cardIcon, styles.cardIcon3]}>
                  <Text style={styles.icon}>📋</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>FORMULÁRIOS ATIVOS</Text>
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
    backgroundColor: '#f8fafc', // Fundo mais leve (slate-50)
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
    fontWeight: '800',
    color: '#0f172a', // Slate-900 mais profundo
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748b', // Slate-500
  },

  // Cards
  cardsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0f172a', // Sombra com o tom slate
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9', // Borda sutil slate-100
  },
  cardIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#eff6ff', // Sky-50
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon2: {
    backgroundColor: '#f0fdf4', // Green-50
  },
  cardIcon3: {
    backgroundColor: '#f5f3ff', // Fuchsia-50
  },
  icon: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
  },

  // Chart
  chartSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    height: 160,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 8,
    height: '100%',
  },
  yLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: 16,
    paddingLeft: 8,
    height: '100%',
  },
  bar: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Slate-100
    borderRadius: 6,
    overflow: 'hidden',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    backgroundColor: '#0ea5e9', // Sky-500
    borderRadius: 6,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingLeft: 38,
  },
  chartLabel: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Action Card
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#0ea5e9', // Sky-500
    position: 'relative',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  actionCardText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    paddingRight: 24, // Espaço para a seta
  },
  actionCardArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -12, // Metade da altura da fonte para centralizar
    fontSize: 24,
    color: '#0ea5e9',
    fontWeight: '600',
  },
});
