import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';

const JoinLeaguePage = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();
  const { reloadLeagues } = useLeague();
  const router = useRouter();

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(apiActions.getMyInvites);
      setInvites(data || []);
    } catch (error) {
      console.error("Failed to fetch invites:", error);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      fetchInvites();
    }, [fetchInvites])
  );

  const handleAcceptInvite = async (inviteId) => {
    try {
      await api(apiActions.acceptInvite, inviteId);
      Alert.alert('Success', 'You have successfully claimed the profile and joined the league!');
      fetchInvites(); // Refresh invites list
      reloadLeagues(); // Refresh leagues list
    } catch (error) {
      console.error('Accept invite error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code.');
      return;
    }
    try {
      const data = await api(apiActions.joinLeague, inviteCode);
      reloadLeagues();
      Alert.alert('Success', `You have joined the league "${data.leagueName}"!`, [
        { text: 'OK', onPress: () => router.replace('/(app)/home') },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    }
  };

  const renderInviteItem = ({ item }) => (
    <View style={styles.inviteItemContainer}>
      <View style={{ flex: 1 }}>
        <Text style={styles.inviteLeagueName}>{item.leagueName}</Text>
        <Text style={styles.inviteClaimText}>Claim profile: {item.displayNameToClaim}</Text>
      </View>
      <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptInvite(item.inviteId)}>
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <PageLayout noScroll>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Join a League</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.subtitle}>Your Invitations</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#fb5b5a" />
          ) : invites.length > 0 ? (
            <FlatList
              data={invites}
              renderItem={renderInviteItem}
              keyExtractor={(item) => item.inviteId.toString()}
              style={{ width: '100%' }}
            />
          ) : (
            <Text style={styles.noInvitesText}>You have no pending invitations.</Text>
          )}
        </View>

        <View style={styles.separator} />

        <View style={styles.sectionContainer}>
          <Text style={styles.subtitle}>Join with Code</Text>
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
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionContainer: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
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
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
    width: '90%',
  },
  noInvitesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  inviteItemContainer: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  inviteLeagueName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inviteClaimText: {
    fontSize: 14,
    color: '#333',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default JoinLeaguePage;
