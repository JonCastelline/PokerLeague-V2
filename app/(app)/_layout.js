
import { Stack } from 'expo-router';
import { LeagueProvider } from '../../context/LeagueContext';

function AppLayout() {
  return (
    <Stack>
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
