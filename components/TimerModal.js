
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

const TimerModal = ({ visible, onClose, onSetTime, onResetLevel }) => {
    const [minutes, setMinutes] = useState('');
    const [seconds, setSeconds] = useState('');

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
                        <View style={styles.buttonWrapper}><Button title="Cancel" onPress={onClose} color="red" /></View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
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
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        padding: 10,
        width: 80,
        textAlign: 'center',
        fontSize: 18,
    },
    separator: {
        fontSize: 18,
        marginHorizontal: 10,
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
});

export default TimerModal;
