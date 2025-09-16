import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

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
      Toast.show({ type: 'success', text1: 'Success', text2: 'You have successfully claimed the profile and joined the league!' });
      fetchInvites(); // Refresh invites list
      reloadLeagues(); // Refresh leagues list
    } catch (error) {
      console.error('Accept invite error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    }
  };

  const handleJoinLeague = async () => {
    if (!inviteCode.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter an invite code.' });
      return;
    }
    try {
      const data = await api(apiActions.joinLeague, inviteCode);
      reloadLeagues();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `You have joined the league "${data.leagueName}"!`
      });
      router.replace('/(app)/home');
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
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
    <View style={{ flex: 1 }}>
      <PageLayout noScroll>
        <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>Join a League</Text>

          <View style={styles.sectionContainer}>
            <Text style={styles.subtitle}>Your Invitations</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#fb5b5a" />
            ) : invites.length > 0 ? (
              <FlatList
                scrollEnabled={false}
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
        </KeyboardAwareScrollView>
      </PageLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
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
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 10,
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
