import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import PageWrapper from '../../components/PageWrapper';

const StandingsPage = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { leagueId } = useLocalSearchParams();

  useEffect(() => {
    if (token && leagueId) {
      fetch(`http://192.168.4.21:8080/api/leagues/${leagueId}/standings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Assuming data is already sorted and contains all necessary fields
          setStandings(data);
          setLoading(false);
        })
        .catch(e => {
          console.error("Failed to fetch standings:", e);
          setError(e.message);
          setLoading(false);
        });
    }
  }, [token, leagueId]);

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.playerName}</Text>
      <Text style={styles.tableCell}>{item.kills}</Text>
      <Text style={styles.tableCell}>{item.bounties}</Text>
      <Text style={styles.tableCell}>{item.points}</Text>
      <Text style={styles.tableCell}>{item.overallScore}</Text>
    </View>
  );

  if (loading) {
    return (
      <PageWrapper>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fb5b5a" />
          <Text>Loading Standings...</Text>
        </View>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </PageWrapper>
    );
  }

  if (standings.length === 0) {
    return (
      <PageWrapper>
        <View style={styles.centered}>
          <Text>No standings data available for this league and season.</Text>
        </View>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <View style={styles.contentContainer}> {/* New container for content */}
        <Text style={styles.title}>Standings</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Player</Text>
          <Text style={styles.headerCell}>Kills</Text>
          <Text style={styles.headerCell}>Bounty</Text>
          <Text style={styles.headerCell}>Points</Text>
          <Text style={styles.headerCell}>Overall</Text>
        </View>
        <FlatList
          data={standings}
          keyExtractor={item => item.playerId.toString()}
          renderItem={renderItem}
          style={styles.table}
        />
      </View>
    </PageWrapper>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#555',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});

export default StandingsPage;