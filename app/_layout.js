import { Slot, useRouter, useSegments, useGlobalSearchParams, useRootNavigationState } from "expo-router";
import React, { useEffect, useState } from "react";
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from "../context/AuthContext";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ActivityIndicator, View } from 'react-native';
import * as Audio from 'expo-audio';
import * as SplashScreen from 'expo-splash-screen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { authenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const params = useGlobalSearchParams();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });
      } catch (e) {
        console.error('Failed to set audio mode', e);
      }
    };

    configureAudio();
  }, []);

  useEffect(() => {
    if (!navigationState?.key || isLoading) {
      return;
    }

    // Hide the splash screen now that the router is ready
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    const isSigningUpWithToken = inAuthGroup && segments[1] === 'signup' && params.token;

    if (isSigningUpWithToken) {
      return;
    }

    if (authenticated && inAuthGroup) {
      router.replace('/(app)/home');
    } else if (!authenticated && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [authenticated, isLoading, segments, router, params, navigationState]);

  return <Slot />;
};

const RootLayout = () => {
  return (
    <React.Fragment>
      <KeyboardProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </KeyboardProvider>
      <Toast />
    </React.Fragment>
  );
};

export default RootLayout;