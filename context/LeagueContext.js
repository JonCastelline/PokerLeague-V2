import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../src/config';

const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [leagueHomeContent, setLeagueHomeContent] = useState(null);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);
  const [currentUserMembership, setCurrentUserMembership] = useState(null); // New state for current user's membership
  const [loadingCurrentUserMembership, setLoadingCurrentUserMembership] = useState(true); // New loading state

  const reloadLeagues = useCallback(async () => {
    if (token) {
      setLoadingLeagues(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/leagues`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        setLeagues(data);
        if (data && data.length > 0) {
          if (!selectedLeagueId || !data.some(league => league.id === selectedLeagueId)) {
            setSelectedLeagueId(data[0].id);
          }
        } else {
          setSelectedLeagueId(null);
        }
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
        setLeagues([]);
        setSelectedLeagueId(null);
      } finally {
        setLoadingLeagues(false);
      }
    }
  }, [token, selectedLeagueId]);

  useEffect(() => {
    reloadLeagues();
  }, [reloadLeagues]);

  const fetchCurrentUserMembership = useCallback(async () => {
    setLoadingCurrentUserMembership(true);
    if (!token || !selectedLeagueId || !user?.id) {
      setCurrentUserMembership(null);
      setLoadingCurrentUserMembership(false); // Stop loading if no dependencies
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/members/me`, { // Call the new 'me' endpoint
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          setCurrentUserMembership(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCurrentUserMembership(data);
    } catch (error) {
      console.error('Failed to fetch current user membership:', error);
      setCurrentUserMembership(null);
    } finally {
      setLoadingCurrentUserMembership(false); // Stop loading in finally block
    }
  }, [token, selectedLeagueId, user?.id]); // Depend on token, selectedLeagueId, and user.id

  useEffect(() => {
    fetchCurrentUserMembership();
  }, [fetchCurrentUserMembership]); // Trigger fetch when dependencies change

  useEffect(() => {
    if (selectedLeagueId && token) {
      setLoadingContent(true);
      fetch(`${API_BASE_URL}/api/leagues/${selectedLeagueId}/home-content`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(response => {
          if (response.ok) return response.json();
          return null;
        })
        .then(data => {
          setLeagueHomeContent(data);
          setLoadingContent(false);
        })
        .catch(error => {
          console.error('Failed to fetch league home content:', error);
          setLeagueHomeContent(null);
          setLoadingContent(false);
        });
    } else {
      setLeagueHomeContent(null);
    }
  }, [selectedLeagueId, token]);

  const switchLeague = (leagueId) => {
    setSelectedLeagueId(leagueId);
  };

  const refreshInviteCode = async (leagueId) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/leagues/${leagueId}/refresh-invite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setInviteCode(data.inviteCode);
        await reloadLeagues(); // Refetch leagues to get the new code
      }
    } catch (error) {
      console.error('Failed to refresh invite code:', error);
    }
  };

  const currentLeague = leagues.find(l => l.id === selectedLeagueId);

  const value = {
    leagues,
    selectedLeagueId,
    leagueHomeContent,
    loadingLeagues,
    loadingContent,
    switchLeague,
    currentLeague,
    currentUserMembership, // Now from state
    setCurrentUserMembership,
    loadingCurrentUserMembership, // Expose loading state
    refreshInviteCode,
    reloadLeagues,
    inviteCode,
    setInviteCode,
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
