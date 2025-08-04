import React, { createContext, useState, useEffect, useContext } from 'react';
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

  useEffect(() => {
    if (token) {
      setLoadingLeagues(true);
      fetch(`${API_BASE_URL}/api/leagues`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(response => response.json())
        .then(data => {
          setLeagues(data);
          if (data && data.length > 0) {
            // Set the first league as selected by default
            setSelectedLeagueId(data[0].id);
          }
          setLoadingLeagues(false);
        })
        .catch(error => {
          console.error('Failed to fetch leagues:', error);
          setLoadingLeagues(false);
        });
    } else {
      // If no token, reset state
      setLeagues([]);
      setSelectedLeagueId(null);
      setLoadingLeagues(false);
    }
  }, [token]);

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

  const value = {
    leagues,
    selectedLeagueId,
    leagueHomeContent,
    loadingLeagues,
    loadingContent,
    switchLeague,
    currentLeague: leagues.find(l => l.id === selectedLeagueId),
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
