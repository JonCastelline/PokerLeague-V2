import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';

const StandingsPage = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { currentLeague } = useLeague();

  useEffect(() => {
    if (token && currentLeague) {
      console.log('Fetching standings for league ID:', currentLeague.id);
      fetch(`${API_BASE_URL}/api/leagues/${currentLeague.id}/standings`, {
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
  }, [token, currentLeague]);

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.rank}</Text>
      <Text style={styles.tableCell}>{item.playerName}</Text>
      <Text style={styles.tableCell}>{item.totalKills}</Text>
      <Text style={styles.tableCell}>{item.totalBounties}</Text>
      <Text style={styles.tableCell}>{item.totalPoints}</Text>
    </View>
  );

  if (loading) {
    return (
      <PageLayout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fb5b5a" />
          <Text>Loading Standings...</Text>
        </View>
      </PageLayout>
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

  if (standings.length === 0) {
    return (
      <PageLayout>
        <View style={styles.centered}>
          <Text>No standings data available for this league and season.</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <View style={styles.contentContainer}> {/* New container for content */}
        <Text style={styles.title}>Standings</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Rank</Text>
          <Text style={styles.headerCell}>Player</Text>
          <Text style={styles.headerCell}>Kills</Text>
          <Text style={styles.headerCell}>Bounty</Text>
          <Text style={styles.headerCell}>Points</Text>
        </View>
        <FlatList
          data={standings}
          keyExtractor={item => item.playerId.toString()}
          renderItem={renderItem}
          style={styles.table}
        />
      </View>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    padding: 20, // Add padding here
    alignItems: 'center', // Add this to center children horizontally
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fb5b5a',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  noStandingsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default StandingsPage;