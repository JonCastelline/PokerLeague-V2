import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLeague } from '../context/LeagueContext';
import { useAuth } from '../context/AuthContext';
import * as Animatable from 'react-native-animatable';

const UserMenu = ({ isVisible, onClose }) => {
  const router = useRouter();
  const { leagues, switchLeague, selectedLeagueId } = useLeague();
  const { signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const selectedLeagueName = leagues.find(league => league.id === selectedLeagueId)?.leagueName || 'Select League';
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
          {leagues.length > 0 && (
            <>
              <TouchableOpacity
                style={[styles.dropdownTrigger, leagues.length <= 1 && styles.dropdownTriggerDisabled]}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={leagues.length <= 1}
              >
                <Text style={styles.dropdownTriggerText}>{selectedLeagueName}</Text>
                {leagues.length > 1 && <MaterialIcons name="arrow-drop-down" size={24} color="black" />}
              </TouchableOpacity>
              {isDropdownOpen && (
                <View style={styles.dropdownOptionsContainer}>
                  {leagues.map(league => (
                    <TouchableOpacity
                      key={league.id}
                      style={styles.dropdownOption}
                      onPress={() => {
                        switchLeague(league.id);
                        setIsDropdownOpen(false);
                        closeMenu();
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{league.leagueName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.separator} />
            </>
          )}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('create-league')}>
            <Text style={styles.menuItemText}>Create League</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('join-league')}>
            <Text style={styles.menuItemText}>Join League</Text>
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
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    marginVertical: 5,
  },
    dropdownTrigger: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '100%',
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownTriggerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownOptionsContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '100%',
    marginTop: 5,
    backgroundColor: 'white',
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 16,
  },
  dropdownTriggerDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
});

export default UserMenu;
