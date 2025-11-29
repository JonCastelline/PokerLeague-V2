
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const TimerModal = ({ visible, onClose, onSetTime, onResetLevel }) => {
    const [minutes, setMinutes] = useState('');
    const [seconds, setSeconds] = useState('');

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme || 'light'];

    const modalOverlayBackgroundColor = useThemeColor({ light: 'rgba(0,0,0,0.5)', dark: 'rgba(0,0,0,0.7)' }, 'background');
    const modalViewBackgroundColor = useThemeColor({}, 'cardBackground');
    const shadowColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
    const inputBorderColor = useThemeColor({ light: 'gray', dark: '#bbbbbb' }, 'background');
    const destructiveButtonColor = useThemeColor({ light: 'red', dark: '#ff6666' }, 'background');
    const textColor = useThemeColor({}, 'text');
    const primaryButtonColor = useThemeColor({ light: colors.tint, dark: colors.tint }, 'background');

    const handleSetTime = () => {
        const totalSeconds = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
        onSetTime(totalSeconds * 1000);
        setMinutes('');
        setSeconds('');
        onClose();
    };

    const handleResetLevel = () => {
        onResetLevel();
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.centeredView}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>Adjust Timer</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Minutes"
                            keyboardType="number-pad"
                            onChangeText={setMinutes}
                            value={minutes}
                        />
                        <Text style={styles.separator}>:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Seconds"
                            keyboardType="number-pad"
                            onChangeText={setSeconds}
                            value={seconds}
                        />
                    </View>
                    <View style={styles.buttonContainer}>
                        <View style={styles.buttonWrapper}><Button title="   Set Time   " onPress={handleSetTime} /></View>
                        <View style={styles.buttonWrapper}><Button title="Reset Level" onPress={handleResetLevel} /></View>
                    </View>
                    <View style={styles.singleButtonContainer}>
                        <View style={styles.buttonWrapper}><Button title="Cancel" onPress={onClose} color={destructiveButtonColor} /></View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

    const styles = React.useMemo(() => StyleSheet.create({
        centeredView: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: modalOverlayBackgroundColor,
        },
        modalView: {
            margin: 20,
            backgroundColor: modalViewBackgroundColor,
            borderRadius: 20,
            padding: 35,
            alignItems: 'center',
            shadowColor: shadowColor,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        modalText: {
            marginBottom: 15,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            color: textColor,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
        },
        input: {
            borderWidth: 1,
            borderColor: inputBorderColor,
            borderRadius: 5,
            padding: 10,
            width: 80,
            textAlign: 'center',
            fontSize: 18,
            color: textColor,
            backgroundColor: modalViewBackgroundColor,
        },
        separator: {
            fontSize: 18,
            marginHorizontal: 10,
            color: textColor,
        },
        buttonContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            width: '100%',
            marginTop: 20,
        },
        buttonWrapper: {
            marginHorizontal: 5,
            borderRadius: 5,
        },
        singleButtonContainer: {
            width: '100%',
            alignItems: 'center',
            marginTop: 10,
        },
    }), [modalOverlayBackgroundColor, modalViewBackgroundColor, shadowColor, inputBorderColor, destructiveButtonColor, textColor, primaryButtonColor]);

export default TimerModal;
