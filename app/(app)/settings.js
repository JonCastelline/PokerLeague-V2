import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import PageLayout from '../../components/PageLayout';
import AddUnregisteredPlayerForm from '../../components/AddUnregisteredPlayerForm';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';

const SettingsPage = () => {
  const { token } = useAuth();
  const { selectedLeagueId, currentUserMembership } = useLeague();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeagueMembers = async () => {
    if (!selectedLeagueId || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMembers(data);
    } catch (e) {
      console.error("Failed to fetch league members:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeagueMembers();
  }, [selectedLeagueId, token]);

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <Text style={styles.memberName}>{item.playerName}</Text>
      <Text style={styles.memberRole}>{item.role} {item.isOwner ? '(Owner)' : ''}</Text>
      {item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
      {!item.playerAccountId && <Text style={styles.unregisteredTag}> (Unregistered)</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fb5b5a" />
        <Text>Loading League Settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </PageLayout>
    );
  }

  const isAdmin = currentUserMembership?.role === 'Admin' || currentUserMembership?.isOwner;

  return (
    <PageLayout>
      <Text style={styles.title}>League Settings</Text>

      <Text style={styles.subtitle}>League Members</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMemberItem}
        style={styles.memberList}
      />

      {isAdmin && (
        <AddUnregisteredPlayerForm leagueId={selectedLeagueId} onPlayerAdded={fetchLeagueMembers} />
      )}
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  memberList: {
    width: '100%',
  },
  memberItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    fontSize: 14,
    color: 'gray',
  },
  memberEmail: {
    fontSize: 14,
    color: '#007bff',
  },
  unregisteredTag: {
    fontSize: 12,
    color: 'red',
    fontWeight: 'bold',
  },
  menuContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    zIndex: 1, // Ensure it's above other content
  },
});

export default SettingsPage;