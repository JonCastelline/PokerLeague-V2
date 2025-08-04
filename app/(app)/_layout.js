
import { Stack } from 'expo-router';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { LeagueProvider, useLeague } from '../../context/LeagueContext';

const AppHeader = () => {
  const { leagueHomeContent, loadingContent } = useLeague();

  return (
    <View style={styles.headerContainer}>
      {loadingContent ? (
        <ActivityIndicator color="#fff" />
      ) : (
        leagueHomeContent && leagueHomeContent.logoImageUrl && (
          <Image
            source={{ uri: leagueHomeContent.logoImageUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        )
      )}
    </View>
  );
};

function AppLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <AppHeader />,
      }}
    >
      <Stack.Screen name="home" options={{ title: 'Home' }} />
      <Stack.Screen name="play" options={{ title: 'Play' }} />
      <Stack.Screen name="standings" options={{ title: 'Standings' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="create-league" options={{ title: 'Create League' }} />
      <Stack.Screen name="join-league" options={{ title: 'Join League' }} />
    </Stack>
  );
}

export default function AppLayoutWrapper() {
  return (
    <LeagueProvider>
      <AppLayout />
    </LeagueProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fb5b5a', // Example background color
    paddingTop: 50, // Adjust for status bar height
    paddingBottom: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 50, // Adjust as needed
  },
});
