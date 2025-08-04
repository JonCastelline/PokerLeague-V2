import React from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useLeague } from '../context/LeagueContext';

const PageWrapper = ({ children }) => {
  const { leagueHomeContent, loadingContent } = useLeague();

  return (
    <View style={styles.container}>
      {loadingContent ? (
        <ActivityIndicator style={styles.logoLoading} size="small" color="#fb5b5a" />
      ) : (
        leagueHomeContent && leagueHomeContent.logoImageUrl && (
          <Image
            source={{ uri: leagueHomeContent.logoImageUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        )
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 40, // Adjust as needed for spacing below header
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  logoLoading: {
    height: 150, // Maintain space while loading
    marginBottom: 20,
  },
});

export default PageWrapper;
