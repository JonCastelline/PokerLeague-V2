import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';

import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, Switch, TextInput, Modal, TouchableOpacity, Alert, Dimensions } from 'react-native';
import PageLayout from '../../components/PageLayout';
import AddUnregisteredPlayerForm from '../../components/AddUnregisteredPlayerForm';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const LeagueSettingsPage = () => {
  const router = useRouter();
  const { api } = useAuth();
  const { selectedLeagueId, currentUserMembership, loadingCurrentUserMembership, reloadHomeContent, reloadCurrentUserMembership, currentLeague, reloadLeagues } = useLeague();

  // Existing state for members
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers] = useState(null);

  const [nonOwnerAdminsCanManageRoles, setNonOwnerAdminsCanManageRoles] = useState(false);

  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [homeContent, setHomeContent] = useState(''); // To store the content text if we decide to add it later

  const [selectedMember, setSelectedMember] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [playerEmail, setPlayerEmail] = useState('');

  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

  useEffect(() => {
    if (currentLeague) {
      setNonOwnerAdminsCanManageRoles(currentLeague.nonOwnerAdminsCanManageRoles);
    }
  }, [currentLeague]);

  useEffect(() => {
    if (!loadingCurrentUserMembership && !isAdmin) {
      router.replace('/(app)/home');
    }
  }, [isAdmin, loadingCurrentUserMembership, router]);

  const handleSaveLeagueSettings = async () => {
    if (!selectedLeagueId) return;
    try {
      await api(apiActions.updateLeagueSettings, selectedLeagueId, { nonOwnerAdminsCanManageRoles });
      alert('League settings saved successfully!');
      reloadLeagues();
    } catch (e) {
      console.error("Failed to save league settings:", e);
      alert('Failed to save league settings.');
    }
  };

  const fetchHomeContent = useCallback(async () => {
    if (!selectedLeagueId) return;
    try {
      const data = await api(apiActions.getLeagueHomeContent, selectedLeagueId);
      if (data) {
        setHomeContent(data.content || '');
        setLogoImageUrl(data.logoImageUrl || '');
      }
    } catch (e) {
        if (e.message.includes('404')) {
            setHomeContent('');
            setLogoImageUrl('');
            return;
        }
      console.error("Failed to fetch home content:", e);
    }
  }, [selectedLeagueId, api]);

  const handleSaveLogoImageUrl = async () => {
    if (!selectedLeagueId) return;
    try {
      await api(apiActions.updateLeagueHomeContent, selectedLeagueId, homeContent, logoImageUrl);
      alert('Logo URL saved successfully!');
      reloadHomeContent(); // Refresh to show updated logo across the app
    } catch (e) {
      console.error("Failed to save logo URL:", e);
      alert(`Failed to save logo URL: ${e.message}`);
    }
  };


  const handleUpdateRole = async (newRole) => {
    if (!selectedMember) return;
    try {
      await api(apiActions.updateUserRole, selectedLeagueId, selectedMember.id, newRole);
      await fetchLeagueMembers(); // Refresh member list
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      alert(e.message);
    }
  };

  const handleUpdateStatus = (member, isActive) => {
    if (!member) return;

    const action = isActive ? "Activate" : "Deactivate";
    Alert.alert(
      `${action} Player`,
      `Are you sure you want to ${action.toLowerCase()} ${member.displayName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          onPress: async () => {
            try {
              await api(apiActions.updateUserStatus, selectedLeagueId, member.id, isActive);
              await fetchLeagueMembers(); // Refresh member list
              setModalVisible(false);
            } catch (e) {
              console.error(e);
              alert(e.message);
            }
          },
          style: isActive ? "default" : "destructive",
        },
      ]
    );
  };

  const handleTransferOwnership = async () => {
    if (!selectedMember) return;
    Alert.alert(
      "Transfer Ownership",
      `Are you sure you want to make ${selectedMember.displayName} the new owner?\n\nThis action is irreversible.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await api(apiActions.transferOwnership, selectedLeagueId, selectedMember.id);
              await fetchLeagueMembers(); // Refresh member list
              setModalVisible(false);
              alert('Ownership transferred successfully.');
              reloadCurrentUserMembership(); // Reload current user's membership to update roles/ownership
            } catch (e) {
              console.error(e);
              alert(e.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleInvite = async () => {
    if (!selectedMember || !playerEmail) {
      Alert.alert("Validation Error", "Please enter an email address.");
      return;
    }

    try {
      await api(apiActions.inviteUserToClaim, selectedLeagueId, selectedMember.id, playerEmail);
      Alert.alert("Invite Sent", "An in-app invite has been sent to the user.");
      setPlayerEmail(''); // Clear the email input after sending
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", e.message);
    }
  };

  const openManageModal = (member) => {
    setSelectedMember(member);
    setPlayerEmail(''); // Reset email field when opening modal
    setModalVisible(true);
  };

  const fetchLeagueMembers = useCallback(async () => {
    if (!selectedLeagueId) return;
    setLoadingMembers(true);
    try {
      const data = await api(apiActions.getLeagueMembers, selectedLeagueId);
      setMembers(data);
    } catch (e) {
      console.error("Failed to fetch league members:", e);
      setErrorMembers(e.message);
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedLeagueId, api]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        fetchLeagueMembers();
        fetchHomeContent();
      }
    }, [isAdmin, fetchLeagueMembers, fetchHomeContent])
  );

  if (loadingCurrentUserMembership || !isAdmin) {
    return (
      <PageLayout>
        <ActivityIndicator size="large" color="#fb5b5a" />
      </PageLayout>
    );
  }

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberInfoContainer}>
        {item.iconUrl && (
          <Image source={{ uri: item.iconUrl }} style={styles.memberIcon} />
        )}
        <View>
          <Text style={styles.memberName}>{item.displayName}</Text>
          {(item.firstName || item.lastName) && (
            <Text style={styles.realNameText}>({item.firstName} {item.lastName})</Text>
          )}
          <Text style={styles.memberRole}>{item.role} {item.isOwner ? '(Owner)' : ''}</Text>
          {!!item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
          {!item.playerAccountId && <Text style={styles.unregisteredTag}> (Unregistered)</Text>}
          {!item.isActive && <Text style={styles.inactiveTag}> (Inactive)</Text>}
        </View>
      </View>
      {((currentUserMembership?.isOwner || (isAdmin && nonOwnerAdminsCanManageRoles)) && item.id !== currentUserMembership.id && (!item.isOwner || currentUserMembership?.isOwner)) ? (
        <TouchableOpacity onPress={() => openManageModal(item)} style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderManagementOptions = () => {
    if (!selectedMember) return null;

    const isOwner = currentUserMembership?.isOwner;
    const canAdminsManage = nonOwnerAdminsCanManageRoles;
    const canManageRoles = isOwner || (isAdmin && canAdminsManage);
    const targetIsOwner = selectedMember.isOwner;

    if (targetIsOwner) {
        return null; // Safeguard: Owners should not be manageable from this modal
    }

    // Unregistered player options
    if (!selectedMember.playerAccountId) {
      return (
        <View style={styles.modalSection}>
          <Text style={styles.modalSubtitle}>Invite to Claim</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter user's email"
            value={playerEmail}
            onChangeText={setPlayerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, { marginTop: 10 }]} 
            onPress={handleInvite}
          >
            <Text style={styles.textStyle}>Send In-App Invite</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Registered player options
    return (
        <View style={styles.modalSection}>
            {isOwner && selectedMember.role === 'ADMIN' ? (
                <TouchableOpacity
                    style={[styles.button, styles.buttonDestructive]}
                    onPress={() => handleUpdateRole('PLAYER')}
                >
                    <Text style={styles.textStyle}>Demote to Player</Text>
                </TouchableOpacity>
            ) : null}
            {canManageRoles && selectedMember.role === 'PLAYER' ? (
                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, { marginTop: 10 }]} 
                    onPress={() => handleUpdateRole('ADMIN')}
                >
                    <Text style={styles.textStyle}>Promote to Admin</Text>
                </TouchableOpacity>
            ) : null}
            {isOwner ? (
                <TouchableOpacity
                    style={[styles.button, styles.buttonDestructive, { marginTop: 10 }]} 
                    onPress={handleTransferOwnership}
                >
                    <Text style={styles.textStyle}>Transfer Ownership</Text>
                </TouchableOpacity>
            ) : null}
            {isAdmin && !targetIsOwner ? (
                selectedMember.isActive ? (
                    <TouchableOpacity
                        style={[styles.button, styles.buttonDestructive, { marginTop: 10 }]} 
                        onPress={() => handleUpdateStatus(selectedMember, false)}
                    >
                        <Text style={styles.textStyle}>Deactivate Player</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, { marginTop: 10 }]} 
                        onPress={() => handleUpdateStatus(selectedMember, true)}
                    >
                        <Text style={styles.textStyle}>Activate Player</Text>
                    </TouchableOpacity>
                )
            ) : null}
        </View>
    );
  };

  return (
    <PageLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>League Settings</Text>

        {/* League Logo */}
        <View style={styles.logoContainer}>
          {logoImageUrl ? (
            <Image source={{ uri: logoImageUrl }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>No Logo</Text>
            </View>
          )}
        </View>

        {/* Logo Image URL Input */}
        {isAdmin ? (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Logo Image URL</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter image URL"
              value={logoImageUrl}
              onChangeText={setLogoImageUrl}
            />
          </View>
        ) : null}

        {/* Save Logo Image URL Button */}
        {isAdmin ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
            onPress={handleSaveLogoImageUrl}
          >
            <Text style={styles.textStyle}>Save Logo</Text>
          </TouchableOpacity>
        ) : null}

        {/* Admins Can Manage Roles */}
        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Admins Can Manage Roles</Text>
            <Switch
                value={nonOwnerAdminsCanManageRoles}
                onValueChange={setNonOwnerAdminsCanManageRoles}
                disabled={!currentUserMembership?.isOwner} // Only owner can change this
            />
          </View>
        {currentUserMembership?.isOwner && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
            onPress={handleSaveLeagueSettings}
          >
            <Text style={styles.textStyle}>Save League Settings</Text>
          </TouchableOpacity>
        )}


        <Text style={styles.subtitle}>League Members</Text>
        {loadingMembers ? (
          <ActivityIndicator size="large" color="#fb5b5a" />
        ) : errorMembers ? (
          <Text style={styles.errorText}>Error: {errorMembers}</Text>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMemberItem}
            style={styles.memberList}
            scrollEnabled={false}
          />
        )}

        {isAdmin ? (
          <AddUnregisteredPlayerForm leagueId={selectedLeagueId} onPlayerAdded={fetchLeagueMembers} />
        ) : null}

        {selectedMember ? (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Manage {selectedMember.displayName}</Text>

                        {renderManagementOptions()}

                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose, { marginTop: 20 }]} 
                            onPress={() => setModalVisible(!modalVisible)}>
                            <Text style={styles.textStyle}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        ) : null}
      </ScrollView>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
    maxWidth: Dimensions.get('window').width - 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: 150,
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
    marginBottom: 20,
  },
  logoText: {
    color: '#888',
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  settingLabel: {
    marginRight: 10,
    flexShrink: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginTop: 5,
  },
  memberList: {
    width: '100%',
  },
  memberItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  realNameText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  memberRole: {
    fontSize: 14,
    color: 'gray',
  },
  memberEmail: {
    fontSize: 14,
    color: '#007bff',
  },
  unregisteredTag: {
    fontSize: 12,
    color: 'red',
    fontWeight: 'bold',
  },
  inactiveTag: {
    fontSize: 12,
    color: 'gray',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  manageButton: {
    backgroundColor: '#007bff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: 'bold'
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  modalSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '100%',
  },
  buttonClose: {
    backgroundColor: '#6c757d',
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  buttonPrimaryRed: {
    backgroundColor: '#fb5b5a',
  },
  buttonDestructive: {
    backgroundColor: '#dc3545',
  },
  actionButton: {
    width: 'auto',
    alignSelf: 'center',
    marginTop: 10,
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
});

export default LeagueSettingsPage;
