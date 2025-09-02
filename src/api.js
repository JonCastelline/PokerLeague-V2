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
    return apiFetch(`/api/games/${gameId}/live/finalize`, { method: 'POST', token });
};

export const updateTimer = (gameId, timeRemainingInMillis, token) => {
  return apiFetch(`/api/games/${gameId}/live/timer`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ timeRemainingInMillis }),
  });
};

export const updateGameResults = (gameId, payload, token) => {
  return apiFetch(`/api/games/${gameId}/live/results`, {
    method: 'PUT',
    token,
    body: JSON.stringify(payload),
  });
};

export const getLeagueMembers = (leagueId, token) => {
    return apiFetch(`/api/leagues/${leagueId}/members`, { token });
};



export const getGameHistory = (seasonId, token) => {
  return apiFetch(`/api/seasons/${seasonId}/games`, { token });
};

export const getGameResults = (gameId, token) => {
  return apiFetch(`/api/games/${gameId}/results`, { token });
};

export const getActiveSeason = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons/active`, { token });
};

export const getSeasonSettings = (seasonId, token) => {
  return apiFetch(`/api/seasons/${seasonId}/settings`, { token });
};

export const getSeasons = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons`, { token });
};

export const getStandings = (seasonId, token) => {
  return apiFetch(`/api/seasons/${seasonId}/standings`, { token });
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

export const createLeague = (leagueName, token) => {
  return apiFetch(`/api/leagues`, {
    method: 'POST',
    token,
    body: JSON.stringify({ leagueName }),
  });
};

export const getMyInvites = (token) => {
  return apiFetch(`/api/player-accounts/me/invites`, { token });
};

export const acceptInvite = (inviteId, token) => {
  return apiFetch(`/api/player-accounts/me/invites/${inviteId}/accept`, {
    method: 'POST',
    token,
  });
};

export const joinLeague = (inviteCode, token) => {
  return apiFetch(`/api/leagues/join`, {
    method: 'POST',
    token,
    body: JSON.stringify({ inviteCode }),
  });
};

export const getCurrentUserMembership = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/me`, { token });
};

export const getLeagueHomeContent = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/home-content`, { token });
};

export const updateLeagueHomeContent = (leagueId, content, logoImageUrl, token) => {
  return apiFetch(`/api/leagues/${leagueId}/home-content`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ content, logoImageUrl }),
  });
};

export const refreshInviteCode = (leagueId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/refresh-invite`, {
    method: 'POST',
    token,
  });
};

export const updateLeagueSettings = (leagueId, leagueName, nonOwnerAdminsCanManageRoles, token) => {
  const settings = { leagueName, nonOwnerAdminsCanManageRoles };
  return apiFetch(`/api/leagues/${leagueId}`,
    {
      method: 'PUT',
      token,
      body: JSON.stringify(settings),
    });
};

export const updateUserRole = (leagueId, memberId, newRole, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/${memberId}/role`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ newRole: newRole }),
  });
};

export const updateUserStatus = (leagueId, memberId, isActive, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/${memberId}/status`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ isActive: isActive }),
  });
};

export const transferOwnership = (leagueId, newOwnerLeagueMembershipId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/transfer-ownership`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ newOwnerLeagueMembershipId: newOwnerLeagueMembershipId }),
  });
};

export const inviteUserToClaim = (leagueId, memberId, email, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/${memberId}/invite`, {
    method: 'POST',
    token,
    body: JSON.stringify({ email: email }),
  });
};

export const createSeason = (leagueId, seasonData, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons`, {
    method: 'POST',
    token,
    body: JSON.stringify(seasonData),
  });
};

export const updateSeason = (leagueId, seasonId, seasonData, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons/${seasonId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(seasonData),
  });
};

export const deleteSeason = (leagueId, seasonId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons/${seasonId}`, {
    method: 'DELETE',
    token,
  });
};

export const createGame = (seasonId, gameData, token) => {
  return apiFetch(`/api/seasons/${seasonId}/games`, {
    method: 'POST',
    token,
    body: JSON.stringify(gameData),
  });
};

export const updateGame = (seasonId, gameId, gameData, token) => {
  return apiFetch(`/api/seasons/${seasonId}/games/${gameId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(gameData),
  });
};

export const deleteGame = (seasonId, gameId, token) => {
  return apiFetch(`/api/seasons/${seasonId}/games/${gameId}`, {
    method: 'DELETE',
    token,
  });
};

export const finalizeSeason = (leagueId, seasonId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/seasons/${seasonId}/finalize`, {
    method: 'POST',
    token,
  });
};

export const updateSeasonSettings = (seasonId, settings, token) => {
  return apiFetch(`/api/seasons/${seasonId}/settings`, {
    method: 'PUT',
    token,
    body: JSON.stringify(settings),
  });
};

export const addUnregisteredPlayer = (leagueId, displayName, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/unregistered`, {
    method: 'POST',
    token,
    body: JSON.stringify({ displayName }),
  });
};

export const removePlayerFromLeague = (leagueId, memberId, token) => {
  return apiFetch(`/api/leagues/${leagueId}/members/${memberId}`, {
    method: 'DELETE',
    token,
  });
};

export const getInviteDetails = (token) => {
  return apiFetch(`/api/auth/invite-details/${token}`);
};

export const signup = (userData) => {
  return apiFetch(`/api/auth/signup`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const registerAndClaim = (claimData) => {
  return apiFetch(`/api/auth/register-and-claim`, {
    method: 'POST',
    body: JSON.stringify(claimData),
  });
};

export const login = (email, password) => {
  return apiFetch(`/api/auth/signin`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};