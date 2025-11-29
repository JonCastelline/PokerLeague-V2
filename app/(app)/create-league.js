import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';

const CreateLeaguePage = () => {
  const [leagueName, setLeagueName] = useState('');
  const router = useRouter();
  const { api } = useAuth();
  const { reloadLeagues, switchLeague } = useLeague();

  // Get themed colors
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background'); // For input background
  const borderColor = useThemeColor({}, 'icon'); // For input border or general border color
  const buttonBgColor = useThemeColor({}, 'tint'); // For button background
  const buttonTextColor = useThemeColor({}, 'background'); // For button text color

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
      await switchLeague(data.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `League "${data.leagueName}" created!`
      });
      router.replace({ pathname: '/(app)/home', params: { leagueId: data.id } });
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
      <View style={[styles.contentContainer, { backgroundColor: backgroundColor }]}>
        <Text style={[styles.title, { color: textColor }]}>Create a New League</Text>
        <TextInput
          style={[styles.input, { backgroundColor: backgroundColor, borderColor: borderColor, color: textColor }]}
          placeholder="League Name"
          placeholderTextColor={borderColor} // Using border color for placeholder, can be changed
          value={leagueName}
          onChangeText={setLeagueName}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: buttonBgColor }]} onPress={handleCreateLeague}>
          <Text style={[styles.buttonText, { color: buttonTextColor }]}>Create League</Text>
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
    borderRadius: 25,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  button: {
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateLeaguePage;
