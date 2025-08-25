import React, { useState, useEffect } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';

const StandingsPage = () => {
  const [standings, setStandings] = useState([]);
  const [allSeasons, setAllSeasons] = useState([]); // New state for all seasons
  const [selectedSeasonId, setSelectedSeasonId] = useState(null); // New state for selected season
  const [seasonSettings, setSeasonSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const { currentLeague } = useLeague();

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token || !currentLeague) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch all seasons
        const seasonsResponse = await fetch(`${API_BASE_URL}/api/leagues/${currentLeague.id}/seasons`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!seasonsResponse.ok) throw new Error(`HTTP error! status: ${seasonsResponse.status}`);
        const seasonsData = await seasonsResponse.json();
        setAllSeasons(seasonsData);

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
          const standingsResponse = await fetch(`${API_BASE_URL}/api/seasons/${defaultSeasonId}/standings`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!standingsResponse.ok) throw new Error(`HTTP error! status: ${standingsResponse.status}`);
          const standingsData = await standingsResponse.json();
          setStandings(standingsData);

          const settingsResponse = await fetch(`${API_BASE_URL}/api/seasons/${defaultSeasonId}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!settingsResponse.ok) throw new Error(`HTTP error! status: ${settingsResponse.status}`);
          const settingsData = await settingsResponse.json();
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
  }, [token, currentLeague]); // Re-run when token or currentLeague changes

  useEffect(() => {
    const fetchStandingsAndSettings = async () => {
      if (!selectedSeasonId || !token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const standingsResponse = await fetch(`${API_BASE_URL}/api/seasons/${selectedSeasonId}/standings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!standingsResponse.ok) throw new Error(`HTTP error! status: ${standingsResponse.status}`);
        const standingsData = await standingsResponse.json();
        setStandings(standingsData);

        const settingsResponse = await fetch(`${API_BASE_URL}/api/seasons/${selectedSeasonId}/settings`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!settingsResponse.ok) throw new Error(`HTTP error! status: ${settingsResponse.status}`);
        const settingsData = await settingsResponse.json();
        setSeasonSettings(settingsData);

      } catch (e) {
        console.error("Failed to fetch standings or settings for selected season:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandingsAndSettings();
  }, [selectedSeasonId, token]); // Re-run when selectedSeasonId or token changes

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
      <View style={styles.contentContainer}>
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
    paddingHorizontal: 8, // Increased padding slightly for overall table
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
    fontSize: 14, // Reduced font size
  },
  tableRow: {
    flexDirection: 'row',
    width: '100%', // Ensure row takes full width
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 8, // Increased padding slightly for overall table
  },
  tableCell: { // Default for general cells, will be overridden
    flex: 1,
    flexDirection: 'row', // Keep this for the playerCell's internal layout
  },
  rankCell: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerCell: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'center', // Keep this for vertical alignment of icon and name within the cell
    justifyContent: 'flex-start', // Left justify content within the playerCell
  },
  placePointsCell: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statCell: { // For Kills, Bounty, Attendance
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCell: {
    flex: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center', // For text content
  },
  leftAlignedCellContent: {
    justifyContent: 'flex-start',
    alignItems: 'center', // For vertical alignment of icon and text
  },
  evenRow: {
    backgroundColor: '#f9f9f9', // Light gray for even rows
  },
  oddRow: {
    backgroundColor: '#ffffff', // White for odd rows
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
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  table: {
    flex: 1, // Ensure FlatList takes up available vertical space
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default StandingsPage;