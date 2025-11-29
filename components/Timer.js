import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { useAudioPlayer } from 'expo-audio';
import { useLeague } from '../context/LeagueContext';
import { useGame } from '../context/GameContext';
import * as apiActions from '../src/api';
import TimerModal from './TimerModal';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const Timer = ({ gameId, timerState, blindLevels, settings, isPlaying, onTimerEnd, warningSoundEnabled, warningSoundTimeSeconds, isCasualGame }) => {
  const { currentUserMembership } = useLeague();
  const { handleAction, fireAndForgetAction, setGameState } = useGame();
  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.role === 'OWNER';
  const prevRemainingTimeRef = useRef(0);
  const remainingTimeRef = useRef(0);
  const isMounted = useRef(false);
  const updateIntervalRef = useRef(null);

  const [initialRemainingTime, setInitialRemainingTime] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const isInitialMount = useRef(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const primaryBlueColor = useThemeColor({ light: '#004777', dark: '#42a5f5' }, 'background'); // Example: blue for light, lighter blue for dark
  const warningYellowColor = useThemeColor({ light: '#F7B801', dark: '#ffee58' }, 'background'); // Example: yellow for light, lighter yellow for dark
  const alertRedColor = useThemeColor({ light: '#A30000', dark: '#ef5350' }, 'background'); // Example: red for light, lighter red for dark
  const textColor = useThemeColor({}, 'text');

  const warningSoundPlayer = useAudioPlayer(require('../assets/ding.wav'));
  const alarmPlayer = useAudioPlayer(require('../assets/alarm.mp3'));

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      try {
        if (alarmPlayer) { alarmPlayer.pause(); alarmPlayer.remove(); }
        if (warningSoundPlayer) { warningSoundPlayer.pause(); warningSoundPlayer.remove(); }
      } catch (e) {
        // console.warn("Error cleaning up audio players, but continuing.", e);
        // This always fails with call to AudioPlayer.pause on an object already released, but we'll ignore it
      }
    };
  }, []);

  useEffect(() => {
    if (timerState) {
      if (isCasualGame) {
        // For casual games, the CountdownCircleTimer will manage its own internal state
        // We just need to ensure initialRemainingTime is set correctly
        setInitialRemainingTime(timerState.timeRemainingSeconds);
        remainingTimeRef.current = timerState.timeRemainingSeconds;
        setTimerKey(prevKey => prevKey + 1); // Force re-render of CountdownCircleTimer
      } else if (timerState.timeRemainingInMillis) {
        const serverRemainingTimeSec = timerState.timeRemainingInMillis / 1000;
        setInitialRemainingTime(serverRemainingTimeSec);
        remainingTimeRef.current = serverRemainingTimeSec;
        setTimerKey(prevKey => prevKey + 1); // Force re-render of CountdownCircleTimer
      }
    }
  }, [timerState.currentLevelIndex, timerState.timeRemainingInMillis, timerState.timeRemainingSeconds, isCasualGame]);

  

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      if (alarmPlayer) {
        alarmPlayer.pause();
        alarmPlayer.seekTo(0);
      }
    }
  }, [timerState.currentLevelIndex]);

  const handleComplete = () => {
    if (isMounted.current) {
      alarmPlayer.seekTo(0);
      alarmPlayer.play();
    }
    if (onTimerEnd) {
      onTimerEnd();
    }
    return { shouldRepeat: false };
  };

  const handleOpenModal = async () => {
    const canControlTimer = isAdmin || settings.playerTimerControlEnabled || isCasualGame;
    if (!canControlTimer) return;

    if (isPlaying) {
      // For non-casual games, pause via API. For casual, just update local state.
      if (!isCasualGame) {
        await handleAction(apiActions.pauseGame, gameId);
      } else {
        setGameState(prevGameState => ({ ...prevGameState, gameStatus: 'PAUSED' }));
      }
    }
    setModalVisible(true);
  };

  const handleSetTime = async (timeInMillis) => {
    const canControlTimer = isAdmin || settings.playerTimerControlEnabled || isCasualGame;
    if (!canControlTimer) return;

    if (isCasualGame) {
      setGameState(prevGameState => ({
        ...prevGameState,
        timer: {
          ...prevGameState.timer,
          timeRemainingSeconds: timeInMillis / 1000,
        },
      }));
      setTimerKey(prevKey => prevKey + 1);
    } else {
      const newGameState = await handleAction(apiActions.setTime, gameId, timeInMillis);
      if (newGameState) {
        setInitialRemainingTime(newGameState.timer.timeRemainingInMillis / 1000);
        setTimerKey(prevKey => prevKey + 1);
      }
    }
    setModalVisible(false);
  };

  const handleResetLevel = async () => {
    const canControlTimer = isAdmin || settings.playerTimerControlEnabled || isCasualGame;
    if (!canControlTimer) return;

    if (isCasualGame) {
      setGameState(prevGameState => ({
        ...prevGameState,
        timer: {
          ...prevGameState.timer,
          currentLevelIndex: 0, // Reset to first level
          timeRemainingSeconds: settings.durationSeconds,
        },
      }));
      setTimerKey(prevKey => prevKey + 1);
    } else {
      const newGameState = await handleAction(apiActions.resetLevel, gameId);
      if (newGameState) {
        setInitialRemainingTime(newGameState.timer.timeRemainingInMillis / 1000);
        setTimerKey(prevKey => prevKey + 1);
      }
    }
    setModalVisible(false);
  };

  const renderTime = ({ remainingTime }) => {
    remainingTimeRef.current = remainingTime;
    const displayTime = Math.max(0, remainingTime);

    if (settings.warningSoundEnabled && displayTime === settings.warningSoundTimeSeconds && displayTime !== prevRemainingTimeRef.current) {
      warningSoundPlayer.seekTo(0);
      warningSoundPlayer.play();
    }
    prevRemainingTimeRef.current = displayTime;

    if (displayTime === 0) {
      return <Text style={styles.countdownText}>Level End</Text>;
    }

    const hours = Math.floor(displayTime / 3600);
    const minutes = Math.floor((displayTime % 3600) / 60);
    const seconds = Math.floor(displayTime % 60);

    const formattedTime = [
      hours > 0 ? hours : null,
      minutes,
      seconds
    ].filter(part => part !== null)
     .map(part => part.toString().padStart(2, '0'))
     .join(':');

    return <Text style={styles.countdownText}>{formattedTime}</Text>;
  };

  const currentLevel = blindLevels[timerState.currentLevelIndex];
  const nextLevel = blindLevels[timerState.currentLevelIndex + 1];

  return (
    <View style={styles.timerContainer}>
        <TouchableOpacity onPress={handleOpenModal} disabled={!isAdmin && !isCasualGame}>
            <CountdownCircleTimer
                key={timerKey}
                isPlaying={isPlaying}
                duration={initialRemainingTime}
                colors={[primaryBlueColor, warningYellowColor, alertRedColor, alertRedColor]}
                colorsTime={[10, 6, 3, 0]}
                onComplete={handleComplete}
                size={200}
            >
                {renderTime}
            </CountdownCircleTimer>
        </TouchableOpacity>

      {(isAdmin || isCasualGame) && (
          <TimerModal
            visible={isModalVisible}
            onClose={() => setModalVisible(false)}
            onSetTime={handleSetTime}
            onResetLevel={handleResetLevel}
          />
      )}

      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Level: {timerState.currentLevelIndex + 1}</Text>
      </View>

      {currentLevel && (
        <View style={styles.blindContainer}>
            <View style={styles.blindItem}>
                <Text style={styles.blindLabel}>Small Blind:</Text>
                <Text style={styles.blindValue}>{currentLevel.smallBlind}</Text>
            </View>
            <View style={styles.blindItem}>
                <Text style={styles.blindLabel}>Big Blind:</Text>
                <Text style={styles.blindValue}>{currentLevel.bigBlind}</Text>
            </View>
        </View>
      )}

      {nextLevel && (
        <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Next Level:</Text>
            <View style={styles.blindContainer}>
                <View style={styles.blindItem}>
                    <Text style={styles.blindLabel}>Small Blind:</Text>
                    <Text style={styles.blindValue}>{nextLevel.smallBlind}</Text>
                </View>
                <View style={styles.blindItem}>
                    <Text style={styles.blindLabel}>Big Blind:</Text>
                    <Text style={styles.blindValue}>{nextLevel.bigBlind}</Text>
                </View>
            </View>
        </View>
      )}
    </View>
  );
};

  const isInitialMount = useRef(true);

  const styles = React.useMemo(() => StyleSheet.create({
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    countdownText: {
      fontSize: 40,
      fontWeight: 'bold',
      color: primaryBlueColor,
    },
    levelContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    levelText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: textColor,
    },
    blindContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: 10,
    },
    blindItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '45%',
    },
    blindLabel: {
      fontSize: 16,
      width: 90,
      textAlign: 'right',
      marginRight: 5,
      color: textColor,
    },
    blindValue: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'left',
      flex: 1,
      color: textColor,
    },
  }), [primaryBlueColor, textColor]);

export default Timer;