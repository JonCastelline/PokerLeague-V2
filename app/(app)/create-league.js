import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';
import PageLayout from '../../components/PageLayout';

const CreateLeaguePage = () => {
  const [leagueName, setLeagueName] = useState('');
  const router = useRouter();
  const { token } = useAuth();
  const { reloadLeagues } = useLeague();

  const handleCreateLeague = () => {
    if (!leagueName.trim()) {
      Alert.alert('Error', 'Please enter a name for your league.');
      return;
    }
    fetch(`${API_BASE_URL}/api/leagues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        leagueName: leagueName,
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              const errorData = JSON.parse(text);
              throw new Error(errorData.message || 'Failed to create league.');
            } catch (e) {
              throw new Error(text || 'Failed to create league. An unknown error occurred.');
            }
          });
        }
        return response.json();
      })
      .then(async (data) => {
        await reloadLeagues();
        Alert.alert('Success', `League "${data.leagueName}" created!`, [
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
        <Text style={styles.title}>Create a New League</Text>
        <TextInput
          style={styles.input}
          placeholder="League Name"
          value={leagueName}
          onChangeText={setLeagueName}
        />
        <TouchableOpacity style={styles.button} onPress={handleCreateLeague}>
          <Text style={styles.buttonText}>Create League</Text>
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

export default CreateLeaguePage;
