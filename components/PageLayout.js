import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AppMenu from './AppMenu';
import UserMenu from './UserMenu';
import { useLeague } from '../context/LeagueContext';

const PageLayout = ({ children }) => {
  const { currentLeague, loadingLeagues, leagueHomeContent, currentUserMembership, reloadCurrentUserMembership } = useLeague();
  const { user } = useAuth();
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reloadCurrentUserMembership();
    }, [reloadCurrentUserMembership])
  );

  if (loadingLeagues) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fb5b5a" />
      </View>
    );
  }

  const displayUserName = currentUserMembership?.displayName || user?.firstName;
  const displayIconUrl = currentUserMembership?.iconUrl;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.menuContainer}>
          <AppMenu />
        </View>
        <View style={styles.logoContainer}>
          {!!leagueHomeContent?.logoImageUrl && (
            <Image source={{ uri: leagueHomeContent.logoImageUrl }} style={styles.logo} resizeMode="contain" />
          )}
        </View>
        <View style={styles.userContainer}>
          {user && (
            <TouchableOpacity onPress={() => setUserMenuVisible(true)} style={styles.userNameContainer}>
              {displayIconUrl && (
                <Image source={{ uri: displayIconUrl }} style={styles.userIcon} />
              )}
              <Text style={styles.userName}>{displayUserName}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <UserMenu isVisible={userMenuVisible} onClose={() => setUserMenuVisible(false)} />
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
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 30,
    height: 30,
    borderRadius: 15, // Make it circular
    marginRight: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PageLayout;
