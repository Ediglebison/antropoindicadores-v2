import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SideMenu from './side-menu';
import { Header } from './components/Header';

export default function ResultsScreen() {
  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Resultados" subtitle="📈 Análise de resultados das coletas" />
      <View style={styles.content}>
        <Text style={styles.title}>📈 Resultados</Text>
        <Text style={styles.message}>Análise de resultados das coletas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
  },
});
