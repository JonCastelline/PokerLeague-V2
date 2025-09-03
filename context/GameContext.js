import React, { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as apiActions from '../src/api';
import { Alert } from 'react-native';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { api } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);
  const pollingIntervalRef = useRef(null);

  const handleAction = useCallback(async (action, ...args) => {
    if (isActionLoading) return;
    setIsActionLoading(true);
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
        Alert.alert('Error', e.message);
      }
    } finally {
      setIsActionLoading(false);
    }
  }, [api, isActionLoading]);

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
    if (!gameId) return;
    try {
      const data = await api(apiActions.getGameState, gameId);
      setGameState(data);
      if (callback) callback(data);
    } catch (e) {
      if (e.message !== '401') {
        Alert.alert('Error', e.message);
      }
    }
  }, [api]);

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