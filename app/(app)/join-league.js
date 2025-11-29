import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useThemeColor } from '../../hooks/useThemeColor';

const JoinLeaguePage = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api, signIn, user } = useAuth();
  const { reloadLeagues, switchLeague, reloadHomeContent } = useLeague();
  const router = useRouter();

  // Themed colors
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const buttonBgColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({}, 'background');
  const mutedTextColor = useThemeColor({}, 'icon');
  const activityIndicatorColor = useThemeColor({}, 'tint');
  const acceptButtonBgColor = useThemeColor({ light: '#28a745', dark: '#218838' }, 'background');
  const inviteItemBgColor = useThemeColor({ light: '#f0f0f0', dark: '#1c1c1e' }, 'background');

  const styles = useMemo(() => StyleSheet.create({
    contentContainer: {
        alignItems: 'center',
        padding: 20,
        width: '100%',
        backgroundColor: backgroundColor,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: textColor,
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
        color: textColor,
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 25,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        textAlign: 'center',
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        color: textColor,
    },
    button: {
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 10,
        backgroundColor: buttonBgColor,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: buttonTextColor,
    },
    separator: {
        height: 1,
        marginVertical: 20,
        width: '90%',
        backgroundColor: borderColor,
    },
    noInvitesText: {
        textAlign: 'center',
        fontStyle: 'italic',
        color: mutedTextColor,
    },
    inviteItemContainer: {
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
        backgroundColor: inviteItemBgColor,
    },
    inviteLeagueName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: textColor,
    },
    inviteClaimText: {
        fontSize: 14,
        color: mutedTextColor,
    },
    acceptButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        marginLeft: 10,
        backgroundColor: acceptButtonBgColor,
    },
    acceptButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
  }), [textColor, backgroundColor, borderColor, buttonBgColor, buttonTextColor, mutedTextColor, activityIndicatorColor, acceptButtonBgColor, inviteItemBgColor]);


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
      const response = await api(apiActions.acceptInvite, inviteId);
      const newLeagueId = response;
      Toast.show({ type: 'success', text1: 'Success', text2: 'You have successfully joined the league!' });
      await fetchInvites(); // Refresh invites list
      await reloadLeagues(); // Refresh leagues list
      await switchLeague(newLeagueId);
      router.replace({ pathname: '/(app)/home', params: { leagueId: newLeagueId } });
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
      await reloadLeagues();
      await switchLeague(data.id);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `You have joined the league "${data.leagueName}"!`
      });
      router.replace({ pathname: '/(app)/home', params: { leagueId: data.id } });
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    }
  };

  const InviteItem = ({ item }) => (
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
    <View style={{ flex: 1, backgroundColor: backgroundColor }}>
      <PageLayout noScroll>
        <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.title}>Join a League</Text>

          <View style={styles.sectionContainer}>
            <Text style={styles.subtitle}>Your Invitations</Text>
            {loading ? (
              <ActivityIndicator size="large" color={activityIndicatorColor} />
            ) : invites.length > 0 ? (
              <FlatList
                scrollEnabled={false}
                data={invites}
                renderItem={({ item }) => <InviteItem item={item} />}
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
              placeholderTextColor={mutedTextColor}
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

export default JoinLeaguePage;
