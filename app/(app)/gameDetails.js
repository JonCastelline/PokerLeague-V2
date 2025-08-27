import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { getGameResults } from '../../src/api';

const GameDetailsPage = () => {
  const { gameId } = useLocalSearchParams();
  const { api } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (gameId) {
      setLoading(true);
      setError(null);
      api(getGameResults, gameId)
        .then(data => {
          const sortedData = data.sort((a, b) => a.place - b.place);
          setResults(sortedData);
        })
        .catch(err => {
          console.error("Failed to fetch game details:", err);
          setError("Failed to load game details. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [gameId, api]);

  const renderResult = ({ item }) => (
    <View style={styles.resultItem}>
      <Text style={styles.place}>{item.place}</Text>
      <View style={styles.playerContainer}>
        <Image source={{ uri: item.player.iconUrl }} style={styles.playerIcon} />
        <Text style={styles.playerName}>{item.player.displayName}</Text>
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.stat}>Kills: {item.kills}</Text>
        <Text style={styles.stat}>Bounties: {item.bounties}</Text>
      </View>
    </View>
  );

  const ListHeader = () => (
    <>
        <Text style={styles.title}>Game Results</Text>
        <View style={styles.header}>
            <Text style={[styles.headerText, styles.placeHeader]}>Place</Text>
            <Text style={[styles.headerText, styles.playerHeader]}>Player</Text>
            <Text style={[styles.headerText, styles.statsHeader]}>Stats</Text>
        </View>
    </>
  );

  if (loading) {
    return <PageLayout><ActivityIndicator size="large" color="#0000ff" /></PageLayout>;
  }

  if (error) {
      return <PageLayout><Text style={styles.errorText}>{error}</Text></PageLayout>;
  }

  return (
    <PageLayout noScroll>
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.container}
      />
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#eef',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeHeader: {
    flex: 1,
  },
  playerHeader: {
    flex: 3,
  },
  statsHeader: {
    flex: 2,
    textAlign: 'right',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  place: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  playerContainer: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  playerName: {
    fontSize: 18,
  },
  statsContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  stat: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default GameDetailsPage;
