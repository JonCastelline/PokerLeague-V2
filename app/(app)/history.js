import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HistoryPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>History Page</Text>
      <Text>This page will display past games and seasons.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default HistoryPage;
