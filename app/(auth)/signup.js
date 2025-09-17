import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image } from 'react-native';
import Toast from 'react-native-toast-message';
import * as apiActions from '../../src/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteDetails, setInviteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { token } = useLocalSearchParams();

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      apiActions.getInviteDetails(token)
        .then(data => {
          setInviteDetails(data);
          setEmail(data.email);
        })
        .catch(error => {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token]);

  const handleSignUp = async () => {
    const isClaiming = !!token;
    const action = isClaiming ? apiActions.registerAndClaim : apiActions.signup;
    const body = isClaiming
      ? {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
          token: token,
        }
      : {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
        };

    try {
      await action(body);
      Toast.show({
        type: 'success',
        text1: isClaiming ? 'Profile Claimed!' : 'Signup Successful',
        text2: isClaiming ? 'You have successfully claimed your profile.' : 'You can now log in.'
      });
      router.replace('/(auth)'); // Navigate to login
    } catch (error) {
      console.error('Signup/claim request failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign Up Error',
        text2: error.message
      });
    }
  };

  if (isLoading) {
      return (
          <View style={styles.container}>
              <Text>Loading invite details...</Text>
          </View>
      );
  }

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Sign Up</Text>
      {inviteDetails && (
        <Text style={styles.claimText}>
          You are claiming the profile for "{inviteDetails.displayNameToClaim}" in the "{inviteDetails.leagueName}" league.
        </Text>
      )}
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="First Name"
          placeholderTextColor="#003f5c"
          onChangeText={text => setFirstName(text)}
        />
      </View>
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Last Name"
          placeholderTextColor="#003f5c"
          onChangeText={text => setLastName(text)}
        />
      </View>
      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Email"
          placeholderTextColor="#003f5c"
          value={email}
          onChangeText={text => setEmail(text)}
          editable={!token}
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
      <TouchableOpacity style={styles.signupBtn} onPress={handleSignUp}>
        <Text style={styles.signupText}>{token ? 'REGISTER AND CLAIM' : 'SIGN UP'}</Text>
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
    fontSize: 50,
    color: '#fb5b5a',
    marginBottom: 40,
  },
  claimText: {
    width: '80%',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#003f5c',
  },
  inputView: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 50,
    marginBottom: 20,
    justifyContent: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#003f5c',
  },
  inputText: {
    height: 50,
    color: 'black',
  },
  signupBtn: {
    width: '80%',
    backgroundColor: '#fb5b5a',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  signupText: {
    color: 'white',
  },
});