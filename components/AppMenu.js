import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import * as Animatable from 'react-native-animatable';

const AppMenu = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const { selectedLeagueId } = useLeague();
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
        setModalVisible(false);
      });
    } else {
        setModalVisible(false);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <Animatable.View
            ref={animatableRef}
            animation="zoomIn"
            duration={500}
            style={styles.modalView}
          >
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('home')}>
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('play')}>
              <Text style={styles.menuItemText}>Play</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('standings')}>
              <Text style={styles.menuItemText}>Standings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('history')}>
              <Text style={styles.menuItemText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('settings')}>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuItemText}>Logout</Text>
            </TouchableOpacity>
          </Animatable.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  menuIcon: {
    fontSize: 30,
    paddingLeft: 10, // Give it some space from the edge
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start', // Align to the top
    alignItems: 'flex-start', // Align to the left
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalView: {
    margin: 10, // Margin from the top-left corner
    marginTop: 50, // Adjust for status bar
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
});

export default AppMenu;
