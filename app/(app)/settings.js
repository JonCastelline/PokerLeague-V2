import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, Switch, TextInput, Button, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { DateTime } from 'luxon';
import PageLayout from '../../components/PageLayout';
import AddUnregisteredPlayerForm from '../../components/AddUnregisteredPlayerForm';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';

const SettingsPage = () => {
  const { token } = useAuth();
  const { selectedLeagueId, currentUserMembership } = useLeague();

  // Existing state for members
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers] = useState(null);

  // State for all seasons
  const [seasons, setSeasons] = useState([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [errorSeasons, setErrorSeasons] = useState(null);

  // State for selected season and its settings
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState(null);

  // State for player management modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // State for create season modal
  const [createSeasonModalVisible, setCreateSeasonModalVisible] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState(null);
  const [newSeasonEndDate, setNewSeasonEndDate] = useState(null);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null); // 'startDate' or 'endDate'

  const showDatePicker = (field) => {
    setDatePickerField(field);
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirmDate = (date) => {
    if (datePickerField === 'startDate') {
      setNewSeasonStartDate(date);
    } else if (datePickerField === 'endDate') {
      setNewSeasonEndDate(date);
    }
    hideDatePicker();
  };

  const isAdmin = currentUserMembership?.role === 'Admin' || currentUserMembership?.isOwner;

  const handleUpdateRole = async (newRole) => {
    if (!selectedMember) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/members/${selectedMember.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
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
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newOwnerId: selectedMember.id }),
              });
              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to transfer ownership: ${errorData}`);
              }
              await fetchLeagueMembers(); // Refresh member list
              // It might be necessary to refresh the entire user/league context as well
              // For now, just closing the modal.
              setModalVisible(false);
              alert('Ownership transferred successfully.');
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

  const fetchSettings = useCallback(async (seasonIdToFetch = null) => {
    if (!selectedLeagueId || !token) return;
    setLoadingSettings(true);
    try {
      let targetSeasonId = seasonIdToFetch;

      // If no specific seasonId is provided, try to get the latest season
      if (!targetSeasonId) {
        const seasonResponse = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/seasons/latest`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!seasonResponse.ok) {
          if (seasonResponse.status === 404) {
            // This means no seasons exist yet, which is a valid state
            setSettings(null);
            setSelectedSeason(null);
            setLoadingSettings(false);
            return; // Exit early, no settings to fetch
          }
          throw new Error(`HTTP error! status: ${seasonResponse.status}`);
        }
        const seasonData = await seasonResponse.json();
        targetSeasonId = seasonData.id;
        setSelectedSeason(seasonData); // Set the full season object
      }

      // If we have a targetSeasonId, fetch its settings
      if (targetSeasonId) {
        const settingsResponse = await fetch(`${API_BASE_URL}/api/seasons/${targetSeasonId}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!settingsResponse.ok) throw new Error(`HTTP error! status: ${settingsResponse.status}`);
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
      }

    } catch (e) {
      console.error("Failed to fetch settings:", e);
      setErrorSettings(e.message);
    } finally {
      setLoadingSettings(false);
    }
  }, [selectedLeagueId, token]);

  const fetchAllSeasons = useCallback(async () => {
    if (!selectedLeagueId || !token) return;
    setLoadingSeasons(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/seasons`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          setSeasons([]); // No seasons found
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSeasons(data);
    } catch (e) {
      console.error("Failed to fetch all seasons:", e);
      setErrorSeasons(e.message);
    } finally {
      setLoadingSeasons(false);
    }
  }, [selectedLeagueId, token]);

  const handleSeasonChange = (seasonId) => {
    const newSelectedSeason = seasons.find(s => s.id === seasonId);
    if (newSelectedSeason) {
      setSelectedSeason(newSelectedSeason);
      fetchSettings(newSelectedSeason.id); // Fetch settings for the newly selected season
    }
  };

  useEffect(() => {
    fetchLeagueMembers();
    fetchAllSeasons(); // Fetch all seasons first
  }, [fetchLeagueMembers, fetchAllSeasons]);

  // Effect to set the initial selected season after all seasons are fetched
  useEffect(() => {
    if (!selectedSeason && seasons.length > 0) {
      // If no season is selected, and we have seasons, select the latest one
      const latest = seasons.reduce((prev, current) => (prev.id > current.id ? prev : current));
      setSelectedSeason(latest);
      fetchSettings(latest.id);
    } else if (seasons.length === 0 && !loadingSeasons) {
      // If no seasons and not loading, ensure settings are cleared
      setSettings(null);
      setSelectedSeason(null);
    }
  }, [seasons, selectedSeason, loadingSeasons, fetchSettings]);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSeason = async () => {
    if (!selectedLeagueId || !token || !newSeasonName || !newSeasonStartDate || !newSeasonEndDate) {
      alert('Please fill in all season details.');
      return;
    }

    try {
      const formattedStartDate = DateTime.fromJSDate(newSeasonStartDate).toFormat('yyyy-MM-dd');
      const formattedEndDate = DateTime.fromJSDate(newSeasonEndDate).toFormat('yyyy-MM-dd');

      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/seasons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seasonName: newSeasonName,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create season: ${errorData}`);
      }

      alert('Season created successfully!');
      setCreateSeasonModalVisible(false);
      setNewSeasonName('');
      setNewSeasonStartDate(null);
      setNewSeasonEndDate(null);
      fetchAllSeasons(); // Refresh seasons list
    } catch (e) {
      console.error("Failed to create season:", e);
      alert(e.message);
    }
  };

  const handleFinalizeSeason = async () => {
    if (!selectedSeason || !token) return;

    Alert.alert(
      "Finalize Season",
      `Are you sure you want to finalize ${selectedSeason.seasonName}? Once finalized, all games, results, and settings will be permanently locked and cannot be edited. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/seasons/${selectedSeason.id}/finalize`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Failed to finalize season: ${errorData}`);
              }

              alert('Season finalized successfully!');
              fetchAllSeasons(); // Refresh seasons list to get updated isFinalized status
              fetchSettings(selectedSeason.id); // Refresh settings for the current season
            } catch (e) {
              console.error("Failed to finalize season:", e);
              alert(e.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const saveSettings = async () => {
      if (!latestSeasonId || !token || !settings) return;
      setLoadingSettings(true);
      try {
          const response = await fetch(`${API_BASE_URL}/api/seasons/${latestSeasonId}/settings`, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(settings),
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          alert('Settings saved successfully!');
      } catch (e) {
          console.error("Failed to save settings:", e);
          setErrorSettings(e.message);
          alert('Failed to save settings.');
      } finally {
          setLoadingSettings(false);
      }
  };


  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <View>
        <Text style={styles.memberName}>{item.playerName}</Text>
        <Text style={styles.memberRole}>{item.role} {item.isOwner ? '(Owner)' : ''}</Text>
        {item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
        {!item.playerAccountId && <Text style={styles.unregisteredTag}> (Unregistered)</Text>}
      </View>
      {isAdmin && item.id !== currentUserMembership.id && (
        <TouchableOpacity onPress={() => openManageModal(item)} style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderManagementOptions = () => {
    if (!selectedMember) return null;

    const isSeasonFinalized = selectedSeason?.isFinalized;
    if (isSeasonFinalized) {
        return <Text style={styles.finalizedMessage}>Season is finalized. Management options are disabled.</Text>;
    }

    const isOwner = currentUserMembership?.isOwner;
    const canAdminsManage = settings?.nonOwnerAdminsCanManageRoles;
    const canManageRoles = isOwner || (isAdmin && canAdminsManage);

    const targetIsOwner = selectedMember.isOwner;
    if (targetIsOwner) {
        return null; // Safeguard: Owners should not be manageable from this modal
    }

    return (
        <View style={styles.modalButtonContainer}>
            {canManageRoles && (
                <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary]}
                    onPress={() => handleUpdateRole(selectedMember.role === 'Admin' ? 'Player' : 'Admin')}
                >
                    <Text style={styles.textStyle}>Make {selectedMember.role === 'Admin' ? 'Player' : 'Admin'}</Text>
                </TouchableOpacity>
            )}
            {isOwner && (
                <TouchableOpacity
                    style={[styles.button, styles.buttonDestructive, { marginTop: 10 }]}
                    onPress={handleTransferOwnership}
                >
                    <Text style={styles.textStyle}>Transfer Ownership</Text>
                </TouchableOpacity>
            )}
        </View>
    );
  };

  const renderSettings = () => {
    if (loadingSettings) {
      return <ActivityIndicator size="large" color="#fb5b5a" />;
    }
    if (errorSettings) {
      return <Text style={styles.errorText}>Error loading settings: {errorSettings}</Text>;
    }
    if (!settings) {
      return <Text>No settings available for this league.</Text>;
    }

    const isSeasonFinalized = selectedSeason?.isFinalized;

    return (
      <View style={styles.settingsContainer}>
        {isSeasonFinalized && (
          <Text style={styles.finalizedMessage}>This season has been finalized and is now read-only.</Text>
        )}
        <View style={styles.settingItem}>
            <Text>Track Kills</Text>
            <Switch
                value={settings.trackKills}
                onValueChange={(value) => handleSettingChange('trackKills', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>
        {settings.trackKills && (
            <View style={styles.settingItem}>
                <Text>Kill Points</Text>
                <TextInput
                    style={styles.input}
                    value={String(settings.killPoints)}
                    onChangeText={(value) => handleSettingChange('killPoints', parseFloat(value) || 0)}
                    keyboardType="numeric"
                    editable={!isSeasonFinalized && isAdmin}
                />
            </View>
        )}

        <View style={styles.settingItem}>
            <Text>Track Bounties</Text>
            <Switch
                value={settings.trackBounties}
                onValueChange={(value) => handleSettingChange('trackBounties', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>
        {settings.trackBounties && (
            <View style={styles.settingItem}>
                <Text>Bounty Points</Text>
                <TextInput
                    style={styles.input}
                    value={String(settings.bountyPoints)}
                    onChangeText={(value) => handleSettingChange('bountyPoints', parseFloat(value) || 0)}
                    keyboardType="numeric"
                    editable={!isSeasonFinalized && isAdmin}
                />
            </View>
        )}

        <View style={styles.settingItem}>
            <Text>Enable Attendance Points</Text>
            <Switch
                value={settings.enableAttendancePoints}
                onValueChange={(value) => handleSettingChange('enableAttendancePoints', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>
        {settings.enableAttendancePoints && (
            <View style={styles.settingItem}>
                <Text>Attendance Points</Text>
                <TextInput
                    style={styles.input}
                    value={String(settings.attendancePoints)}
                    onChangeText={(value) => handleSettingChange('attendancePoints', parseFloat(value) || 0)}
                    keyboardType="numeric"
                    editable={!isSeasonFinalized && isAdmin}
                />
            </View>
        )}

        <View style={styles.settingItem}>
            <Text>Timer Duration (seconds)</Text>
            <TextInput
                style={styles.input}
                value={String(settings.durationSeconds)}
                onChangeText={(value) => handleSettingChange('durationSeconds', parseInt(value, 10) || 0)}
                keyboardType="numeric"
                editable={!isSeasonFinalized && isAdmin}
            />
        </View>

        <View style={styles.settingItem}>
            <Text>Starting Stack</Text>
            <TextInput
                style={styles.input}
                value={String(settings.startingStack)}
                onChangeText={(value) => handleSettingChange('startingStack', parseInt(value, 10) || 0)}
                keyboardType="numeric"
                editable={!isSeasonFinalized && isAdmin}
            />
        </View>

        <View style={styles.settingItem}>
            <Text>Admins Can Manage Roles</Text>
            <Switch
                value={settings.nonOwnerAdminsCanManageRoles}
                onValueChange={(value) => handleSettingChange('nonOwnerAdminsCanManageRoles', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>

        <View style={styles.settingItem}>
            <Text>Bounty on Leader Absence</Text>
            <Picker
                selectedValue={settings.bountyOnLeaderAbsenceRule}
                style={styles.picker}
                onValueChange={(itemValue) => handleSettingChange('bountyOnLeaderAbsenceRule', itemValue)}
                enabled={!isSeasonFinalized && isAdmin}
            >
                <Picker.Item label="No Bounty" value="NO_BOUNTY" />
                <Picker.Item label="Next Highest Player" value="NEXT_HIGHEST_PLAYER" />
            </Picker>
        </View>

        {!isSeasonFinalized && isAdmin && <Button title="Save Settings" onPress={saveSettings} color="#fb5b5a" />}
      </View>
    );
  };


  return (
    <PageLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>League Settings</Text>

        {loadingSeasons ? (
          <ActivityIndicator size="large" color="#fb5b5a" />
        ) : errorSeasons ? (
          <Text style={styles.errorText}>Error loading seasons: {errorSeasons}</Text>
        ) : seasons.length === 0 ? (
          <View style={styles.noSeasonsContainer}>
            <Text style={styles.noSeasonsText}>No seasons found for this league.</Text>
            <Text style={styles.noSeasonsText}>Create your first season to get started!</Text>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed]}
                onPress={() => setCreateSeasonModalVisible(true)}
              >
                <Text style={styles.textStyle}>Create First Season</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.seasonSelectorContainer}>
              <Text style={styles.subtitle}>Current Season:</Text>
              <Picker
                selectedValue={selectedSeason?.id}
                style={styles.picker}
                onValueChange={(itemValue) => handleSeasonChange(itemValue)}
                enabled={!selectedSeason?.isFinalized} // Disable picker if season is finalized
              >
                {seasons.map(s => (
                  <Picker.Item key={s.id} label={s.seasonName} value={s.id} />
                ))}
              </Picker>
              {isAdmin && !selectedSeason?.isFinalized && (
                <Button title="Create New Season" onPress={() => setCreateSeasonModalVisible(true)} color="#fb5b5a" />
              )}
            </View>

            {selectedSeason && renderSettings()}

            {selectedSeason && isAdmin && !selectedSeason.isFinalized && (
              <Button title="Finalize Season" onPress={handleFinalizeSeason} color="#dc3545" />
            )}
          </View>
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
            scrollEnabled={false} // To prevent nested scroll views warning
          />
        )}

        {isAdmin && (
          <AddUnregisteredPlayerForm leagueId={selectedLeagueId} onPlayerAdded={fetchLeagueMembers} />
        )}

        {/* Create Season Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={createSeasonModalVisible}
          onRequestClose={() => setCreateSeasonModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Create New Season</Text>
              <TextInput
                style={[styles.input, styles.modalInput]} // Apply modalInput style for fixed width
                placeholder="Season Name (e.g., 2025 Season)"
                value={newSeasonName}
                onChangeText={setNewSeasonName}
              />
              <TouchableOpacity onPress={() => showDatePicker('startDate')} style={styles.dateInputButton}>
                <Text style={styles.dateInputText}>
                  Start Date: {newSeasonStartDate ? DateTime.fromJSDate(newSeasonStartDate).toFormat('MM/dd/yyyy') : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => showDatePicker('endDate')} style={styles.dateInputButton}>
                <Text style={styles.dateInputText}>
                  End Date: {newSeasonEndDate ? DateTime.fromJSDate(newSeasonEndDate).toFormat('MM/dd/yyyy') : 'Select Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                onPress={handleCreateSeason}
              >
                <Text style={styles.textStyle}>Create Season</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setCreateSeasonModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          date={datePickerField === 'startDate' ? (newSeasonStartDate || new Date()) : (newSeasonEndDate || new Date())}
        />

        {selectedMember && (
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
        )}
      </ScrollView>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
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
  noSeasonsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
  },
  noSeasonsText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  seasonSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  settingsContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    width: '100%',
    marginBottom: 10,
  },
  modalInput: {
    width: '80%', // Fixed width for modal text inputs
  },
  dateInputButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '80%',
    marginBottom: 10,
    alignItems: 'center',
  },
  dateInputText: {
    color: '#000',
  },
  picker: {
    width: 180,
  },
  modalButton: {
    width: '80%',
    borderRadius: 10, // Rounded edges
    marginTop: 10,
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
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  finalizedMessage: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  }
});

export default SettingsPage;
