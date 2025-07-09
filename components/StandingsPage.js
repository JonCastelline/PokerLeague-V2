import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';

    const testData = [
        {
            id: 1,
            player: 'John Doe',
            kills: 5,
            bounties: 3,
            points: 15
          },
          {
              id: 2,
              player: 'Jane Smith',
              kills: 7,
              bounties: 2,
              points: 20
            },
            {
                id: 3,
                player: 'Bob Johnson',
                kills: 4,
                bounties: 1,
                points: 10
              }
    ];

    const StandingsPage = () => {
      const [standings, setStandings] = useState([]);

      useEffect(() => {
          // Here you can make a request to the backend to get the standings data
          // and update the state with the response data.
          // For now, we'll use the test data.
          setStandings(testData.map((item) => {
            const overallScore = (item.points + item.bounties + (item.kills / 3)).toFixed(2);
            return { ...item, overallScore };
          }).sort((a, b) => b.overallScore - a.overallScore)
            .map((item, index) => ({ ...item, place: index + 1 })));
        },
      []);

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.place}</Text>
      <Text style={styles.tableCell}>{item.player}</Text>
      <Text style={styles.tableCell}>{item.kills}</Text>
      <Text style={styles.tableCell}>{item.bounties}</Text>
      <Text style={styles.tableCell}>{item.points}</Text>
      <Text style={styles.tableCell}>{item.overallScore}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Standings</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Place</Text>
        <Text style={styles.headerCell}>Player</Text>
        <Text style={styles.headerCell}>Kills</Text>
        <Text style={styles.headerCell}>Bounty</Text>
        <Text style={styles.headerCell}>Points</Text>
        <Text style={styles.headerCell}>Overall</Text>
      </View>
      <FlatList
        data={standings}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        style={styles.table}
      />
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  table: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
});

export default StandingsPage;
