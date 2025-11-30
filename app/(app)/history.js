import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import SafePicker from '../../components/SafePicker';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { getGameHistory, getSeasons } from '../../src/api';
import * as apiActions from '../../src/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const HistoryPage = () => {
  const { api, token } = useAuth();
  const { currentLeague, activeSeason } = useLeague();
  const router = useRouter();

  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchGames = useCallback(async (seasonId) => {
    if (!seasonId) {
      setGames([]);
      return;
    }
    setIsLoading(true);
    setGames([]);
    setError(null);
    try {
      const data = await api(getGameHistory, seasonId);
      const completedGames = data
        .filter(game => game.gameStatus === 'COMPLETED')
        .sort((a, b) => new Date(a.gameDateTime) - new Date(b.gameDateTime));
      setGames(completedGames);
    } catch (err) {
      console.error("Failed to fetch game history:", err);
      setError("Failed to load game history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const isInitialMount = useRef(true);

  useFocusEffect(
    useCallback(() => {
      isInitialMount.current = true; // Reset on focus
      const loadInitialData = async () => {
        if (currentLeague?.id) {
          setIsLoading(true);
          setError(null);
          try {
            const seasonsData = await api(getSeasons, currentLeague.id);
            const nonCasualSeasons = seasonsData.filter(s => !s.isCasual);
            const sortedData = [...nonCasualSeasons].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            setSeasons(sortedData);

            if (sortedData.length > 0) {
              const today = new Date();
              today.setHours(0, 0, 0, 0); // Normalize today to start of day

              let initialSeason = null;

              // 1. Find a season that is currently active
              const activeSeasons = sortedData.filter(s => {
                const startDate = new Date(s.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(s.endDate);
                endDate.setHours(23, 59, 59, 999); // Normalize endDate to end of day
                return today >= startDate && today <= endDate;
              });

              if (activeSeasons.length > 0) {
                // If multiple active seasons, pick the one with the most recent end date
                initialSeason = activeSeasons.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
              }

              // 3. If no active season found, find the most recently ended season
              if (!initialSeason) {
                const endedSeasons = sortedData.filter(s => {
                  const endDate = new Date(s.endDate);
                  endDate.setHours(23, 59, 59, 999);
                  return endDate < today;
                });

                if (endedSeasons.length > 0) {
                  // Pick the one with the most recent end date
                  initialSeason = endedSeasons.sort((a, b) => new Date(b.endDate) - new Date(a.endDate))[0];
                }
              }

              // 4. If still no initial season, default to the first in the sorted list
              if (!initialSeason && sortedData.length > 0) {
                initialSeason = sortedData[0];
              }

              if (initialSeason) {
                setSelectedSeasonId(initialSeason.id);
                await fetchGames(initialSeason.id);
              } else {
                setSelectedSeasonId(null);
                setGames([]);
                setIsLoading(false);
              }
            } else {
                setSelectedSeasonId(null);
                setGames([]);
                setIsLoading(false);
            }
          } catch (err) {
            console.error("Failed to fetch seasons:", err);
            setError("Failed to load seasons.");
            setIsLoading(false);
          }
        }
      };

      loadInitialData();
    }, [currentLeague?.id, api, fetchGames])
  );

  useEffect(() => {
    // This effect runs only when the user manually changes the season in the picker
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else if (selectedSeasonId) {
      fetchGames(selectedSeasonId);
    }
  }, [selectedSeasonId, fetchGames]);

  const handleExportCsv = async () => {
    if (!selectedSeasonId || !currentLeague) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a season first.',
      });
      return;
    }

    setExporting(true);
    try {
      const selectedSeason = seasons.find(s => s.id == selectedSeasonId);
      const leagueName = currentLeague ? currentLeague.leagueName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'league';
      const seasonName = selectedSeason ? selectedSeason.seasonName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `season_${selectedSeasonId}`;
      const filename = `game-history-${leagueName}-${seasonName}.csv`;

      const csvData = await api(apiActions.exportGameHistoryCsv, selectedSeasonId, token);
      const fileUri = FileSystem.cacheDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, csvData, { encoding: 'utf8' });

      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Sharing is not available on this device.',
        });
        return;
      }

      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values' });

    } catch (e) {
      console.error("Failed to export CSV:", e);
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: e.message || 'An unknown error occurred during export.',
      });
    } finally {
      setExporting(false);
    }
  };

  const renderGame = useCallback(({ item }) => (
    <TouchableOpacity style={styles.gameItem} onPress={() => router.push({ pathname: '/(app)/gameDetails', params: { gameId: item.id } })}>
      <Text style={styles.gameName}>{item.gameName}</Text>
      <Text style={styles.gameDate}>{new Date(item.gameDateTime).toLocaleDateString()}</Text>
    </TouchableOpacity>
  ), [router]);

  const ListHeader = useCallback(() => (
    <>
        <Text style={styles.title}>Game History</Text>
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
        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
    </>
  ), [selectedSeasonId, seasons, isLoading]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
        { !isLoading && <Text style={styles.emptyText}>No completed games found for this season.</Text> }
    </View>
  ), [isLoading]);

  const renderListFooter = () => {
    if (games.length === 0) {
      return null;
    }
    return (
      <View style={styles.footerContainer}>
        <TouchableOpacity
          onPress={handleExportCsv}
          style={styles.exportButton}
          disabled={exporting || isLoading}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="download-outline" size={24} color="#fff" />
          )}
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (error && !games.length) {
      return <PageLayout><Text style={styles.errorText}>{error}</Text></PageLayout>;
  }

  if (!seasons.length && !isLoading) {
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
            ListFooterComponent={renderListFooter}
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
  picker: {
    width: '100%',
    color: 'black',
    marginBottom: 10,
  },
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 16,
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