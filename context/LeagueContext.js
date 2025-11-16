import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import * as apiActions from '../src/api';

const LeagueContext = createContext();

export const LeagueProvider = React.memo(({ children }) => {
    const { user, api } = useAuth();
    const [leagueState, setLeagueState] = useState({
        leagues: [],
        selectedLeagueId: user?.lastLeagueId || null,
        leagueHomeContent: null,
        loadingLeagues: true,
        loadingContent: true,
        inviteCode: null,
        currentUserMembership: null,
        loadingCurrentUserMembership: true,
        activeSeason: null,
        loadingSeason: true,
    });

    const {
        leagues,
        selectedLeagueId,
        leagueHomeContent,
        loadingLeagues,
        loadingContent,
        inviteCode,
        currentUserMembership,
        loadingCurrentUserMembership,
        activeSeason,
        loadingSeason,
    } = leagueState;
  
    const reloadLeagues = useCallback(async () => {
      if (user) {
        try {
          const data = await api(apiActions.getLeagues);
          const leagues = data || [];
          
          let newSelectedLeagueId = leagueState.selectedLeagueId;
          if (newSelectedLeagueId && leagues.some(league => league.id === newSelectedLeagueId)) {
            // Keep current ID if it's still valid
          } else if (leagues.length > 0) {
            if (user.lastLeagueId && leagues.some(league => league.id === user.lastLeagueId)) {
              newSelectedLeagueId = user.lastLeagueId;
            } else {
              newSelectedLeagueId = leagues[0].id;
            }
          } else {
            newSelectedLeagueId = null;
          }

          setLeagueState(prev => ({
            ...prev,
            leagues: leagues,
            selectedLeagueId: newSelectedLeagueId,
            loadingLeagues: false,
          }));

        } catch (error) {
          console.error('Failed to fetch leagues:', error);
          if (error.message !== '401') {
            setLeagueState(prev => ({
                ...prev,
                leagues: [],
                selectedLeagueId: null,
                loadingLeagues: false,
            }));
          }
        }
      }
    }, [user, api, leagueState.selectedLeagueId]);
  
    useEffect(() => {
      reloadLeagues();
    }, [reloadLeagues]);

    useEffect(() => {
        const loadAllLeagueData = async () => {
            if (!selectedLeagueId || !user) {
                setLeagueState(prev => ({
                    ...prev,
                    leagueHomeContent: null,
                    currentUserMembership: null,
                    activeSeason: null,
                    loadingContent: false,
                    loadingCurrentUserMembership: false,
                    loadingSeason: false,
                }));
                return;
            }
    
            setLeagueState(prev => ({
                ...prev,
                loadingContent: true,
                loadingCurrentUserMembership: true,
                loadingSeason: true,
            }));
    
            try {
                const [membership, allSeasons, content] = await Promise.all([
                    api(apiActions.getCurrentUserMembership, selectedLeagueId),
                    api(apiActions.getSeasons, selectedLeagueId),
                    api(apiActions.getLeagueHomeContent, selectedLeagueId).catch(e => {
                        if (e.message.startsWith('API Error: 404')) return null;
                        throw e;
                    }),
                ]);

                const today = new Date();

                const activeSeasons = allSeasons
                    .filter(s => {
                        if (s.isFinalized) {
                            return false;
                        }
                        const startDate = new Date(s.startDate);
                        const endDate = new Date(s.endDate);
                        
                        const startUTC = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                        const endUTC = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                        const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

                        return todayUTC >= startUTC && todayUTC <= endUTC;
                    })
                    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

                const activeSeason = activeSeasons.length > 0 ? activeSeasons[0] : null;
    
                setLeagueState(prev => ({
                    ...prev,
                    currentUserMembership: membership,
                    activeSeason: activeSeason,
                    leagueHomeContent: content,
                    loadingContent: false,
                    loadingCurrentUserMembership: false,
                    loadingSeason: false,
                }));
    
            } catch (error) {
                console.error("Failed to load league data", error);
                if (error.message !== '401') {
                    setLeagueState(prev => ({
                        ...prev,
                        loadingContent: false,
                        loadingCurrentUserMembership: false,
                        loadingSeason: false,
                    }));
                }
            }
        };
    
        loadAllLeagueData();
    
    }, [selectedLeagueId, user, api]);
  
    const switchLeague = useCallback(async (leagueId) => {
      setLeagueState(prev => ({ ...prev, selectedLeagueId: leagueId }));
      try {
        await api(apiActions.updateLastLeague, leagueId);
      } catch (error) {
        console.error('Failed to update last league:', error);
      }
    }, [api]);

  const refreshInviteCode = useCallback(async (leagueId) => {
    try {
      const data = await api(apiActions.refreshInviteCode, leagueId);
      if (data) {
        setLeagueState(prev => ({ ...prev, inviteCode: data.inviteCode }));
        await reloadLeagues();
      }
    } catch (error) {
      console.error('Failed to refresh invite code:', error);
    }
  }, [api, reloadLeagues]);

  const currentLeague = useMemo(() => 
    Array.isArray(leagues) ? leagues.find(l => l.id === selectedLeagueId) : undefined,
    [leagues, selectedLeagueId]
  );

  const reloadCurrentUserMembership = useCallback(async () => {
    if (!selectedLeagueId || !user?.id) return;
    setLeagueState(prev => ({ ...prev, loadingCurrentUserMembership: true }));
    try {
      const data = await api(apiActions.getCurrentUserMembership, selectedLeagueId);
      setLeagueState(prev => ({ ...prev, currentUserMembership: data, loadingCurrentUserMembership: false }));
    } catch (error) {
      console.error('Failed to fetch current user membership:', error);
      if (error.message !== '401') {
          setLeagueState(prev => ({ ...prev, currentUserMembership: null, loadingCurrentUserMembership: false }));
      }
    }
  }, [selectedLeagueId, user?.id, api]);

  const reloadHomeContent = useCallback(async () => {
    if (!selectedLeagueId) {
      setLeagueState(prev => ({ ...prev, leagueHomeContent: null, loadingContent: false }));
      return;
    }
    setLeagueState(prev => ({ ...prev, loadingContent: true }));
    try {
      const data = await api(apiActions.getLeagueHomeContent, selectedLeagueId);
      setLeagueState(prev => ({ ...prev, leagueHomeContent: data, loadingContent: false }));
    } catch (error) {
      if (error.message.startsWith('API Error: 404')) {
          setLeagueState(prev => ({ ...prev, leagueHomeContent: null, loadingContent: false }));
      } else {
        console.error('Failed to fetch league home content:', error);
        if (error.message !== '401') {
          setLeagueState(prev => ({ ...prev, leagueHomeContent: null, loadingContent: false }));
        }
      }
    }
  }, [selectedLeagueId, api]);

  const value = useMemo(() => ({
    leagues,
    selectedLeagueId,
    leagueHomeContent,
    loadingLeagues,
    loadingContent,
    switchLeague,
    currentLeague,
    currentUserMembership,
    loadingCurrentUserMembership,
    refreshInviteCode,
    reloadLeagues,
    inviteCode,
    setInviteCode: (newInviteCode) => setLeagueState(prev => ({ ...prev, inviteCode: newInviteCode })),
    reloadHomeContent,
    reloadCurrentUserMembership,
    activeSeason,
    loadingSeason,
  }), [
    leagues,
    selectedLeagueId,
    leagueHomeContent,
    loadingLeagues,
    loadingContent,
    switchLeague,
    currentLeague,
    currentUserMembership,
    loadingCurrentUserMembership,
    refreshInviteCode,
    reloadLeagues,
    inviteCode,
    reloadHomeContent,
    reloadCurrentUserMembership,
    activeSeason,
    loadingSeason,
  ]);

  return (
    <LeagueContext.Provider value={value}>
      {children}
    </LeagueContext.Provider>
  );
});

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  return context;
};