import SafePicker from '../../components/SafePicker';
import { DateTime } from 'luxon';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Toast from 'react-native-toast-message';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { useLeague } from '../../context/LeagueContext';
import * as apiActions from '../../src/api';
import HelpIcon from '../../components/HelpIcon';

const SeasonSettingsPage = () => {
  const { api } = useAuth();
  const { selectedLeagueId, currentUserMembership, loadingCurrentUserMembership } = useLeague();

  // Helper function to parse date strings robustly
  const parseDateStringAsLocal = (dateString) => {
    if (!dateString) return null;
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    // Create a new Date object using local timezone midnight
    return new Date(year, month - 1, day);
  };

  // State for all seasons
  const [seasons, setSeasons] = useState([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [errorSeasons, setErrorSeasons] = useState(null);

  // State for selected season and its settings
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState(null);

  // New states for timer duration (minutes and seconds)
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSecondsInput, setDurationSecondsInput] = useState('');

  // New states for warning sound time (minutes and seconds)
  const [warningMinutes, setWarningMinutes] = useState('');
  const [warningSecondsInput, setWarningSecondsInput] = useState('');

  // State for Games
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [hasGamesInSelectedSeason, setHasGamesInSelectedSeason] = useState(false);

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

  // State for edit season modal
  const [editSeasonModalVisible, setEditSeasonModalVisible] = useState(false);
  const [editedSeasonName, setEditedSeasonName] = useState('');
  const [editedSeasonStartDate, setEditedSeasonStartDate] = useState(null);
  const [editedSeasonEndDate, setEditedSeasonEndDate] = useState(null);

  // State for create game modal
  const [createGameModalVisible, setCreateGameModalVisible] = useState(false);
  const [newGameDate, setNewGameDate] = useState(new Date());
  const [newGameTime, setNewGameTime] = useState(new Date());
  const [newGameLocation, setNewGameLocation] = useState('');
  const [isGameDatePickerVisible, setGameDatePickerVisible] = useState(false);
  const [isGameTimePickerVisible, setGameTimePickerVisible] = useState(false);

  // State for editing game modal
  const [editGameModalVisible, setEditGameModalVisible] = useState(false);
  const [currentEditingGame, setCurrentEditingGame] = useState(null);
  const [editedGameName, setEditedGameName] = useState('');
  const [editedGameDate, setEditedGameDate] = useState(new Date());
  const [editedGameTime, setEditedGameTime] = useState(new Date());
  const [editedGameLocation, setEditedGameLocation] = useState('');
  const [isEditGameDatePickerVisible, setEditGameDatePickerVisible] = useState(false);
  const [isEditGameTimePickerVisible, setEditGameTimePickerVisible] = useState(false);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState(null); // 'startDate' or 'endDate'

  useFocusEffect(
    useCallback(() => {
      // When the screen is focused, do nothing special for now.
      // The important part is the cleanup function when it blurs.
      return () => {
        // Reset all state variables to their initial values when the screen blurs
        setSeasons([]);
        setLoadingSeasons(true);
        setErrorSeasons(null);
        setSelectedSeason(null);
        setSettings(null);
        setLoadingSettings(true);
        setErrorSettings(null);
        setDurationMinutes('');
        setDurationSecondsInput('');
        setWarningMinutes('');
        setWarningSecondsInput('');
        setGames([]);
        setLoadingGames(false);
        setHasGamesInSelectedSeason(false);
        setBlindLevels([]);
        setPlacePoints([]);
        setAddBlindLevelModalVisible(false);
        setNewBlindLevel({ level: '', smallBlind: '', bigBlind: '' });
        setAddPlacePointModalVisible(false);
        setNewPlacePoint({ place: '', points: '' });
        setEditBlindLevelModalVisible(false);
        setCurrentEditingBlindLevel(null);
        setCurrentEditingBlindLevelIndex(null);
        setEditPlacePointModalVisible(false);
        setCurrentEditingPlacePoint(null);
        setCurrentEditingPlacePointIndex(null);
        setCreateSeasonModalVisible(false);
        setNewSeasonName('');
        setNewSeasonStartDate(null);
        setNewSeasonEndDate(null);
        setEditSeasonModalVisible(false);
        setEditedSeasonName('');
        setEditedSeasonStartDate(null);
        setEditedSeasonEndDate(null);
        setCreateGameModalVisible(false);
        setNewGameLocation('');
        setNewGameTime(new Date());
        setNewGameLocation('');
        setGameDatePickerVisible(false);
        setGameTimePickerVisible(false);
        setEditGameModalVisible(false);
        setCurrentEditingGame(null);
        setEditedGameName('');
        setEditedGameDate(new Date());
        setEditedGameTime(new Date());
        setEditedGameLocation('');
        setEditGameDatePickerVisible(false);
        setEditGameTimePickerVisible(false);
        setDatePickerVisible(false);
        setDatePickerField(null);
      };
    }, [])
  );

  const handleAddToCalendar = (game) => {
    const url = `${apiActions.API_BASE_URL}/api/games/calendar/${game.calendarToken}.ics`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

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
    } else if (datePickerField === 'editedStartDate') {
      setEditedSeasonStartDate(date);
    } else if (datePickerField === 'editedEndDate') {
      setEditedSeasonEndDate(date);
    }
    hideDatePicker();
  };

  const isAdmin = currentUserMembership?.role === 'ADMIN' || currentUserMembership?.isOwner;

  const seasonPickerItems = useMemo(() => {
    return seasons.map((s) => {
      const label = typeof s.seasonName === 'string' ? s.seasonName : String(s.seasonName ?? 'Unnamed');
      const value = String(s.id);
      return (
        <SafePicker.Item key={value} label={label} value={value} />
      );
    });
  }, [seasons]);

  const fetchGames = useCallback(async (seasonId) => {
    if (!seasonId) return;
    setLoadingGames(true);
    try {
      const gamesData = await api(apiActions.getAllGamesBySeason, seasonId);
      setGames(gamesData.sort((a, b) => new Date(a.gameDateTime) - new Date(b.gameDateTime)));
      return gamesData; // Return gamesData
    } catch (e) {
      console.error("Failed to fetch games:", e);
      return []; // Return empty array on error
    } finally {
      setLoadingGames(false);
    }
  }, [api]);

  const fetchSettings = useCallback(async (seasonIdToFetch = null) => {
    if (!selectedLeagueId) return;
    setLoadingSettings(true);
    try {
      let targetSeasonId = seasonIdToFetch;
      let fetchedSeason = null;
      let fetchedSettingsData = null;
      let fetchedBlindLevels = [];
      let fetchedPlacePoints = [];
      let fetchedGames = [];
      let hasGames = false;
      let durationMins = '';
      let durationSecs = '';
      let warningMins = '';
      let warningSecs = '';

      if (!targetSeasonId) {
        try {
          fetchedSeason = await api(apiActions.getActiveSeason, selectedLeagueId);
          targetSeasonId = fetchedSeason.id;
        } catch (e) {
          if (e.message.includes('404')) {
            // No active season, reset all related states
            setSettings(null);
            setSelectedSeason(null);
            setBlindLevels([]);
            setPlacePoints([]);
            setGames([]);
            setHasGamesInSelectedSeason(false);
            setDurationMinutes('');
            setDurationSecondsInput('');
            setWarningMinutes('');
            setWarningSecondsInput('');
            return;
          }
          throw e;
        }
      } else {
        // If targetSeasonId was provided, we need to fetch the season data for setSelectedSeason
        fetchedSeason = seasons.find(s => s.id === targetSeasonId);
        if (!fetchedSeason) {
          // Fallback if season not found in current 'seasons' state (e.g., after a new season is created)
          const allSeasons = await api(apiActions.getSeasons, selectedLeagueId);
          fetchedSeason = allSeasons.find(s => s.id === targetSeasonId);
        }
      }

      if (targetSeasonId) {
        fetchedSettingsData = await api(apiActions.getSeasonSettings, targetSeasonId);
        fetchedBlindLevels = (fetchedSettingsData.blindLevels || []).sort((a, b) => a.level - b.level);
        fetchedPlacePoints = fetchedSettingsData.placePoints || [];
        fetchedGames = await fetchGames(targetSeasonId);
        hasGames = fetchedGames.length > 0;

        if (fetchedSettingsData.durationSeconds !== undefined) {
          durationMins = Math.floor(fetchedSettingsData.durationSeconds / 60).toString();
          durationSecs = (fetchedSettingsData.durationSeconds % 60).toString();
        }
        if (fetchedSettingsData.warningSoundTimeSeconds !== undefined) {
          warningMins = Math.floor(fetchedSettingsData.warningSoundTimeSeconds / 60).toString();
          warningSecs = (fetchedSettingsData.warningSoundTimeSeconds % 60).toString();
        }
      }

      // Consolidate all state updates into a single block
      setSelectedSeason(fetchedSeason);
      setSettings(fetchedSettingsData);
      setBlindLevels(fetchedBlindLevels);
      setPlacePoints(fetchedPlacePoints);
      setGames(fetchedGames);
      setHasGamesInSelectedSeason(hasGames);
      setDurationMinutes(durationMins);
      setDurationSecondsInput(durationSecs);
      setWarningMinutes(warningMins);
      setWarningSecondsInput(warningSecs);

    } catch (e) {
      console.error("Failed to fetch settings:", e);
      setErrorSettings(e.message);
    } finally {
      setLoadingSettings(false);
    }
  }, [selectedLeagueId, api, fetchGames, seasons]);

  const fetchAllSeasons = useCallback(async () => {
    if (!selectedLeagueId) return [];
    setLoadingSeasons(true);
    try {
      const data = await api(apiActions.getSeasons, selectedLeagueId);
      const sortedData = [...data].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setSeasons(sortedData || []);
      return sortedData || [];
    } catch (e) {
      console.error("Failed to fetch all seasons:", e);
      setErrorSeasons(e.message);
      return [];
    } finally {
      setLoadingSeasons(false);
    }
  }, [selectedLeagueId, api]);

  const handleSeasonChange = useCallback((seasonId) => {
    const newSelectedSeason = seasons.find(s => s.id === seasonId);
    if (newSelectedSeason) {
      setSelectedSeason(newSelectedSeason);
      fetchSettings(newSelectedSeason.id);
    }
  }, [seasons, fetchSettings]);

  const onSeasonPickerChange = useCallback((itemValue) => {
    handleSeasonChange(Number(itemValue));
  }, [handleSeasonChange]);

  useEffect(() => {
    fetchAllSeasons();
  }, [fetchAllSeasons]);

  useEffect(() => {
    if (!selectedSeason && seasons.length > 0) {
      const today = new Date();
      let defaultSeason = null;

      // 1. Try to find an active non-casual season
      const activeNonCasualSeason = seasons.find(season => {
        if (season.isCasual) return false; // Skip casual seasons
        const startDate = DateTime.fromISO(season.startDate).toJSDate();
        const endDate = DateTime.fromISO(season.endDate).toJSDate();
        return today >= startDate && today <= endDate;
      });

      if (activeNonCasualSeason) {
        defaultSeason = activeNonCasualSeason;
      } else {
        // 2. If no active non-casual, try to find the most recently started non-casual season
        const nonCasualSeasons = seasons.filter(s => !s.isCasual);
        if (nonCasualSeasons.length > 0) {
          // Seasons are already sorted by startDate descending, so nonCasualSeasons[0] is the latest
          defaultSeason = nonCasualSeasons[0];
        } else {
          // 3. If only casual seasons exist, default to the most recently started casual season
          // Seasons are already sorted by startDate descending, so seasons[0] is the latest (which would be casual here)
          defaultSeason = seasons[0];
        }
      }

      if (defaultSeason) {
        handleSeasonChange(defaultSeason.id);
      } else {
        // No seasons found at all (should be caught by seasons.length === 0 check, but for safety)
        // Consolidate state updates
        setSettings(null);
        setSelectedSeason(null);
        setBlindLevels([]);
        setPlacePoints([]);
        setGames([]);
        setDurationMinutes('');
        setDurationSecondsInput('');
        setWarningMinutes('');
        setWarningSecondsInput('');
        setHasGamesInSelectedSeason(false);
      }
    } else if (seasons.length === 0 && !loadingSeasons) {
      // Consolidate state updates
      setSettings(null);
      setSelectedSeason(null);
      setBlindLevels([]);
      setPlacePoints([]);
      setGames([]);
      setDurationMinutes('');
      setDurationSecondsInput('');
      setWarningMinutes('');
      setWarningSecondsInput('');
      setHasGamesInSelectedSeason(false);
    }
  }, [seasons, selectedSeason, loadingSeasons, handleSeasonChange]);

  const handleSettingChange = useCallback((field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  }, []);

  const onBountyRuleChange = useCallback((itemValue) => {
    handleSettingChange('bountyOnLeaderAbsenceRule', itemValue);
  }, [handleSettingChange]);

  const handleNumericInputBlur = (field, currentValue) => {
    let cleanedValue = currentValue.toString().replace(/,/g, '');
    const decimalCount = (cleanedValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      cleanedValue = cleanedValue.substring(0, cleanedValue.indexOf('.') + 1) +
                     cleanedValue.substring(cleanedValue.indexOf('.') + 1).replace(/\./g, '');
    }

    const numValue = parseFloat(cleanedValue);

    if (isNaN(numValue)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a valid number.'
      });
      setSettings(prev => ({ ...prev, [field]: 0 }));
      return;
    }

    const parts = numValue.toString().split('.');
    if (parts.length > 1 && parts[1].length > 2) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a number with a maximum of 2 decimal places.'
      });
      setSettings(prev => ({ ...prev, [field]: parseFloat(numValue.toFixed(2)) }));
      return;
    }

    setSettings(prev => ({ ...prev, [field]: numValue }));
  };

  const handleCreateSeason = async () => {
    if (!selectedLeagueId || !newSeasonName || !newSeasonStartDate || !newSeasonEndDate) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all season details.'
      });
      return;
    }

    if (newSeasonName === "Casual Games") {
      Toast.show({
        type: 'error',
        text1: 'Invalid Season Name',
        text2: 'The name "Casual Games" is reserved.'
      });
      return;
    }

    try {
      const formattedStartDate = DateTime.fromJSDate(newSeasonStartDate).toFormat('yyyy-MM-dd');
      const formattedEndDate = DateTime.fromJSDate(newSeasonEndDate).toFormat('yyyy-MM-dd');
      const seasonData = {
        seasonName: newSeasonName,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      };

      await api(apiActions.createSeason, selectedLeagueId, seasonData);

      Toast.show({
        type: 'success',
        text1: 'Season Created',
        text2: 'Season created successfully!'
      });
      setCreateSeasonModalVisible(false);
      setNewSeasonName('');
      setNewSeasonStartDate(null);
      setNewSeasonEndDate(null);
      fetchAllSeasons();
    } catch (e) {
      console.error("Failed to create season:", e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e.message
      });
    }
  };

  const handleEditSeason = async () => {
    if (selectedSeason?.isCasual) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Edit Casual Season',
        text2: 'The "Casual Games" season cannot be edited.'
      });
      return;
    }

    if (!selectedSeason || !editedSeasonName || !editedSeasonStartDate || !editedSeasonEndDate) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill in all season details.'
      });
      return;
    }

    try {
      const formattedStartDate = DateTime.fromJSDate(editedSeasonStartDate).toFormat('yyyy-MM-dd');
      const formattedEndDate = DateTime.fromJSDate(editedSeasonEndDate).toFormat('yyyy-MM-dd');
      const seasonData = {
        seasonName: editedSeasonName,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      };

      await api(apiActions.updateSeason, selectedLeagueId, selectedSeason.id, seasonData);
      Toast.show({
        type: 'success',
        text1: 'Season Updated',
        text2: 'Season updated successfully!'
      });
      setEditSeasonModalVisible(false);

      // Refresh seasons list and then update selectedSeason state
      const fetchedSeasons = await fetchAllSeasons(); // Get the updated seasons directly

      // Find the updated season object from the fetched seasons array
      const updatedSeason = fetchedSeasons.find(s => s.id === selectedSeason.id);
      if (updatedSeason) {
        setSelectedSeason(updatedSeason); // Update selectedSeason state with fresh data
      }

      fetchSettings(updatedSeason.id); // Refresh current season settings using the updated selectedSeason state
    } catch (e) {
      console.error("Failed to update season:", e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Failed to update season: ${e.message}`
      });
    }
  };

  const handleAddNewGame = async () => {
    if (!selectedSeason) return;

    try {
      const combinedDateTime = DateTime.fromJSDate(newGameDate)
        .set({
          hour: newGameTime.getHours(),
          minute: newGameTime.getMinutes(),
          second: newGameTime.getSeconds(),
        })
        .toISO();

      const gameData = {
        gameDateTime: combinedDateTime,
        gameLocation: newGameLocation,
      };
      await api(apiActions.createGame, selectedSeason.id, gameData);

      Toast.show({
        type: 'success',
        text1: 'Game Added',
        text2: 'Game added successfully!'
      });
      setCreateGameModalVisible(false);
      setNewGameLocation('');
      setNewGameTime(new Date());
      fetchGames(selectedSeason.id);
    } catch (e) {
      console.error("Failed to add game:", e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e.message
      });
    }
  };

  const handleEditGame = (game) => {
    setCurrentEditingGame(game);
    setEditedGameName(game.gameName);
    const gameDateTime = DateTime.fromISO(game.gameDateTime).toJSDate();
    setEditedGameDate(gameDateTime);
    setEditedGameTime(gameDateTime);
    setEditedGameLocation(game.gameLocation || '');
    setEditGameModalVisible(true);
  };

  const handleUpdateGame = async () => {
    if (!currentEditingGame || !selectedSeason) return;

    try {
      const combinedDateTime = DateTime.fromJSDate(editedGameDate)
        .set({
          hour: editedGameTime.getHours(),
          minute: editedGameTime.getMinutes(),
          second: editedGameTime.getSeconds(),
        })
        .toISO();

      const gameData = {
        gameName: editedGameName,
        gameDateTime: combinedDateTime,
        gameLocation: editedGameLocation,
      };
      await api(apiActions.updateGame, selectedSeason.id, currentEditingGame.id, gameData);

      Toast.show({
        type: 'success',
        text1: 'Game Updated',
        text2: 'Game updated successfully!'
      });
      setEditGameModalVisible(false);
      setCurrentEditingGame(null);
      setEditedGameName('');
      setEditedGameDate(new Date());
      setEditedGameTime(new Date());
      setEditedGameLocation('');
      fetchGames(selectedSeason.id);
    } catch (e) {
      console.error("Failed to update game:", e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e.message
      });
    }
  };

  const handleDeleteGame = (gameId) => {
    Alert.alert(
      "Delete Game",
      "Are you sure you want to delete this game? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            if (!selectedSeason) return;
            try {
              await api(apiActions.deleteGame, selectedSeason.id, gameId);
              Toast.show({
                type: 'success',
                text1: 'Game Deleted',
                text2: 'Game deleted successfully!'
              });
              fetchGames(selectedSeason.id);
            } catch (e) {
              console.error("Failed to delete game:", e);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: e.message
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleFinalizeSeason = async () => {
    if (!selectedSeason) return;

    Alert.alert(
      "Finalize Season",
      `Are you sure you want to finalize ${selectedSeason.seasonName}? Once finalized, all games, results, and settings will be permanently locked and cannot be edited. This action cannot be undone.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await api(apiActions.finalizeSeason, selectedLeagueId, selectedSeason.id);
              Toast.show({
                type: 'success',
                text1: 'Season Finalized',
                text2: 'Season finalized successfully!'
              });
              const updatedSeasons = await fetchAllSeasons();
              const updatedSelectedSeason = updatedSeasons.find(s => s.id === selectedSeason.id);
              if (updatedSelectedSeason) {
                setSelectedSeason(updatedSelectedSeason);
              }
              fetchSettings(selectedSeason.id);
            } catch (e) {
              console.error("Failed to finalize season:", e);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: e.message
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleDeleteSeason = async () => {
    if (!selectedSeason) return;

    Alert.alert(
      "Delete Season",
      `Are you sure you want to delete the season "${selectedSeason.seasonName}"? This action cannot be undone.`, 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await api(apiActions.deleteSeason, selectedLeagueId, selectedSeason.id);
              Toast.show({
                type: 'success',
                text1: 'Season Deleted',
                text2: 'Season deleted successfully!'
              });
              fetchAllSeasons(); // Refresh seasons list
            } catch (e) {
              console.error("Failed to delete season:", e);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: `Failed to delete season: ${e.message}`
              });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const saveSettings = async () => {
      if (!selectedSeason?.id || !settings) return;
      setLoadingSettings(true);
      try {
          // Convert minutes and seconds to total seconds
          const totalDurationSeconds = (parseInt(durationMinutes, 10) || 0) * 60 + (parseInt(durationSecondsInput, 10) || 0);
          const totalWarningSoundTimeSeconds = (parseInt(warningMinutes, 10) || 0) * 60 + (parseInt(warningSecondsInput, 10) || 0);

          const settingsToSave = {
              ...settings,
              durationSeconds: totalDurationSeconds,
              warningSoundTimeSeconds: totalWarningSoundTimeSeconds,
              blindLevels: blindLevels,
              placePoints: placePoints,
          };
          await api(apiActions.updateSeasonSettings, selectedSeason.id, settingsToSave);
          Toast.show({
            type: 'success',
            text1: 'Settings Saved',
            text2: 'Settings saved successfully!'
          });
      } catch (e) {
          console.error("Failed to save settings:", e);
          setErrorSettings(e.message);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to save settings.'
          });
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields for the new blind level.'
      });
      return;
    }
    const newLevel = blindLevels.length > 0 ? Math.max(...blindLevels.map(b => b.level)) + 1 : 1;
    const newSmallBlind = parseInt(newBlindLevel.smallBlind);
    const newBigBlind = parseInt(newBlindLevel.bigBlind);
    if (blindLevels.length > 0) {
      const last = blindLevels[blindLevels.length - 1];
      if (newSmallBlind <= last.smallBlind || newBigBlind <= last.bigBlind) {
        Toast.show({
            type: 'error',
            text1: 'Validation Error',
            text2: 'New blind level\'s small blind and big blind must be greater than the previous level\'s blinds.'
        });
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields for the new place point.'
      });
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

                {!selectedSeason?.isCasual && (
                  <>
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
                            <Text style={styles.gameNameText}>{game.gameName}</Text>
                            <View style={styles.gameInfo}>
                              <Text>{DateTime.fromISO(game.gameDateTime).toLocal().toFormat('MM/dd/yyyy hh:mm a')}</Text>
                              {game.gameLocation && <Text>Location: {game.gameLocation}</Text>}
                            </View>
                          </View>
                          <View style={styles.gameActions}>
                            {isAdmin && !isSeasonFinalized && game.gameStatus === 'SCHEDULED' && (
                              <>
                                <TouchableOpacity
                                  style={[styles.button, styles.buttonPrimary, styles.smallButton]}
                                  onPress={() => handleEditGame(game)}
                                >
                                  <Text style={styles.textStyle}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.button, styles.buttonDestructive, styles.smallButton, { marginLeft: 10 }]}
                                  onPress={() => handleDeleteGame(game.id)}
                                >
                                  <Text style={styles.textStyle}>Delete</Text>
                                </TouchableOpacity>
                              </>
                            )}
                            {game.gameStatus !== 'COMPLETED' && (
                              <TouchableOpacity onPress={() => handleAddToCalendar(game)} style={{ marginLeft: 10 }}>
                                <MaterialCommunityIcons name="calendar-plus" size={30} color="#28a745" />
                              </TouchableOpacity>
                            )}
                          </View>
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
                            // Manually parse the date components to avoid timezone issues during initial parsing
                            const [startDatePart] = selectedSeason.startDate.split('T');
                            const [startYear, startMonth, startDay] = startDatePart.split('-').map(Number);
        
                            const [endDatePart] = selectedSeason.endDate.split('T');
                            const [endYear, endMonth, endDay] = endDatePart.split('-').map(Number);
        
                            const seasonStartLuxon = DateTime.local(startYear, startMonth, startDay);
                            const seasonEndLuxon = DateTime.local(endYear, endMonth, endDay);
        
                            const seasonStartLuxonYear = seasonStartLuxon.year;
                            const seasonStartLuxonMonth = seasonStartLuxon.month;
                            const seasonStartLuxonDay = seasonStartLuxon.day;
        
                            const seasonEndLuxonYear = seasonEndLuxon.year;
                            const seasonEndLuxonMonth = seasonEndLuxon.month;
                            const seasonEndLuxonDay = seasonEndLuxon.day;
        
                            const seasonStart = new Date(seasonStartLuxonYear, seasonStartLuxonMonth - 1, seasonStartLuxonDay, 0, 0, 0, 0);
                            const seasonEnd = new Date(seasonEndLuxonYear, seasonEndLuxonMonth - 1, endDay, 0, 0, 0, 0);
        
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
                            onPress={() => setGameTimePickerVisible(true)}
                            style={styles.dateInputButton}
                          >
                            <Text style={styles.dateInputText}>
                              Game Time: {DateTime.fromJSDate(newGameTime).toFormat('hh:mm a')}
                            </Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.input, styles.modalInput]}
                            placeholder="Game Location (Optional)"
                            placeholderTextColor="gray"
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
                      minimumDate={parseDateStringAsLocal(selectedSeason?.startDate)}
                      maximumDate={parseDateStringAsLocal(selectedSeason?.endDate)}
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
                            onPress={() => setEditGameTimePickerVisible(true)}
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
                      minimumDate={parseDateStringAsLocal(selectedSeason?.startDate)}
                      maximumDate={parseDateStringAsLocal(selectedSeason?.endDate)}
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
                  </>
                )}
        {!selectedSeason?.isCasual && (
          <View style={styles.settingItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.settingLabel}>Track Kills</Text>
                  <HelpIcon topicKey="TRACK_KILLS" />
              </View>
              <Switch
                  value={settings.trackKills}
                  onValueChange={(value) => handleSettingChange('trackKills', value)}
                  disabled={isSeasonFinalized || !isAdmin}
              />
          </View>
        )}
        {settings.trackKills && !selectedSeason?.isCasual ? (
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

        {!selectedSeason?.isCasual && (
          <View style={styles.settingItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.settingLabel}>Track Bounties</Text>
                  <HelpIcon topicKey="TRACK_BOUNTIES" />
              </View>
              <Switch
                  value={settings.trackBounties}
                  onValueChange={(value) => handleSettingChange('trackBounties', value)}
                  disabled={isSeasonFinalized || !isAdmin}
              />
          </View>
        )}
        {settings.trackBounties && !selectedSeason?.isCasual ? (
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

        {!selectedSeason?.isCasual && (
          <View style={styles.settingItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.settingLabel}>Enable Attendance Points</Text>
                  <HelpIcon topicKey="ATTENDANCE_POINTS" />
              </View>
              <Switch
                  value={settings.enableAttendancePoints}
                  onValueChange={(value) => handleSettingChange('enableAttendancePoints', value)}
                  disabled={isSeasonFinalized || !isAdmin}
              />
          </View>
        )}
        {settings.enableAttendancePoints && !selectedSeason?.isCasual ? (
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
            <Text style={styles.settingLabel}>Timer Duration</Text>
            <View style={styles.timeInputContainer}>
                <TextInput
                    style={styles.timeInput}
                    value={durationMinutes}
                    onChangeText={(value) => setDurationMinutes(value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                    maxLength={3}
                />
                <Text style={styles.timeLabel}>min</Text>
                <TextInput
                    style={styles.timeInput}
                    value={durationSecondsInput}
                    onChangeText={(value) => setDurationSecondsInput(value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                    maxLength={2}
                />
                <Text style={styles.timeLabel}>sec</Text>
            </View>
        </View>

        <View style={styles.settingItem}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.settingLabel}>Warning Sound Enabled</Text>
                <HelpIcon topicKey="TIMER_WARNING_SOUND" />
            </View>
            <Switch
                value={settings.warningSoundEnabled}
                onValueChange={(value) => handleSettingChange('warningSoundEnabled', value)}
                disabled={isSeasonFinalized || !isAdmin}
            />
        </View>

        {settings.warningSoundEnabled ? (
            <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Warning Sound Time</Text>
                <View style={styles.timeInputContainer}>
                    <TextInput
                        style={styles.timeInput}
                        value={warningMinutes}
                        onChangeText={(value) => setWarningMinutes(value.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                        maxLength={3}
                    />
                    <Text style={styles.timeLabel}>min</Text>
                    <TextInput
                        style={styles.timeInput}
                        value={warningSecondsInput}
                        onChangeText={(value) => setWarningSecondsInput(value.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        editable={isSeasonFinalized ? false : (isAdmin ? true : false)}
                        maxLength={2}
                    />
                    <Text style={styles.timeLabel}>sec</Text>
                </View>
            </View>
        ) : null}

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

        {!selectedSeason?.isCasual && (
          <View style={styles.settingItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.settingLabel}>Allow Players to Control Timer</Text>
                  <HelpIcon topicKey="PLAYER_TIMER_CONTROL" />
              </View>
              <Switch
                  value={settings.playerTimerControlEnabled}
                  onValueChange={(value) => handleSettingChange('playerTimerControlEnabled', value)}
                  disabled={isSeasonFinalized || !isAdmin || selectedSeason?.isCasual}
              />
          </View>
        )}

        {!selectedSeason?.isCasual && (
          <View style={styles.settingItem}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.settingLabel}>Allow Players to Handle Eliminations</Text>
                  <HelpIcon topicKey="PLAYER_ELIMINATION_CONTROL" />
              </View>
              <Switch
                  value={settings.playerEliminationEnabled}
                  onValueChange={(value) => handleSettingChange('playerEliminationEnabled', value)}
                  disabled={isSeasonFinalized || !isAdmin || selectedSeason?.isCasual}
              />
          </View>
        )}

        {!selectedSeason?.isCasual && (
          <View style={styles.settingItem}>
              <View style={{ flexDirection: 'column', width: '100%' }}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.settingLabel}>Bounty on Leader Absence</Text>
                      <HelpIcon topicKey="BOUNTY_ON_LEADER_ABSENCE" />
                  </View>
                  <SafePicker
                      selectedValue={settings.bountyOnLeaderAbsenceRule}
                      style={styles.pickerBounty}
                      onValueChange={onBountyRuleChange}
                      enabled={isSeasonFinalized ? false : (isAdmin ? true : false)}
                      itemStyle={{ color: 'black' }}
                  >
                      <SafePicker.Item label="No Bounty" value="NO_BOUNTY"/>
                      <SafePicker.Item label="Next Highest Player" value="NEXT_HIGHEST_PLAYER"/>
                  </SafePicker>
              </View>
          </View>
        )}

        {/* Blind Levels Section */}
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.subtitle}>Blind Levels</Text>
            <HelpIcon topicKey="BLIND_LEVELS" />
        </View>
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

        {!selectedSeason?.isCasual && (
          <>
            {/* Place Points Section */}
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.subtitle}>Place Points</Text>
                <HelpIcon topicKey="PLACE_POINTS" />
            </View>
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
                <View style={styles.placePointItemContent}> 
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
          </>
        )}

        {isSeasonFinalized
          ? null
          : (
              isAdmin
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
              : null
            )}
      </View>
    );
  };


  return (
    <PageLayout>
      <View style={styles.container}>
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
                <SafePicker
                  selectedValue={String(selectedSeason?.id ?? '')}
                  style={styles.picker}
                  onValueChange={onSeasonPickerChange}>
                  {seasonPickerItems}
                </SafePicker>
              </View>
            </View>
            {isAdmin && selectedSeason && !selectedSeason.isFinalized && !selectedSeason.isCasual && (
              <View style={styles.seasonActionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary, styles.actionButton]}
                  onPress={() => {
                    setEditedSeasonName(selectedSeason.seasonName);
                    setEditedSeasonStartDate(parseDateStringAsLocal(selectedSeason.startDate));
                    setEditedSeasonEndDate(parseDateStringAsLocal(selectedSeason.endDate));
                    setEditSeasonModalVisible(true);
                  }}
                >
                  <Text style={styles.textStyle}>Edit Season</Text>
                </TouchableOpacity>
                {!hasGamesInSelectedSeason && !selectedSeason.isCasual && ( // Conditional render
                  <TouchableOpacity
                    style={[styles.button, styles.buttonDestructive, styles.actionButton]}
                    onPress={handleDeleteSeason}
                  >
                    <Text style={styles.textStyle}>Delete Season</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {isAdmin && (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.actionButton]}
                onPress={() => setCreateSeasonModalVisible(true)}
              >
                <Text style={styles.textStyle}>Create New Season</Text>
              </TouchableOpacity>
            )}


            {selectedSeason ? renderSettings() : null}

            {selectedSeason && !selectedSeason.isCasual
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
                placeholderTextColor="gray"
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

        {/* Edit Season Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editSeasonModalVisible}
          onRequestClose={() => setEditSeasonModalVisible(false)}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Edit Season</Text>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="Season Name"
                value={editedSeasonName}
                onChangeText={setEditedSeasonName}
              />
              <TouchableOpacity onPress={() => showDatePicker('editedStartDate')} style={styles.dateInputButton}>
                <Text style={styles.dateInputText}>
                  Start Date: {editedSeasonStartDate ? DateTime.fromJSDate(editedSeasonStartDate).toFormat('MM/dd/yyyy') : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => showDatePicker('editedEndDate')} style={styles.dateInputButton}>
                <Text style={styles.dateInputText}>
                  End Date: {editedSeasonEndDate ? DateTime.fromJSDate(editedSeasonEndDate).toFormat('MM/dd/yyyy') : 'Select Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimaryRed, styles.modalButton]}
                onPress={handleEditSeason}
              >
                <Text style={styles.textStyle}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose, styles.modalButton]}
                onPress={() => setEditSeasonModalVisible(false)}>
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
          date={ 
            datePickerField === 'startDate' ? (newSeasonStartDate || new Date()) :
            datePickerField === 'endDate' ? (newSeasonEndDate || new Date()) :
            datePickerField === 'editedStartDate' ? (editedSeasonStartDate || new Date()) :
            datePickerField === 'editedEndDate' ? (editedSeasonEndDate || new Date()) :
            new Date() // Default
          }
        />


      </View>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  noSeasonsContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  seasonActionButtonsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 10,
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
    justifyContent: 'space-between', // Pushes children to opposite ends
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
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    width: 50, // Smaller width for minutes/seconds
    textAlign: 'center',
    marginBottom: 10,
    marginHorizontal: 5,
  },
  timeLabel: {
    fontSize: 14,
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
    color: 'black',
    dropdownIconColor: 'black',
  },
  pickerBounty: {
    width: 210,
    backgroundColor: 'white',
    color: 'black',
    dropdownIconColor: 'black',
  },
  pickerWrapper: {
    justifyContent: 'center',
    paddingLeft: 10,
    borderRadius: 10, // Rounded corners
  },
  modalButton: {
    width: '80%',
    borderRadius: 25, // Rounded edges
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
    borderRadius: 25,
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
    marginBottom: 15,
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
  gameNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
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
  gameActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
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
