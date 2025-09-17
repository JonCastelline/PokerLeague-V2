import { Slot, useRouter, useSegments, useGlobalSearchParams, useRootNavigationState } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from "react";
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from "../context/AuthContext";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ActivityIndicator, View } from 'react-native';
import * as Audio from 'expo-audio';
import * as NavigationBar from 'expo-navigation-bar';
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
    const hideNavigationBar = async () => {
      await NavigationBar.setVisibilityAsync('hidden');
      await NavigationBar.setBehaviorAsync('inset-swipe');
    };
    hideNavigationBar();

    let hideTimer;

    const visibilityListener = NavigationBar.addVisibilityListener(({ visibility }) => {
      if (visibility === 'visible') {
        // Clear any existing timer
        if (hideTimer) {
          clearTimeout(hideTimer);
        }
        // Set a new timer to hide the navigation bar after 3 seconds
        hideTimer = setTimeout(() => {
          NavigationBar.setVisibilityAsync('hidden');
        }, 3000);
      }
    });

    return () => {
      // Clean up the listener and the timer when the component unmounts
      visibilityListener.remove();
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
    };
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
      <StatusBar style="auto" />
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