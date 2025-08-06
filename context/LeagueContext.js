import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../src/config';

const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const { token } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [leagueHomeContent, setLeagueHomeContent] = useState(null);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [inviteCode, setInviteCode] = useState(null);

  const reloadLeagues = useCallback(async () => {
    if (token) {
      setLoadingLeagues(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/leagues`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        setLeagues(data);
        if (data && data.length > 0 && !selectedLeagueId) {
          setSelectedLeagueId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch leagues:', error);
      } finally {
        setLoadingLeagues(false);
      }
    }
  }, [token, selectedLeagueId]);

  useEffect(() => {
    reloadLeagues();
  }, [reloadLeagues]);

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
  const currentUserMembership = currentLeague;

  const value = {
    leagues,
    selectedLeagueId,
    leagueHomeContent,
    loadingLeagues,
    loadingContent,
    switchLeague,
    currentLeague,
    currentUserMembership,
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
