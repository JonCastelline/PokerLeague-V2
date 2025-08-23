import { API_BASE_URL } from './config';

const apiFetch = async (url, options = {}) => {
  const { token, ...restOptions } = options;

  const headers = {
    'Content-Type': 'application/json',
    ...restOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...restOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('401');
    }
    const errorData = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorData}`);
  }

  // return response.json() if there is a body, otherwise return null
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json();
  }
  return null;
};

export const getGameState = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live`, { token });
};

export const startGame = (gameId, playerIds, token) => {
  return apiFetch(`/api/games/${gameId}/live/start`, {
    method: 'POST',
    token,
    body: JSON.stringify({ playerIds }),
  });
};

export const pauseGame = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live/pause`, {
    method: 'POST',
    token,
  });
};

export const resumeGame = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live/resume`, {
    method: 'POST',
    token,
  });
};

export const eliminatePlayer = (gameId, eliminatedPlayerId, killerPlayerId, token) => {
  return apiFetch(`/api/games/${gameId}/live/eliminate`, {
    method: 'POST',
    token,
    body: JSON.stringify({ eliminatedPlayerId, killerPlayerId }),
  });
};

export const undoElimination = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live/undo`, {
    method: 'POST',
    token,
  });
};

export const finalizeGame = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live/finalize`, {
    method: 'POST',
    token,
  });
};

export const getLeagueMembers = (leagueId, token) => {
    return apiFetch(`/api/leagues/${leagueId}/members`, { token });
};



export const getGameHistory = (seasonId, token) => {
  return apiFetch(`/api/seasons/${seasonId}/games`, { token });
};

export const getActiveSeason = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons/active`, { token });
};

export const nextLevel = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live/next-level`, {
    method: 'POST',
    token,
  });
};

export const previousLevel = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/live/previous-level`, {
    method: 'POST',
    token,
  });
};

export const getLeagues = (token) => {
  return apiFetch(`/api/leagues`, { token });
};

export const getCurrentUserMembership = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/me`, { token });
};

export const getLeagueHomeContent = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/home-content`, { token });
};

export const refreshInviteCode = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/refresh-invite`, {
    method: 'POST',
    token,
  });
};