import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PageWrapper from '../../components/PageWrapper';

const HistoryPage = () => {
  return (
    <PageWrapper>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>History Page</Text>
        <Text>This page will display past games and seasons.</Text>
      </View>
    </PageWrapper>
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
