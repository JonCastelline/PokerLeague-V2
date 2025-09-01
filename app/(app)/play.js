import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Switch, TextInput, Image } from 'react-native';
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
  const [editableGameState, setEditableGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('setup'); // 'setup', 'play', 'review', 'eliminate_select_player', 'eliminate_select_killer', 'edit'
  const [allPlayers, setAllPlayers] = useState([]);
  const [playersInEditOrder, setPlayersInEditOrder] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [selectedPlayerToEliminate, setSelectedPlayerToEliminate] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  const [activeSeasonSettings, setActiveSeasonSettings] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [noActiveSeason, setNoActiveSeason] = useState(false);
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
    setLoading(true); // Ensure loading is true at the start
    setError(null); // Clear any previous errors
    setNoActiveSeason(false); // Clear previous no active season state

    try {
      const members = await api(apiActions.getLeagueMembers, selectedLeagueId);
      setAllPlayers(members);
      const activePlayerIds = new Set(members.filter(m => m.isActive).map(m => m.id));
      setSelectedPlayerIds(activePlayerIds);

      let season = null;
      try {
        season = await api(apiActions.getActiveSeason, selectedLeagueId);
        setActiveSeason(season);
      } catch (e) {
        if (e.message.includes('404')) {
          setNoActiveSeason(true);
          return; // Exit early, no further processing needed for this scenario
        }
        throw e; // Re-throw other errors to be caught by the outer catch
      }

      const seasonSettings = await api(apiActions.getSeasonSettings, season.id);
      setActiveSeasonSettings(seasonSettings);

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
      handleApiError(e); // Only handle non-404 errors here
    } finally {
      setLoading(false); // Ensure loading is set to false in all cases
    }
  }, [selectedLeagueId, api]);

  useEffect(() => {
    if (mode === 'setup') {
      fetchInitialData();
    }
  }, [mode, fetchInitialData]);

  useEffect(() => {
    if (mode === 'setup' && selectedGameId) {
        const game = allGames.find(g => g.id === selectedGameId);
        if (game && (game.gameStatus === 'IN_PROGRESS' || game.gameStatus === 'PAUSED')) {
            fetchGameState();
        } else {
            setGameState(null); // Clear game state for scheduled games
        }
    }
  }, [selectedGameId, allGames, mode, fetchGameState]);

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

  const [isPlayScreenActive, setIsPlayScreenActive] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsPlayScreenActive(true);

      return () => {
        setIsPlayScreenActive(false);
      };
    }, [])
  );

  useEffect(() => {
    if ((mode === 'play' || mode === 'review') && selectedGameId && isPlayScreenActive) {
      setLoading(true);
      fetchGameState();
      pollingIntervalRef.current = setInterval(fetchGameState, 5000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [mode, selectedGameId, fetchGameState, isPlayScreenActive]);

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

  const handleUpdateResults = async () => {
    setValidationErrors({});
    if (!editableGameState) return;

    const players = editableGameState.players;
    const numPlayers = players.length;
    const errors = {};

    // Validation 1: Total Kills
    const totalKills = players.reduce((sum, p) => sum + (parseInt(p.kills, 10) || 0), 0);
    if (totalKills > numPlayers - 1) {
      errors.general = `Total kills (${totalKills}) cannot exceed the number of players minus one (${numPlayers - 1}).`;
    }

    // Validation 2: Total Bounties
    const availableBounties = gameState.players.filter(p => p.hasBounty).length;
    const totalBounties = players.reduce((sum, p) => sum + (parseInt(p.bounties, 10) || 0), 0);
    if (totalBounties > availableBounties) {
      errors.general = (errors.general || '') + `\nTotal bounties (${totalBounties}) cannot exceed the number of available bounties (${availableBounties}).`;
    }

    // Validation 3: Unique Places
    const places = players.map(p => parseInt(p.place, 10) || 0).filter(p => p > 0);
    const uniquePlaces = new Set(places);
    if (places.length !== uniquePlaces.size) {
        errors.general = (errors.general || '') + '\nEach player must have a unique place. No ties are allowed.';
    }

    // Validation 4: Valid Places
    for (const player of players) {
        const place = parseInt(player.place, 10);
        if (isNaN(place) || place < 1 || place > numPlayers) {
            errors[player.id] = { ...errors[player.id], place: `Place must be between 1 and ${numPlayers}.` };
        }
    }

    // Validation 5: First place kills
    const firstPlacePlayer = players.find(p => (parseInt(p.place, 10) || 0) === 1);
    if (firstPlacePlayer && (parseInt(firstPlacePlayer.kills, 10) || 0) === 0) {
        errors[firstPlacePlayer.id] = { ...errors[firstPlacePlayer.id], kills: '1st place must have > 0 kills.' };
    }

    // Validation 6: Kills >= Bounties
    for (const player of players) {
        const kills = parseInt(player.kills, 10) || 0;
        const bounties = parseInt(player.bounties, 10) || 0;
        if (kills < bounties) {
            errors[player.id] = { ...errors[player.id], bounties: 'Bounties cannot exceed kills.' };
        }
    }

    if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
    }

    const payload = {
        results: players.map(p => ({
            playerId: p.id,
            place: parseInt(p.place, 10) || 0,
            kills: parseInt(p.kills, 10) || 0,
            bounties: parseInt(p.bounties, 10) || 0,
        }))
    };

    await handleAction(apiActions.updateGameResults, selectedGameId, payload);
    setMode('review');
  };

  const handleEditPlayerState = (playerId, field, value) => {
    setValidationErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (newErrors[playerId]) {
            delete newErrors[playerId][field];
            if (Object.keys(newErrors[playerId]).length === 0) {
                delete newErrors[playerId];
            }
        }
        return newErrors;
    });

    setEditableGameState(prevState => {
        let newPlayers = [...prevState.players];

        if (field === 'place' && value === '1') {
            newPlayers = newPlayers.map(p => {
                if (p.place === 1) {
                    return { ...p, place: '' };
                }
                return p;
            });
        }

        newPlayers = newPlayers.map(p => {
            if (p.id === playerId) {
                return { ...p, [field]: value };
            }
            return p;
        });

        return { ...prevState, players: newPlayers };
    });
  };

  if (loading && !gameState && mode !== 'setup') {
    return <PageLayout><ActivityIndicator size="large" color="#fb5b5a" /></PageLayout>;
  }

  if (error) {
    return <PageLayout><Text style={styles.errorText}>Error: {error}</Text></PageLayout>;
  }

  if (noActiveSeason) {
    return (
      <PageLayout>
        <View style={styles.noSeasonContainer}>
          <Text style={styles.noSeasonText}>No active season found for this league.</Text>
          <Text style={styles.noSeasonText}>Please create a new season in the Season Settings to get started!</Text>
        </View>
      </PageLayout>
    );
  }

  if (mode === 'setup') {
      const hasActiveGames = allGames.filter(game => game.gameStatus !== 'COMPLETED').length > 0;
      const selectedGame = allGames.find(g => g.id === selectedGameId);

      return (
          <PageLayout>
              <ScrollView contentContainerStyle={styles.setupContainer}>
                  <Text style={styles.title}>Select Game</Text>
                  {hasActiveGames ? (
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

                  {selectedGame?.gameStatus === 'SCHEDULED' && (
                    <>
                      <Text style={styles.title}>Select Players</Text>
                      <View style={{width: '100%'}}>
                        {allPlayers.map(player => (
                            <View key={player.id} style={styles.playerSetupItem}>
                                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                    {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                                    <Text>{player.displayName}</Text>
                                </View>
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

                  {(selectedGame?.gameStatus === 'IN_PROGRESS' || selectedGame?.gameStatus === 'PAUSED') && (
                    <>
                        {loading && !gameState ? (
                            <ActivityIndicator size="large" color="#fb5b5a" />
                        ) : (
                            <>
                                <Text style={styles.title}>Players in Game</Text>
                                <View style={{width: '100%'}}>
                                    {gameState?.players.map(player => (
                                        <View key={player.id} style={styles.playerSetupItem}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                                {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                                                <Text>{player.displayName}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                                <TouchableOpacity style={[styles.button, styles.setupStartButton]} onPress={() => setMode('play')} disabled={isActionLoading}>
                                    <Text style={styles.buttonText}>Join Game</Text>
                                </TouchableOpacity>
                            </>
                        )}
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
  } else if ((gameState.gameStatus === 'IN_PROGRESS' || gameState.gameStatus === 'PAUSED') && mode === 'play') {
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

  if (mode === 'edit') {
    return (
        <PageLayout>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Edit Results</Text>
                <View style={styles.playersContainer}>
                    {editableGameState.players.map((player) => (
                        <View key={player.id} style={styles.editPlayerItem}>
                            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                                <Text style={styles.editPlayerName}>{player.displayName}</Text>
                            </View>
                            <View style={styles.editPlayerStatsContainer}>
                                <Text>Place:</Text>
                                <TextInput
                                    style={[styles.input, validationErrors[player.id]?.place && styles.inputError]}
                                    value={String(player.place || '')}
                                    onChangeText={(text) => handleEditPlayerState(player.id, 'place', text)}
                                    keyboardType="numeric"
                                />
                                {activeSeasonSettings?.trackKills && (
                                    <>
                                        <Text>Kills:</Text>
                                        <TextInput
                                            style={[styles.input, validationErrors[player.id]?.kills && styles.inputError]}
                                            value={String(player.kills)}
                                            onChangeText={(text) => handleEditPlayerState(player.id, 'kills', text)}
                                            keyboardType="numeric"
                                        />
                                    </>
                                )}
                                {activeSeasonSettings?.trackBounties && (
                                    <>
                                        <Text>Bounties:</Text>
                                        <TextInput
                                            style={[styles.input, validationErrors[player.id]?.bounties && styles.inputError]}
                                            value={String(player.bounties)}
                                            onChangeText={(text) => handleEditPlayerState(player.id, 'bounties', text)}
                                            keyboardType="numeric"
                                        />
                                    </>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
                {validationErrors.general && <Text style={styles.errorText}>{validationErrors.general}</Text>}
                {Object.entries(validationErrors).map(([playerId, playerErrors]) => {
                    if (playerId === 'general') return null;
                    const player = editableGameState.players.find(p => p.id == playerId);
                    return Object.entries(playerErrors).map(([field, message]) => (
                        <Text key={`${playerId}-${field}`} style={styles.errorText}>{player?.displayName}: {message}</Text>
                    ))
                })}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleUpdateResults} disabled={isActionLoading}>
                        <Text style={styles.buttonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setMode('review'); setValidationErrors({}); }} disabled={isActionLoading}>
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </PageLayout>
    );
  }

  if (mode === 'review') {
    return (
      <PageLayout noScroll>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Final Results</Text>
          <View style={styles.playersContainer}>
            {sortedPlayers.map((player) => {
              const place = player.isEliminated ? getOrdinal(player.place) : '1st';
              return (
                <View key={player.id} style={styles.reviewPlayerItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                        <Text style={styles.reviewPlayerName}>{player.displayName} {activeSeasonSettings?.trackBounties && player.hasBounty && <Text style={styles.bountyIndicator}>⭐️</Text>}</Text>
                    </View>
                  <View style={styles.reviewPlayerStatsContainer}>
                    <Text style={styles.reviewPlayerStat}>Place: {place}</Text>
                    {activeSeasonSettings?.trackKills && (
                        <Text style={styles.reviewPlayerStat}>Kills: {player.kills}</Text>
                    )}
                    {activeSeasonSettings?.trackBounties && (
                        <Text style={styles.reviewPlayerStat}>Bounties: {player.bounties}</Text>
                    )}
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
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => {
                    const newEditableState = JSON.parse(JSON.stringify(gameState));
                    const winner = newEditableState.players.find(p => !p.isEliminated);
                    if (winner) {
                        winner.place = 1;
                    }
                    newEditableState.players.sort((a, b) => (a.place || 0) - (b.place || 0));
                    setEditableGameState(newEditableState);
                    setMode('edit');
                }}>
                    <Text style={styles.buttonText}>Edit</Text>
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
    <PageLayout noScroll>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Game Play</Text>

        {gameState.gameStatus === 'COMPLETED' ? (
          <Text style={styles.gameOverText}>Game Over</Text>
        ) : (
          gameState.timer && gameState.timer.blindLevels && (
              <Timer
                  gameId={gameState.gameId}
                  timerState={gameState.timer}
                  blindLevels={gameState.timer.blindLevels}
                  isPlaying={gameState.gameStatus === 'IN_PROGRESS' && isPlayScreenActive}
                  onTimerEnd={() => setIsTimerFinished(true)}
                  warningSoundEnabled={gameState.settings.warningSoundEnabled}
                  warningSoundTimeSeconds={gameState.settings.warningSoundTimeSeconds}
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
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon}></View>}
                        <Text style={styles.playerDisplayName}>{String(player.displayName)} {activeSeasonSettings?.trackBounties && player.hasBounty ? <Text style={styles.bountyIndicator}>⭐️</Text> : null}</Text>
                    </View>
                    <View style={styles.playerStatsContainer}>
                        {player.isEliminated && <Text style={styles.playerStatLine}>Place: {getOrdinal(player.place)}</Text>}
                        {(activeSeasonSettings?.trackKills || activeSeasonSettings?.trackBounties) && (
                            <Text style={styles.playerStatLine}>
                                {activeSeasonSettings?.trackKills && `Kills: ${player.kills}`}
                                {activeSeasonSettings?.trackKills && activeSeasonSettings?.trackBounties && ` | `}
                                {activeSeasonSettings?.trackBounties && `Bounties: ${player.bounties}`}
                            </Text>
                        )}
                    </View>
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
  noSeasonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSeasonText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
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
  playerStatsContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  playerStatLine: {
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
    marginTop: 5,
    marginBottom: 5,
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
  editPlayerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  editPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  editPlayerStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    width: 60,
    textAlign: 'center',
  },
  inputError: {
    borderColor: 'red',
  },
  inputContainer: {
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  playerIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
});

export default PlayPage;