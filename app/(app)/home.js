import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { Picker } from '@react-native-picker/picker';
import PageWrapper from '../../components/PageWrapper'; // Import PageWrapper

const HomePage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { 
    leagues, 
    loadingLeagues, 
    selectedLeagueId, 
    switchLeague, 
    currentLeague 
  } = useLeague();

  const handleCreateLeague = () => {
    router.push('/(app)/create-league');
  };

  const handleJoinLeague = () => {
    router.push('/(app)/join-league');
  };

  const handleLogout = () => {
    signOut();
    router.replace('/(auth)');
  };

  if (loadingLeagues) {
    return <ActivityIndicator size="large" color="#fb5b5a" />;
  }

  if (leagues && leagues.length > 0) {
    return (
      <PageWrapper>
        {leagues.length > 1 ? (
          <Picker
            selectedValue={selectedLeagueId}
            style={styles.picker}
            onValueChange={(itemValue) => switchLeague(itemValue)}
          >
            {leagues.map(league => (
              <Picker.Item key={league.id} label={league.leagueName} value={league.id} />
            ))}
          </Picker>
        ) : (
          <Text style={styles.title}>{currentLeague?.leagueName}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/(app)/play', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/(app)/standings', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>Standings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/(app)/history', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/(app)/settings', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>You're not in any leagues yet.</Text>

      <TouchableOpacity style={styles.button} onPress={handleCreateLeague}>
        <Text style={styles.buttonText}>Create a League</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleJoinLeague}>
        <Text style={styles.buttonText}>Join a League</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 40,
  },
  picker: {
    height: 50,
    width: '80%',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fb5b5a',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    marginVertical: 10,
  },
  logoutButton: {
    backgroundColor: '#A9A9A9',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomePage;
