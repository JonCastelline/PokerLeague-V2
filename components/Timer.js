import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';
import { useAudioPlayer } from 'expo-audio';

const Timer = ({ timerState, blindLevels, isPlaying, onTimerEnd, warningSoundEnabled, warningSoundTimeSeconds }) => {
  const prevRemainingTimeRef = useRef(0);

  const warningSoundPlayer = useAudioPlayer(require('../assets/ding.wav'));
  const alarmPlayer = useAudioPlayer(require('../assets/alarm.mp3'));

  const handleComplete = () => {
    alarmPlayer.seekTo(0);
    alarmPlayer.play();
    if (onTimerEnd) {
        onTimerEnd();
    }
    return { shouldRepeat: false };
  };

  const renderTime = ({ remainingTime }) => {
    const displayTime = Math.max(0, remainingTime);

    if (warningSoundEnabled && displayTime === warningSoundTimeSeconds && displayTime !== prevRemainingTimeRef.current) {
        warningSoundPlayer.seekTo(0);
        warningSoundPlayer.play();
    }
    prevRemainingTimeRef.current = displayTime;

    if (displayTime === 0) {
        return <Text style={styles.countdownText}>Level End</Text>;
    }

    const hours = Math.floor(displayTime / 3600);
    const minutes = Math.floor((displayTime % 3600) / 60);
    const seconds = displayTime % 60;

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
      <CountdownCircleTimer
        key={timerState.currentLevelIndex} // Keep the key to reset the timer animation
        isPlaying={isPlaying}
        duration={timerState.timeRemainingInMillis / 1000}
        colors={['#004777', '#F7B801', '#A30000', '#A30000']}
        colorsTime={[10, 6, 3, 0]}
        onComplete={handleComplete}
        size={200}
      >
        {renderTime}
      </CountdownCircleTimer>

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

const styles = StyleSheet.create({
    timerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    countdownText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#004777',
    },
    levelContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    levelText: {
        fontSize: 18,
        fontWeight: 'bold',
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
    },
    blindValue: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'left',
        flex: 1,
    },
});

export default Timer;