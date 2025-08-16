import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'react-native';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, Switch, TextInput, Modal, TouchableOpacity, Alert, Dimensions } from 'react-native';
import PageLayout from '../../components/PageLayout';
import AddUnregisteredPlayerForm from '../../components/AddUnregisteredPlayerForm';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';
import { useRouter } from 'expo-router';

const LeagueSettingsPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const { selectedLeagueId, currentUserMembership, loadingCurrentUserMembership, reloadHomeContent, reloadCurrentUserMembership, currentLeague, reloadLeagues } = useLeague();

  // Existing state for members
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers] = useState(null);

  // State for player management modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [nonOwnerAdminsCanManageRoles, setNonOwnerAdminsCanManageRoles] = useState(false);

  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [homeContent, setHomeContent] = useState(''); // To store the content text if we decide to add it later

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
    if (!selectedLeagueId || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nonOwnerAdminsCanManageRoles: nonOwnerAdminsCanManageRoles }),
        });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      alert('League settings saved successfully!');
      reloadLeagues();
    } catch (e) {
      console.error("Failed to save league settings:", e);
      alert('Failed to save league settings.');
    }
  };

  const fetchHomeContent = useCallback(async () => {
    if (!selectedLeagueId || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/home-content`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          // No home content yet, which is fine
          setHomeContent('');
          setLogoImageUrl('');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHomeContent(data.content || '');
      setLogoImageUrl(data.logoImageUrl || '');
    } catch (e) {
      console.error("Failed to fetch home content:", e);
      // Handle error, maybe set an error state
    }
  }, [selectedLeagueId, token]);

  const handleSaveLogoImageUrl = async () => {
    if (!selectedLeagueId || !token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/home-content`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: homeContent, logoImageUrl: logoImageUrl }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/members/${selectedMember.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update role: ${errorData}`);
      }
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
      `Are you sure you want to ${action.toLowerCase()} ${member.playerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/members/${member.id}/status`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: isActive }),
              });
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to update status: ${errorData}`);
              }
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
      `Are you sure you want to make ${selectedMember.playerName} the new owner?\n\nThis action is irreversible.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/transfer-ownership`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newOwnerLeagueMembershipId: selectedMember.id }),
              });
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to transfer ownership: ${errorData}`);
              }
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

  const openManageModal = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const fetchLeagueMembers = useCallback(async () => {
    if (!selectedLeagueId || !token) return;
    setLoadingMembers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMembers(data);
    } catch (e) {
      console.error("Failed to fetch league members:", e);
      setErrorMembers(e.message);
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedLeagueId, token]);

  useEffect(() => {
    if (isAdmin) {
        fetchLeagueMembers();
        fetchHomeContent();
    }
  }, [isAdmin, fetchLeagueMembers, fetchHomeContent]);

  if (loadingCurrentUserMembership || !isAdmin) {
    return (
      <PageLayout>
        <ActivityIndicator size="large" color="#fb5b5a" />
      </PageLayout>
    );
  }

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <View>
        <Text style={styles.memberName}>{item.playerName}</Text>
        <Text style={styles.memberRole}>{item.role} {item.isOwner ? '(Owner)' : ''}</Text>
        {!!item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
        {!item.playerAccountId && <Text style={styles.unregisteredTag}> (Unregistered)</Text>}
        {!item.isActive && <Text style={styles.inactiveTag}> (Inactive)</Text>}
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
    const canAdminsManage = nonOwnerAdminsCanManageRoles; // Use the league-level setting
    const canManageRoles = isOwner || (isAdmin && canAdminsManage);

    const targetIsOwner = selectedMember.isOwner;
    if (targetIsOwner) {
        return null; // Safeguard: Owners should not be manageable from this modal
    }

    return (
        <View style={styles.modalButtonContainer}>
            {isOwner && selectedMember.role === 'ADMIN' ? (
                <TouchableOpacity
                    style={[styles.button, styles.buttonDestructive]}
                    onPress={() => handleUpdateRole('PLAYER')}
                >
                    <Text style={styles.textStyle}>Demote to Player</Text>
                </TouchableOpacity>
            ) : null}
            {canManageRoles && selectedMember.role === 'PLAYER' && selectedMember.playerAccountId !== null ? (
                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, { marginTop: 10 }]}
                    onPress={() => handleUpdateRole('ADMIN')}
                >
                    <Text style={styles.textStyle}>Promote to Admin</Text>
                </TouchableOpacity>
            ) : null}
            {isOwner && selectedMember.playerAccountId !== null ? (
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
                        <Text style={styles.modalText}>Manage {selectedMember.playerName}</Text>

                        {renderManagementOptions()}

                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => setModalVisible(!modalVisible)}
                        >
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
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
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
    elevation: 5
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: 'bold'
  },
  modalButtonContainer: {
    width: '80%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  buttonPrimary: {
    backgroundColor: '#007bff',
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