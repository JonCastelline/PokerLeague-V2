import { useRouter, Link } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import * as apiActions from '../../src/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      const data = await apiActions.login(email, password);
      const user = { id: data.id, firstName: data.firstName, lastName: data.lastName, email: data.email };
      signIn(data.accessToken, user);
      console.log(`Login successful for ${user.firstName} ${user.lastName}`);
      router.replace('/(app)/home');
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: error.message
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
    >
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Login</Text>
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Email"
          placeholderTextColor="#003f5c"
          onChangeText={text => setEmail(text)}
        />
      </View>
      <View style={styles.inputView}>
        <TextInput
          secureTextEntry
          style={styles.inputText}
          placeholder="Password"
          placeholderTextColor="#003f5c"
          onChangeText={text => setPassword(text)}
        />
      </View>
      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginText}>LOGIN</Text>
      </TouchableOpacity>
      <Link href="/signup" style={styles.signupText}>
        Don't have an account? Sign up
      </Link>
      <Link href="/forgot-password" style={styles.forgotPasswordText}>
        Forgot Password?
      </Link>
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
    fontSize: 50,
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
  loginBtn: {
    width: '40%',
    backgroundColor: '#fb5b5a',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  loginText: {
    color: 'white',
  },
  signupText: {
    color: '#003f5c',
  },
  forgotPasswordText: {
    color: '#003f5c',
    marginTop: 10,
  },
});