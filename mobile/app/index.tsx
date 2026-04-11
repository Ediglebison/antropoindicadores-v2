import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  // A lógica de redirecionamento (Login vs Dashboard) acontece no arquivo _layout.tsx.
  // Esta tela serve apenas como uma "ponte" inicial enquanto o layout decide para onde o usuário vai.
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
      <ActivityIndicator size="large" color="#0ea5e9" />
    </View>
  );
}
