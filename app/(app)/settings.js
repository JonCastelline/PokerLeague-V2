import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, ScrollView, Switch, TextInput, Modal, TouchableOpacity, Alert, Platform, Dimensions } from 'react-native';
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
  const { selectedLeagueId, currentUserMembership, loadingCurrentUserMembership } = useLeague();

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

  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

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

      // If no specific seasonId is provided, try to get the active season
      if (!targetSeasonId) {
        const seasonResponse = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/seasons/active`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!seasonResponse.ok) {
          if (seasonResponse.status === 404) {
            // This means no active season exists yet, which is a valid state
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
      // If no season is selected, and we have seasons, try to fetch the active one
      fetchSettings();
    } else if (seasons.length === 0 && !loadingSeasons) {
      // If no seasons and not loading, ensure settings are cleared
      setSettings(null);
      setSelectedSeason(null);
    }
  }, [seasons, selectedSeason, loadingSeasons, fetchSettings]);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInputBlur = (field, currentValue) => {
    // 1. Clean the input: remove commas, allow only one decimal point
    let cleanedValue = currentValue.toString().replace(/,/g, ''); // Remove all commas
    const decimalCount = (cleanedValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      // If more than one decimal, keep only the first one
      cleanedValue = cleanedValue.substring(0, cleanedValue.indexOf('.') + 1) +
                     cleanedValue.substring(cleanedValue.indexOf('.') + 1).replace(/\./g, '');
    }

    const numValue = parseFloat(cleanedValue);

    if (isNaN(numValue)) {
      alert('Please enter a valid number.');
      setSettings(prev => ({ ...prev, [field]: 0 })); // Revert to 0 or previous valid value
      return;
    }

    // Check for maximum 2 decimal place after parsing
    const parts = numValue.toString().split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      alert('Please enter a number with a maximum of 2 decimal places.');
      setSettings(prev => ({ ...prev, [field]: parseFloat(numValue.toFixed(2)) }));
      return;
    }

    setSettings(prev => ({ ...prev, [field]: numValue }));
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
      if (!selectedSeason?.id || !token || !settings) return;
      setLoadingSettings(true);
      try {
          const response = await fetch(`${API_BASE_URL}/api/seasons/${selectedSeason.id}/settings`, {
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
        {!!item.email && <Text style={styles.memberEmail}>{item.email}</Text>}
        {!item.playerAccountId && <Text style={styles.unregisteredTag}> (Unregistered)</Text>}
      </View>
      {((currentUserMembership?.isOwner || (isAdmin && settings?.nonOwnerAdminsCanManageRoles)) && item.id !== currentUserMembership.id && (!item.isOwner || currentUserMembership?.isOwner)) ? (
        <TouchableOpacity onPress={() => openManageModal(item)} style={styles.manageButton}>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      ) : null}
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
        </View>
    );
  };

  const renderSettings = () => {
    if (loadingSettings || loadingCurrentUserMembership) {
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
        {isSeasonFinalized ? (
          <Text style={styles.finalizedMessage}>This season has been finalized and is now read-only.</Text>
        ) : null}
        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Track Kills</Text>
            <Switch
                value={settings.trackKills}
                onValueChange={(value) => handleSettingChange('trackKills', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>
        {settings.trackKills ? (
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Kill Points</Text>
                <TextInput
                    style={styles.numericInput}
                    value={String(settings.killPoints)}
                    onChangeText={(value) => handleSettingChange('killPoints', value)}
                    keyboardType="decimal-pad"
                    onBlur={() => handleNumericInputBlur('killPoints', settings.killPoints)}
                    editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                />
            </View>
        ) : null}

        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Track Bounties</Text>
            <Switch
                value={settings.trackBounties}
                onValueChange={(value) => handleSettingChange('trackBounties', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>
        {settings.trackBounties ? (
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Bounty Points</Text>
                <TextInput
                    style={styles.numericInput}
                    value={String(settings.bountyPoints)}
                    onChangeText={(value) => handleSettingChange('bountyPoints', value)}
                    keyboardType="decimal-pad"
                    onBlur={() => handleNumericInputBlur('bountyPoints', settings.bountyPoints)}
                    editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                />
            </View>
        ) : null}

        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Attendance Points</Text>
            <Switch
                value={settings.enableAttendancePoints}
                onValueChange={(value) => handleSettingChange('enableAttendancePoints', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>
        {settings.enableAttendancePoints ? (
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Attendance Points</Text>
                <TextInput
                    style={styles.numericInput}
                    value={String(settings.attendancePoints)}
                    onChangeText={(value) => handleSettingChange('attendancePoints', value)}
                    keyboardType="decimal-pad"
                    onBlur={() => handleNumericInputBlur('attendancePoints', settings.attendancePoints)}
                    editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                />
            </View>
        ) : null}

        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Timer Duration (seconds)</Text>
            <TextInput
                style={styles.numericInput}
                value={String(settings.durationSeconds)}
                onChangeText={(value) => handleSettingChange('durationSeconds', parseInt(value, 10) || 0)}
                keyboardType="numeric"
                editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
            />
        </View>

        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Starting Stack</Text>
            <TextInput
                style={styles.numericInput}
                value={String(settings.startingStack)}
                onChangeText={(value) => handleSettingChange('startingStack', parseInt(value, 10) || 0)}
                keyboardType="numeric"
                editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
            />
        </View>

        <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Admins Can Manage Roles</Text>
            <Switch
                value={settings.nonOwnerAdminsCanManageRoles}
                onValueChange={(value) => handleSettingChange('nonOwnerAdminsCanManageRoles', value)}
                disabled={isSeasonFinalized || !currentUserMembership?.isOwner}
            />
        </View>

        <View style={styles.settingItem}>
            <View style={{ flexDirection: 'column', width: '100%' }}>
                <Text style={styles.settingLabel}>Bounty on Leader Absence</Text>
                <Picker
                    selectedValue={settings.bountyOnLeaderAbsenceRule}
                    style={styles.pickerBounty}
                    onValueChange={(itemValue) => handleSettingChange('bountyOnLeaderAbsenceRule', itemValue)}
                    enabled={isSeasonFinalized ? false : (isAdmin ? true : false)}
                >
                    <Picker.Item label="No Bounty" value="NO_BOUNTY" />
                    <Picker.Item label="Next Highest Player" value="NEXT_HIGHEST_PLAYER" />
                </Picker>
            </View>
        </View>

        {isSeasonFinalized
          ? null
          : (isAdmin
              ? (
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
                  onPress={saveSettings}
                >
                  <Text style={styles.textStyle}>Save Settings</Text>
                </TouchableOpacity>
              )
              : null)
        }
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
            {isAdmin ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed]}
                onPress={() => setCreateSeasonModalVisible(true)}
              >
                <Text style={styles.textStyle}>Create First Season</Text>
              </TouchableOpacity>
            )
            : null}
          </View>
        ) : (
          <View>
            <View style={styles.seasonSelectorContainer}>
              <View style={{ flexDirection: 'column', width: '100%' }}>
                <Text style={styles.subtitle}>Current Season:</Text>
                <Picker
                  selectedValue={String(selectedSeason?.id)}
                  style={styles.picker}
                  onValueChange={(itemValue) => handleSeasonChange(Number(itemValue))}
                >
                  {seasons.map((s) => {
                    const label = typeof s.seasonName === 'string' ? s.seasonName : String(s.seasonName ?? 'Unnamed');
                    const value = String(s.id);
                    return (
                      <Picker.Item key={value} label={label} value={value} />
                    );
                  })}
                </Picker>
              </View>
            </View>
            {(isAdmin ? (!selectedSeason?.isFinalized ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
                onPress={() => setCreateSeasonModalVisible(true)}
              >
                <Text style={styles.textStyle}>Create New Season</Text>
              </TouchableOpacity>
            ) : null) : null)}


            {selectedSeason ? renderSettings() : null}

            {selectedSeason
              ? (isAdmin
                  ? (!selectedSeason.isFinalized
                      ? (
                        <TouchableOpacity
                          style={[styles.button, styles.buttonDestructive, styles.actionButton]}
                          onPress={handleFinalizeSeason}
                        >
                          <Text style={styles.textStyle}>Finalize Season</Text>
                        </TouchableOpacity>
                      )
                      : null)
                  : null)
              : null}
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
            scrollEnabled={false}
          />
        )}

        {isAdmin ? (
          <AddUnregisteredPlayerForm leagueId={selectedLeagueId} onPlayerAdded={fetchLeagueMembers} />
        ) : null}

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
                style={[styles.input, styles.modalInput]}
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
    width: '100%', // Ensure the container takes full width
    maxWidth: Dimensions.get('window').width - 40, // 20px padding on each side
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
    alignSelf: 'stretch', // Make it stretch to fill parent's width
    marginBottom: 20,
    marginHorizontal: 10, // Add horizontal margin for spacing
  },
  settingsContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15, // Keep internal padding
    marginBottom: 20,
    alignSelf: 'stretch', // Make it stretch to fill parent's width
    marginHorizontal: 10, // Add horizontal margin for spacing
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Align items to the start
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexWrap: 'wrap', // Allow items to wrap if needed
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
  numericInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    width: 60, // Fixed width for 6 characters
    textAlign: 'center',
    marginBottom: 10,
  },
  modalInput: {
    width: 250, // Fixed width for modal text inputs
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
    backgroundColor: 'white', // Make background white for visibility
  },
  pickerBounty: {
    width: 210,
    backgroundColor: 'white', // Make background white for visibility
  },
  pickerWrapper: {
    justifyContent: 'center',
    paddingLeft: 10,
    flex: 1, // allows it to fill remaining space and align nicely
    borderRadius: 10, // Rounded corners
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
  settingLabel: { // New style for setting labels
    marginRight: 10, // Space between label and input/switch
    flexShrink: 1, // Allow text to shrink
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
  actionButton: { // New style for action buttons
    width: 'auto', // Allow button to size to content
    alignSelf: 'center', // Center the button
    marginTop: 10, // Add some top margin for spacing
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
