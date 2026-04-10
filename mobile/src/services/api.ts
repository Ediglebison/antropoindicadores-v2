import axios from 'axios';
import { Storage } from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(async (config) => {
  try {
    const token = await Storage.getItem('auth_token');
    console.log('🔐 Token recuperado:', token ? '✅ Sim' : '❌ Não');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Header Authorization setado');
    } else {
      console.warn('⚠️ Token não encontrado no Storage!');
    }
  } catch (error) {
    console.error('❌ Erro ao recuperar token:', error);
  }
  return config;
});

// Interceptor para captura de erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, limpa e redireciona para login
      await Storage.removeItem('auth_token');
      // Aqui você pode redirecionar para a tela de login
    }
    return Promise.reject(error);
  }
);

// Exporta funções úteis
export const authAPI = {
  async login(accessCode: string, password: string) {
    console.log('🔑 Tentando login com código:', accessCode);
    const response = await api.post('/auth/login', { access_code: accessCode, password });
    const { access_token, user } = response.data;
    
    console.log('✅ Login bem-sucedido!');
    console.log('📝 Token:', access_token ? `${access_token.substring(0, 20)}...` : 'VAZIO');
    console.log('👤 Usuário:', user?.id, user?.access_code);
    
    await Storage.setItem('auth_token', access_token);
    await Storage.setItem('user', JSON.stringify(user));
    
    console.log('💾 Dados salvos no Storage');
    return { access_token, user };
  },

  async logout() {
    await Storage.removeItem('auth_token');
    await Storage.removeItem('user');
  },

  async getCurrentUser() {
    const user = await Storage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export const surveysAPI = {
  async getActive() {
    const response = await api.get('/surveys');
    return (response.data || []).filter((s: any) => s.is_active);
  },

  async getAll() {
    const response = await api.get('/surveys');
    return response.data || [];
  },

  async getAllSurveys() {
    const response = await api.get('/surveys');
    return response;
  },
};

export const locationsAPI = {
  async getAll() {
    const response = await api.get('/locations');
    return response.data || [];
  },

  async getAllLocations() {
    const response = await api.get('/locations');
    return response;
  },
};

export const responsesAPI = {
  async submit(surveyId: string, locationId: string, answers: Record<string, any>) {
    const response = await api.post('/responses', {
      survey_id: surveyId,
      location_id: locationId,
      answers_json: answers,
    });
    return response.data;
  },

  async getAll() {
    const response = await api.get('/responses');
    return response.data || [];
  },
};
