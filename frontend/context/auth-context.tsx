import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { api } from '@/services/api';

type AuthState = {
  token: string | null;
  username: string | null;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    token: null,
    username: null,
    isLoading: true,
  });

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'username']).then((pairs) => {
      const token = pairs[0][1];
      const username = pairs[1][1];
      setState({ token, username, isLoading: false });
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { token } = await api.login(username, password);
    await AsyncStorage.multiSet([['token', token], ['username', username]]);
    setState({ token, username, isLoading: false });
  }, []);

  const register = useCallback(async (username: string, password: string, password2: string) => {
    const { token, username: user } = await api.register(username, password, password2);
    await AsyncStorage.multiSet([['token', token], ['username', user]]);
    setState({ token, username: user, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'username']);
    setState({ token: null, username: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
