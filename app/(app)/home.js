import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { Picker } from '@react-native-picker/picker';
import PageLayout from '../../components/PageLayout';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';

const HomePage = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const { 
    leagues, 
    loadingLeagues, 
    selectedLeagueId, 
    switchLeague, 
    currentLeague,
    currentUserMembership,
    refreshInviteCode,
    leagueHomeContent,
    inviteCode,
    reloadLeagues
  } = useLeague();

  const handleCreateLeague = () => {
    router.push('/(app)/create-league');
  };

  const handleJoinLeague = () => {
    router.push('/(app)/join-league');
  };

  if (loadingLeagues) {
    return <ActivityIndicator size="large" color="#fb5b5a" />;
  }

  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

  if (leagues && leagues.length > 0) {
    return (
      <PageLayout>
        {leagueHomeContent && leagueHomeContent.content && (
          <View style={styles.contentContainer}>
            <Markdown style={markdownStyles}>{leagueHomeContent.content}</Markdown>
          </View>
        )}

        {isAdmin && (
          <View style={styles.inviteContainer}>
            {inviteCode && <Text style={styles.inviteCodeText}>{inviteCode} <TouchableOpacity style={[styles.button, styles.copyButton]} onPress={() => Clipboard.setString(inviteCode)}><Text style={styles.buttonText}>Copy</Text></TouchableOpacity></Text>}
            <TouchableOpacity style={styles.button} onPress={() => refreshInviteCode(selectedLeagueId)}>
              <Text style={styles.buttonText}>Generate Invite Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>You're not in any leagues yet.</Text>

      <TouchableOpacity style={styles.button} onPress={handleCreateLeague}>
        <Text style={styles.buttonText}>Create a League</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleJoinLeague}>
        <Text style={styles.buttonText}>Join a League</Text>
      </TouchableOpacity>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'gray',
    marginBottom: 40,
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
  
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 10,
  },
  inviteContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inviteCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  copyButton: {
    width: 60,
    height: 30,
    marginLeft: 10,
  },
  contentContainer: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
});

const markdownStyles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
  heading1: {
    textAlign: 'center',
  },
  heading2: {
    textAlign: 'center',
  },
  heading3: {
    textAlign: 'center',
  },
  heading4: {
    textAlign: 'center',
  },
  heading5: {
    textAlign: 'center',
  },
  heading6: {
    textAlign: 'center',
  },
});

export default HomePage;
