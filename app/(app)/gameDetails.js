import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import PageLayout from '../../components/PageLayout';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { getGameResults, getSeasonSettings } from '../../src/api';

const GameDetailsPage = () => {
  const { gameId } = useLocalSearchParams();
  const { api } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSeasonSettings, setCurrentSeasonSettings] = useState(null);
  const [gameName, setGameName] = useState(null);

  // Themed colors
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const itemBorderColor = useThemeColor({}, 'icon'); // Item border
  const itemBgColor = useThemeColor({}, 'cardBackground');
  const mutedTextColor = useThemeColor({}, 'icon'); // For #666, #888 like colors
  const errorColor = 'red'; // Keep red for errors, assuming it's visible on both backgrounds.
  const activityIndicatorColor = useThemeColor({}, 'tint'); // For activity indicator

  useEffect(() => {
    if (gameId) {
      setLoading(true);
      setError(null);
      api(getGameResults, gameId)
        .then(data => {
          const sortedData = data.sort((a, b) => a.place - b.place);
          setResults(sortedData);

          // Extract game name
          if (sortedData.length > 0 && sortedData[0].game) {
            setGameName(sortedData[0].game.gameName);
          } else {
            setGameName(null);
          }

          if (sortedData.length > 0 && sortedData[0].game && sortedData[0].game.season && sortedData[0].game.season.id) {
            return api(getSeasonSettings, sortedData[0].game.season.id);
          }
          return null; // No seasonId found or no results
        })
        .then(seasonSettings => {
          if (seasonSettings) {
            setCurrentSeasonSettings(seasonSettings);
          }
        })
        .catch(err => {
          console.error("Failed to fetch game details or season details:", err);
          setError("Failed to load game details. Please try again.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [gameId, api]);

  // Moved getHeaderStyles and getItemStyles for clarity to be defined within the component
  // to leverage the themed colors. They should not create new StyleSheet.create instances on every render.
  const getHeaderStyles = (trackKills, trackBounties) => {
    const showStats = trackKills || trackBounties;
    return {
      placeHeader: { flex: 1 },
      playerHeader: { flex: showStats ? 3 : 5 },
      statsHeader: { flex: 2, textAlign: 'right' },
    };
  };

  const getItemStyles = (trackKills, trackBounties) => {
    const showStats = trackKills || trackBounties;
    return {
      place: { flex: 1 },
      playerContainer: { flex: showStats ? 3 : 5 },
      statsContainer: { flex: 2, alignItems: 'flex-end' },
    };
  };

  const renderResult = ({ item }) => {
    const itemStyles = getItemStyles(currentSeasonSettings?.trackKills, currentSeasonSettings?.trackBounties);
    return (
      <View style={[styles.resultItem, {backgroundColor: itemBgColor, borderColor: itemBorderColor}]}>
        <Text style={[styles.place, itemStyles.place, {color: textColor}]}>{item.place}</Text>
        <View style={[styles.playerContainer, itemStyles.playerContainer]}>
          <Image source={{ uri: item.player.iconUrl }} style={styles.playerIcon} />
          <Text style={[styles.playerName, {color: textColor}]}>{item.player.displayName}</Text>
        </View>
        {(currentSeasonSettings?.trackKills || currentSeasonSettings?.trackBounties) && (
          <View style={[styles.statsContainer, itemStyles.statsContainer]}>
            {currentSeasonSettings?.trackKills && <Text style={[styles.stat, {color: mutedTextColor}]}>Kills: {item.kills}</Text>}
            {currentSeasonSettings?.trackBounties && <Text style={[styles.stat, {color: mutedTextColor}]}>Bounties: {item.bounties}</Text>}
          </View>
        )}
      </View>
    );
  };

  const ListHeader = ({ gameName }) => {
    const headerStyles = getHeaderStyles(currentSeasonSettings?.trackKills, currentSeasonSettings?.trackBounties);
    return (
      <>
          <Text style={[styles.title, {color: textColor}]}>Game Results</Text>
          {gameName && <Text style={[styles.gameNameText, {color: mutedTextColor}]}>{gameName}</Text>}
          <View style={[styles.header, {backgroundColor: backgroundColor, borderBottomColor: itemBorderColor}]}>
              <Text style={[styles.headerText, headerStyles.placeHeader, {color: textColor}]}>Place</Text>
              <Text style={[styles.headerText, headerStyles.playerHeader, {color: textColor}]}>Player</Text>
              {(currentSeasonSettings?.trackKills || currentSeasonSettings?.trackBounties) && (
                  <Text style={[styles.headerText, headerStyles.statsHeader, {color: textColor}]}>Stats</Text>
              )}
          </View>
      </>
    );
  };

  if (loading) {
    return <PageLayout><ActivityIndicator size="large" color={activityIndicatorColor} /></PageLayout>;
  }

  if (error) {
      return <PageLayout><Text style={[styles.errorText, {color: errorColor}]}>{error}</Text></PageLayout>;
  }

  return (
    <PageLayout noScroll>
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={() => <ListHeader gameName={gameName} />}
        contentContainerStyle={[styles.container, {backgroundColor: backgroundColor}]}
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
  gameNameText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
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
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
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
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default GameDetailsPage;
