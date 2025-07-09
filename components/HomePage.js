import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';

const HomePage = ({ navigation }) => {
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
//    axios.get('file:///F:/PokerLeague/database/pokerleague.db/league/1', { responseType: 'blob' })
//      .then(response => {
//        console.log(response);
//        console.log(response.data);
//        const logoBlob = new Blob([response.data], { type: response.headers['content-type'] });
//        const url = URL.createObjectURL(logoBlob);
//        setLogoUrl(url);
//      })
//      .catch(error => {
//        console.log('Error retrieving logo');
//        console.log(error);
//      });
  }, []);

  return (
    <View style={styles.container}>
      {logoUrl && <Image source={{ uri: logoUrl }} style={styles.logo} />}
      <Text style={styles.title}>Welcome to the Poker League!</Text>
      <View style={styles.menu}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.menuItem}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Standings')}>
          <Text style={styles.menuItem}>Standings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Play')}>
          <Text style={styles.menuItem}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.menuItem}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
          <Text style={styles.menuItem}>Calendar</Text>
        </TouchableOpacity>
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
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default HomePage;
