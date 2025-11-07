import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as apiActions from '../src/api';
import Toast from 'react-native-toast-message';

const GameContext = createContext();

export const GameProvider = ({ children, isCasualGame }) => {
  const { api } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const pollingIntervalRef = useRef(null);

  const handleAction = useCallback(async (action, ...args) => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    if (isCasualGame) {
      // Handle casual game actions locally
      let updatedGameState = { ...gameState };
      const gameId = args[0];

      try {
        switch (action) {
          case apiActions.previousLevel:
            if (updatedGameState.timer.currentLevelIndex > 0) {
              updatedGameState.timer.currentLevelIndex--;
              updatedGameState.timer.timeRemainingSeconds = updatedGameState.settings.durationSeconds;
              setIsTimerFinished(false);
            }
            break;
          case apiActions.nextLevel:
            if (updatedGameState.timer.currentLevelIndex < updatedGameState.timer.blindLevels.length - 1) {
              updatedGameState.timer.currentLevelIndex++;
              updatedGameState.timer.timeRemainingSeconds = updatedGameState.settings.durationSeconds;
              setIsTimerFinished(false);
            }
            break;
          case apiActions.pauseGame:
            updatedGameState.gameStatus = 'PAUSED';
            break;
          case apiActions.resumeGame:
            updatedGameState.gameStatus = 'IN_PROGRESS';
            break;
          case apiActions.eliminatePlayer:
            const eliminatedPlayerId = args[1];
            const killerPlayerId = args[2];
            const totalPlayers = updatedGameState.players.length;
            const eliminatedPlayersCount = updatedGameState.players.filter(p => p.isEliminated).length;
            const assignedPlace = totalPlayers - eliminatedPlayersCount; // Assign place from highest (last) down to 2nd

            updatedGameState.players = updatedGameState.players.map(p => {
              if (p.id === eliminatedPlayerId) {
                return { ...p, isEliminated: true, place: assignedPlace };
              }
              // Only track kills for non-casual games
              if (!isCasualGame && p.id === killerPlayerId && updatedGameState.settings.trackKills) {
                return { ...p, kills: (p.kills || 0) + 1 };
              }
              return p;
            });
            break;
          case apiActions.undoElimination:
            const lastEliminatedPlayer = updatedGameState.players
              .filter(p => p.isEliminated)
              .sort((a, b) => (b.place || 0) - (a.place || 0))[0]; // Get the last eliminated player

            if (lastEliminatedPlayer) {
              updatedGameState.players = updatedGameState.players.map(p => {
                if (p.id === lastEliminatedPlayer.id) {
                  return { ...p, isEliminated: false, place: null };
                }
                // Kill tracking is not enabled for casual games, so no kill decrement needed here.
                // For non-casual games, the backend API for undoElimination should handle kill decrement.
                return p;
              });
            }
            break;
          case apiActions.updateGameResults:
            const results = args[1].results;
            updatedGameState.players = updatedGameState.players.map(player => {
              const result = results.find(r => r.playerId === player.id);
              if (result) {
                return {
                  ...player,
                  place: result.place,
                  kills: result.kills,
                  bounties: result.bounties,
                  isEliminated: result.place > 0, // If they have a place, they are eliminated
                };
              }
              return player;
            });
            updatedGameState.gameStatus = 'COMPLETED'; // Mark as completed after results update
            break;
          case apiActions.finalizeGame:
            // For casual games, finalize means just setting status to completed locally
            updatedGameState.gameStatus = 'COMPLETED';
            break;
          default:
            console.warn(`Unhandled casual game action: ${action.name}`);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Unhandled casual game action.' });
            setIsActionLoading(false);
            return;
        }
        setGameState(updatedGameState);
        setIsActionLoading(false);
        return updatedGameState;
      } catch (e) {
        console.error("Error handling casual game action:", e);
        Toast.show({ type: 'error', text1: 'Error', text2: `Casual game action failed: ${e.message}` });
        setIsActionLoading(false);
        return;
      }
    } else {
      // API call logic for non-casual games
      try {
        if (action === apiActions.nextLevel || action === apiActions.previousLevel) {
          setIsTimerFinished(false);
        }
        const newGameState = await api(action, ...args);
        if (action === apiActions.finalizeGame) {
          setGameState(prevState => ({ ...prevState, gameStatus: 'COMPLETED' }));
          return { ...newGameState, gameStatus: 'COMPLETED' };
        } else {
          setGameState(newGameState);
          return newGameState;
        }
      } catch (e) {
        if (e.message !== '401') {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message
          });
        }
      } finally {
        setIsActionLoading(false);
      }
    }
  }, [api, isActionLoading, gameState, isCasualGame, setIsTimerFinished, setGameState]);

  const fireAndForgetAction = useCallback(async (action, ...args) => {
    try {
      await api(action, ...args);
    } catch (e) {
      if (e.message !== '401') {
        // Don't show an alert for these, just log it.
        console.error('Fire and forget action failed:', e);
      }
    }
  }, [api]);

  const fetchGameState = useCallback(async (gameId, callback) => {
    if (!gameId || isCasualGame) return; // Do not fetch for casual games
    try {
      const data = await api(apiActions.getGameState, gameId);
      setGameState(data);
      if (callback) callback(data);
    } catch (e) {
      if (e.message !== '401') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message
        });
      }
    }
  }, [api, isCasualGame]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((gameId) => {
    stopPolling(); // Ensure no multiple polls are running
    fetchGameState(gameId, (fetchedState) => {
      if (fetchedState && fetchedState.gameStatus === 'IN_PROGRESS') {
        pollingIntervalRef.current = setInterval(() => fetchGameState(gameId), 5000);
      }
    });
  }, [fetchGameState, stopPolling]);

  useEffect(() => {
    // Cleanup on unmount
    return () => stopPolling();
  }, []);

  const value = {
    gameState,
    setGameState,
    isActionLoading,
    isTimerFinished,
    setIsTimerFinished,
    handleAction,
    startPolling,
    stopPolling,
    fetchGameState,
    isCasualGame, // Pass isCasualGame to context
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};