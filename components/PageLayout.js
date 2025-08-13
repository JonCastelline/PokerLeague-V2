import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AppMenu from './AppMenu';
import { useLeague } from '../context/LeagueContext';

const PageLayout = ({ children }) => {
  const { currentLeague, loadingLeagues } = useLeague();
  const { user } = useAuth();

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
        <View style={styles.logoContainer}>
          {!!currentLeague?.logoImageUrl && (
            <Image source={{ uri: currentLeague.logoImageUrl }} style={styles.logo} resizeMode="contain" />
          )}
        </View>
        <View style={styles.userContainer}>
          {user && (
            <Text style={styles.userName}>{user.firstName}</Text>
          )}
        </View>
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
    justifyContent: 'center', // Center the logo
    paddingTop: 50, // Adjust for status bar
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    minHeight: 150, // Increased minHeight to ensure space
    position: 'relative',
    width: '100%', // Explicitly set width to 100%
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 1, // Ensure menu is on top
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: '100%', // Make logo responsive to its container
    height: 150,
  },
  userContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
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
