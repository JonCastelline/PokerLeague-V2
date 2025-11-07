import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Switch, TextInput, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { GameProvider, useGame } from '../../context/GameContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';
import HelpIcon from '../../components/HelpIcon';
import Timer from '../../components/Timer';
import SafePicker from '../../components/SafePicker';

const PlayPage = ({ selectedGameId, setSelectedGameId }) => {
  const { api } = useAuth();
  const { selectedLeagueId, currentUserMembership } = useLeague();
  const { gameState, setGameState, isActionLoading, isTimerFinished, setIsTimerFinished, handleAction, startPolling, stopPolling, fetchGameState, isCasualGame } = useGame();
  const [editableGameState, setEditableGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('setup'); // 'setup', 'play', 'review', 'eliminate_select_player', 'eliminate_select_killer', 'edit'
  const [allPlayers, setAllPlayers] = useState([]);
  const [playersInEditOrder, setPlayersInEditOrder] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState(new Set());
  const [selectedPlayerToEliminate, setSelectedPlayerToEliminate] = useState(null);
  const [activeSeason, setActiveSeason] = useState(null);
  const [activeSeasonSettings, setActiveSeasonSettings] = useState(null);
  const [allGames, setAllGames] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [noActiveSeason, setNoActiveSeason] = useState(false);
  const [isPlayScreenActive, setIsPlayScreenActive] = useState(true);

  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

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
          return;
        }
        throw e;
      }

      const seasonSettings = await api(apiActions.getSeasonSettings, season.id);
      setActiveSeasonSettings(seasonSettings);

      const games = await api(apiActions.getAllGamesBySeason, season.id);
      setAllGames(games);

      if (games.length > 0) {
        const nonCompletedGames = games.filter(game => game.gameStatus !== 'COMPLETED');

        let defaultGame = null;

        // Prioritize games that are IN_PROGRESS or PAUSED
        defaultGame = nonCompletedGames.find(game => game.gameStatus === 'IN_PROGRESS' || game.gameStatus === 'PAUSED');

        // If no IN_PROGRESS or PAUSED game, default to the most recently created non-completed game
        // Assuming 'games' array is already sorted by creation date (or gameDateTime) descending,
        // the first non-completed game would be the most recent.
        if (!defaultGame && nonCompletedGames.length > 0) {
            defaultGame = nonCompletedGames[0];
        }

        // Fallback: if no non-completed games, or if nonCompletedGames is empty,
        // and there are games in the original list, pick the first one.
        // This case should ideally not be hit if nonCompletedGames is handled correctly.
        if (!defaultGame && games.length > 0) {
            defaultGame = games[0];
        }

        setSelectedGameId(defaultGame?.id ?? 'casual');
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
    if (mode === 'setup' && selectedGameId && !isCasualGame) {
        const game = allGames.find(g => g.id === selectedGameId);
        if (game && (game.gameStatus === 'IN_PROGRESS' || game.gameStatus === 'PAUSED')) {
            fetchGameState(selectedGameId);
        } else {
            setGameState(null);
        }
    }
  }, [selectedGameId, allGames, mode, fetchGameState, setGameState, isCasualGame]);

  useEffect(() => {
    if (isPlayScreenActive && gameState?.gameStatus === 'IN_PROGRESS' && !isCasualGame) {
      startPolling(selectedGameId);
    } else {
      stopPolling();
    }
  }, [isPlayScreenActive, gameState?.gameStatus, selectedGameId, startPolling, stopPolling, isCasualGame]);

    useFocusEffect(
    React.useCallback(() => {
      setIsPlayScreenActive(true);
      return () => {
        setIsPlayScreenActive(false);
        stopPolling();
      };
    }, [stopPolling])
  );

  useEffect(() => {
    if (gameState?.gameStatus === 'COMPLETED') {
      stopPolling();
    }
  }, [gameState, stopPolling]);

  useEffect(() => {
    if (!gameState || gameState.gameStatus === 'COMPLETED') return;

    const remaining = gameState.players.filter(p => !p.isEliminated).length;
    if (remaining <= 1 && mode === 'play') {
      if (isCasualGame) {
        // For casual games, mark as completed and transition to review
        setGameState(prevGameState => ({ ...prevGameState, gameStatus: 'COMPLETED' }));
      }
      setMode('review');
    }
  }, [gameState, mode, setGameState, isCasualGame]);


  const handleStartGame = () => {
    if (!selectedGameId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a game to start.' });
      return;
    }
    handleAction(apiActions.startGame, selectedGameId, Array.from(selectedPlayerIds)).then(() => {
        setMode('play');
    });
  }

  const handleStartCasualGame = async () => {
    if (!selectedLeagueId) return;

    try {
      // Find the casual season
      const allSeasons = await api(apiActions.getSeasons, selectedLeagueId);
      const casualSeason = allSeasons.find(s => s.seasonName === "Casual Games");

      if (!casualSeason) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Casual Games season not found.' });
        return;
      }

      // Fetch settings for the casual season
      const casualSeasonSettings = await api(apiActions.getSeasonSettings, casualSeason.id);

      // Initialize local game state
      const initialGameState = {
        gameId: null, // No backend game ID for casual games
        gameStatus: 'IN_PROGRESS',
        players: Array.from(selectedPlayerIds).map(playerId => {
          const player = allPlayers.find(p => p.id === playerId);
          return {
            id: playerId,
            displayName: player?.displayName || 'Unknown Player',
            iconUrl: player?.iconUrl || null,
            isEliminated: false,
            place: null,
            kills: 0,
            bounties: 0,
            hasBounty: false, // Casual games start without bounties
            rank: null,
          };
        }),
        timer: {
          currentLevelIndex: 0,
          timeRemainingSeconds: casualSeasonSettings.durationSeconds,
          blindLevels: casualSeasonSettings.blindLevels,
        },
        settings: casualSeasonSettings,
      };

      setGameState(initialGameState);
      setMode('play');
      Toast.show({ type: 'success', text1: 'Casual Game Started', text2: 'Enjoy your game!' });

    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to start casual game: ${e.message}` });
      console.error("Failed to start casual game:", e);
    }
  };

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

  if (noActiveSeason && selectedGameId !== 'casual') {
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
              <KeyboardAwareScrollView contentContainerStyle={styles.setupContainer}>
                  <Text style={styles.title}>Select Game</Text>
                  <SafePicker
                    selectedValue={selectedGameId ?? 'casual'}
                    onValueChange={(itemValue) => setSelectedGameId(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="black"
                  >
                    {allGames
                      .filter(game => game.gameStatus !== 'COMPLETED')
                      .map(game => (
                        <Picker.Item
                          key={game.id}
                          label={`${game.gameName} (${new Date(game.gameDateTime).toLocaleDateString()}) - ${game.gameStatus || 'SCHEDULED'}`}
                          value={game.id}
                          style={{ color: 'black' }}
                        />
                      ))}
                    <Picker.Item label="Casual Game" value="casual" />
                  </SafePicker>

                  {selectedGame && (selectedGame.gameStatus === 'IN_PROGRESS' || selectedGame.gameStatus === 'PAUSED') ? (
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
                  ) : (
                    <>
                      {isAdmin && (
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
                                        disabled={!isAdmin}
                                    />
                                </View>
                            ))}
                          </View>
                          {selectedGameId && (
                            <View style={styles.centeredButtonContainer}>
                              <TouchableOpacity style={[styles.button, styles.setupStartButton]} onPress={isCasualGame ? handleStartCasualGame : handleStartGame} disabled={isActionLoading}>
                                  <Text style={styles.buttonText}>{isCasualGame ? 'Start Casual Game' : 'Start Game'}</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}
              </KeyboardAwareScrollView>
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
  if ((isAdmin || activeSeasonSettings?.playerEliminationEnabled) && (mode === 'eliminate_select_player' || mode === 'eliminate_select_killer')) {
      mainButton = (
          <TouchableOpacity style={styles.button} onPress={() => setMode('play')} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
      );
  } else if ((isAdmin || activeSeasonSettings?.playerEliminationEnabled) && (gameState.gameStatus === 'IN_PROGRESS' || gameState.gameStatus === 'PAUSED') && mode === 'play') {
      mainButton = (
          <TouchableOpacity style={styles.button} onPress={() => setMode('eliminate_select_player')} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Eliminate Player</Text>
          </TouchableOpacity>
      );
  }

  let undoButton = null;
  if ((isAdmin || activeSeasonSettings?.playerEliminationEnabled) && eliminatedPlayersCount > 0 && gameState.gameStatus === 'IN_PROGRESS') {
      undoButton = (
          <TouchableOpacity style={styles.button} onPress={() => {
              handleAction(apiActions.undoElimination, selectedGameId).then(() => {
                  setMode('play');
              });
          }} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Undo Elimination</Text>
          </TouchableOpacity>
      );
  }

  if (mode === 'edit') {
    return (
        <PageLayout>
            <View style={styles.editScreenContainer}>
                <Text style={styles.title}>Edit Results</Text>
                <View style={styles.playersContainer}>
                    {editableGameState.players.map((player) => (
                        <View key={player.id} style={styles.editPlayerItem}>
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                                <Text style={styles.editPlayerName}>{player.displayName}</Text>
                            </View>
                            <View style={styles.editPlayerStatsContainer}>
                                <View style={styles.statGroup}>
                                    <Text style={styles.statLabel}>Place:</Text>
                                    <TextInput
                                        style={[styles.input, validationErrors[player.id]?.place && styles.inputError]}
                                        value={String(player.place || '')}
                                        onChangeText={(text) => handleEditPlayerState(player.id, 'place', text)}
                                        keyboardType="numeric"
                                    />
                                </View>

                                {!isCasualGame && activeSeasonSettings?.trackKills && (
                                    <View style={styles.statGroup}>
                                        <Text style={styles.statLabel}>Kills:</Text>
                                        <TextInput
                                            style={[styles.input, validationErrors[player.id]?.kills && styles.inputError]}
                                            value={String(player.kills)}
                                            onChangeText={(text) => handleEditPlayerState(player.id, 'kills', text)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}

                                {activeSeasonSettings?.trackBounties && (
                                    <View style={styles.statGroup}>
                                        <Text style={styles.statLabel}>Bounties:</Text>
                                        <TextInput
                                            style={[styles.input, validationErrors[player.id]?.bounties && styles.inputError]}
                                            value={String(player.bounties)}
                                            onChangeText={(text) => handleEditPlayerState(player.id, 'bounties', text)}
                                            keyboardType="numeric"
                                        />
                                    </View>
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
            </View>
        </PageLayout>
    );
  }

  if (mode === 'review') {
    return (
      <PageLayout noScroll>
        <KeyboardAwareScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Final Results</Text>
          <View style={styles.playersContainer}>
            {sortedPlayers.map((player) => {
              const place = player.place ? getOrdinal(player.place) : '1st';
              return (
                <View key={player.id} style={styles.reviewPlayerItem}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                        <Text style={styles.reviewPlayerName}>{player.displayName} {activeSeasonSettings?.trackBounties && player.hasBounty && <Text style={styles.bountyIndicator}>⭐️</Text>}</Text>
                    </View>
                  <View style={styles.reviewPlayerStatsContainer}>
                    <Text style={styles.reviewPlayerStat}>Place: {place}</Text>
                    {!isCasualGame && activeSeasonSettings?.trackKills && (
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
              {isAdmin && !isCasualGame && ( // Only show Finalize & Save for non-casual games
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={async () => {
                      await handleAction(apiActions.finalizeGame, selectedGameId);
                      setMode(null);
                  }}>
                      <Text style={styles.buttonText}>Finalize & Save</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isAdmin && !isCasualGame && ( // Only show Edit for non-casual games
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
              )}
              {undoButton && (
                  <View style={styles.buttonContainer}>
                      {undoButton}
                  </View>
              )}
            </>
          ) : (
            <ActivityIndicator size="large" color="#fb5b5a" style={{ marginTop: 20 }} />
          )}
        </KeyboardAwareScrollView>
      </PageLayout>
    );
  }

  return (
    <PageLayout noScroll>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Game Play</Text>

        {gameState.gameStatus === 'COMPLETED' ? (
          <Text style={styles.gameOverText}>Game Over</Text>
        ) : (
          gameState.timer && gameState.timer.blindLevels && (
              <Timer
                  gameId={gameState.gameId}
                  timerState={gameState.timer}
                  blindLevels={gameState.timer.blindLevels}
                  settings={gameState.settings} // Pass settings prop
                  isPlaying={gameState.gameStatus === 'IN_PROGRESS' && isPlayScreenActive}
                  onTimerEnd={() => setIsTimerFinished(true)}
                  handleAction={handleAction}
                  isCasualGame={isCasualGame} // Pass isCasualGame prop
              />
          )
        )}

        {(isAdmin || activeSeasonSettings?.playerTimerControlEnabled) && gameState.gameStatus !== 'COMPLETED' && (
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
                        {(!isCasualGame && (activeSeasonSettings?.trackKills || activeSeasonSettings?.trackBounties)) && (
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

      </KeyboardAwareScrollView>
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
    marginHorizontal: 10,
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
  casualGameHelpIcon: {
    marginLeft: 10, // Space between button and icon
  },
  centeredButtonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPlayerItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  editPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editPlayerStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    width: 45,
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
  editScreenContainer: {
    padding: 20,
    width: '100%',
  },
  statLabel: {
    marginRight: 5,
  },
  casualGameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the entire row

    marginTop: 10, // Match actionButton's marginTop
    marginBottom: 15, // Match actionButton's marginBottom
  },
  casualGameHelpIcon: {
    marginLeft: 10, // Space between button and icon
  },
});

const PlayPageWrapper = () => {
  const [selectedGameId, setSelectedGameId] = useState(null);
  const isCasualGame = selectedGameId === 'casual';

  return (
    <GameProvider isCasualGame={isCasualGame}>
      <PlayPage selectedGameId={selectedGameId} setSelectedGameId={setSelectedGameId} />
    </GameProvider>
  );
};

export default PlayPageWrapper;