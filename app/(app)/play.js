import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';
import Timer from '../../components/Timer';
import { Picker } from '@react-native-picker/picker';

const PlayPage = () => {
  const { api } = useAuth();
  const { selectedLeagueId } = useLeague();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('setup'); // 'setup', 'play', 'review', 'eliminate_select_player', 'eliminate_select_killer'
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [selectedPlayerToEliminate, setSelectedPlayerToEliminate] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [activeSeasonId, setActiveSeasonId] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const pollingIntervalRef = useRef(null);

  const getOrdinal = (n) => {
    if (n === null || n === undefined) return '';
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleApiError = (e) => {
    if (e.message !== '401') {
      setError(e.message);
    }
  };

  const fetchInitialData = useCallback(async () => {
    if (!selectedLeagueId) return;
    try {
      const members = await api(apiActions.getLeagueMembers, selectedLeagueId);
      setAllPlayers(members);
      const activePlayerIds = new Set(members.filter(m => m.isActive).map(m => m.id));
      setSelectedPlayerIds(activePlayerIds);

      const season = await api(apiActions.getActiveSeason, selectedLeagueId);
      setActiveSeasonId(season.id);

      const games = await api(apiActions.getGameHistory, season.id);
      setAllGames(games);

      if (games.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const defaultGame = games.find(game => game.gameStatus !== 'COMPLETED' && new Date(game.gameDate).getTime() === today.getTime()) ||
                              games.find(game => game.gameStatus !== 'COMPLETED' && new Date(game.gameDate).getTime() >= today.getTime()) ||
                              games.find(game => game.gameStatus !== 'COMPLETED') ||
                              games[0];
        setSelectedGameId(defaultGame?.id || null);
      }

    } catch (e) {
      handleApiError(e);
    }
  }, [selectedLeagueId, api]);

  useEffect(() => {
    if (mode === 'setup') {
      fetchInitialData();
    }
  }, [mode, fetchInitialData]);

  const fetchGameState = useCallback(async () => {
    if (!selectedGameId) return;
    try {
      const data = await api(apiActions.getGameState, selectedGameId);
      setGameState(data);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  }, [selectedGameId, api]);

  useEffect(() => {
    if (mode === 'play' || mode === 'review') {
      setLoading(true);
      fetchGameState();
      pollingIntervalRef.current = setInterval(fetchGameState, 5000);
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [mode, fetchGameState]);

  useEffect(() => {
    if (gameState?.gameStatus === 'COMPLETED') {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [gameState]);

  useEffect(() => {
    if (!gameState || gameState.gameStatus === 'COMPLETED') return;

    const remaining = gameState.players.filter(p => !p.isEliminated).length;
    if (remaining <= 1 && mode === 'play') {
      setMode('review');
    } else if (remaining > 1 && mode === 'review') {
      setMode('play');
    }
  }, [gameState, mode]);


  const handleAction = async (action, ...args) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
    try {
      if (action === apiActions.nextLevel || action === apiActions.previousLevel) {
        setIsTimerFinished(false);
      }
      const newGameState = await api(action, ...args);
      if (action === apiActions.finalizeGame) {
        setGameState(prevState => ({ ...prevState, gameStatus: 'COMPLETED' }));
        setMode('play');
      } else {
        setGameState(newGameState);
      }
    } catch (e) {
      if (e.message !== '401') {
        Alert.alert('Error', e.message);
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartGame = () => {
    if (!selectedGameId) {
      Alert.alert('Error', 'Please select a game to start.');
      return;
    }
    handleAction(apiActions.startGame, selectedGameId, Array.from(selectedPlayerIds)).then(() => {
        setMode('play');
    });
  }

  const togglePlayerSelection = (playerId) => {
    const newSelection = new Set(selectedPlayerIds);
    if (newSelection.has(playerId)) {
      newSelection.delete(playerId);
    } else {
      newSelection.add(playerId);
    }
    setSelectedPlayerIds(newSelection);
  };

  const handlePlayerPress = (player) => {
    if (mode === 'eliminate_select_player') {
        setSelectedPlayerToEliminate(player);
        setMode('eliminate_select_killer');
    } else if (mode === 'eliminate_select_killer') {
        handleAction(apiActions.eliminatePlayer, selectedGameId, selectedPlayerToEliminate.id, player.id);
        setMode('play');
        setSelectedPlayerToEliminate(null);
    }
  }

  if (loading && !gameState && mode !== 'setup') {
    return <PageLayout><ActivityIndicator size="large" color="#fb5b5a" /></PageLayout>;
  }

  if (error) {
    return <PageLayout><Text style={styles.errorText}>Error: {error}</Text></PageLayout>;
  }

  if (mode === 'setup') {
      return (
          <PageLayout>
              <ScrollView contentContainerStyle={styles.setupContainer}>
                  <Text style={styles.title}>Select Game</Text>
                  {allGames.filter(game => game.gameStatus !== 'COMPLETED').length > 0 ? (
                    <Picker
                      selectedValue={selectedGameId}
                      onValueChange={(itemValue) => setSelectedGameId(itemValue)}
                      style={styles.picker}
                    >
                      {allGames
                        .filter(game => game.gameStatus !== 'COMPLETED')
                        .map(game => (
                          <Picker.Item
                            key={game.id}
                            label={`${game.gameName} (${new Date(game.gameDate).toLocaleDateString()}) - ${game.gameStatus || 'SCHEDULED'}`}
                            value={game.id}
                          />
                        ))}
                    </Picker>
                  ) : (
                    <Text>No upcoming or active games found for this season.</Text>
                  )}

                  {selectedGameId && (
                    <>
                      <Text style={styles.title}>Select Players</Text>
                      <View style={{width: '100%'}}>
                        {allPlayers.map(player => (
                            <View key={player.id} style={styles.playerSetupItem}>
                                <Text>{player.displayName}</Text>
                                <Switch
                                    value={selectedPlayerIds.has(player.id)}
                                    onValueChange={() => togglePlayerSelection(player.id)}
                                />
                            </View>
                        ))}
                      </View>
                      <TouchableOpacity style={[styles.button, styles.setupStartButton]} onPress={handleStartGame} disabled={isActionLoading}>
                          <Text style={styles.buttonText}>Start Game</Text>
                      </TouchableOpacity>
                    </>
                  )}
              </ScrollView>
          </PageLayout>
      );
   }


  if (!gameState) {
    return <PageLayout><Text>No game state available.</Text></PageLayout>;
  }

  const eliminatedPlayersCount = gameState.players.filter(p => p.isEliminated).length;

  const sortedPlayers = [...gameState.players].sort((a, b) => {
    if (a.isEliminated && !b.isEliminated) return 1;
    if (!a.isEliminated && b.isEliminated) return -1;

    if (a.isEliminated && b.isEliminated) {
      return (a.place || 0) - (b.place || 0);
    }

    if (a.rank && b.rank) {
        if (a.rank !== b.rank) {
            return a.rank - b.rank;
        }
    }
    return a.displayName.localeCompare(b.displayName);
  });

  let mainButton = null;
  if (mode === 'eliminate_select_player' || mode === 'eliminate_select_killer') {
      mainButton = (
          <TouchableOpacity style={styles.button} onPress={() => setMode('play')} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
      );
  } else if (gameState.gameStatus === 'IN_PROGRESS' && mode === 'play') {
      mainButton = (
          <TouchableOpacity style={styles.button} onPress={() => setMode('eliminate_select_player')} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Eliminate Player</Text>
          </TouchableOpacity>
      );
  }

  let undoButton = null;
  if (eliminatedPlayersCount > 0 && gameState.gameStatus === 'IN_PROGRESS') {
      undoButton = (
          <TouchableOpacity style={styles.button} onPress={() => handleAction(apiActions.undoElimination, selectedGameId)} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Undo Elimination</Text>
          </TouchableOpacity>
      );
  }

  if (mode === 'review') {
    return (
      <PageLayout>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Final Results</Text>
          <View style={styles.playersContainer}>
            {sortedPlayers.map((player) => {
              const place = player.isEliminated ? getOrdinal(player.place) : '1st';
              return (
                <View key={player.id} style={styles.reviewPlayerItem}>
                  <Text style={styles.reviewPlayerName}>{player.displayName} {player.hasBounty && <Text style={styles.bountyIndicator}>⭐️</Text>}</Text>
                  <View style={styles.reviewPlayerStatsContainer}>
                    <Text style={styles.reviewPlayerStat}>Place: {place}</Text>
                    <Text style={styles.reviewPlayerStat}>Kills: {player.kills}</Text>
                    <Text style={styles.reviewPlayerStat}>Bounties: {player.bounties}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {!isActionLoading ? (
            <>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => handleAction(apiActions.finalizeGame, selectedGameId)}>
                    <Text style={styles.buttonText}>Finalize & Save</Text>
                </TouchableOpacity>
              </View>
              {undoButton && (
                  <View style={styles.buttonContainer}>
                      {undoButton}
                  </View>
              )}
            </>
          ) : (
            <ActivityIndicator size="large" color="#fb5b5a" style={{ marginTop: 20 }} />
          )}
        </ScrollView>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Game Play</Text>

        {gameState.gameStatus === 'COMPLETED' ? (
          <Text style={styles.gameOverText}>Game Over</Text>
        ) : (
          gameState.timer && gameState.timer.blindLevels && (
              <Timer
                  timerState={gameState.timer}
                  blindLevels={gameState.timer.blindLevels}
                  isPlaying={gameState.gameStatus === 'IN_PROGRESS'}
                  onTimerEnd={() => setIsTimerFinished(true)}
              />
          )
        )}

        {gameState.gameStatus !== 'COMPLETED' && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, (isActionLoading || gameState.timer.currentLevelIndex <= 0) && styles.disabledButton]}
                onPress={() => handleAction(apiActions.previousLevel, selectedGameId)}
                disabled={isActionLoading || gameState.timer.currentLevelIndex <= 0}
              >
                <Text style={styles.buttonText}>Prev Level</Text>
              </TouchableOpacity>

              {gameState.gameStatus === 'IN_PROGRESS' && (
                <TouchableOpacity
                    style={[styles.button, (isActionLoading || isTimerFinished) && styles.disabledButton]}
                    onPress={() => handleAction(apiActions.pauseGame, selectedGameId)}
                    disabled={isActionLoading || isTimerFinished}
                >
                  <Text style={styles.buttonText}>Pause</Text>
                </TouchableOpacity>
              )}
              {gameState.gameStatus === 'PAUSED' && (
                <TouchableOpacity
                    style={[styles.button, isActionLoading && styles.disabledButton]}
                    onPress={() => handleAction(apiActions.resumeGame, selectedGameId)}
                    disabled={isActionLoading}>
                  <Text style={styles.buttonText}>Resume</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.button, (isActionLoading || gameState.timer.currentLevelIndex >= gameState.timer.blindLevels.length - 1) && styles.disabledButton]}
                onPress={() => handleAction(apiActions.nextLevel, selectedGameId)}
                disabled={isActionLoading || gameState.timer.currentLevelIndex >= gameState.timer.blindLevels.length - 1}
              >
                <Text style={styles.buttonText}>Next Level</Text>
              </TouchableOpacity>
            </View>
        )}

        {mode === 'eliminate_select_player' && (
            <Text style={styles.promptText}>Select the player to ELIMINATE.</Text>
        )}
        {mode === 'eliminate_select_killer' && (
            <Text style={styles.promptText}>Select the player who got the KILL.</Text>
        )}

        <View style={styles.playersContainer}>
          <Text style={styles.subtitle}>Players</Text>
          {sortedPlayers.map((player) => (
            <TouchableOpacity key={player.id} onPress={() => handlePlayerPress(player)} disabled={isActionLoading || (mode !== 'eliminate_select_player' && mode !== 'eliminate_select_killer') || player.isEliminated}>
                <View style={[styles.playerItem, selectedPlayerToEliminate?.id === player.id && styles.selectedPlayerItem]}>
                <Text style={styles.playerDisplayName}>{player.displayName} {player.hasBounty && <Text style={styles.bountyIndicator}>⭐️</Text>}</Text>
                <Text style={styles.playerStatsText}>
                    {player.isEliminated && `Place: ${getOrdinal(player.place)} | `}
                    Kills: {player.kills} | Bounties: {player.bounties}
                </Text>
                </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
            {mainButton}
        </View>
        {undoButton && (
            <View style={styles.buttonContainer}>
                {undoButton}
            </View>
        )}

      </ScrollView>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  setupContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  promptText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#fb5b5a',
  },
  playersContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  playerDisplayName: {
    flex: 2,
  },
  playerStatsText: {
    flex: 1,
    textAlign: 'right',
  },
  selectedPlayerItem: {
    backgroundColor: '#e0e0e0',
  },
  playerSetupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fb5b5a',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  bountyIndicator: {
    fontSize: 16,
    marginLeft: 5,
  },
  picker: {
    width: 225,
    height: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  gameOverText: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#A30000',
  },
  reviewPlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  reviewPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  reviewPlayerStatsContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  reviewPlayerStat: {
    fontSize: 16,
  },
  setupStartButton: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default PlayPage;