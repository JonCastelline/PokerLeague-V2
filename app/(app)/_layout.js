
import { Stack } from 'expo-router';
import { LeagueProvider } from '../../context/LeagueContext';

function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ title: 'Home' }} />
      <Stack.Screen name="play" options={{ title: 'Play' }} />
      <Stack.Screen name="standings" options={{ title: 'Standings' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="gameDetails" options={{ title: 'Game Details' }} />
      <Stack.Screen name="season-settings" options={{ title: 'Season' }} />
      <Stack.Screen name="league-settings" options={{ title: 'League' }} />
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
