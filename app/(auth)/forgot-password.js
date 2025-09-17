import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import * as apiActions from '../../src/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      const questions = await apiActions.getSecurityQuestionsByEmail(email);
      if (questions.length > 0) {
        router.push({ pathname: '/reset-password', params: { email: email, questions: JSON.stringify(questions) } });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No security questions found for this email.'
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message
      });
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Forgot Password</Text>
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Email"
          placeholderTextColor="#003f5c"
          onChangeText={text => setEmail(text)}
        />
      </View>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>SUBMIT</Text>
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
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 30,
    color: '#fb5b5a',
    marginBottom: 40,
  },
  inputView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    justifyContent: 'center',
    padding: 20,
  },
  inputText: {
    height: 50,
    color: 'black',
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