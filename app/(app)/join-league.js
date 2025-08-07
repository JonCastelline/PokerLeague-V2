import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';
import PageLayout from '../../components/PageLayout';

const JoinLeaguePage = () => {
  const [inviteCode, setInviteCode] = useState('');
  const router = useRouter();
  const { token } = useAuth();
  const { reloadLeagues } = useLeague();

  const handleJoinLeague = () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }
    fetch(`${API_BASE_URL}/api/leagues/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        inviteCode: inviteCode,
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(text || 'Failed to join league. An unknown error occurred.');
          });
        }
        return response.json();
      })
      .then(data => {
        reloadLeagues(); // Reload leagues after successful join
        Alert.alert('Success', `You have joined the league "${data.leagueName}"!`, [
          { text: 'OK', onPress: () => router.replace('/(app)/home') },
        ]);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Error', error.message);
      });
  };

  return (
    <PageLayout>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Join a League</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Invite Code"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.button} onPress={handleJoinLeague}>
          <Text style={styles.buttonText}>Join League</Text>
        </TouchableOpacity>
      </View>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#fb5b5a',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default JoinLeaguePage;
