import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import PlayersContext from '../context/PlayersContext';

const StandingsPage = () => {
  const { players } = useContext(PlayersContext);
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    const standingsData = players.map((player) => {
      const overallScore = (player.points + player.bounties + (player.kills / 3)).toFixed(2);
      return { ...player, overallScore };
    }).sort((a, b) => b.overallScore - a.overallScore)
      .map((item, index) => ({ ...item, place: index + 1 }));

    setStandings(standingsData);
  }, [players]);

  const renderItem = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{item.place}</Text>
      <Text style={styles.tableCell}>{item.firstName} {item.lastName}</Text>
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
