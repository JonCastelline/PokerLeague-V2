import { Stack } from 'expo-router';
import React, { useState } from 'react';
import PlayersContext from '../context/PlayersContext';

export default function RootLayout() {
  const [players, setPlayers] = useState([
    { id: 1, firstName: "John", lastName: "Doe", kills: 0, place: 0, bounties: 0, points: 5, hasBounty: false, playing: true },
    { id: 2, firstName: "Jane", lastName: "Smith", kills: 0, place: 0, bounties: 0, points: 11, hasBounty: false, playing: true },
    { id: 3, firstName: "Mike", lastName: "Johnson", kills: 0, place: 0, bounties: 0, points: 3, hasBounty: true, playing: true },
    { id: 4, firstName: "Sarah", lastName: "Williams", kills: 0, place: 0, bounties: 0, points: 11, hasBounty: false, playing: true },
    { id: 5, firstName: "David", lastName: "Brown", kills: 0, place: 0, bounties: 0, points: 0, hasBounty: false, playing: false },
    { id: 6, firstName: "Emily", lastName: "Jones", kills: 0, place: 0, bounties: 0, points: 6, hasBounty: false, playing: true },
  ]);

  const updatePlayers = (updatedPlayers) => {
    setPlayers(updatedPlayers);
  };

  return (
    <PlayersContext.Provider value={{ players, updatePlayers }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="home" options={{ title: 'Home' }} />
        <Stack.Screen name="play" options={{ title: 'Play' }} />
        <Stack.Screen name="standings" options={{ title: 'Standings' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      </Stack>
    </PlayersContext.Provider>
  );
}
