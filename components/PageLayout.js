import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import AppMenu from './AppMenu';
import { useLeague } from '../context/LeagueContext';

const PageLayout = ({ children }) => {
  const { currentLeague, loadingLeagues } = useLeague();

  if (loadingLeagues) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fb5b5a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.menuContainer}>
          <AppMenu />
        </View>
        {currentLeague?.logoImageUrl && (
          <Image source={{ uri: currentLeague.logoImageUrl }} style={styles.logo} resizeMode="contain" />
        )}
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50, // Adjust for status bar
    paddingHorizontal: 10,
    backgroundColor: 'transparent', // Make header background transparent
    minHeight: 100, // Ensure enough space for logo and menu
  },
  menuContainer: {
    position: 'absolute',
    top: 50, // Align with header paddingTop
    left: 10,
    zIndex: 1,
  },
  logo: {
    width: 400,
    height: 150,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PageLayout;
