import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import * as apiActions from '../../src/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { email, questions: questionsString } = params;
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (questionsString) {
      setQuestions(JSON.parse(questionsString));
    }
  }, [questionsString]);

  const handleAnswerChange = (text, questionId) => {
    const otherAnswers = answers.filter(a => a.questionId !== questionId);
    setAnswers([...otherAnswers, { questionId, answer: text }]);
  };

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match.'
      });
      return;
    }

    try {
      await apiActions.verifySecurityAnswersAndResetPassword(email, answers, newPassword);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password has been reset successfully.'
      });
      router.replace('/(auth)');
    } catch (error) {
      console.error(error);
      if (error.message.includes('Security answers verification failed')) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'One or more of your answers are incorrect. Please try again.'
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unexpected error occurred. Please try again later.'
        });
      }
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Reset Password</Text>
      {questions.map(q => (
        <View key={q.id} style={styles.inputView}>
          <Text style={styles.questionText}>{q.questionText}</Text>
          <TextInput
            style={styles.inputText}
            placeholder="Your Answer"
            placeholderTextColor="#003f5c"
            onChangeText={text => handleAnswerChange(text, q.id)}
          />
        </View>
      ))}
      <View style={styles.inputView}>
        <TextInput
          secureTextEntry
          style={styles.inputText}
          placeholder="New Password"
          placeholderTextColor="#003f5c"
          onChangeText={text => setNewPassword(text)}
        />
      </View>
      <View style={styles.inputView}>
        <TextInput
          secureTextEntry
          style={styles.inputText}
          placeholder="Confirm New Password"
          placeholderTextColor="#003f5c"
          onChangeText={text => setConfirmPassword(text)}
        />
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>RESET PASSWORD</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      },
      logo: {
        fontWeight: 'bold',
        fontSize: 30,
        color: '#fb5b5a',
        marginBottom: 40,
      },
      questionText: {
        marginBottom: 10,
        fontSize: 16,
        color: '#003f5c',
      },
      inputView: {
        width: '80%',
        marginBottom: 20,
      },
      inputText: {
        height: 50,
        color: 'black',
        borderWidth: 1,
        borderColor: '#003f5c',
        borderRadius: 5,
        padding: 10,
      },
      submitBtn: {
        width: '80%',
        backgroundColor: '#fb5b5a',
        borderRadius: 25,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 10,
      },
      submitText: {
        color: 'white',
      },
});