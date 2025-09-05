import React, { useState, useEffect, useCallback } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';

const StandingsPage = () => {
  const [standings, setStandings] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]); // New state for all seasons
  const [selectedSeasonId, setSelectedSeasonId] = useState(null); // New state for selected season
  const [seasonSettings, setSeasonSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();
  const { currentLeague } = useLeague();

  useEffect(() => {
    const fetchAllData = async () => {
      if (!currentLeague) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch all seasons
        const seasonsData = await api(apiActions.getSeasons, currentLeague.id);
        const sortedSeasonsData = [...seasonsData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setAllSeasons(sortedSeasonsData);

        let defaultSeasonId = null;
        const today = new Date();

        // Determine default season: active season first, then latest
        const activeSeason = seasonsData.find(season => {
          const startDate = new Date(season.startDate);
          const endDate = new Date(season.endDate);
          return today >= startDate && today <= endDate;
        });

        if (activeSeason) {
          defaultSeasonId = activeSeason.id;
        } else if (seasonsData.length > 0) {
          // Sort by endDate descending to get the latest season
          const sortedSeasons = [...seasonsData].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
          defaultSeasonId = sortedSeasons[0].id;
        }

        setSelectedSeasonId(defaultSeasonId);

        // 2. Fetch standings and season settings for the default/selected season
        if (defaultSeasonId) {
          const standingsData = await api(apiActions.getStandings, defaultSeasonId);
          setStandings(standingsData);

          const settingsData = await api(apiActions.getSeasonSettings, defaultSeasonId);
          setSeasonSettings(settingsData);
        }

      } catch (e) {
        console.error("Failed to fetch data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [api, currentLeague]); // Re-run when token or currentLeague changes

  useEffect(() => {
    const fetchStandingsAndSettings = async () => {
      if (!selectedSeasonId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const standingsData = await api(apiActions.getStandings, selectedSeasonId);
        setStandings(standingsData);

        const settingsData = await api(apiActions.getSeasonSettings, selectedSeasonId);
        setSeasonSettings(settingsData);

      } catch (e) {
        console.error("Failed to fetch standings or settings for selected season:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandingsAndSettings();
  }, [selectedSeasonId, api]); // Re-run when selectedSeasonId or token changes

  const renderItem = ({ item, index }) => (
    <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
      <Text style={[styles.rankCell, styles.centeredCellContent]}>{item.rank.toString()}</Text>
      <View style={[styles.playerCell, styles.leftAlignedCellContent]}>
        {item.iconUrl && (
          <Image source={{ uri: item.iconUrl }} style={styles.playerIcon} />
        )}
        <Text style={styles.playerName}>{item.displayName ? item.displayName.toString() : ''}</Text>
      </View>
      {(seasonSettings?.trackKills || seasonSettings?.trackBounties || seasonSettings?.enableAttendancePoints) && <Text style={[styles.placePointsCell, styles.centeredCellContent]}>{item.placePointsEarned.toString()}</Text>}
      {seasonSettings?.trackKills && <Text style={[styles.statCell, styles.centeredCellContent]}>{item.totalKills.toString()}</Text>}
      {seasonSettings?.trackBounties && <Text style={[styles.statCell, styles.centeredCellContent]}>{item.totalBounties.toString()}</Text>}
      {seasonSettings?.enableAttendancePoints && <Text style={[styles.statCell, styles.centeredCellContent]}>{item.gamesWithoutPlacePoints.toString()}</Text>}
      <Text style={[styles.totalCell, styles.centeredCellContent]}>{item.totalPoints.toString()}</Text>
    </View>
  );

  const renderHeader = useCallback(() => (
    <>
      <Text style={styles.title}>Standings</Text>
      {allSeasons.length > 0 && selectedSeasonId !== null && (
        <Picker
          selectedValue={selectedSeasonId}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedSeasonId(itemValue)}
        >
          {allSeasons.map(season => (
            <Picker.Item key={season.id} label={season.seasonName} value={season.id} />
          ))}
        </Picker>
      )}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.rankCell]}>Rk</Text>
        <Text style={[styles.headerCell, styles.playerCell]}>Player</Text>
        {(seasonSettings?.trackKills || seasonSettings?.trackBounties || seasonSettings?.enableAttendancePoints) && <Text style={[styles.headerCell, styles.placePointsCell]}>Place Pts</Text>}
        {seasonSettings?.trackKills && <Text style={[styles.headerCell, styles.statCell]}>Kills</Text>}
        {seasonSettings?.trackBounties && <Text style={[styles.headerCell, styles.statCell]}>Bty</Text>}
        {seasonSettings?.enableAttendancePoints && <Text style={[styles.headerCell, styles.statCell]}>Att</Text>}
        <Text style={[styles.headerCell, styles.totalCell]}>Total</Text>
      </View>
    </>
  ), [allSeasons, selectedSeasonId, seasonSettings]);

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
    <PageLayout noScroll>
      <FlatList
        data={standings}
        keyExtractor={item => item.playerId.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        style={styles.flatListStyle}
        contentContainerStyle={styles.containerContent}
      />
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  flatListStyle: {
    flex: 1,
    width: '100%',
  },
  containerContent: {
    padding: 20,
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
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rankCell: {
    flex: 0.6,
    textAlign: 'center',
  },
  playerCell: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placePointsCell: {
    flex: 1.2,
    textAlign: 'center',
  },
  statCell: {
    flex: 0.8,
    textAlign: 'center',
  },
  totalCell: {
    flex: 0.9,
    textAlign: 'center',
  },
  playerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  playerName: {
    fontSize: 16,
    color: '#333',
  },
  centeredCellContent: {
    textAlign: 'center',
  },
  leftAlignedCellContent: {
    // This is now handled by the cell's flex properties
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});

export default StandingsPage;