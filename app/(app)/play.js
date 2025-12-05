import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Switch, TextInput, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { GameProvider, useGame } from '../../context/GameContext';
import * as apiActions from '../../src/api';
import PageLayout from '../../components/PageLayout';
import Timer from '../../components/Timer';
import SafePicker from '../../components/SafePicker';


const PlayPage = (props) => {
  const {
    selectedGameId,
    setSelectedGameId,
    setupData,
    setSetupData,
    error,
    handleStartCasualGame,
    router,
  } = props;

  const { currentUserMembership } = useLeague();
  const { gameState, setGameState, isActionLoading, isTimerFinished, setIsTimerFinished, handleAction, startPolling, stopPolling, fetchGameState, isCasualGame } = useGame();
  const [editableGameState, setEditableGameState] = useState(null);
  const [mode, setMode] = useState('setup'); // 'setup', 'play', 'review', 'eliminate_select_player', 'eliminate_select_killer', 'edit'
  const [validationErrors, setValidationErrors] = useState({});
  const [isPlayScreenActive, setIsPlayScreenActive] = useState(true);

  const { loading, allPlayers, selectedPlayerIds, activeSeason, activeSeasonSettings, allGames, noActiveSeason, selectedPlayerToEliminate } = setupData;

    const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;
  
    const selectablePlayers = useMemo(() => {
      return isCasualGame ? allPlayers : allPlayers.filter(p => p.isActive);
      }, [isCasualGame, allPlayers]);
    
    const handlePickerValueChange = useCallback((itemValue) => {    setSelectedGameId(itemValue);
  }, [setSelectedGameId]);

  const pickerItems = useMemo(() => {
    const items = allGames
      .filter(game => game.gameStatus !== 'COMPLETED')
      .map(game => (
        <SafePicker.Item
          key={game.id}
          label={`${game.gameName} (${new Date(game.gameDateTime).toLocaleDateString()}) - ${game.gameStatus || 'SCHEDULED'}`}
          value={game.id}
          style={{ color: 'black' }}
        />
      ));
    items.push(<SafePicker.Item key="casual" label="Casual Game" value="casual" />);
    return items;
  }, [allGames]);

  const nonCompletedGames = allGames.filter(game => game.gameStatus !== 'COMPLETED');
  const onlyCasualGameAvailable = nonCompletedGames.length === 0;

  const getOrdinal = (n) => {
    if (n === null || n === undefined) return '';
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

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

  const onStartCasualGame = () => {
    handleStartCasualGame(allPlayers, selectedPlayerIds).then(initialGameState => {
        if (initialGameState) {
            setGameState(initialGameState);
            setMode('play');
        }
    });
  };

  const togglePlayerSelection = (playerId) => {
    setSetupData(prevData => {
        const newSelection = new Set(prevData.selectedPlayerIds);
        if (newSelection.has(playerId)) {
          newSelection.delete(playerId);
        } else {
          newSelection.add(playerId);
        }
        return { ...prevData, selectedPlayerIds: newSelection };
    });
  };

  const handlePlayerPress = (player) => {
    if (mode === 'eliminate_select_player') {
        setSetupData(prevData => ({ ...prevData, selectedPlayerToEliminate: player }));
        setMode('eliminate_select_killer');
    } else if (mode === 'eliminate_select_killer') {
        handleAction(apiActions.eliminatePlayer, selectedGameId, selectedPlayerToEliminate.id, player.id);
        setMode('play');
        setSetupData(prevData => ({ ...prevData, selectedPlayerToEliminate: null }));
    }
  }

  const handleUpdateResults = async () => {
    setValidationErrors({});
    if (!editableGameState) return;

    const players = editableGameState.players;
    const numPlayers = players.length;
    const errors = {};

    const totalKills = players.reduce((sum, p) => sum + (parseInt(p.kills, 10) || 0), 0);
    if (totalKills > numPlayers - 1) {
      errors.general = `Total kills (${totalKills}) cannot exceed the number of players minus one (${numPlayers - 1}).`;
    }

    const availableBounties = gameState.players.filter(p => p.hasBounty).length;
    const totalBounties = players.reduce((sum, p) => sum + (parseInt(p.bounties, 10) || 0), 0);
    if (totalBounties > availableBounties) {
      errors.general = (errors.general || '') + `\nTotal bounties (${totalBounties}) cannot exceed the number of available bounties (${availableBounties}).`;
    }

    const places = players.map(p => parseInt(p.place, 10) || 0).filter(p => p > 0);
    const uniquePlaces = new Set(places);
    if (places.length !== uniquePlaces.size) {
        errors.general = (errors.general || '') + '\nEach player must have a unique place. No ties are allowed.';
    }

    for (const player of players) {
        const place = parseInt(player.place, 10);
        if (isNaN(place) || place < 1 || place > numPlayers) {
            errors[player.id] = { ...errors[player.id], place: `Place must be between 1 and ${numPlayers}.` };
        }
    }

    const firstPlacePlayer = players.find(p => (parseInt(p.place, 10) || 0) === 1);
    if (firstPlacePlayer && (parseInt(firstPlacePlayer.kills, 10) || 0) === 0) {
        errors[firstPlacePlayer.id] = { ...errors[firstPlacePlayer.id], kills: '1st place must have > 0 kills.' };
    }

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

  if (loading) {
    return <PageLayout><ActivityIndicator size="large" color="#fb5b5a" /></PageLayout>;
  }

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
        if (loading) {
            return <PageLayout><ActivityIndicator size="large" color="#fb5b5a" /></PageLayout>;
        }

        if (isAdmin && allPlayers.length <= 1) {
            return (
                <PageLayout>
                    <View style={styles.centeredMessage}>
                        <Text style={styles.title}>Add Players to Get Started</Text>
                        <Text style={styles.emptyStateSubtitle}>
                            Your league needs at least two players to start a game.
                        </Text>
                        <Text style={styles.bodyText}>
                            Go to League Settings to invite players using your league's invite code or to add unregistered players manually.
                        </Text>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.replace('/(app)/league-settings')}
                        >
                            <Text style={styles.buttonText}>Go to League Settings</Text>
                        </TouchableOpacity>
                    </View>
                </PageLayout>
            );
        }

        const selectedGame = allGames.find(g => g.id === selectedGameId);

        return (
            <PageLayout>
                <KeyboardAwareScrollView contentContainerStyle={styles.setupContainer}>
                    <Text style={styles.title}>Select Game</Text>
                    <SafePicker
                      selectedValue={selectedGameId ?? 'casual'}
                      onValueChange={handlePickerValueChange}
                      style={styles.picker}
                      dropdownIconColor="black"
                    >
                      {pickerItems}
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
                  {(isAdmin || isCasualGame) && (
                    <>
                      <Text style={styles.title}>Select Players</Text>
                      <View style={{width: '100%'}}>
                        {selectablePlayers.map(player => (
                            <View key={player.id} style={styles.playerSetupItem}>
                                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                                    {player.iconUrl ? <Image source={{ uri: player.iconUrl }} style={styles.playerIcon} /> : <View style={styles.playerIcon} />}
                                    <Text>{player.displayName}</Text>
                                </View>
                                <Switch
                                    value={selectedPlayerIds.has(player.id)}
                                    onValueChange={() => togglePlayerSelection(player.id)}
                                    disabled={!isAdmin && !isCasualGame}
                                />
                            </View>
                        ))}
                      </View>
                      {(selectedGameId || onlyCasualGameAvailable) && (
                        <View style={styles.centeredButtonContainer}>
                          <TouchableOpacity
                            style={[styles.button, styles.setupStartButton]}
                            onPress={onlyCasualGameAvailable ? onStartCasualGame : (isCasualGame ? onStartCasualGame : handleStartGame)}
                            disabled={isActionLoading}
                          >
                              <Text style={styles.buttonText}>{onlyCasualGameAvailable || isCasualGame ? 'Start Casual Game' : 'Start Game'}</Text>
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
  if ((isAdmin || activeSeasonSettings?.playerEliminationEnabled || isCasualGame) && (mode === 'eliminate_select_player' || mode === 'eliminate_select_killer')) {
      mainButton = (
          <TouchableOpacity style={styles.button} onPress={() => setMode('play')} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
      );
  } else if ((isAdmin || activeSeasonSettings?.playerEliminationEnabled || isCasualGame) && (gameState.gameStatus === 'IN_PROGRESS' || gameState.gameStatus === 'PAUSED') && mode === 'play') {
      mainButton = (
          <TouchableOpacity style={styles.button} onPress={() => setMode('eliminate_select_player')} disabled={isActionLoading}>
              <Text style={styles.buttonText}>Eliminate Player</Text>
          </TouchableOpacity>
      );
  }

  let undoButton = null;
  if ((isAdmin || activeSeasonSettings?.playerEliminationEnabled || isCasualGame) && eliminatedPlayersCount > 0 && gameState.gameStatus === 'IN_PROGRESS') {
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

        {(isAdmin || activeSeasonSettings?.playerTimerControlEnabled || isCasualGame) && gameState.gameStatus !== 'COMPLETED' && (
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
                        {gameState.gameStatus === 'COMPLETED' ? (
                            <Text style={styles.playerStatLine}>Place: {player.isEliminated ? getOrdinal(player.place) : '1st'}</Text>
                        ) : (
                            player.isEliminated && <Text style={styles.playerStatLine}>Place: {getOrdinal(player.place)}</Text>
                        )}
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
    width: '100%',
    height: 50,
    marginBottom: 20,
    backgroundColor: 'white',
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
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateSubtitle: {
      fontSize: 18,
      textAlign: 'center',
      color: '#666',
      marginBottom: 20,
  },
  bodyText: {
      fontSize: 16,
      textAlign: 'center',
      color: '#333',
      marginBottom: 30,
  },
  actionButton: {
      backgroundColor: '#fb5b5a',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
  },
});

const PlayPageWrapper = (props) => {
  const { api } = useAuth();
  const { selectedLeagueId, activeSeason, loadingSeason } = useLeague();
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [error, setError] = useState(null);
  const [setupData, setSetupData] = useState({
    loading: true,
    allPlayers: [],
    selectedPlayerIds: new Set(),
    activeSeason: null,
    activeSeasonSettings: null,
    allGames: [],
    noActiveSeason: false,
    selectedPlayerToEliminate: null,
  });

  const isCasualGame = selectedGameId === 'casual';

  useEffect(() => {
    const loadPlayPageData = async () => {
      if (!selectedLeagueId) {
        setSetupData(prev => ({ ...prev, loading: false }));
        return;
      }
      
      // Use the loading state from the context to wait for season determination
      if (loadingSeason) {
        setSetupData(prev => ({ ...prev, loading: true }));
        return;
      }

      try {
        const seasonToFetch = activeSeason?.id;
        const playPageData = await api(apiActions.getPlayPageData, selectedLeagueId, seasonToFetch);

        const newSetupData = {
          loading: false,
          allPlayers: playPageData.members || [],
          selectedPlayerIds: new Set((playPageData.members || []).filter(m => m.isActive).map(m => m.id)),
          activeSeason: playPageData.activeSeason,
          activeSeasonSettings: playPageData.activeSeasonSettings,
          allGames: playPageData.activeSeasonGames || [],
          noActiveSeason: !playPageData.activeSeason,
          selectedPlayerToEliminate: null,
          casualSeasonSettings: playPageData.casualSeasonSettings,
        };

        if (playPageData.activeSeason) {
          const nonCompletedGames = (playPageData.activeSeasonGames || []).filter(game => game.gameStatus !== 'COMPLETED');
          let defaultGame = nonCompletedGames.find(game => game.gameStatus === 'IN_PROGRESS' || game.gameStatus === 'PAUSED');
          if (!defaultGame && nonCompletedGames.length > 0) {
            defaultGame = nonCompletedGames[0];
          }
          setSelectedGameId(defaultGame ? defaultGame.id : 'casual');
        } else {
          setSelectedGameId('casual');
        }

        setSetupData(newSetupData);

      } catch (e) {
        if (e.message !== '401') {
          setError(e.message);
        }
        setSetupData(prev => ({ ...prev, loading: false }));
      }
    };

    loadPlayPageData();
  }, [selectedLeagueId, activeSeason, loadingSeason, api]);

  const handleStartCasualGame = useCallback(async (allPlayers, selectedPlayerIds) => {
    if (!selectedLeagueId) return null;

    const casualSeasonSettings = setupData.casualSeasonSettings;

    if (!casualSeasonSettings) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Casual game settings not found.' });
        return null;
    }

    try {
      const initialGameState = {
        gameId: null,
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
            hasBounty: false,
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

      Toast.show({ type: 'success', text1: 'Casual Game Started', text2: 'Enjoy your game!' });
      return initialGameState;

    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: `Failed to start casual game: ${e.message}` });
      console.error("Failed to start casual game:", e);
      return null;
    }
  }, [selectedLeagueId, setupData.casualSeasonSettings]);

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      return () => {
        setError(null);
        setSetupData({
            loading: true,
            allPlayers: [],
            selectedPlayerIds: new Set(),
            activeSeason: null,
            activeSeasonSettings: null,
            allGames: [],
            noActiveSeason: false,
            selectedPlayerToEliminate: null,
        });
        setSelectedGameId(null);
      };
    }, [setSelectedGameId])
  );

  return (
    <GameProvider isCasualGame={isCasualGame}>
      <PlayPage
        router={router}
        selectedGameId={selectedGameId}
        setSelectedGameId={setSelectedGameId}
        setupData={setupData}
        setSetupData={setSetupData}
        error={error}
        handleStartCasualGame={handleStartCasualGame}
      />
    </GameProvider>
  );
};

export default PlayPageWrapper;