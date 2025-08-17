import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import * as Animatable from 'react-native-animatable';

const UserMenu = ({ isVisible, onClose }) => {
  const router = useRouter();
  const { leagues, switchLeague, selectedLeagueId } = useLeague();
  const { signOut } = useAuth();
  const animatableRef = useRef(null);

  const navigateTo = (path) => {
    closeMenu();
    router.push({ pathname: path, params: { leagueId: selectedLeagueId } });
  };

  const handleLogout = () => {
    closeMenu();
    signOut();
    router.replace('/(auth)');
  };

  const closeMenu = () => {
    if (animatableRef.current) {
      animatableRef.current.zoomOut(500).then(() => {
        onClose();
      });
    } else {
        onClose();
    }
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={closeMenu}
    >
      <Pressable style={styles.modalOverlay} onPress={closeMenu}>
        <Animatable.View
          ref={animatableRef}
          animation="zoomIn"
          duration={500}
          style={styles.modalView}
        >
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('create-league')}>
            <Text style={styles.menuItemText}>Create League</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('join-league')}>
            <Text style={styles.menuItemText}>Join League</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <Text style={styles.menuTitle}>Switch League</Text>
          {leagues.map(league => (
            <TouchableOpacity
              key={league.id}
              style={styles.menuItem}
              onPress={() => {
                switchLeague(league.id);
                closeMenu();
              }}
            >
              <Text style={[styles.menuItemText, selectedLeagueId === league.id && styles.activeLeague]}>{league.leagueName}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuItemText}>Logout</Text>
          </TouchableOpacity>
        </Animatable.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 10,
    marginTop: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    width: '100%',
  },
  menuItemText: {
    fontSize: 18,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    marginVertical: 10,
  },
  activeLeague: {
    fontWeight: 'bold',
    color: '#fb5b5a',
  },
});

export default UserMenu;
