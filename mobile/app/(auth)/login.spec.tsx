import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './login';
import { authAPI } from '../../src/services/api';
import { Storage } from '../../src/utils/storage';
import { router } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// Mocks
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('../../src/services/api', () => ({
  authAPI: {
    login: jest.fn(),
  },
}));

jest.mock('../../src/utils/storage', () => ({
  Storage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../../src/database', () => ({
  database: null, // Testando caminho online
}));

jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly after loading', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue(null);
    
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    await waitFor(() => {
      expect(getByText('Antropoindicadores')).toBeTruthy();
      expect(getByPlaceholderText('Digite seu código')).toBeTruthy();
      expect(getByPlaceholderText('Sua senha secreta')).toBeTruthy();
    });
  });

  it('redirects to dashboard if already authenticated', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue('existing-token');
    
    render(<LoginScreen />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('alerts if fields are empty on login', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue(null);
    const { getByText } = render(<LoginScreen />);

    await waitFor(() => getByText(/entrar na plataforma/i));
    
    const loginButton = getByText(/entrar na plataforma/i);
    fireEvent.press(loginButton);

    expect(Alert.alert).toHaveBeenCalledWith('Atenção', 'Preencha código de acesso e senha');
  });

  it('performs online login successfully', async () => {
    (Storage.getItem as jest.Mock).mockResolvedValue(null);
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true });
    (authAPI.login as jest.Mock).mockResolvedValue({
      access_token: 'new-token',
      user: { id: 1, name: 'Admin', role: 'ADMIN' }
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    await waitFor(() => getByText(/entrar na plataforma/i));

    const codeInput = getByPlaceholderText('Digite seu código');
    const passInput = getByPlaceholderText('Sua senha secreta');
    const loginButton = getByText(/entrar na plataforma/i);

    fireEvent.changeText(codeInput, 'admin123');
    fireEvent.changeText(passInput, 'secret');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('admin123', 'secret');
      expect(Storage.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
      expect(Storage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ id: 1, name: 'Admin', role: 'ADMIN' }));
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso!', 'Login realizado');
      expect(router.replace).toHaveBeenCalledWith('/dashboard');
    });
  });
});
