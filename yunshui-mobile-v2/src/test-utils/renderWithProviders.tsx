import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { configureStore } from '@reduxjs/toolkit';

// Simple mock store for testing
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: null, token: null, isAuthenticated: false }, action) => state,
    materials: (state = { items: [], loading: false }, action) => state,
    orders: (state = { items: [], loading: false }, action) => state,
  },
});

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  store?: typeof mockStore;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    store = mockStore,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <PaperProvider>
          <NavigationContainer>
            {children}
          </NavigationContainer>
        </PaperProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything
export * from '@testing-library/react-native';