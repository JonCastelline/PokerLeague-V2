import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import axios from 'axios';
import { API_BASE_URL } from '../../src/config';

const SettingsScreen = () => {
  const { user, updateAuthUser, isLoading, token, signOut } = useAuth();
  const { selectedLeagueId, reloadLeagues } = useLeague();
  const router = useRouter();

  // Account Settings State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Player Settings State
  const [displayName, setDisplayName] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Populate account settings from auth context
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
    }

    // Fetch league-specific player settings
    const fetchPlayerSettings = async () => {
      if (!selectedLeagueId || !user || isLoading) return;
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/leagues/${selectedLeagueId}/members/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDisplayName(response.data.displayName || '');
        setIconUrl(response.data.iconUrl || '');
      } catch (error) {
        console.error('Error fetching player settings:', error);
        Alert.alert('Error', 'Failed to fetch player settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerSettings();
  }, [user, selectedLeagueId, isLoading]);

  const handleUpdateAccount = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const oldEmail = user.email; // Store old email
      const response = await axios.put(
        `${API_BASE_URL}/api/player-accounts/me`,
        { firstName, lastName, email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (oldEmail === email) { // Email did NOT change
        updateAuthUser(response.data);
        Alert.alert('Success', 'Account details updated successfully!');
      } else { // Email DID change
        Alert.alert(
          'Email Changed',
          'Your email address has been updated. You will be logged out to re-authenticate with your new email.'
        );
        await signOut();
        router.replace('/(auth)');
      }
    } catch (error) {
      console.error('Error updating account details:', error);
      Alert.alert('Error', 'Failed to update account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !token) return;
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/player-accounts/me/password`,
        { currentPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayerSettings = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/leagues/${selectedLeagueId}/members/me`,
        { displayName, iconUrl },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      reloadLeagues(); // Re-fetch leagues to update any displayed player names
      Alert.alert('Success', 'Player settings updated successfully!');
    } catch (error) {
      console.error('Error updating player settings:', error);
      Alert.alert('Error', 'Failed to update player settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Settings</Text>

      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        <Text style={styles.label}>First Name:</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

        <Text style={styles.label}>Last Name:</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

        <Text style={styles.label}>Email:</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <TouchableOpacity style={styles.button} onPress={handleUpdateAccount} disabled={loading}>
          <Text style={styles.buttonText}>Update Account Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Text style={styles.label}>Current Password:</Text>
        <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />

        <Text style={styles.label}>New Password:</Text>
        <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry />

        <Text style={styles.label}>Confirm New Password:</Text>
        <TextInput style={styles.input} value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.buttonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Player Settings (Current League)</Text>
        <Text style={styles.label}>Display Name:</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

        <Text style={styles.label}>Icon URL:</Text>
        <TextInput style={styles.input} value={iconUrl} onChangeText={setIconUrl} keyboardType="url" autoCapitalize="none" />

        <TouchableOpacity style={styles.button} onPress={handleUpdatePlayerSettings} disabled={loading}>
          <Text style={styles.buttonText}>Update Player Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#fb5b5a',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    fontSize: 16,
  },
  loadingIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
});

export default SettingsScreen;