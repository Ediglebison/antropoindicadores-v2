import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { locationsAPI } from '../src/services/api';
import SideMenu from './side-menu';
import { Header } from './components/Header';

export default function LocationsScreen() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      const response = await locationsAPI.getAllLocations();
      if (response && response.data) {
        setLocations(response.data.data || response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <SideMenu />
        <Header title="Locais" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0052CC" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SideMenu />
      <Header title="Locais" subtitle="📍 Locais de pesquisa mapeados" />
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.locationCard}>
            <Text style={styles.locationName}>{item.name}</Text>
            {item.latitude && item.longitude && (
              <Text style={styles.coordinates}>
                📌 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>Nenhum local encontrado</Text>
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
  locationCard: {
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
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    color: '#0052CC',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
