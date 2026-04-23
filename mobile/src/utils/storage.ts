import { Platform } from 'react-native';

// In-memory storage - fallback seguro que sempre funciona
const inMemoryStorage: Record<string, string> = {};

const memoryStorageAdapter = {
  getItem: (key: string) => {
    return Promise.resolve(inMemoryStorage[key] || null);
  },
  setItem: (key: string, value: string) => {
    inMemoryStorage[key] = value;
    return Promise.resolve(undefined);
  },
  removeItem: (key: string) => {
    delete inMemoryStorage[key];
    return Promise.resolve(undefined);
  },
};

// Web storage adapter - apenas para web real com localStorage
const webStorageAdapter = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        return Promise.resolve(localStorage.getItem(key));
      }
    } catch (error) {
      console.warn(`Web storage getItem failed for ${key}`);
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn(`Web storage setItem failed for ${key}`);
    }
    return Promise.resolve(undefined);
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Web storage removeItem failed for ${key}`);
    }
    return Promise.resolve(undefined);
  },
};

let storageInstance: any = null;
let secureStorageInstance: any = null;
let initialized = false;

async function initializeStorage() {
  if (initialized) return { storageInstance, secureStorageInstance };

  // Setup Secure Store for native (fallback to web/async otherwise)
  try {
    if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      const isAvailable = await SecureStore.isAvailableAsync();
      if (isAvailable) {
        secureStorageInstance = {
          getItem: async (key: string) => await SecureStore.getItemAsync(key),
          setItem: async (key: string, value: string) => await SecureStore.setItemAsync(key, value),
          removeItem: async (key: string) => await SecureStore.deleteItemAsync(key),
        };
        console.log('Storage: Using SecureStore for sensitive data');
      }
    }
  } catch (error) {
    console.log('Storage: SecureStore not available');
  }

  // Tentamos AsyncStorage apenas em plataformas nativas
  try {
    if (Platform.OS !== 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // Teste se funciona
      await AsyncStorage.setItem('__init_test__', '1');
      await AsyncStorage.removeItem('__init_test__');
      storageInstance = AsyncStorage;
      if (!secureStorageInstance) secureStorageInstance = AsyncStorage;
      console.log('Storage: Using AsyncStorage');
      initialized = true;
      return { storageInstance, secureStorageInstance };
    }
  } catch (error) {
    console.log('Storage: AsyncStorage not available');
  }

  // Teste web storage
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('__init_test__', '1');
      localStorage.removeItem('__init_test__');
      storageInstance = webStorageAdapter;
      if (!secureStorageInstance) secureStorageInstance = webStorageAdapter;
      console.log('Storage: Using Web Storage (localStorage)');
      initialized = true;
      return { storageInstance, secureStorageInstance };
    }
  } catch (error) {
    console.log('Storage: Web storage not available');
  }

  // Fallback final: in-memory storage
  console.log('Storage: Using In-Memory Storage');
  storageInstance = memoryStorageAdapter;
  if (!secureStorageInstance) secureStorageInstance = memoryStorageAdapter;
  initialized = true;
  return { storageInstance, secureStorageInstance };
}

function isSensitiveKey(key: string) {
  const k = key.toLowerCase();
  return k.includes('token') || k.includes('user') || k.includes('password');
}

export const Storage = {
  async getItem(key: string) {
    try {
      const stores = await initializeStorage();
      const store = isSensitiveKey(key) && stores.secureStorageInstance ? stores.secureStorageInstance : stores.storageInstance;
      return await store.getItem(key);
    } catch (error) {
      console.error(`Storage.getItem(${key}) error:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string) {
    try {
      const stores = await initializeStorage();
      const store = isSensitiveKey(key) && stores.secureStorageInstance ? stores.secureStorageInstance : stores.storageInstance;
      await store.setItem(key, value);
    } catch (error) {
      console.error(`Storage.setItem(${key}) error:`, error);
    }
  },

  async removeItem(key: string) {
    try {
      const stores = await initializeStorage();
      const store = isSensitiveKey(key) && stores.secureStorageInstance ? stores.secureStorageInstance : stores.storageInstance;
      await store.removeItem(key);
    } catch (error) {
      console.error(`Storage.removeItem(${key}) error:`, error);
    }
  },
};
