import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Timer from '../../components/Timer';
import PlayersContext from '../../context/PlayersContext';

const PlayPage = () => {
  const { players, updatePlayers } = useContext(PlayersContext);
  const defaultDuration = 15; // Test duration in seconds
  const levels = [ // Test levels
    { smallBlind: 15, bigBlind: 30 },
    { smallBlind: 20, bigBlind: 40 },
    { smallBlind: 25, bigBlind: 50 },
  ];

  const [playerListBorderColor, setPlayerListBorderColor] = useState('black');
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [eliminationOrder, setEliminationOrder] = useState([]);
  const [bountyClaimedBy, setBountyClaimedBy] = useState(null);
  const [playerKilledBy, setPlayerKilledBy] = useState(null);
  const [mode, setMode] = useState('setup');
  const switchToPlayMode = () => setMode('play');
  const totalPlayed = players.filter(player => player.playing).length;
  const playerListTouchable = useState(false);

  const handlePlayerClick = (index) => {
       if (bountyClaimedBy == null && playerKilledBy == null) {
         setSelectedPlayerIndex(index);
         return;
       }

       if (bountyClaimedBy != null) {
         players[index].bounties += 1;
         setBountyClaimedBy(null);
       }

       players[index].kills += 1;
       setPlayerKilledBy(null);
  };


    const handleEliminateButtonClick = () => {
      if (selectedPlayerIndex !== null) {
        const updatedPlayers = [...players]; // Spread operator should be used inside the square brackets
        const eliminatedPlayer = updatedPlayers.splice(
          selectedPlayerIndex,
          1
        )[0];

        const eliminatedPlayerCount = updatedPlayers.filter(player => player.eliminated).length;
        eliminatedPlayer.eliminated = true;
        eliminatedPlayer.place = totalPlayed - eliminatedPlayerCount; // Assign place for eliminated player
        updatedPlayers.push(eliminatedPlayer); // Use updatedPlayers here instead of players
        setSelectedPlayerIndex(null);

        updatedPlayers.sort((a, b) => a.place - b.place);

        // Check if there's only one active player left
        const activePlayers = updatedPlayers.filter(player => !player.eliminated && player.playing);

        //console.log('active players name: ' + activePlayers.firstName + ' ' + activePlayers.lastName);
        if (activePlayers.length === 1) {
          activePlayers[0].place = 1;
          activePlayers[0].eliminated = true;
          activePlayers[0].kills += 1;
          if (eliminatedPlayer.hasBounty) {
            activePlayers[0].bounties += 1;
          }
          updatePlayers(updatedPlayers); // Update state with the modified array
          return updatedPlayers; // Return the modified array
        }

        if (eliminatedPlayer.hasBounty) {
          setBountyClaimedBy(selectedPlayerIndex);
        }

        setPlayerKilledBy(selectedPlayerIndex);

        updatePlayers(updatedPlayers); // Update state with the modified array
        return updatedPlayers; // Return the modified array
      }
    };


    const getOrdinal = (number) => {
      const suffixes = ['th', 'st', 'nd', 'rd'];
      const specialCases = [11, 12, 13]; // Numbers that end with 'th'

      const remainder = number % 100;
      const suffix = suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];

      if (specialCases.includes(remainder)) {
        suffix = 'th';
      }

      return `${number}${suffix}`;
    };

    const handleTogglePlaying = (index) => {
      const updatedPlayers = [...players];
      updatedPlayers[index].playing = !updatedPlayers[index].playing;
      updatePlayers(updatedPlayers);
    };

    return (
      <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {mode === 'setup' ? (
              <>
                {players.map((player, index) => (
                  <TouchableOpacity
                    key={player.id}
                    style={[
                      styles.playerContainer,
                      !player.playing && styles.eliminatedPlayerContainer,
                    ]}
                    onPress={() => handleTogglePlaying(index)}
                  >
                    <Text style={styles.playerName}>
                      {player.firstName} {player.lastName}
                      {player.hasBounty ? ' ⭐️' : null}
                    </Text>
                    <Text style={styles.playerStats}>
                      {!player.playing ? 'Not Playing' : 'Playing'}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.eliminateButton}
                  onPress={switchToPlayMode}
                >
                  <Text style={styles.eliminateButtonText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : mode === 'play' ? (
              <>
                <View style={styles.timerContainer}>
                  <Timer
                    defaultDuration={defaultDuration}
                    levels={levels}
                  />
                </View>
                <View><Text style={styles.playerListHeader}>Players</Text></View>
                  {playerKilledBy !== null ? (
                    <Text style={styles.claimKillText}>Which player claimed the kill?</Text>)
                    : null}
                  {players.sort((a, b) => (a.playing && !b.playing ? -1 : 1)).map((player, index) => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.playerContainer,
                        selectedPlayerIndex === index && styles.selectedPlayerContainer,
                        (!player.playing || player.eliminated) && styles.eliminatedPlayerContainer,
                      ]}
                      onPress={player.eliminated ? null : () => handlePlayerClick(index)}
                    >
                    <Text style={styles.playerName}>
                      {player.firstName} {player.lastName}
                      {player.hasBounty ? ' ⭐️' : null}
                    </Text>
                    <Text style={styles.playerStats}>
                      {player.playing ? `Kills: ${player.kills} | Bounties: ${player.bounties}` : 'DNP'}
                      {player.eliminated ? ` | Place: ${getOrdinal(player.place)}` : player.place === 1 ? '1' : null}
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.eliminateButton, { marginRight: 10 }]}
                    onPress={handleEliminateButtonClick}
                  >
                    <Text style={styles.eliminateButtonText}>Eliminate</Text>
                  </TouchableOpacity>
                </View>
              </>
          ) : (
            <>
                      {/* Render Edit Mode Content */}
            </>
          )}
        </ScrollView>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
  },
  playerListHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  playerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    width: 300,
    alignSelf: 'center',
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'black',
  },
  playerName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerStats: {
    fontSize: 12,
  },
  eliminateButton: {
    backgroundColor: 'blue',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    maxWidth: 100,
  },
  eliminateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedPlayerContainer: {
    borderColor: 'blue',
    borderWidth: 2,
  },
  eliminatedPlayerContainer: {
    borderColor: 'light-gray',
    borderWidth: 1,
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  claimKillText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004777',
    padding: 10,
  },
});

export default PlayPage;
