import React, { useState, useEffect, useCallback } from 'react';
import SafePicker from '../../components/SafePicker';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';


const StandingsPage = () => {
  const [standings, setStandings] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [seasonSettings, setSeasonSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { api, token } = useAuth();
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
        const filteredSeasonsData = seasonsData.filter(season => season.seasonName !== "Casual Games");
        const sortedSeasonsData = [...filteredSeasonsData].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setAllSeasons(sortedSeasonsData);

        let defaultSeasonId = null;
        const today = new Date();
        const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

        const nonCasualSeasons = filteredSeasonsData;

        // 1. Find currently active season (today between start and end)
        const currentlyActiveSeasons = nonCasualSeasons.filter(season => {
            const startDate = new Date(season.startDate);
            const endDate = new Date(season.endDate);
            const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            return todayUTC >= startUTC && todayUTC <= endUTC;
        }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // Sort by newest startDate

        if (currentlyActiveSeasons.length > 0) {
            defaultSeasonId = currentlyActiveSeasons[0].id;
        } else {
            // 2. If no season is currently active, look for the next upcoming season
            const upcomingSeasons = nonCasualSeasons.filter(season => {
                const endDate = new Date(season.endDate);
                const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                return todayUTC < endUTC; // Season has not ended yet
            }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)); // Sort by oldest startDate (next to start)

            if (upcomingSeasons.length > 0) {
                defaultSeasonId = upcomingSecoming[0].id;
            } else if (nonCasualSeasons.length > 0) {
                // 3. If no active or upcoming, default to the latest season by end date
                const sortedByEndDate = [...nonCasualSeasons].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
                defaultSeasonId = sortedByEndDate[0].id;
            }
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
      const selectedSeason = allSeasons.find(s => s.id == selectedSeasonId);
      const seasonName = selectedSeason ? selectedSeason.seasonName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `season_${selectedSeasonId}`;
      const filename = `standings-${seasonName}.csv`;

      const csvData = await api(apiActions.exportStandingsCsv, selectedSeasonId, token);
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

  const renderPageHeader = () => (
    <>
      <Text style={styles.title}>Standings</Text>
      {allSeasons.length > 0 && selectedSeasonId !== null && (
        <View style={styles.pickerContainer}>
          <SafePicker
            selectedValue={selectedSeasonId}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedSeasonId(itemValue)}
            dropdownIconColor="black"
          >
            {allSeasons.map(season => (
              <SafePicker.Item key={season.id} label={season.seasonName} value={season.id} />
            ))}
          </SafePicker>
          <TouchableOpacity
            onPress={handleExportCsv}
            style={styles.exportButton}
            disabled={exporting || loading}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="download-outline" size={24} color="#fff" />
            )}
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.rankCell]}>Rk</Text>
      <Text style={[styles.headerCell, styles.playerCell]}>Player</Text>
      {(seasonSettings?.trackKills || seasonSettings?.trackBounties || seasonSettings?.enableAttendancePoints) && <Text style={[styles.headerCell, styles.placePointsCell]}>Place Pts</Text>}
      {seasonSettings?.trackKills && <Text style={[styles.headerCell, styles.statCell]}>Kills</Text>}
      {seasonSettings?.trackBounties && <Text style={[styles.headerCell, styles.statCell]}>Bty</Text>}
      {seasonSettings?.enableAttendancePoints && <Text style={[styles.headerCell, styles.statCell]}>Att</Text>}
      <Text style={[styles.headerCell, styles.totalCell]}>Total</Text>
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
        <View style={styles.container}>
          {renderPageHeader()}
          <View style={styles.centeredMessage}>
            <Text>
              {allSeasons.length > 0
                ? "No standings data available for this season."
                : "No seasons have been created for this league yet."}
            </Text>
          </View>
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
        ListHeaderComponent={<>{renderPageHeader()}{renderTableHeader()}</>}
        style={styles.container}
      />
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredMessage: {
    flexGrow: 1,
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
  pickerContainer: {
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  picker: {
    height: 50,
    width: '100%',
    color: 'black',
  },
  exportButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  exportButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});

export default StandingsPage;