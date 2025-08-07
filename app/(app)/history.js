import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PageLayout from '../../components/PageLayout';

const HistoryPage = () => {
  return (
    <PageLayout>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>History Page</Text>
        <Text>This page will display past games and seasons.</Text>
      </View>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default HistoryPage;
