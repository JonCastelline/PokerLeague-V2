export const HELP_TOPICS = {
  ATTENDANCE_POINTS: {
    title: 'Attendance Points',
    content: "Points awarded for each game a player participates in where they do not earn any points from their finishing place. This rewards players for consistently showing up, even if they don't make it into a point-scoring position. Attendance points are ignored for casual games."
  },
  TRACK_KILLS: {
    title: 'Track Kills',
    content: 'Enable this to award players points for each opponent they eliminate during a game. The number of points awarded per kill can be configured below. Kills are ignored for casual games.'
  },
  TRACK_BOUNTIES: {
    title: 'Track Bounties',
    content: 'Enable this to award players points for collecting bounties. A bounty is a special prize placed on the player(s) with the most total points for the season heading into the game. If multiple players are tied for the lead, they each have a bounty. The number of points awarded per bounty can be configured below. Bounties are ignored for casual games.'
  },
  TIMER_WARNING_SOUND: {
    title: 'Timer Warning Sound',
    content: 'Enable this to play a warning sound shortly before the current blind level ends, reminding players that the blinds are about to increase.'
  },
  PLAYER_TIMER_CONTROL: {
    title: 'Player Timer Control',
    content: 'Enable this to allow all players in a live game to have control over the tournament timer. When disabled, only league admins can pause, resume, or adjust the timer. Automatically enabled for casual games.'
  },
  PLAYER_ELIMINATION_CONTROL: {
    title: 'Player Elimination Control',
    content: 'Enable this to allow all players in a live game to record player eliminations. When disabled, only league admins can mark players as eliminated. Automatically enabled for casual games.'
  },
  BOUNTY_ON_LEADER_ABSENCE: {
    title: 'Bounty on Leader Absence',
    content: "Determines what happens to the bounty if the season points leader is absent. 'No Bounty' means no bounty is in play for the game. 'Next Highest Player' will move the bounty to the next highest-ranked player from the season standings who is present. Bounties are ignored for casual games."
  },
  BLIND_LEVELS: {
    title: 'Blind Levels',
    content: 'This defines the structure of the tournament by setting the small and big blind amounts for each level. The timer duration setting determines how long each level lasts. Blinds must increase with each level.'
  },
  PLACE_POINTS: {
    title: 'Place Points',
    content: 'Points awarded based on a player\'s finishing position in a game. You can define how many points are awarded for each place (e.g., 10 for 1st, 6 for 2nd, etc.). Place points are ignored for casual games.'
  },
  ADMINS_MANAGE_ROLES: {
    title: 'Admins Can Manage Roles',
    content: "When enabled, league members with the 'Admin' role (who are not the owner) are given permissions to manage other players. This includes promoting/demoting players, activating/deactivating them, and removing them from the league. This setting can only be changed by the league owner."
  },
  ADD_UNREGISTERED_PLAYER: {
    title: 'Add Unregistered Player',
    content: "This allows an admin to add a player to the league using only a display name, without requiring them to have an account. This creates a placeholder profile that can be invited to claim later. It's useful for quickly adding players on game day so they can be included in the results."
  },
  LEAGUE_DISPLAY_NAME: {
    title: 'Display Name (League-Specific)',
    content: "This is a custom display name that will be used for you only within the current league. It will appear on the standings, game history, and live game pages. If you leave this blank, your first and last name from your account details will be used."
  },
  LEAGUE_ICON_URL: {
    title: 'Icon URL (League-Specific)',
    content: "This is a custom icon or avatar that will be used for you only within the current league. It will appear next to your display name on various pages. Please provide a direct URL to an image (e.g., a link ending in .png or .jpg)."
  },
  LEAGUE_LOGO_URL: {
    title: 'League Logo URL',
    content: 'This is a custom logo for the entire league. It will appear on various pages, such as the home and settings pages. Please provide a direct URL to an image (e.g., a link ending in .png or .jpg).'
  },
  HOME_PAGE_CONTENT_EDIT: {
    title: 'Home Page Content',
    content: "This content supports Markdown formatting, allowing you to use rich text features like headings (#), bold (**text**), italics (*text*), lists (- item), and even embed images (![alt text](image_url))."
  },
  CASUAL_GAME: {
    title: 'Casual Game Mode',
    content: "Casual games are for fun and practice. They do not affect league standings, player statistics, or season points. All game actions (like eliminating players, adjusting the timer) are handled locally on your device and are not saved to the server. This mode is perfect for impromptu games or when you don't want to impact your league's official records."
  },
};