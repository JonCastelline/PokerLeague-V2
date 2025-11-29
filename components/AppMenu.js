import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import * as Animatable from 'react-native-animatable';
import { useThemeColor } from '../hooks/useThemeColor';
import Colors from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const AppMenu = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const { selectedLeagueId, currentUserMembership } = useLeague();
  const { signOut } = useAuth();
  const animatableRef = useRef(null);

  const styles = React.useMemo(() => StyleSheet.create({
    menuIcon: {
      fontSize: 30,
      paddingLeft: 10, // Give it some space from the edge
      color: menuIconColor,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-start', // Align to the top
      alignItems: 'flex-start', // Align to the left
      backgroundColor: modalOverlayBackgroundColor, // Semi-transparent background
    },
    modalView: {
      margin: 10, // Margin from the top-left corner
      marginTop: 50, // Adjust for status bar
      backgroundColor: modalViewBackgroundColor,
      borderRadius: 10,
      padding: 20,
      alignItems: 'flex-start',
      shadowColor: shadowColor,
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
      color: menuItemTextColor,
    },
  }), [menuIconColor, modalOverlayBackgroundColor, modalViewBackgroundColor, shadowColor, menuItemTextColor]);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const menuIconColor = useThemeColor({}, 'text');
  const modalOverlayBackgroundColor = useThemeColor({ light: 'rgba(0,0,0,0.5)', dark: 'rgba(255,255,255,0.5)' }, 'background');
  const modalViewBackgroundColor = useThemeColor({}, 'cardBackground');
  const shadowColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const menuItemTextColor = useThemeColor({}, 'text');

  if (!selectedLeagueId) {
    return null;
  }

  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

  const navigateTo = (path) => {
    closeMenu();
    router.replace({ pathname: path, params: { leagueId: selectedLeagueId } });
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
            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('season-settings')}>
              <Text style={styles.menuItemText}>Season</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('league-settings')}>
                <Text style={styles.menuItemText}>League</Text>
              </TouchableOpacity>
            )}
            
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