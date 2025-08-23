
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as api from '../src/api'; // Import all api functions

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: null,
    authenticated: false,
    isLoading: true,
    user: null,
  });

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userString = await AsyncStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;
        setAuthState({
          token: token,
          authenticated: !!token,
          isLoading: false,
          user: user,
        });
      } catch (e) {
        console.error('Failed to load token:', e);
        setAuthState({ token: null, authenticated: false, isLoading: false });
      }
    };

    loadToken();
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setAuthState({
      token: null,
      authenticated: false,
      isLoading: false,
      user: null,
    });
  }, []);

  const authenticatedApiCall = useCallback(async (apiFunc, ...args) => {
    try {
      return await apiFunc(...args, authState.token);
    } catch (error) {
      if (error.message === '401') {
        console.log('Caught 401 error, signing out...');
        await signOut();
      }
      throw error; // Re-throw the error to be handled by the calling component if needed
    }
  }, [authState.token, signOut]);

  const signIn = async (token, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      token: token,
      authenticated: true,
      isLoading: false,
      user: user,
    });
    console.log('AuthContext: User signed in with:', user);
  };

  const value = {
    user: authState.user,
    token: authState.token,
    authenticated: authState.authenticated,
    isLoading: authState.isLoading,
    signIn,
    signOut,
    api: authenticatedApiCall, // Expose the wrapped api call function
    updateAuthUser: async (newUser) => {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setAuthState(prevState => ({
        ...prevState,
        user: newUser,
      }));
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
