import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import SafePicker from '../../components/SafePicker';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { getGameHistory, getSeasons } from '../../src/api';

const HistoryPage = () => {
  const { authData, api } = useAuth();
  const { currentLeague, activeSeason } = useLeague();
  const router = useRouter();

  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [games, setGames] = useState([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentLeague?.id) {
      setLoadingSeasons(true);
      setError(null);
      api(getSeasons, currentLeague.id)
        .then(data => {
          const nonCasualSeasons = data.filter(s => !s.isCasual);
          const sortedData = [...nonCasualSeasons].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
          setSeasons(sortedData);
          if (sortedData.length > 0) {
            const activeSeasonInList = sortedData.find(s => s.id === activeSeason?.id);
            setSelectedSeasonId(activeSeasonInList ? activeSeason.id : sortedData[0].id);
          } else {
            setSelectedSeasonId(null); // No non-casual seasons available
            setLoadingSeasons(false);
          }
        })
        .catch(err => {
          console.error("Failed to fetch seasons:", err);
          setError("Failed to load seasons.");
          setLoadingSeasons(false);
        });
    }
  }, [currentLeague?.id, activeSeason?.id, api]);

  useEffect(() => {
    if (selectedSeasonId) {
      setLoadingGames(true);
      setGames([]); // Clear previous games
      setError(null);
      api(getGameHistory, selectedSeasonId)
        .then(data => {
          const completedGames = data
            .filter(game => game.gameStatus === 'COMPLETED')
            .sort((a, b) => new Date(a.gameDateTime) - new Date(b.gameDateTime));
          setGames(completedGames);
        })
        .catch(err => {
          console.error("Failed to fetch game history:", err);
          setError("Failed to load game history. Please try again.");
        })
        .finally(() => {
          setLoadingGames(false);
          setLoadingSeasons(false); // Stop season loading indicator once games are loaded/failed
        });
    }
  }, [selectedSeasonId, api]);

  const renderGame = ({ item }) => (
    <TouchableOpacity style={styles.gameItem} onPress={() => router.push({ pathname: '/(app)/gameDetails', params: { gameId: item.id } })}>
      <Text style={styles.gameName}>{item.gameName}</Text>
      <Text style={styles.gameDate}>{new Date(item.gameDateTime).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <>
        <Text style={styles.title}>Game History</Text>
        <View style={styles.pickerContainer}>
            <SafePicker
                selectedValue={selectedSeasonId}
                onValueChange={(itemValue) => setSelectedSeasonId(itemValue)}
                style={styles.picker}
                mode="dialog"
                dropdownIconColor="black"
            >
                {seasons.map(s => (
                    <SafePicker.Item key={s.id} label={s.seasonName} value={s.id}/>
                ))}
            </SafePicker>
        </View>
        {loadingGames && <ActivityIndicator size="large" color="#0000ff" />}
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
        { !loadingGames && <Text style={styles.emptyText}>No completed games found for this season.</Text> }
    </View>
  );

  if (loadingSeasons) {
    return <PageLayout><ActivityIndicator size="large" color="#0000ff" /></PageLayout>;
  }

  if (error) {
      return <PageLayout><Text style={styles.errorText}>{error}</Text></PageLayout>;
  }

  if (seasons.length === 0) {
      return <PageLayout><Text style={styles.emptyText}>No seasons found for this league.</Text></PageLayout>;
  }

  return (
    <PageLayout noScroll>
        <FlatList
            data={games}
            renderItem={renderGame}
            keyExtractor={item => item.id.toString()}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            contentContainerStyle={styles.listContentContainer}
            style={styles.container}
        />
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  listContentContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20, // Add some padding at the bottom
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    color: 'black',
  },
  picker: {
    width: '100%',
    color: 'black',
  },
  gameItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default HistoryPage;

