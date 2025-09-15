# Poker League Mobile Application (Frontend)

This repository contains the React Native frontend for the Poker League mobile application. It provides the user interface for interacting with the backend API, allowing users to manage leagues, seasons, games, and view standings.

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
    git clone <repository-url>
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