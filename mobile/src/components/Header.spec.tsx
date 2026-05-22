import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Header } from './Header';
import { MenuProvider, useMenu } from '../context/MenuContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// Mock para podermos acessar a função openMenu que o Header chama
let mockOpenMenu = jest.fn();

jest.mock('../context/MenuContext', () => {
  const original = jest.requireActual('../context/MenuContext');
  return {
    ...original,
    useMenu: () => ({
      openMenu: mockOpenMenu,
    }),
  };
});

describe('Header Component', () => {
  beforeEach(() => {
    mockOpenMenu.mockClear();
  });

  it('renders title correctly', () => {
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <Header title="My Title" />
      </SafeAreaProvider>
    );

    expect(getByText('My Title')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <Header title="My Title" subtitle="My Subtitle" />
      </SafeAreaProvider>
    );

    expect(getByText('My Subtitle')).toBeTruthy();
  });

  it('calls openMenu when menu button is pressed', () => {
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <Header title="My Title" />
      </SafeAreaProvider>
    );

    const menuButton = getByText('☰');
    fireEvent.press(menuButton);

    expect(mockOpenMenu).toHaveBeenCalledTimes(1);
  });
});
