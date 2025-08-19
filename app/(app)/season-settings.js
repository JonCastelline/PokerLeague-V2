import { Picker } from '@react-native-picker/picker';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import { API_BASE_URL } from '../../src/config';

const SeasonSettingsPage = () => {
  const { token } = useAuth();
  const { selectedLeagueId, currentUserMembership, loadingCurrentUserMembership } = useLeague();

  // State for all seasons
  const [seasons, setSeasons] = useState([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [errorSeasons, setErrorSeasons] = useState(null);

  // State for selected season and its settings
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState(null);

  // State for Games
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // State for Blind Levels and Place Points
  const [blindLevels, setBlindLevels] = useState([]);
  const [placePoints, setPlacePoints] = useState([]);

  // State for adding new blind level
  const [addBlindLevelModalVisible, setAddBlindLevelModalVisible] = useState(false);
  const [newBlindLevel, setNewBlindLevel] = useState({ level: '', smallBlind: '', bigBlind: '' });

  // State for adding new place point
  const [addPlacePointModalVisible, setAddPlacePointModalVisible] = useState(false);
  const [newPlacePoint, setNewPlacePoint] = useState({ place: '', points: '' });

  // State for editing blind level
  const [editBlindLevelModalVisible, setEditBlindLevelModalVisible] = useState(false);
  const [currentEditingBlindLevel, setCurrentEditingBlindLevel] = useState(null);
  const [currentEditingBlindLevelIndex, setCurrentEditingBlindLevelIndex] = useState(null);

  // State for editing place point
  const [editPlacePointModalVisible, setEditPlacePointModalVisible] = useState(false);
  const [currentEditingPlacePoint, setCurrentEditingPlacePoint] = useState(null);
  const [currentEditingPlacePointIndex, setCurrentEditingPlacePointIndex] = useState(null);

  // State for create season modal
  const [createSeasonModalVisible, setCreateSeasonModalVisible] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStartDate, setNewSeasonStartDate] = useState(null);
  const [newSeasonEndDate, setNewSeasonEndDate] = useState(null);

  // State for create game modal
  const [createGameModalVisible, setCreateGameModalVisible] = useState(false);
  const [newGameDate, setNewGameDate] = useState(new Date());
  const [newGameTime, setNewGameTime] = useState(new Date()); // Added newGameTime
  const [newGameLocation, setNewGameLocation] = useState('');
  const [isGameDatePickerVisible, setGameDatePickerVisible] = useState(false);
  const [isGameTimePickerVisible, setGameTimePickerVisible] = useState(false); // Added isGameTimePickerVisible

  // State for editing game modal
  const [editGameModalVisible, setEditGameModalVisible] = useState(false);
  const [currentEditingGame, setCurrentEditingGame] = useState(null);
  const [editedGameName, setEditedGameName] = useState('');
  const [editedGameDate, setEditedGameDate] = useState(new Date());
  const [editedGameTime, setEditedGameTime] = useState(new Date()); // Added editedGameTime
  const [editedGameLocation, setEditedGameLocation] = useState('');
  const [isEditGameDatePickerVisible, setEditGameDatePickerVisible] = useState(false);
  const [isEditGameTimePickerVisible, setEditGameTimePickerVisible] = useState(false); // Added isEditGameTimePickerVisible

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

  const fetchGames = useCallback(async (seasonId) => {
    if (!seasonId || !token) return;
    setLoadingGames(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/seasons/${seasonId}/games`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const gamesData = await response.json();
      setGames(gamesData);
    } catch (e) {
      console.error("Failed to fetch games:", e);
    } finally {
      setLoadingGames(false);
    }
  }, [token]);

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
            // Clear blindLevels and placePoints if no settings
            setBlindLevels([]);
            setPlacePoints([]);
            setGames([]);
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
        if (!settingsResponse.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        // Populate blindLevels and placePoints state, and sort them
        setBlindLevels((settingsData.blindLevels || []).sort((a, b) => a.level - b.level));
        setPlacePoints(settingsData.placePoints || []);
        fetchGames(targetSeasonId);
      }

    } catch (e) {
      console.error("Failed to fetch settings:", e);
      setErrorSettings(e.message);
    } finally {
      setLoadingSettings(false);
    }
  }, [selectedLeagueId, token, fetchGames]);

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
    fetchAllSeasons(); // Fetch all seasons first
  }, [fetchAllSeasons]);

  // Effect to set the initial selected season after all seasons are fetched
  useEffect(() => {
    if (!selectedSeason && seasons.length > 0) {
      // If no season is selected, and we have seasons, try to fetch the active one
      fetchSettings();
    } else if (seasons.length === 0 && !loadingSeasons) {
      // If no seasons and not loading, ensure settings are cleared
      setSettings(null);
      setSelectedSeason(null);
      // Clear blindLevels and placePoints if no settings
      setBlindLevels([]);
      setPlacePoints([]);
      setGames([]);
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

  const handleAddNewGame = async () => {
    if (!selectedSeason || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/seasons/${selectedSeason.id}/games`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameDate: DateTime.fromJSDate(newGameDate).toFormat('yyyy-MM-dd'),
          gameTime: DateTime.fromJSDate(newGameTime).toFormat('HH:mm:ss'), // Use newGameTime
          gameLocation: newGameLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to add game: ${errorData}`);
      }

      alert('Game added successfully!');
      setCreateGameModalVisible(false);
      setNewGameLocation(''); // Clear the location field
      setNewGameTime(new Date()); // Clear the time field
      fetchGames(selectedSeason.id); // Refresh games list
    } catch (e) {
      console.error("Failed to add game:", e);
      alert(e.message);
    }
  };

  const handleEditGame = (game) => {
    setCurrentEditingGame(game);
    setEditedGameName(game.gameName);
    setEditedGameDate(DateTime.fromISO(game.gameDate).toJSDate());
    setEditedGameLocation(game.gameLocation || '');
    setEditGameModalVisible(true);
  };

  const handleUpdateGame = async () => {
    if (!currentEditingGame || !token || !selectedSeason) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/seasons/${selectedSeason.id}/games/${currentEditingGame.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameName: editedGameName,
          gameDate: DateTime.fromJSDate(editedGameDate).toFormat('yyyy-MM-dd'),
          gameTime: DateTime.fromJSDate(editedGameTime).toFormat('HH:mm:ss'), // Use editedGameTime
          gameLocation: editedGameLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update game: ${errorData}`);
      }

      alert('Game updated successfully!');
      setEditGameModalVisible(false);
      setCurrentEditingGame(null);
      setEditedGameName('');
      setEditedGameDate(new Date());
      setEditedGameTime(new Date()); // Clear the time field
      setEditedGameLocation('');
      fetchGames(selectedSeason.id); // Refresh games list
    } catch (e) {
      console.error("Failed to update game:", e);
      alert(e.message);
    }
  };

  const handleFinalizeSeason = async () => {
    if (!selectedSeason || !token) return;

    Alert.alert(
      "Finalize Season",
      `Are you sure you want to finalize ${selectedSeason.seasonName}? Once finalized, all games, results, and settings will be permanently locked and cannot be edited. This action cannot be undone.`, [
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
          // Include blindLevels and placePoints in the settings object
          const settingsToSave = {
              ...settings,
              blindLevels: blindLevels,
              placePoints: placePoints,
          };

          const response = await fetch(`${API_BASE_URL}/api/seasons/${selectedSeason.id}/settings`, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(settingsToSave), // Use settingsToSave
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

  const handleEditBlindLevel = (blindLevel, index) => {
    setCurrentEditingBlindLevel({ ...blindLevel });
    setCurrentEditingBlindLevelIndex(index);
    setEditBlindLevelModalVisible(true);
  };

  const handleUpdateBlindLevel = () => {
    if (currentEditingBlindLevel && currentEditingBlindLevelIndex !== null) {
      const updatedBlindLevels = [...blindLevels];
      updatedBlindLevels[currentEditingBlindLevelIndex] = {
        ...updatedBlindLevels[currentEditingBlindLevelIndex],
        smallBlind: currentEditingBlindLevel.smallBlind,
        bigBlind: currentEditingBlindLevel.bigBlind,
      };
      setBlindLevels(updatedBlindLevels);
      setEditBlindLevelModalVisible(false);
      setCurrentEditingBlindLevel(null);
      setCurrentEditingBlindLevelIndex(null);
    }
  };

  const handleDeleteBlindLevel = (indexToDelete) => {
    Alert.alert(
      "Delete Blind Level",
      "Are you sure you want to delete this blind level?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedBlindLevels = blindLevels.filter((_, index) => index !== indexToDelete);
            setBlindLevels(updatedBlindLevels.sort((a, b) => a.level - b.level)); // Sort after delete
            setEditBlindLevelModalVisible(false); // Close modal if open
            setCurrentEditingBlindLevel(null);
            setCurrentEditingBlindLevelIndex(null);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddBlindLevel = () => {
    if (!newBlindLevel.smallBlind || !newBlindLevel.bigBlind) {
      Alert.alert('Error', 'Please fill all fields for the new blind level.');
      return;
    }
    const newLevel = blindLevels.length > 0 ? Math.max(...blindLevels.map(b => b.level)) + 1 : 1;
    const newSmallBlind = parseInt(newBlindLevel.smallBlind);
    const newBigBlind = parseInt(newBlindLevel.bigBlind);
    if (blindLevels.length > 0) {
      const last = blindLevels[blindLevels.length - 1];
      if (newSmallBlind <= last.smallBlind || newBigBlind <= last.bigBlind) {
        Alert.alert('Validation Error', 'New blind level\'s small blind and big blind must be greater than the previous level\'s blinds.');
        return;
      }
    }
    setBlindLevels([...blindLevels, { level: newLevel, smallBlind: newSmallBlind, bigBlind: newBigBlind }]);
    setNewBlindLevel({ smallBlind: '', bigBlind: '' });
    setAddBlindLevelModalVisible(false);
  };

  const handleEditPlacePoint = (placePoint, index) => {
    setCurrentEditingPlacePoint({ ...placePoint });
    setCurrentEditingPlacePointIndex(index);
    setEditPlacePointModalVisible(true);
  };

  const handleUpdatePlacePoint = () => {
    if (currentEditingPlacePoint && currentEditingPlacePointIndex !== null) {
      const updatedPlacePoints = [...placePoints];
      updatedPlacePoints[currentEditingPlacePointIndex] = {
        place: parseInt(currentEditingPlacePoint.place),
        points: parseFloat(currentEditingPlacePoint.points),
      };
      setPlacePoints(updatedPlacePoints.sort((a, b) => a.place - b.place)); // Sort after update
      setEditPlacePointModalVisible(false);
      setCurrentEditingPlacePoint(null);
      setCurrentEditingPlacePointIndex(null);
    }
  };

  const handleDeletePlacePoint = (indexToDelete) => {
    Alert.alert(
      "Delete Place Point",
      "Are you sure you want to delete this place point?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedPlacePoints = placePoints.filter((_, index) => index !== indexToDelete);
            setPlacePoints(updatedPlacePoints.sort((a, b) => a.place - b.place)); // Sort after delete
            setEditPlacePointModalVisible(false); // Close modal if open
            setCurrentEditingPlacePoint(null);
            setCurrentEditingPlacePointIndex(null);
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddPlacePoint = () => {
    // Basic validation for new place point
    if (!newPlacePoint.points) {
      Alert.alert('Error', 'Please fill all fields for the new place point.');
      return;
    }
    const newPlace = placePoints.length > 0 ? Math.max(...placePoints.map(p => p.place)) + 1 : 1;
    setPlacePoints([...placePoints, {
      place: newPlace,
      points: parseFloat(newPlacePoint.points),
    }].sort((a, b) => a.place - b.place)); // Sort after add
    setNewPlacePoint({ place: '', points: '' }); // Clear form
    setAddPlacePointModalVisible(false);
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

    // Compute blind level validation errors for display and save button disabling
    const blindLevelErrors = getBlindLevelValidationErrors(blindLevels);
    const hasBlindLevelErrors = blindLevelErrors.some(e => !!e);

    // Compute place point validation errors for display and save button disabling
    const placePointErrors = getPlacePointValidationErrors(placePoints);
    const hasPlacePointErrors = placePointErrors.some(e => !!e);

    // Require at least 1 blind level and 1 place point to save
    const hasMinimumBlindLevels = blindLevels.length > 0;
    const hasMinimumPlacePoints = placePoints.length > 0;
    const canSaveSettings = hasMinimumBlindLevels && hasMinimumPlacePoints && !hasBlindLevelErrors && !hasPlacePointErrors;

    return (
      <View style={styles.settingsContainer}>
        {isSeasonFinalized ? (
          <Text style={styles.finalizedMessage}>This season has been finalized and is now read-only.</Text>
        ) : null}

        {/* Games Section */}
        <Text style={styles.subtitle}>Games</Text>
        {loadingGames ? (
          <ActivityIndicator size="small" color="#fb5b5a" />
        ) : games.length === 0 ? (
          <Text>No games have been added to this season yet.</Text>
        ) : (
          games.map((game, index) => (
            <View key={index} style={styles.gameItem}>
              <View>
                <Text>{game.gameName}</Text>
                <Text>{DateTime.fromISO(game.gameDate).toFormat('MM/dd/yyyy')}</Text>
                {game.gameTime && <Text>Time: {DateTime.fromISO(game.gameTime).toFormat('hh:mm a')}</Text>}
                {game.gameLocation && <Text>Location: {game.gameLocation}</Text>}
              </View>
              {isAdmin && !isSeasonFinalized && (
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, styles.smallButton]}
                  onPress={() => handleEditGame(game)}
                >
                  <Text style={styles.textStyle}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
        {isAdmin && !isSeasonFinalized && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
            onPress={() => {
              // Calculate the correct default date for the modal and picker (local time, no timezone offset)
              const today = new Date();
              let defaultDate = today;
              if (selectedSeason?.startDate && selectedSeason?.endDate) {
                console.log("DEBUG: selectedSeason.startDate:", selectedSeason.startDate);
                console.log("DEBUG: selectedSeason.endDate:", selectedSeason.endDate);
                // Manually parse the date components to avoid timezone issues during initial parsing
                const [startDatePart] = selectedSeason.startDate.split('T');
                const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);

                const [endDatePart] = selectedSeason.endDate.split('T');
                const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);

                const seasonStartLuxon = DateTime.local(startYear, startMonth, startDay);
                const seasonEndLuxon = DateTime.local(endYear, endMonth, endDay);

                console.log("DEBUG: seasonStartLuxon.year:", seasonStartLuxon.year);
                console.log("DEBUG: seasonStartLuxon.month:", seasonStartLuxon.month); // This is 1-indexed
                console.log("DEBUG: seasonStartLuxon.day:", seasonStartLuxon.day);

                console.log("DEBUG: seasonEndLuxon.year:", seasonEndLuxon.year);
                console.log("DEBUG: seasonEndLuxon.month:", seasonEndLuxon.month); // This is 1-indexed
                console.log("DEBUG: seasonEndLuxon.day:", seasonEndLuxon.day);

                const sy = seasonStartLuxon.year;
                const sm = seasonStartLuxon.month;
                const sd = seasonStartLuxon.day;

                const ey = seasonEndLuxon.year;
                const em = seasonEndLuxon.month;
                const ed = seasonEndLuxon.day;

                const seasonStart = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
                const seasonEnd = new Date(ey, em - 1, ed, 0, 0, 0, 0);
                console.log("DEBUG: seasonStart Date object:", seasonStart);
                console.log("DEBUG: seasonEnd Date object:", seasonEnd);
                if (today >= seasonStart && today <= seasonEnd) {
                  defaultDate = today;
                } else if (today < seasonStart) {
                  defaultDate = seasonStart;
                } else if (today > seasonEnd) {
                  defaultDate = seasonEnd;
                }
              }
              setNewGameDate(defaultDate);
              setCreateGameModalVisible(true);
            }}
          >
            <Text style={styles.textStyle}>Add New Game</Text>
          </TouchableOpacity>
        )}
        {/* Create Game Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={createGameModalVisible}
          onRequestClose={() => setCreateGameModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Create New Game</Text>
              <TouchableOpacity
                onPress={() => setGameDatePickerVisible(true)}
                style={styles.dateInputButton}
              >
                <Text style={styles.dateInputText}>
                  Game Date: {DateTime.fromJSDate(newGameDate).toFormat('MM/dd/yyyy')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGameTimePickerVisible(true)} // New time picker trigger
                style={styles.dateInputButton}
              >
                <Text style={styles.dateInputText}>
                  Game Time: {DateTime.fromJSDate(newGameTime).toFormat('hh:mm a')}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Game Location (Optional)"
                value={newGameLocation}
                onChangeText={setNewGameLocation}
              />
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                onPress={handleAddNewGame}
              >
                <Text style={styles.textStyle}>Create Game</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setCreateGameModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isGameDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setNewGameDate(date);
            setGameDatePickerVisible(false);
          }}
          onCancel={() => setGameDatePickerVisible(false)}
          date={newGameDate}
          minimumDate={selectedSeason?.startDate ? new Date(
            (() => {
              const [startDatePart] = selectedSeason.startDate.split('T');
              const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
              return startYear;
            })(),
            (() => {
              const [startDatePart] = selectedSeason.startDate.split('T');
              const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
              return startMonth - 1; // Month is 0-indexed for Date constructor
            })(),
            (() => {
              const [startDatePart] = selectedSeason.startDate.split('T');
              const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
              return startDay;
            })()
          ) : undefined}
          maximumDate={selectedSeason?.endDate ? new Date(
            (() => {
              const [endDatePart] = selectedSeason.endDate.split('T');
              const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
              return endYear;
            })(),
            (() => {
              const [endDatePart] = selectedSeason.endDate.split('T');
              const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
              return endMonth - 1; // Month is 0-indexed for Date constructor
            })(),
            (() => {
              const [endDatePart] = selectedSeason.endDate.split('T');
              const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
              return endDay;
            })()
          ) : undefined}
        />

        {/* Game Time Picker Modal */}
        <DateTimePickerModal
          isVisible={isGameTimePickerVisible}
          mode="time"
          onConfirm={(time) => {
            setNewGameTime(time);
            setGameTimePickerVisible(false);
          }}
          onCancel={() => setGameTimePickerVisible(false)}
          date={newGameTime}
        />

        {/* Edit Game Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editGameModalVisible}
          onRequestClose={() => setEditGameModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Edit Game</Text>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Game Name"
                value={editedGameName}
                onChangeText={setEditedGameName}
              />
              <TouchableOpacity
                onPress={() => setEditGameDatePickerVisible(true)}
                style={styles.dateInputButton}
              >
                <Text style={styles.dateInputText}>
                  Game Date: {DateTime.fromJSDate(editedGameDate).toFormat('MM/dd/yyyy')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditGameTimePickerVisible(true)} // New time picker trigger
                style={styles.dateInputButton}
              >
                <Text style={styles.dateInputText}>
                  Game Time: {DateTime.fromJSDate(editedGameTime).toFormat('hh:mm a')}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Game Location (Optional)"
                value={editedGameLocation}
                onChangeText={setEditedGameLocation}
              />
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                onPress={handleUpdateGame}
              >
                <Text style={styles.textStyle}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setEditGameModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Game Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isEditGameDatePickerVisible}
          mode="date"
          onConfirm={(date) => {
            setEditedGameDate(date);
            setEditGameDatePickerVisible(false);
          }}
          onCancel={() => setEditGameDatePickerVisible(false)}
          date={editedGameDate}
          minimumDate={selectedSeason?.startDate ? new Date(
            (() => {
              const [startDatePart] = selectedSeason.startDate.split('T');
              const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
              return startYear;
            })(),
            (() => {
              const [startDatePart] = selectedSeason.startDate.split('T');
              const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
              return startMonth - 1; // Month is 0-indexed for Date constructor
            })(),
            (() => {
              const [startDatePart] = selectedSeason.startDate.split('T');
              const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
              return startDay;
            })()
          ) : undefined}
          maximumDate={selectedSeason?.endDate ? new Date(
            (() => {
              const [endDatePart] = selectedSeason.endDate.split('T');
              const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
              return endYear;
            })(),
            (() => {
              const [endDatePart] = selectedSeason.endDate.split('T');
              const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
              return endMonth - 1; // Month is 0-indexed for Date constructor
            })(),
            (() => {
              const [endDatePart] = selectedSeason.endDate.split('T');
              const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
              return endDay;
            })()
          ) : undefined}
        />

        {/* Edit Game Time Picker Modal */}
        <DateTimePickerModal
          isVisible={isEditGameTimePickerVisible}
          mode="time"
          onConfirm={(time) => {
            setEditedGameTime(time);
            setEditGameTimePickerVisible(false);
          }}
          onCancel={() => setEditGameTimePickerVisible(false)}
          date={editedGameTime}
        />

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

        {/* Blind Levels Section */}
        <Text style={styles.subtitle}>Blind Levels</Text>
        {blindLevels.map((bl, index) => (
          <TouchableOpacity
            key={index}
            style={[ 
              styles.blindLevelItem,
              blindLevelErrors[index] && { borderColor: 'red', borderWidth: 2 }
            ]}
            onPress={() => isAdmin && !isSeasonFinalized && handleEditBlindLevel(bl, index)}
            disabled={isSeasonFinalized || !isAdmin}
            activeOpacity={0.7}
          >
            <View style={styles.blindLevelItemContent}>
              <Text>Level: {bl.level}</Text>
              <Text>Small Blind: {bl.smallBlind}</Text>
              <Text>Big Blind: {bl.bigBlind}</Text>
              {blindLevelErrors[index] && (
                <Text style={{ color: 'red', fontSize: 12 }}>{blindLevelErrors[index]}</Text>
              )}
            </View>
            {isAdmin && !isSeasonFinalized && index === blindLevels.length - 1 && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteBlindLevel(index);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        {isAdmin && !isSeasonFinalized && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
            onPress={() => setAddBlindLevelModalVisible(true)}
          >
            <Text style={styles.textStyle}>Add Blind Level</Text>
          </TouchableOpacity>
        )}

        {/* Place Points Section */}
        <Text style={styles.subtitle}>Place Points</Text>
        {placePoints.map((pp, index) => (
          <TouchableOpacity
            key={index}
            style={[ 
              styles.placePointItem,
              placePointErrors && placePointErrors[index] && { borderColor: 'red', borderWidth: 2 }
            ]}
            onPress={() => isAdmin && !isSeasonFinalized && handleEditPlacePoint(pp, index)}
            disabled={isSeasonFinalized || !isAdmin}
            activeOpacity={0.7}
          >
            <View style={[styles.placePointItemContent, { flex: 1 }]}>
              <Text>Place: {pp.place}</Text>
              <Text>Points: {pp.points}</Text>
              {placePointErrors && placePointErrors[index] && (
                <Text style={{ color: 'red', fontSize: 12 }}>{placePointErrors[index]}</Text>
              )}
            </View>
            {isAdmin && !isSeasonFinalized && index === placePoints.length - 1 && (
              <View style={{ marginLeft: 10 }}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeletePlacePoint(index);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {isAdmin && !isSeasonFinalized && (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
            onPress={() => setAddPlacePointModalVisible(true)}
          >
            <Text style={styles.textStyle}>Add Place Point</Text>
          </TouchableOpacity>
        )}

        {isSeasonFinalized
          ? null
          : (isAdmin
              ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimaryRed, styles.actionButton, !canSaveSettings && { opacity: 0.5 }]}
                    onPress={saveSettings}
                    disabled={!canSaveSettings}
                  >
                    <Text style={styles.textStyle}>Save Settings</Text>
                  </TouchableOpacity>
                  {(!hasMinimumBlindLevels || !hasMinimumPlacePoints || hasBlindLevelErrors || hasPlacePointErrors) && (
                    <Text style={{ color: 'red', textAlign: 'center', marginTop: 5 }}>
                      {!hasMinimumBlindLevels && 'At least one blind level is required. '}
                      {!hasMinimumPlacePoints && 'At least one place point is required. '}
                      {hasBlindLevelErrors && 'Please fix all blind level errors before saving settings.'}
                      {(hasBlindLevelErrors && (hasPlacePointErrors || !hasMinimumBlindLevels || !hasMinimumPlacePoints)) ? '\n' : ''}
                      {hasPlacePointErrors && 'Please fix all place point errors before saving settings.'}
                    </Text>
                  )}
                </>
              )
              : null)}
      </View>
    );
  };


  return (
    <PageLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Season Settings</Text>

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
                  onValueChange={(itemValue) => handleSeasonChange(Number(itemValue))}>
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={createSeasonModalVisible}
          onRequestClose={() => setCreateSeasonModalVisible(false)}>
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
                onPress={() => setCreateSeasonModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Add Blind Level Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={addBlindLevelModalVisible}
          onRequestClose={() => setAddBlindLevelModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Add New Blind Level</Text>
              <View style={{ marginBottom: 10 }}>
                <Text>Level: {blindLevels.length > 0 ? Math.max(...blindLevels.map(b => b.level)) + 1 : 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Small Blind"
                keyboardType="numeric"
                value={newBlindLevel.smallBlind}
                onChangeText={(text) => setNewBlindLevel({ ...newBlindLevel, smallBlind: text })}
              />
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Big Blind"
                keyboardType="numeric"
                value={newBlindLevel.bigBlind}
                onChangeText={(text) => setNewBlindLevel({ ...newBlindLevel, bigBlind: text })}
              />
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                onPress={handleAddBlindLevel}
              >
                <Text style={styles.textStyle}>Add Blind Level</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setAddBlindLevelModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Blind Level Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editBlindLevelModalVisible}
          onRequestClose={() => setEditBlindLevelModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Edit Blind Level</Text>
              {(() => {
                let editBlindLevelErrors = [];
                if (currentEditingBlindLevel && currentEditingBlindLevelIndex !== null) {
                  const tempBlindLevels = [...blindLevels];
                  tempBlindLevels[currentEditingBlindLevelIndex] = {
                    ...tempBlindLevels[currentEditingBlindLevelIndex],
                    smallBlind: currentEditingBlindLevel.smallBlind,
                    bigBlind: currentEditingBlindLevel.bigBlind,
                  };
                  editBlindLevelErrors = getBlindLevelValidationErrors(tempBlindLevels);
                }
                return currentEditingBlindLevel && (
                  <>
                    <View style={{ marginBottom: 10 }}>
                      <Text>Level: {currentEditingBlindLevel.level}</Text>
                    </View>
                    <TextInput
                      style={[ 
                        styles.input,
                        styles.modalInput,
                        editBlindLevelErrors[currentEditingBlindLevelIndex] && { borderColor: 'red' }
                      ]}
                      placeholder="Small Blind"
                      keyboardType="numeric"
                      value={String(currentEditingBlindLevel.smallBlind)}
                      onChangeText={(text) => setCurrentEditingBlindLevel({ ...currentEditingBlindLevel, smallBlind: text })}
                    />
                    <TextInput
                      style={[ 
                        styles.input,
                        styles.modalInput,
                        editBlindLevelErrors[currentEditingBlindLevelIndex] && { borderColor: 'red' }
                      ]}
                      placeholder="Big Blind"
                      keyboardType="numeric"
                      value={String(currentEditingBlindLevel.bigBlind)}
                      onChangeText={(text) => setCurrentEditingBlindLevel({ ...currentEditingBlindLevel, bigBlind: text })}
                    />
                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                      onPress={handleUpdateBlindLevel}
                    >
                      <Text style={styles.textStyle}>Save Changes</Text>
                    </TouchableOpacity>
                    {editBlindLevelErrors[currentEditingBlindLevelIndex] && (
                      <Text style={{ color: 'red', marginTop: 5 }}>
                        {editBlindLevelErrors[currentEditingBlindLevelIndex]}
                      </Text>
                    )}
                  </>
                );
              })()
              }
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setEditBlindLevelModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Add Place Point Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={addPlacePointModalVisible}
          onRequestClose={() => setAddPlacePointModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Add New Place Point</Text>
              <View style={{ marginBottom: 10 }}>
                <Text>Place: {placePoints.length > 0 ? Math.max(...placePoints.map(p => p.place)) + 1 : 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Points"
                keyboardType="decimal-pad"
                value={newPlacePoint.points}
                onChangeText={(text) => setNewPlacePoint({ ...newPlacePoint, points: text })}
              />
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                onPress={handleAddPlacePoint}
              >
                <Text style={styles.textStyle}>Add Place Point</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setAddPlacePointModalVisible(false)}>
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Edit Place Point Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editPlacePointModalVisible}
          onRequestClose={() => setEditPlacePointModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Edit Place Point</Text>
              {(() => {
                let editPlacePointErrors = [];
                if (currentEditingPlacePoint && currentEditingPlacePointIndex !== null) {
                  const tempPlacePoints = [...placePoints];
                  tempPlacePoints[currentEditingPlacePointIndex] = {
                    ...tempPlacePoints[currentEditingPlacePointIndex],
                    // Only allow editing points, not place
                    points: currentEditingPlacePoint.points,
                  };
                  editPlacePointErrors = getPlacePointValidationErrors(tempPlacePoints);
                }
                return currentEditingPlacePoint && (
                  <>
                    <View style={{ marginBottom: 10 }}>
                      <Text>Place: {currentEditingPlacePoint.place}</Text>
                    </View>
                    <TextInput
                      style={[ 
                        styles.input,
                        styles.modalInput,
                        editPlacePointErrors[currentEditingPlacePointIndex] && { borderColor: 'red' }
                      ]}
                      placeholder="Points"
                      keyboardType="decimal-pad"
                      value={String(currentEditingPlacePoint.points)}
                      onChangeText={(text) => setCurrentEditingPlacePoint({ ...currentEditingPlacePoint, points: text })}
                    />
                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                      onPress={handleUpdatePlacePoint}
                    >
                      <Text style={styles.textStyle}>Save Changes</Text>
                    </TouchableOpacity>
                    {editPlacePointErrors[currentEditingPlacePointIndex] && (
                      <Text style={{ color: 'red', marginTop: 5 }}>
                        {editPlacePointErrors[currentEditingPlacePointIndex]}
                      </Text>
                    )}
                  </>
                );
              })()
              }
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setEditPlacePointModalVisible(false)}>
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
    width: 250,
    marginBottom: 10,
  },
  dateInputText: {
    color: '#000',
  },
  picker: {
    backgroundColor: 'white',
  },
  pickerBounty: {
    width: 210,
    backgroundColor: 'white',
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
  settingLabel: {
    marginRight: 10,
    flexShrink: 1,
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
  finalizedMessage: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  blindLevelItem: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blindLevelItemContent: {
    flexDirection: 'column',
  },
  placePointItem: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placePointItemContent: {
    flexDirection: 'column',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
  },
  gameItem: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
});

// --- Blind Level Validation Helper */
function getBlindLevelValidationErrors(levels) {
  const errors = [];
  for (let i = 0; i < levels.length; i++) {
    const prev = levels[i - 1];
    const curr = levels[i];
    const next = levels[i + 1];
    const small = parseInt(curr.smallBlind);
    const big = parseInt(curr.bigBlind);
    let error = '';
    if (isNaN(small) || isNaN(big)) {
      error = 'Both blinds must be numbers.';
    } else if (big <= small) {
      error = 'Big blind must be greater than small blind.';
    } else if (prev && (small <= parseInt(prev.smallBlind) || big <= parseInt(prev.bigBlind))) {
      error = 'Blinds must be greater than previous level.';
    } else if (next && (small >= parseInt(next.smallBlind) || big >= parseInt(next.bigBlind))) {
      error = 'Blinds must be less than next level.';
    }
    errors.push(error);
  }
  return errors;
}

// --- Place Point Validation Helper */
function getPlacePointValidationErrors(pointsArr) {
  const errors = [];
  for (let i = 0; i < pointsArr.length; i++) {
    const prev = pointsArr[i - 1];
    const curr = pointsArr[i];
    const next = pointsArr[i + 1];
    const currPoints = parseFloat(curr.points);
    let error = '';
    if (isNaN(currPoints)) {
      error = 'Points must be a number.';
    } else if (prev && currPoints > parseFloat(prev.points)) {
      error = 'Lower rank place must have less than or equal to higher rank.';
    } else if (next && currPoints < parseFloat(next.points)) {
      error = 'Higher rank place must have more than or equal to lower rank.';
    }
    errors.push(error);
  }
  return errors;
}

export default SeasonSettingsPage;
