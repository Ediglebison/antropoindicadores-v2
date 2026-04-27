import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { authAPI } from '../../src/services/api';
import { router } from 'expo-router';
import { Storage } from '../../src/utils/storage';
import NetInfo from '@react-native-community/netinfo';
import { database } from '../../src/database';
import { Q } from '@nozbe/watermelondb';
import bcrypt from 'bcryptjs';

export default function LoginScreen() {
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    try {
      const token = await Storage.getItem('auth_token');
      if (token) {
        router.replace('/dashboard' as any);
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleOfflineLogin() {
    try {
      if (!database) {
        Alert.alert('Erro', 'Banco de dados offline não disponível.');
        return false;
      }

      // Busca o usuário pelo código de acesso (ignorando case)
      const usersCollection = database.collections.get('users');
      const users = await usersCollection.query(
        Q.where('access_code', accessCode.toUpperCase())
      ).fetch();

      if (users.length === 0) {
        Alert.alert('Erro Offline', 'Usuário não encontrado no banco de dados local. Você precisa ter feito login online ao menos uma vez antes.');
        return false;
      }

      const user: any = users[0];
      
      // Valida a senha usando bcryptjs
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        Alert.alert('Erro Offline', 'Senha incorreta.');
        return false;
      }

      // Login offline com sucesso!
      // Geramos um token "falso" para o sistema manter logado no offline
      await Storage.setItem('auth_token', 'offline_token_' + user.id);
      await Storage.setItem('user', JSON.stringify({
        id: user.id,
        name: user.name,
        access_code: user.accessCode,
        role: user.role
      }));

      Alert.alert('Modo Offline', `Bem-vindo(a) de volta, ${user.name}! (Modo Offline)`);
      router.replace('/dashboard' as any);
      return true;

    } catch (error) {
      console.error("Erro no login offline:", error);
      Alert.alert('Erro Offline', 'Falha ao tentar autenticar localmente.');
      return false;
    }
  }

  async function handleLogin() {
    if (!accessCode || !password) {
      Alert.alert('Atenção', 'Preencha código de acesso e senha');
      return;
    }

    setLoginLoading(true);
    try {
      const netInfo = await NetInfo.fetch();

      // Se já sabemos que estamos sem internet, vamos direto para o Offline
      if (!netInfo.isConnected) {
        await handleOfflineLogin();
        setLoginLoading(false);
        return;
      }

      // 1. Tenta login na API
      const response = await authAPI.login(accessCode, password);
      
      // 2. Guardamos o token para manter logado e os dados do usuário
      if (response.access_token) {
        await Storage.setItem('auth_token', response.access_token);
      }
      if (response.user) {
        await Storage.setItem('user', JSON.stringify(response.user));
      }

      Alert.alert('Sucesso!', 'Login realizado');
      router.replace('/dashboard' as any);
      
    } catch (error: any) {
      console.error(error);
      const isNetworkError = !error.response && error.request;
      
      // Se for erro de rede (servidor caiu ou wifi falhou na hora H), tentamos offline
      if (isNetworkError) {
        console.log("Erro de rede detectado. Tentando login offline...");
        await handleOfflineLogin();
      } else {
        const message = error.response?.data?.message || 'Falha na autenticação';
        Alert.alert('Erro no Login', message);
      }
    } finally {
      setLoginLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/android-icon-foreground.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Título e Subtítulo */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Antropoindicadores</Text>
          <Text style={styles.subtitle}>Painel de Gestão de Pesquisa</Text>
        </View>

        {/* Formulário de Login */}
        <View style={styles.formContainer}>
          {/* Campo de Código de Acesso */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Código de Acesso</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu código"
              placeholderTextColor="#cbd5e1"
              value={accessCode}
              onChangeText={setAccessCode}
              editable={!loginLoading}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Campo de Senha */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Sua senha secreta"
                placeholderTextColor="#cbd5e1"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loginLoading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loginLoading}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão de Login */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loginLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={loginLoading}
            activeOpacity={0.8}
          >
            {loginLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar na Plataforma</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Espaço vazio para layout */}
        <View style={{ flex: 1 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 100,
  },
  
  // Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },

  // Título
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },

  // Formulário
  formContainer: {
    gap: 18,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#f9f9f9',
  },

  // Senha
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#f9f9f9',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },

  // Botão de Login
  loginButton: {
    backgroundColor: '#0052CC',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#0052CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
