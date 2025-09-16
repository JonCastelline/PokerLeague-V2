import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';

const CreateLeaguePage = () => {
  const [leagueName, setLeagueName] = useState('');
  const router = useRouter();
  const { api } = useAuth();
  const { reloadLeagues } = useLeague();

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a name for your league.'
      });
      return;
    }
    try {
      const data = await api(apiActions.createLeague, leagueName);
      await reloadLeagues();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `League "${data.leagueName}" created!`
      });
      router.replace('/(app)/home');
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    }
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
    width: '40%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateLeaguePage;
