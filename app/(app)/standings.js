import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [seasonSettings, setSeasonSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { api, token } = useAuth();
  const { currentLeague, allSeasons, activeSeason } = useLeague();

  const displaySeasons = useMemo(() => {
    return allSeasons.filter(season => season.seasonName !== "Casual Games");
  }, [allSeasons]);

  useEffect(() => {
    // Initialize selectedSeasonId with the active season from context if it's not already set
    if (activeSeason && !selectedSeasonId) {
      setSelectedSeasonId(activeSeason.id);
    }
  }, [activeSeason, selectedSeasonId]);

  useEffect(() => {
    const fetchStandingsAndSettings = async () => {
      if (!selectedSeasonId) {
        // If there's no selected season (e.g., no seasons in the league), don't fetch
        setStandings([]);
        setSeasonSettings(null);
        setLoading(false);
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
      const leagueName = currentLeague ? currentLeague.leagueName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'league';
      const seasonName = selectedSeason ? selectedSeason.seasonName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `season_${selectedSeasonId}`;
      const filename = `standings-${leagueName}-${seasonName}.csv`;

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
      {displaySeasons.length > 0 && selectedSeasonId !== null && (
          <SafePicker
            selectedValue={selectedSeasonId}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedSeasonId(itemValue)}
            dropdownIconColor="black"
          >
            {displaySeasons.map(season => (
              <SafePicker.Item key={season.id} label={season.seasonName} value={season.id} />
            ))}
          </SafePicker>
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

  const renderListFooter = () => {
    if (standings.length === 0) {
      return null;
    }
    return (
      <View style={styles.footerContainer}>
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
    );
  };

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
        ListFooterComponent={renderListFooter}
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
  picker: {
    height: 50,
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
});

export default StandingsPage;