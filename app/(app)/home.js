import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '../../src/config';

const HomePage = () => {
  const router = useRouter();
  const { token, signOut } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/leagues`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          setLeagues(data);
          if (data.length > 0) {
            setSelectedLeagueId(data[0].id);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error(error);
          setLoading(false);
        });
    }
  }, [token]);

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

  if (loading) {
    return <ActivityIndicator size="large" color="#fb5b5a" />;
  }

  if (leagues.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to your league!</Text>

        {leagues.length > 1 && (
          <Picker
            selectedValue={selectedLeagueId}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedLeagueId(itemValue)}
          >
            {leagues.map(league => (
              <Picker.Item key={league.id} label={league.leagueName} value={league.id} />
            ))}
          </Picker>
        )}

        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/play', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/standings', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>Standings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/history', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push({ pathname: '/settings', params: { leagueId: selectedLeagueId } })}>
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
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
