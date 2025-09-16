import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import * as apiActions from '../src/api';
import { useAuth } from '../context/AuthContext';
import HelpIcon from './HelpIcon';

const AddUnregisteredPlayerForm = ({ leagueId, onPlayerAdded }) => {
  const [playerName, setPlayerName] = useState('');
  const { api } = useAuth();

  const handleAddPlayer = async () => {
    if (!playerName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Player name cannot be empty.'
      });
      return;
    }

    try {
      const newMember = await api(apiActions.addUnregisteredPlayer, leagueId, playerName);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Player ${newMember.displayName} added successfully!`
      });
      setPlayerName('');
      onPlayerAdded(); // Notify parent component to refresh list
    } catch (error) {
      console.error('Error adding unregistered player:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Text style={styles.title}>Add Unregistered Player</Text>
        <HelpIcon topicKey="ADD_UNREGISTERED_PLAYER" />
      </View>
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
