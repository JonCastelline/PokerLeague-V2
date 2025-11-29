import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import * as apiActions from '../src/api';
import { useAuth } from '../context/AuthContext';
import HelpIcon from './HelpIcon';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const AddUnregisteredPlayerForm = ({ leagueId, onPlayerAdded }) => {
  const [playerName, setPlayerName] = useState('');
  const { api } = useAuth();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const inputBorderColor = useThemeColor({ light: '#ccc', dark: '#555' }, 'background');
  const inputBackgroundColor = useThemeColor({}, 'cardBackground');
  const successButtonColor = useThemeColor({ light: '#4CAF50', dark: '#66bb6a' }, 'background');

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

  const styles = React.useMemo(() => StyleSheet.create({
      container: {
        width: '100%',
        padding: 15,
        backgroundColor: backgroundColor,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: 'center',
      },
      title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: textColor,
      },
      input: {
        width: 225,
        height: 40,
        borderColor: inputBorderColor,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: inputBackgroundColor,
        color: textColor,
      },
      button: {
        backgroundColor: successButtonColor,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        alignSelf: 'center',
      },
      buttonText: {
        color: 'white', // Assuming button text is always white for contrast
        fontWeight: 'bold',
      },
    }), [backgroundColor, textColor, inputBorderColor, inputBackgroundColor, successButtonColor]);
export default AddUnregisteredPlayerForm;
