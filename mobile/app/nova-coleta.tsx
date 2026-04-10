import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, Platform } from 'react-native';

// Tipagens para o TypeScript não reclamar
import Survey from '../src/database/models/Survey';
import Location from '../src/database/models/Locations';

import { database } from '../src/database';

// WatermelonDB só funciona em plataformas nativas
let withObservables: any = null;

if (Platform.OS !== 'web') {
  const watermelon = require('@nozbe/watermelondb/react');
  withObservables = watermelon.withObservables;
}

interface ColetaProps {
  surveys?: Survey[];
  locations?: Location[];
}

const ColetaScreen = ({ surveys = [], locations = [] }: ColetaProps) => {
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [respostaGenerica, setRespostaGenerica] = useState('');

  // ==========================================
  // FUNÇÃO DE SALVAR NO BANCO OFFLINE
  // ==========================================
  const handleSalvarColeta = async () => {
    if (!selectedSurvey || !selectedLocation) {
      Alert.alert('Atenção', 'Selecione um Questionário e uma Localidade primeiro.');
      return;
    }

    try {
      if (!database) {
        Alert.alert('Modo Offline Indisponível', 'Para usar coleta offline, compile para Android ou iOS.');
        return;
      }

      // Toda gravação no WatermelonDB precisa estar dentro de um database.write()
      await database.write(async () => {
        await database.get('responses').create((newResponse: any) => {
          newResponse.surveyId = selectedSurvey;
          newResponse.locationId = selectedLocation;
          
          // O payload real virá dos inputs dinâmicos do questionário, 
          // mas por enquanto salvamos esse texto de teste em JSON
          newResponse.dataPayload = JSON.stringify({
            observacao: respostaGenerica,
            data_coleta: new Date().toISOString()
          });
        });
      });

      Alert.alert('Sucesso!', 'Coleta salva offline e pronta para sincronizar! 🚀');
      setRespostaGenerica(''); // Limpa o campo
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a coleta.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Nova Coleta de Dados</Text>

      {/* 1. SELEÇÃO DA LOCALIDADE */}
      <Text style={styles.label}>1. Escolha a Localidade:</Text>
      <View style={styles.listContainer}>
        {locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[styles.item, selectedLocation === loc.id && styles.itemSelected]}
            onPress={() => setSelectedLocation(loc.id)}
          >
            <Text style={selectedLocation === loc.id ? styles.textSelected : styles.text}>
              📍 {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. SELEÇÃO DO QUESTIONÁRIO */}
      <Text style={styles.label}>2. Escolha o Questionário Base:</Text>
      <View style={styles.listContainer}>
        {surveys.map((survey) => (
          <TouchableOpacity
            key={survey.id}
            style={[styles.item, selectedSurvey === survey.id && styles.itemSelected]}
            onPress={() => setSelectedSurvey(survey.id)}
          >
            <Text style={selectedSurvey === survey.id ? styles.textSelected : styles.text}>
              📋 {survey.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. A COLETA EM SI (Simulação) */}
      {selectedSurvey && selectedLocation && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>3. Respostas da Coleta:</Text>
          <Text style={styles.subtext}>
            Aqui no futuro nós vamos renderizar os inputs dinâmicos baseados no JSON do questionário escolhido.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Digite os dados da pesquisa aqui..."
            multiline
            value={respostaGenerica}
            onChangeText={setRespostaGenerica}
          />

          <TouchableOpacity style={styles.button} onPress={handleSalvarColeta}>
            <Text style={styles.buttonText}>Salvar Coleta Localmente 💾</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// ==========================================
// A MÁGICA DOS OBSERVABLES
// ==========================================
// Essa função injeta os dados do banco na tela em tempo real
// Mas só funciona em plataformas nativas
let enhancedComponent;

if (Platform.OS !== 'web' && withObservables && database) {
  const enhance = withObservables([], () => ({
    // Busca todas as pesquisas ativas
    surveys: database.get('surveys').query().observe(),
    // Busca todas as localidades
    locations: database.get('locations').query().observe(),
  }));
  enhancedComponent = enhance(ColetaScreen);
} else {
  // Em web, exporta o componente diretamente sem observables
  enhancedComponent = ColetaScreen;
}

export default enhancedComponent;

// --- ESTILOS BÁSICOS ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f6fa' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2f3640' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#353b48' },
  listContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { padding: 12, backgroundColor: '#dcdde1', borderRadius: 8, marginBottom: 10, marginRight: 10 },
  itemSelected: { backgroundColor: '#44bd32' },
  text: { color: '#2f3640' },
  textSelected: { color: '#fff', fontWeight: 'bold' },
  formContainer: { marginTop: 30, padding: 15, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  subtext: { fontSize: 12, color: '#7f8fa6', marginBottom: 15, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: '#dcdde1', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  button: { backgroundColor: '#0097e6', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});