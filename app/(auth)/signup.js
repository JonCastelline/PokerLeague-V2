import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { API_BASE_URL } from '../../src/config';

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
      fetch(`${API_BASE_URL}/api/auth/invite-details/${token}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Invalid or expired invite token.');
          }
          return response.json();
        })
        .then(data => {
          setInviteDetails(data);
          setEmail(data.email);
        })
        .catch(error => {
          Alert.alert('Error', error.message);
          // Optionally, redirect or handle the error state
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token]);

  const handleSignUp = () => {
    const isClaiming = !!token;
    const url = isClaiming
      ? `${API_BASE_URL}/api/auth/register-and-claim`
      : `${API_BASE_URL}/api/auth/signup`;

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

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              const errorData = JSON.parse(text);
              throw new Error(errorData.message || 'Sign up failed. Please try again.');
            } catch (e) {
              throw new Error(text || 'Sign up failed. An unknown error occurred.');
            }
          });
        }
        return response.json();
      })
      .then(data => {
        Alert.alert(
          isClaiming ? 'Profile Claimed!' : 'Signup Successful',
          isClaiming ? 'You have successfully claimed your profile.' : 'You can now log in.',
        );
        router.replace('/(auth)'); // Navigate to login
      })
      .catch(error => {
        console.error('Signup/claim request failed:', error);
        Alert.alert('Sign Up Error', error.message);
      });
  };

  if (isLoading) {
      return (
          <View style={styles.container}>
              <Text>Loading invite details...</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Sign Up</Text>
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
    </View>
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
