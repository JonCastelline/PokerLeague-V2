import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import axios from 'axios';
import { API_BASE_URL } from '../../src/config';
import * as apiActions from '../../src/api';
import HelpIcon from '../../components/HelpIcon';
import { useThemeColor } from '../../hooks/useThemeColor';
import Colors from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

const SettingsScreen = () => {
  const { user, updateAuthUser, isLoading, token, signOut, api } = useAuth();
  const { selectedLeagueId, reloadLeagues, reloadCurrentUserMembership, currentUserMembership } = useLeague();
  const router = useRouter();

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryButtonColor = useThemeColor({ light: colors.tint, dark: colors.tint }, 'background');
  const sectionBackgroundColor = useThemeColor({}, 'cardBackground');
  const sectionTitleColor = useThemeColor({ light: '#333', dark: '#ccc' }, 'background');
  const labelColor = useThemeColor({ light: '#555', dark: '#aaaaaa' }, 'background');
  const borderColor = useThemeColor({ light: '#ddd', dark: '#555' }, 'background');
  const noPreviewTextColor = useThemeColor({ light: '#888', dark: '#bbbbbb' }, 'background');
  const loadingOverlayColor = useThemeColor({ light: 'rgba(255, 255, 255, 0.7)', dark: 'rgba(0, 0, 0, 0.7)' }, 'background');
  const activityIndicatorColor = useThemeColor({ light: '#0000ff', dark: '#4285F4' }, 'background');
  const shadowColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');

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

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 60,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: textColor,
    },
    section: {
      backgroundColor: sectionBackgroundColor,
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
      shadowColor: shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: sectionTitleColor,
    },
    label: {
      fontSize: 16,
      marginBottom: 5,
      color: labelColor,
    },
    input: {
      borderWidth: 1,
      borderColor: borderColor,
      padding: 10,
      marginBottom: 15,
      borderRadius: 5,
      fontSize: 16,
      color: textColor,
      backgroundColor: backgroundColor,
    },
    button: {
      backgroundColor: primaryButtonColor,
      padding: 10,
      borderRadius: 25,
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 10,
    },
    buttonText: {
      color: 'white', // Assuming button text is always white for contrast
      fontWeight: 'bold',
      paddingHorizontal: 10,
      fontSize: 16,
    },
    iconPreview: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignSelf: 'center',
      marginBottom: 15,
      borderWidth: 1,
      borderColor: borderColor,
    },
    noPreviewText: {
      textAlign: 'center',
      color: noPreviewTextColor,
      marginBottom: 15,
    },
    loadingIndicator: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: loadingOverlayColor,
      zIndex: 1000,
    },
    leaveLeagueButton: {
      backgroundColor: Colors.light.red, // Directly use a red from Colors for specific actions
    },
  }), [backgroundColor, textColor, primaryButtonColor, sectionBackgroundColor, sectionTitleColor, labelColor, borderColor, noPreviewTextColor, loadingOverlayColor, activityIndicatorColor, shadowColor]);

  const handleUpdateAccount = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      const oldEmail = user.email; // Store old email
      const response = await api(apiActions.updatePlayerAccount, { firstName, lastName, email });

      if (oldEmail === email) { // Email did NOT change
        updateAuthUser(response);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Account details updated successfully!'
        });
      } else { // Email DID change
        Toast.show({
          type: 'info',
          text1: 'Email Changed',
          text2: 'Your email address has been updated. You will be logged out to re-authenticate with your new email.'
        });
        await signOut();
        router.replace('/(auth)');
      }
    } catch (error) {
      console.error('Error updating account details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update account details.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !token) return;
    if (newPassword !== confirmNewPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'New password and confirmation do not match.'
      });
      return;
    }
    setLoading(true);
    try {
      await api(apiActions.changePassword, { currentPassword, newPassword });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password changed successfully!'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to change password. Please check your current password.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlayerSettings = async () => {
    if (!user || !token) return;
    setLoading(true);
    try {
      await api(apiActions.updateLeagueMembershipSettings, selectedLeagueId, { displayName, iconUrl });
      reloadCurrentUserMembership(); // Re-fetch current user's membership to update displayed player name/icon
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Player settings updated successfully!'
      });
    } catch (error) {
      console.error('Error updating player settings:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update player settings.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveLeague = () => {
    if (!selectedLeagueId) return;

    Alert.alert(
      "Leave League",
      "Are you sure you want to leave this league?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          onPress: async () => {
            try {
              await api(apiActions.leaveLeague, selectedLeagueId);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'You have left the league.'
              });
              reloadLeagues(); // Reload the list of leagues
              router.replace('/(app)/home'); // Redirect to home, which will show create/join options if no other leagues
            } catch (e) {
              console.error(e);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: e.message
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Settings</Text>

      {loading && <ActivityIndicator size="large" color={activityIndicatorColor} style={styles.loadingIndicator} />}

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
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(app)/security-questions')}>
          <Text style={styles.buttonText}>Set Security Questions</Text>
        </TouchableOpacity>
      </View>

      {selectedLeagueId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Settings (Current League)</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.label}>Display Name:</Text>
            <HelpIcon topicKey="LEAGUE_DISPLAY_NAME" />
          </View>
          <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.label}>Icon URL:</Text>
            <HelpIcon topicKey="LEAGUE_ICON_URL" />
          </View>
          <TextInput style={styles.input} value={iconUrl} onChangeText={setIconUrl} keyboardType="url" autoCapitalize="none" />
          {iconUrl ? (
            <Image source={{ uri: iconUrl }} style={styles.iconPreview} />
          ) : (
            <Text style={styles.noPreviewText}>No icon URL provided</Text>
          )}

          <TouchableOpacity style={styles.button} onPress={handleUpdatePlayerSettings} disabled={loading}>
            <Text style={styles.buttonText}>Update Player Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedLeagueId && !currentUserMembership?.isOwner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave League</Text>
          <Text style={styles.leaveLeagueText}>If you leave this league, you will lose access to its games and standings.</Text>
          <TouchableOpacity style={[styles.button, styles.leaveLeagueButton]} onPress={handleLeaveLeague} disabled={loading}>
            <Text style={styles.buttonText}>Leave League</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAwareScrollView>
  );
};

export default SettingsScreen;
