import { Link } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomePage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Poker League!</Text>
      <View style={styles.menu}>
        <Link href="/" style={styles.menuItem}>Home</Link>
        <Link href="/standings" style={styles.menuItem}>Standings</Link>
        <Link href="/play" style={styles.menuItem}>Play</Link>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
  },
  menu: {
    alignItems: 'center',
  },
  menuItem: {
    fontSize: 18,
    marginVertical: 12,
  },
});

export default HomePage;
