
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: null,
    authenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setAuthState({
          token: token,
          authenticated: !!token,
          isLoading: false,
        });
      } catch (e) {
        console.error('Failed to load token:', e);
        setAuthState({ token: null, authenticated: false, isLoading: false });
      }
    };

    loadToken();
  }, []);

  const signIn = async (token) => {
    await AsyncStorage.setItem('token', token);
    setAuthState({
      token: token,
      authenticated: true,
      isLoading: false,
    });
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    setAuthState({
      token: null,
      authenticated: false,
      isLoading: false,
    });
  };

  const value = {
    ...authState,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
