import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_BASE_URL } from '../src/config';
import { useAuth } from '../context/AuthContext';

const AddUnregisteredPlayerForm = ({ leagueId, onPlayerAdded }) => {
  const [playerName, setPlayerName] = useState('');
  const { token } = useAuth();

  const handleAddPlayer = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Player name cannot be empty.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${leagueId}/members/unregistered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: playerName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add unregistered player.');
      }

      const newMember = await response.json();
      Alert.alert('Success', `Player ${newMember.displayName} added successfully!`);
      setPlayerName('');
      onPlayerAdded(); // Notify parent component to refresh list
    } catch (error) {
      console.error('Error adding unregistered player:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Unregistered Player</Text>
      <TextInput
        style={styles.input}
        placeholder="Player Name"
        value={playerName}
        onChangeText={setPlayerName}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddPlayer}>
        <Text style={styles.buttonText}>Add Player</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: 225,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'center', // Center the button if it's not full width
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddUnregisteredPlayerForm;
