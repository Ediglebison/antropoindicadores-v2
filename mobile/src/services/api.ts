import axios from 'axios';
import { Storage } from '../utils/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.7:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(async (config) => {
  try {
    const token = await Storage.getItem('auth_token');
    
    if (token) {
      // Trava de segurança para garantir que o objeto headers existe
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Header Authorization setado com sucesso');
    } else {
      // Mudei para log normal, pois é natural não ter token na hora do login
      console.log('ℹ️ Sem token no Storage (Normal se estiver na tela de login)');
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
    // Se der 401 e a rota NÃO for a de login, significa que o token expirou de verdade
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      console.warn('🚫 Token expirado. Limpando sessão...');
      await Storage.removeItem('auth_token');
      await Storage.removeItem('user');
      // O seu Contexto de Autenticação vai notar que o token sumiu e jogar o usuário pra fora
    }
    return Promise.reject(error);
  }
);

// Exporta funções úteis de Autenticação
export const authAPI = {
  async login(accessCode: string, password: string) {
    
    // 👇 1. A SOLUÇÃO DO CÓDIGO MAIÚSCULO ESTÁ AQUI!
    const codigoLimpo = accessCode.trim().toLowerCase();
    
    console.log('🔑 Tentando login com código:', codigoLimpo);
    
    const response = await api.post('/auth/login', { 
      access_code: codigoLimpo, 
      password: password 
    });
    
    const { access_token, user } = response.data;
    
    console.log('✅ Login bem-sucedido!');
    
    // 2. Os nomes aqui estão perfeitos! Batem exatamente com o interceptor lá em cima
    await Storage.setItem('auth_token', access_token);
    await Storage.setItem('user', JSON.stringify(user));
    
    console.log('💾 Dados salvos no Storage com sucesso');
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

// Exporta funções de Questionários (Limpas e sem duplicatas)
export const surveysAPI = {
  async getActive() {
    const response = await api.get('/surveys');
    return (response.data || []).filter((s: any) => s.is_active);
  },

  async getAll() {
    const response = await api.get('/surveys');
    return response.data || [];
  },

  async create(data: { id?: string; title: string; description: string; is_active: boolean; questions_schema: any[] }) {
    const response = await api.post('/surveys', data);
    return response.data;
  },

  async update(id: string, data: any) {
    const response = await api.patch(`/surveys/${id}`, data); 
    return response.data;
  },
};

// Exporta funções de Localidades (Limpas e sem duplicatas)
export const locationsAPI = {
  // Procura todas as localizações
  async getAll() {
    const response = await api.get('/locations');
    return response.data;
  },

  // Cria uma nova localização
  async create(data: { id: string; name: string; unique_code: string; city?: string; state?: string; description?: string }) {
    const response = await api.post('/locations', data);
    return response.data;
  },

  // Atualiza uma localização existente
  async update(id: string, data: any) {
    const response = await api.patch(`/locations/${id}`, data);
    return response.data;
  }
};

// Exporta funções de Respostas
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

export const usersAPI = {
  async getAll() {
    const response = await api.get('/users');
    return response.data;
  },
  async create(data: any) {
    const response = await api.post('/users', data);
    return response.data;
  },
  async update(id: string, data: any) {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  }
};