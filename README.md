# Poker League Mobile Application (Frontend)

This repository contains the React Native frontend for the Poker League mobile application. It provides the user interface for interacting with the backend API, allowing users to manage leagues, seasons, games, and view standings.

## Table of Contents
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Getting Started](#getting-started)
* [Running the Development Server](#running-the-development-server)
* [Running Tests](#running-tests)
* [Deployment](#deployment)
* [User Manual](#user-manual)
    * [Authentication Pages](#authentication-pages)
        * [Login](#login)
        * [Sign Up](#sign-up)
        * [Forgot Password](#forgot-password)
        * [Reset Password](#reset-password)
    * [Application Pages](#application-pages)
        * [Home](#home)
        * [Create League](#create-league)
        * [Join League](#join-league)
        * [Play](#play)
        * [Standings](#standings)
        * [History](#history)
        * [Game Details](#game-details)
        * [League Settings](#league-settings)
        * [Season Settings](#season-settings)
        * [Settings](#settings)
        * [Security Questions](#security-questions)

## Features

*   **User Interface:** Intuitive and responsive UI for mobile devices.
*   **User Authentication:** Login and registration flows.
*   **League & Season Management:** Create, join, and view details of leagues and seasons.
*   **Game Play:** Interactive timer for blind levels, player elimination, and game state display.
*   **Standings:** View player standings within a season.
*   **Cross-Platform:** Built with React Native for iOS and Android.

## Tech Stack

*   **Framework:** React Native
*   **Development Platform:** Expo
*   **Language:** JavaScript (with TypeScript support via Expo)
*   **UI/UX:** Material Design principles (implied by general modern app design)
*   **API Communication:** Fetch API

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

*   **Node.js:** Version 16 or higher.
*   **npm (Node Package Manager):** Comes with Node.js.
*   **Expo CLI:** Install globally: `npm install -g expo-cli`
*   **Android Studio / Xcode:** For emulators/simulators, or a physical device with the Expo Go app.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/JonCastelline/PokerLeague-V2
    cd PokerLeague-V2
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Backend API URL:**
    The application needs to know where your backend API is running. You will need to update the `API_BASE_URL` in `src/config.js`.
    *   For local development, this will typically be `http://<your-local-ip>:8080` (replace `<your-local-ip>` with your computer's IP address on your local network, as `localhost` won't work from an emulator/device).
    *   For production, this will be your Render backend service URL.

## Running the Development Server

To start the Expo development server:
```bash
npx expo start
```
This will open a new tab in your browser with the Expo Dev Tools. From there, you can:
*   Scan the QR code with the Expo Go app on your physical device.
*   Run on an Android emulator.
*   Run on an iOS simulator.
*   Run in a web browser (limited functionality).

## Running Tests

Currently, automated frontend tests are not configured. Manual testing is performed.

## Deployment

This application is designed to be deployed using Expo Application Services (EAS). Refer to the Expo documentation for details on building and deploying for production.

## User Manual

This section provides an overview of each page in the application.

### Authentication Pages

#### Login
**File:** `app/(auth)/index.js`

**Overview:**
The login page is the entry point for existing users. It allows them to authenticate and access their account.

**Features:**
*   **Email and Password Fields:** Standard input fields for users to enter their credentials.
*   **Login Button:** Submits the credentials to the backend for authentication.
*   **Sign Up Link:** Navigates to the Sign Up page for new users.
*   **Forgot Password Link:** Navigates to the Forgot Password page for users who have forgotten their password.

#### Sign Up
**File:** `app/(auth)/signup.js`

**Overview:**
The sign up page allows new users to create an account.

**Features:**
*   **First Name, Last Name, Email, and Password Fields:** Input fields for new user registration.
*   **Sign Up Button:** Submits the user's details to the backend to create a new account.

#### Forgot Password
**File:** `app/(auth)/forgot-password.js`

**Overview:**
This page allows users who have forgotten their password to initiate the password reset process by providing their email address.

**Features:**
*   **Email Field:** An input field for the user to enter their email address.
*   **Submit Button:** Submits the email to the backend to retrieve the user's security questions.

#### Reset Password
**File:** `app/(auth)/reset-password.js`

**Overview:**
This page allows users to reset their password after successfully answering their security questions.

**Features:**
*   **Security Question Display:** Displays the user's security questions.
*   **Answer Fields:** Input fields for the user to provide answers to their security questions.
*   **New Password and Confirm Password Fields:** Input fields for the user to enter and confirm their new password.
*   **Reset Password Button:** Submits the answers and new password to the backend to complete the password reset process.

### Application Pages

#### Home
**File:** `app/(app)/home.js`

**Overview:**
The home page is the main landing page after a user logs in. It displays information about the current league and provides navigation to other parts of the app.

**Features:**
*   **Welcome Message:** Displays a welcome message to the user.
*   **League Home Content:** Displays content specific to the league, which can be edited by league admins. Supports Markdown for rich text formatting.
*   **Edit Content (Admin):** Admins can edit the league's home page content.
*   **Create/Join League:** If the user is not part of any leagues, they are presented with options to create a new league or join an existing one.

#### Create League
**File:** `app/(app)/create-league.js`

**Overview:**
This page allows a user to create a new poker league, making them the league administrator.

**Features:**
*   **League Name Field:** An input field for the user to enter the name of their new league.
*   **Create League Button:** Submits the new league information to the backend.

#### Join League
**File:** `app/(app)/join-league.js`

**Overview:**
This page allows a user to join an existing poker league.

**Features:**
*   **Invitations List:** Displays a list of pending invitations for the user to accept.
*   **Accept Invite Button:** Allows the user to accept an invitation and join the corresponding league.
*   **Join with Code:** An input field for the user to enter an invite code to join a league.
*   **Join League Button:** Submits the invite code to the backend.

#### Play
**File:** `app/(app)/play.js`

**Overview:**
The play page is the main screen for a game in progress. It features the tournament timer, blind levels, and controls for managing the game state.

**Features:**
*   **Game Setup:** Before a game starts, admins can select which players are participating.
*   **Casual Games:** These are informal games that do not affect league standings or player statistics. They are for practice or fun. Non-admin players have full control over player selection and in-game actions (timer, eliminations). The settings for casual games can be configured in the "Casual Games" season on the Season Settings page.
*   **Tournament Timer:** A timer that counts down each blind level.
*   **Blind Level Display:** Shows the current and next blind levels.
*   **Player List:** Displays a list of players in the game, along with their status (active or eliminated), place, kills, and bounties.
*   **Eliminate Player (Admin/Enabled):** Allows admins (or players, if enabled in season settings) to eliminate players from the game.
*   **Undo Elimination (Admin/Enabled):** Allows admins (or players, if enabled) to undo the last elimination.
*   **Pause/Resume Game (Admin/Enabled):** Admins (or players, if enabled) can pause and resume the game timer.
*   **Final Results Review:** After a game is over, a summary of the final results is displayed.
*   **Edit Results (Admin):** Admins can edit the final results before finalizing the game.

#### Standings
**File:** `app/(app)/standings.js`

**Overview:**
This page displays the current player standings for a selected season.

**Features:**
*   **Season Selector:** A dropdown menu to select which season's standings to view.
*   **Standings Table:** A table displaying each player's rank, name, points, kills, bounties, and attendance.
*   **Dynamic Columns:** The table columns adjust based on the season's settings (e.g., if kills or bounties are being tracked).

#### History
**File:** `app/(app)/history.js`

**Overview:**
This page shows the history of completed games within a selected season.

**Features:**
*   **Season Selector:** A dropdown menu to select a season.
*   **Game List:** A list of completed games for the selected season.
*   **Game Details Navigation:** Tapping on a game navigates to the Game Details page.

#### Game Details
**File:** `app/(app)/gameDetails.js`

**Overview:**
This page displays the detailed results of a specific game.

**Features:**
*   **Game Name:** Displays the name of the game.
*   **Results List:** A list of players who participated in the game, sorted by their finishing place.
*   **Player Stats:** Shows each player's place, kills, and bounties for that game.

#### League Settings
**File:** `app/(app)/league-settings.js`

**Overview:**
This page allows league administrators to manage league-level settings and members.

**Features:**
*   **League Name (Owner):** The league owner can edit the league name.
*   **Admin Role Management (Owner):** The owner can allow other admins to manage user roles.
*   **League Logo:** Admins can set a URL for the league's logo.
*   **Member List:** Displays a list of all league members, their roles, and status.
*   **Manage Members (Admin):** Admins can manage members, including:
    *   Promoting/demoting players to/from admin roles.
    *   Activating/deactivating players.
    *   Removing players from the league.
    *   Transferring ownership (owner only).
    *   Resetting a player's display name or icon.
    *   Inviting unregistered players to claim their profile.
*   **Add Unregistered Player (Admin):** Admins can add unregistered players to the league.
*   **Invite Code (Admin):** Admins can generate and copy an invite code for others to join the league.

#### Season Settings
**File:** `app/(app)/season-settings.js`

**Overview:**
This page allows league administrators to manage settings for a specific season.

**Features:**
*   **Season Management (Admin):**
    *   Create, edit, and delete seasons.
    *   Finalize a season to lock its results and settings.
*   **Game Management (Admin):**
    *   Add, edit, and delete games within a season.
*   **Points System (Admin):**
    *   Enable/disable and set points for kills, bounties, and attendance.
*   **Timer Settings (Admin):**
    *   Set the duration of blind levels and the warning sound time.
*   **Game Rules (Admin):**
    *   Set the starting stack size.
    *   Allow players to control the timer or handle eliminations.
*   **Blind Levels (Admin):**
    *   Define the blind structure for the season.
*   **Place Points (Admin):**
    *   Define the points awarded for each finishing place.

#### Settings
**File:** `app/(app)/settings.js`

**Overview:**
This page allows users to manage their own account and player-specific settings.

**Features:**
*   **Account Details:**
    *   Update first name, last name, and email.
*   **Change Password:**
    *   Change their account password.
*   **Security Questions:**
    *   Navigate to the Security Questions page.
*   **Player Settings (League-Specific):**
    *   Set a custom display name and icon URL for the current league.
*   **Leave League:**
    *   Allows a user to leave the current league (unless they are the owner).

#### Security Questions
**File:** `app/(app)/security-questions.js`

**Overview:**
This page allows users to set up and manage their security questions for account recovery.

**Features:**
*   **Question Selectors:** Three dropdown menus for users to select their security questions.
*   **Answer Fields:** Input fields for users to provide answers to their selected questions.
*   **Save Button:** Saves the security questions and answers to the backend.
