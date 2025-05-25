# Connect-ED Cloud Functions

## Overview

This repository contains a collection of Node.js Google Cloud Functions designed for the Connect-ED application. These functions scrape data from various sources (CISAA and GameSheetStats), process it, and store it in Firebase Firestore. The system handles sports data (schedules, results, standings, rosters), as well as lunch menus, articles, and events.

## Features

- **Web Scraping**:
    - Puppeteer for dynamic content rendering (e.g., GameSheetStats).
    - Cheerio and Axios for parsing static HTML content (e.g., CISAA site).
- **Comprehensive Data Modeling**:
    - JavaScript classes for `Sports`, `Standings`, `Games` (including `Goals`), `Rosters` (including `Players`), `LunchMenus`, `Articles`, and `Events`.
    - `toMap()` methods in models for easy Firestore serialization.
    - Sport-specific subclasses for detailed player/goalie stats where applicable.
- **Firestore Integration**:
    - Firebase Admin SDK for backend database operations.
    - `set...` functions for writing/updating data to various Firestore collections (e.g., `Sports`, `Games`, `Team Rosters`, `LunchMenus`, `Articles`, `Events`).
    - Standings are stored as an array within `Sports` documents.
    - Game goals (for GameSheet games) are stored as an array within `Games` documents.
    - Player rosters are stored as an array within `Team Rosters` documents.
    - `get...` utility functions for retrieving data from Firestore.
- **Automated and On-Demand Operations**:
    - Scheduled Cloud Functions for regular updates (e.g., daily game/standings updates, weekly full data refresh).
    - On-demand (HTTP and Callable) functions for immediate data fetching or updates.
- **Modular Design**:
    - Clear separation of concerns: scraping logic (`games.js`, `gamesheet.js`), database interactions (`database.js`), and data models (`models/`).
- **Environment-Aware Configuration**:
    - Supports local Firebase service account keys via environment variables for development and testing.

## Technologies

- **Node.js** (v22 recommended)
- **Firebase**:
    - Cloud Functions (v2)
    - Firestore
    - Firebase Admin SDK
- **Puppeteer**
- **Axios**
- **Cheerio**
- **qs**
- **Google Cloud Functions Framework**

## Project Structure

```plaintext
connect-ed-2-cloud-functions/
├── functions/                      # ← your Cloud Functions codebase
│   ├── index.js                    # Entry point: exports Firebase Functions (scheduled & on-demand)
│   ├── src/                        
│   │   ├── games.js                # Scraping logic for CISAA site
│   │   ├── gamesheet.js            # Scraping logic for GameSheetStats
│   │   ├── database.js             # Firestore initialization, set/get functions for all data types
│   │   └── models/
│   │       ├── Article.js          # Article class
│   │       ├── Event.js            # Event class
│   │       ├── GameClasses.js      # BaseGame, gamesheetGame (includes goals array)
│   │       ├── goal.js             # Goal class (used within gamesheetGame model)
│   │       ├── LunchMenu.js        # LunchMenuItem, LunchMenuStation, LunchMenu
│   │       ├── RosterClasses.js    # BaseRoster, sport-specific player classes
│   │       ├── schools.js          # Schools (static data)
│   │       ├── sports.js           # Sports (static data)
│   │       └── StandingsClasses.js # BaseStandings, sport-specific standings classes
│   │       
│   ├── .eslintrc.cjs               # ESLint config for functions
│   ├── .puppeteerrc.cjs            # Puppeteer config
│   ├── .gitignore                  # ignores node_modules, secrets, etc.
│   ├── package.json                # Project dependencies and scripts
│   └── node_modules/               # (functions-only dependencies)
│ 
├── .firebaserc                     # Firebase project aliases
├── firebase.json                   # overall Firebase config
├── .gitignore                      # root-level ignores (logs, /node_modules, etc.)
├── firestore.rules
├── firestore.indexes.json
└── README.md                       # This file
```

## Setup and Installation

1.  **Prerequisites**:
    *   Node.js (version 22 recommended, see `package.json` engines) and npm.
    *   Firebase CLI installed (`npm install -g firebase-tools`).
    *   A Firebase project created on the [Firebase Console](https://console.firebase.google.com/).

2.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd <repository-name>/functions
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```
    This will also run `puppeteer browsers install chrome` due to the `postinstall` script in `package.json`.

4.  **Firebase Service Account for Local Development**:
    *   Go to your Firebase project settings in the Firebase Console -> "Service accounts".
    *   Generate a new private key and download the JSON file.
    *   **For local development/emulator use**:
        *   Store this file securely (e.g., in a `functions/secrets/` directory, ensuring this path is in your `.gitignore` as `functions/secrets/service-account.json` is).
        *   Set the `LOCAL_SA_PATH` environment variable to the path of this JSON file relative to the `functions` directory (e.g., `LOCAL_SA_PATH=secrets/your-service-account-file.json`). The `database.js` file will use this path.
    *   When deployed to Google Cloud, Firebase Functions automatically use the appropriate service account credentials.

5.  **Configure Firebase Project**:
    *   Associate your local project with your Firebase project:
        ```bash
        firebase use --add
        ```
        Select your project from the list.

## Key Modules and Functionality

*   **`index.js`**:
    *   Main entry point for all Firebase Functions.
    *   Initializes Firebase Admin SDK via `database.js`.
    *   Exports scheduled Cloud Functions (`onSchedule`) for:
        *   `scheduledUpdateGamesStandings`: Daily updates for games and standings.
        *   `scheduledSetAll`: Weekly updates for all data (sports, standings, games, rosters).
        *   `scheduledSetSports`: Monthly updates for sports data.
    *   Exports numerous on-demand Cloud Functions (`onCall`, `onRequest`) for:
        *   Setting and getting sports, standings, games, and rosters.
        *   Setting and getting lunch menus.
        *   Setting and getting articles.
        *   Setting and getting events.
        *   Triggering `updateGamesStandings` and `setAll` on demand.

*   **`games.js`**:
    *   `parseSports()`: Scrapes sports and league codes from CISAA.
    *   `parseStandings()`: Scrapes team standings from CISAA (for non-GameSheet leagues).
    *   `parseGames()`: Scrapes game schedules/results from CISAA (for non-GameSheet leagues).
    *   Uses Axios and Cheerio for scraping.

*   **`gamesheet.js`**:
    *   Handles scraping from `gamesheetstats.com` using Puppeteer.
    *   `parseGameIDs()`: Retrieves game IDs.
    *   `parseGameSheetGames()`: Fetches detailed game info, including goals.
    *   `parseGameSheetSoccerStandings()`, `parseGameSheetHockeyStandings()`: Scrapes standings.
    *   `parseGameSheetSoccerRoster()`, `parseGameSheetHockeyRoster()`: Scrapes rosters and player stats.

*   **`database.js`**:
    *   `initializeFirebase()`: Initializes Firebase Admin SDK. Supports local service account key via `LOCAL_SA_PATH` env var or default credentials in the cloud.
    *   `setSports()`: Writes sports data to the `Sports` collection.
    *   `setStandings()`: Updates `Sports` documents with an array of standings data.
    *   `setGames()`: Writes game data to the `Games` collection. For GameSheet games, goals are stored as an array within the game document.
    *   `setRoster()`: Writes roster data to the `Team Rosters` collection, with players stored as an array within each team roster document.
    *   `setLunchMenu()`, `setArticle()`, `setEvent()`: Write data to `LunchMenus`, `Articles`, and `Events` collections respectively.
    *   Various `get...` and `getAll...` functions to retrieve data from Firestore for all managed entities.
    *   `setAll()`: Orchestrates scraping and setting all sports, standings, games, and rosters.
    *   `updateGamesStandings()`: Updates games and standings, managing a shared Puppeteer instance for efficiency.
    *   `getSeason()`: Determines the current sports season.

*   **`models/`**:
    *   Contains JavaScript classes for data entities, each with a `constructor` and `toMap()` method.
    *   `Article.js`: Class for articles.
    *   `Event.js`: Class for events.
    *   `GameClasses.js`: `BaseGame` and `gamesheetGame` (includes a `goals` array).
    *   `goal.js`: `Goal` class, instances are stored within the `gamesheetGame`'s `goals` array.
    *   `LunchMenu.js`: `LunchMenuItem`, `LunchMenuStation`, `LunchMenu` classes.
    *   `RosterClasses.js`: `BaseRoster` and sport-specific player/goalie classes.
    *   `schools.js`: Static school data and lookup methods.
    *   `sports.js`: Static sports data and lookup methods.
    *   `StandingsClasses.js`: `BaseStandings` and sport-specific standings classes.

## Available Scripts (from `package.json`)

*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run serve`: Starts the Firebase emulators (for functions and Firestore).
*   `npm run shell`: Opens the Firebase functions shell.
*   `npm run start`: Runs the functions using Google Cloud Functions Framework (useful for local testing without full emulator).
*   `npm run deploy`: Deploys functions to Firebase.
*   `npm run logs`: Fetches logs for deployed functions.
*   `npm run gcp-build`: A script typically used in Google Cloud Build environments to ensure Puppeteer's browser is correctly installed.

## Deployment

To deploy the functions to your Firebase project:

```bash
cd functions  # Ensure you are in the 'functions' directory
firebase deploy --only functions
```

Ensure you have selected the correct Firebase project using `firebase use <project-id>`.
