import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as apiActions from '../src/api';

const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const { user, api } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [leagueHomeContent, setLeagueHomeContent] = useState(null);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [currentUserMembership, setCurrentUserMembership] = useState(null);
  const [loadingCurrentUserMembership, setLoadingCurrentUserMembership] = useState(true);
  const [activeSeason, setActiveSeason] = useState(null);
  const [loadingSeason, setLoadingSeason] = useState(true);

  const reloadLeagues = useCallback(async () => {
    if (user) {
      setLoadingLeagues(true);
      try {
        const data = await api(apiActions.getLeagues);
        setLeagues(data || []);
        if (data && data.length > 0) {
          if (!selectedLeagueId || !data.some(league => league.id === selectedLeagueId)) {
            setSelectedLeagueId(data[0].id);
          }
        } else {
          setSelectedLeagueId(null);
        }
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
        if (error.message !== '401') {
          setLeagues([]);
          setSelectedLeagueId(null);
        }
      } finally {
        setLoadingLeagues(false);
      }
    }
  }, [user, selectedLeagueId, api]);

  useEffect(() => {
    reloadLeagues();
  }, [reloadLeagues]);

  const fetchCurrentUserMembership = useCallback(async () => {
    if (!selectedLeagueId || !user?.id) {
      setCurrentUserMembership(null);
      setLoadingCurrentUserMembership(false);
      return;
    }
    setLoadingCurrentUserMembership(true);
    try {
      const data = await api(apiActions.getCurrentUserMembership, selectedLeagueId);
      setCurrentUserMembership(data);
    } catch (error) {
      console.error('Failed to fetch current user membership:', error);
      if (error.message !== '401') {
        setCurrentUserMembership(null);
      }
    } finally {
      setLoadingCurrentUserMembership(false);
    }
  }, [selectedLeagueId, user?.id, api]);

  useEffect(() => {
    fetchCurrentUserMembership();
  }, [fetchCurrentUserMembership]);

  useEffect(() => {
    const fetchActiveSeason = async () => {
      if (selectedLeagueId) {
        setLoadingSeason(true);
        try {
          const season = await api(apiActions.getActiveSeason, selectedLeagueId);
          setActiveSeason(season);
        } catch (error) {
          if (error.message.includes('404')) {
            setActiveSeason(null); // It's okay if there's no active season
          } else if (error.message !== '401') {
            console.error('Failed to fetch active season:', error);
            setActiveSeason(null);
          }
        } finally {
          setLoadingSeason(false);
        }
      }
    };
    fetchActiveSeason();
  }, [selectedLeagueId, api]);

  const reloadHomeContent = useCallback(async () => {
    if (!selectedLeagueId) {
      setLeagueHomeContent(null);
      setLoadingContent(false);
      return;
    }
    setLoadingContent(true);
    try {
      const data = await api(apiActions.getLeagueHomeContent, selectedLeagueId);
      setLeagueHomeContent(data);
    } catch (error) {
      if (error.message.startsWith('API Error: 404')) {
        // Gracefully handle 404 when no home content exists yet
        setLeagueHomeContent(null);
      } else {
        console.error('Failed to fetch league home content:', error);
        if (error.message !== '401') {
          setLeagueHomeContent(null);
        }
      }
    } finally {
      setLoadingContent(false);
    }
  }, [selectedLeagueId, api]);

  useEffect(() => {
    reloadHomeContent();
  }, [reloadHomeContent]);

  const switchLeague = (leagueId) => {
    setSelectedLeagueId(leagueId);
  };

  const refreshInviteCode = async (leagueId) => {
    try {
      const data = await api(apiActions.refreshInviteCode, leagueId);
      if (data) {
        setInviteCode(data.inviteCode);
        await reloadLeagues();
      }
    } catch (error) {
      console.error('Failed to refresh invite code:', error);
    }
  };

  const currentLeague = Array.isArray(leagues) ? leagues.find(l => l.id === selectedLeagueId) : undefined;

  const reloadCurrentUserMembership = useCallback(async () => {
    await fetchCurrentUserMembership();
  }, [fetchCurrentUserMembership]);

  const value = {
    leagues,
    selectedLeagueId,
    leagueHomeContent,
    loadingLeagues,
    loadingContent,
    switchLeague,
    currentLeague,
    currentUserMembership,
    setCurrentUserMembership,
    loadingCurrentUserMembership,
    refreshInviteCode,
    reloadLeagues,
    inviteCode,
    setInviteCode,
    reloadHomeContent,
    reloadCurrentUserMembership,
    activeSeason,
    loadingSeason,
  };

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};
