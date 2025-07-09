import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Timer from './Timer';
import { Audio } from 'expo-av';

const Level = forwardRef(
  (
    {
      smallBlind,
      bigBlind,
      nextSmallBlind,
      nextBigBlind,
      duration,
      onCompletion,
      onStartPause,
      onNextLevel,
      onPrevLevel,
    },
    ref
  ) => {
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [sound, setSound] = useState(null);

    const timerRef = useRef();

    useImperativeHandle(ref, () => ({
        resetTimer() {
            timerRef.current.resetTimer();
        }
    }));

    const handleTimerUpdate = (timeInSeconds) => {
      if (timeInSeconds === 0) {
        setIsTimerRunning(false);
      }

      if (timeInSeconds === 300) {
        playDing();
      }
    };

    const startPause = () => {
      onStartPause();
      setIsTimerRunning(!isTimerRunning);
      setSound(null);
    };

    const nextLevel = () => {
      onNextLevel();
      setIsTimerRunning(false);
      setResetTimer(true);
      setSound(null);
      setResetTimer(false);
    };

    const prevLevel = () => {
      onPrevLevel();
      setIsTimerRunning(false);
      setResetTimer(true);
      setSound(null);
      setResetTimer(false);
    };

    const handleTimerComplete = async () => {
      onCompletion();
      await playAlarm();
    };

    const playAlarm = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/alarm.mp3'));
        setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing sound', error);
      }
    };

    const playDing = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/ding.mp3'));
        setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing sound', error);
      }
    };

    useEffect(() => {
      if (sound) {
        return () => {
          sound.unloadAsync();
        };
      }
    }, [sound]);

    return (
      <View>
        <Timer
          duration={duration}
          onCompletion={handleTimerComplete}
          onUpdate={handleTimerUpdate}
          reset={timerRef}
        />
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={prevLevel}>
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={startPause}>
            <Text style={styles.buttonText}>{isTimerRunning ? 'Pause' : 'Start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={nextLevel}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.blindsContainer}>
          <View style={styles.blind}>
            <Text style={styles.blindText}>Small Blind</Text>
            <Text style={styles.blindValue}>{smallBlind}</Text>
          </View>
          <View style={styles.blind}>
            <Text style={styles.blindText}>Big Blind</Text>
            <Text style={styles.blindValue}>{bigBlind}</Text>
          </View>
        </View>
        <View style={styles.nextBlindsContainer}>
          <View style={styles.blind}>
            <Text style={styles.nextBlindText}>Next Small Blind</Text>
            <Text style={styles.nextBlindValue}>{nextSmallBlind}</Text>
          </View>
          <View style={styles.blind}>
            <Text style={styles.nextBlindText}>Next Big Blind</Text>
            <Text style={styles.nextBlindValue}>{nextBigBlind}</Text>
          </View>
        </View>
      </View>
  );
});

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  blindsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  blind: {
    alignItems: 'center',
  },
  blindText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  blindValue: {
    fontSize: 20,
  },
  nextBlindsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nextBlindText: {
    fontSize: 14,
  },
  nextBlindValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Level;
