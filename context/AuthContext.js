
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

  const signIn = async (token, user) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setAuthState({
      token: token,
      authenticated: true,
      isLoading: false,
      user: user,
    });
    console.log('AuthContext: User signed in with:', user); // Add this line
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setAuthState({
      token: null,
      authenticated: false,
      isLoading: false,
      user: null,
    });

  // const updateAuthUser = async (newUser) => { // Commented out
  //   await AsyncStorage.setItem('user', JSON.stringify(newUser));
  //   setAuthState(prevState => ({
  //     ...prevState,
  //     user: newUser,
  //   }));
  // };
  };

  const value = {
    user: authState.user,
    token: authState.token,
    authenticated: authState.authenticated,
    isLoading: authState.isLoading,
    signIn,
    signOut,
    updateAuthUser: async (newUser) => { // Defined directly in value
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
