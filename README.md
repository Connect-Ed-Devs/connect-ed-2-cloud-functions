# Connect-ED Cloud Functions

## Overview

This repository contains a collection of Node.js Google Cloud Functions that scrape, process, and store sports data for the Connect-ED application. It pulls game schedules, results, standings, and rosters from CISAA and GameSheetStats, structures the data via model classes, and writes everything into Firebase Firestore.

## Features

- **Web Scraping**
    - Puppeteer for dynamic content (GameSheetStats)
    - Cheerio + Axios for static HTML (CISAA site)
- **Data Modeling**
    - JS classes with `toMap()` for Games, Standings, Rosters, etc.
    - Sport-specific subclasses (soccer/hockey players & goalies)
- **Firestore Integration**
    - Admin SDK initialization
    - `set…` functions to batch-write Sports, Standings, Games (with Goals subcollections), Rosters (with Players subcollections)
    - `get…` utilities to read stored data
- **Automated Updates**: Scheduled or on-demand functions to refresh games & standings
- **Modular Design**: Clear separation between scraping, data models, and Firestore logic

## Technologies

- **Node.js**
- **Firebase**
    - Cloud Functions
    - Firestore
    - Admin SDK
- **Puppeteer**
- **Axios**
- **Cheerio**
- **qs**

## Project Structure

```plaintext
functions/
├── src/
│   ├── index.js            # Entry point: exports Firebase Functions (including scheduled tasks) & orchestrates tasks
│   ├── games.js            # Scraping logic for CISAA site: parseSports, parseStandings (non-GameSheet), parseGames (non-GameSheet), inSport, and helper utilities
│   ├── gamesheet.js        # Scraping logic for GameSheetStats: parseGameIDs, parseGameSheetGames, parseGameSheetSoccerStandings, parseGameSheetHockeyStandings, parseGameSheetSoccerRoster, parseGameSheetHockeyRoster
│   ├── database.js         # Firestore init + set/get for Sports, Standings, Games, Rosters; manages Puppeteer instances for updates
│   ├── models/             # Data model classes with `toMap()`
│   │   ├── Article.js
│   │   ├── Event.js
│   │   ├── GameClasses.js  # BaseGame, gamesheetGame
│   │   ├── goal.js         # Goal
│   │   ├── LunchMenu.js    # LunchMenuItem, LunchMenuStation, LunchMenu
│   │   ├── RosterClasses.js # BaseRoster, soccerPlayer, soccerGK, hockeyPlayer, hockeyGK
│   │   ├── schools.js      # Schools (static data)
│   │   ├── sports.js       # Sports (static data)
│   │   └── StandingsClasses.js # BaseStandings, SoccerStandings, HockeyStandings
│   └── services/           # Optional helper modules
│       └── firestoreService.js # Example: addGame()
├── package.json            # Dependencies & scripts
└── README.md               # This file
```

## Setup and Installation

1.  **Prerequisites**:
    *   Node.js and npm (or yarn) installed.
    *   Firebase CLI installed and configured (`npm install -g firebase-tools`).
    *   A Firebase project created on the [Firebase Console](https://console.firebase.google.com/).

2.  **Clone the Repository**:
    ```bash
    git clone <your-repository-url>
    cd connect-ed-2-cloud-functions/functions
    ```

3.  **Install Dependencies**:
    ```bash
    npm install
    ```

4.  **Firebase Service Account**:
    *   Go to your Firebase project settings in the Firebase Console.
    *   Navigate to "Service accounts".
    *   Generate a new private key and download the JSON file.
    *   **Crucially**, update the path to this service account JSON file in `functions/src/database.js`. The current hardcoded path is:
        `C:/Users/2025124/OneDrive - Appleby College/Documents/connect-ed-dfbbd-firebase-adminsdk-fbsvc-4625a29707.json`
        You **must** change this to the correct path where you've stored your downloaded service account key. It's recommended to use relative paths or environment variables for better security and portability rather than absolute paths.

5.  **Configure Firebase Project**:
    *   If you haven't already, associate your local project with your Firebase project:
        ```bash
        firebase use --add
        ```
        Select your project from the list.

## Key Modules and Functionality

*   **`index.js`**:
    *   Entry point for Firebase Functions.
    *   Initializes Firebase Admin SDK.
    *   Exports scheduled Cloud Functions using `onSchedule` for:
        *   `scheduledUpdateGamesStandings`: Daily updates for games and standings.
        *   `scheduledSetAll`: Weekly updates for all data (sports, standings, games, rosters).
        *   `scheduledSetSports`: Monthly updates for sports data.
    *   Includes various test functions for manual verification of functionalities (e.g., `testSportsUpload`, `testRosterUpload`).
    *   Orchestrates calls to database and scraping functions.

*   **`games.js`**:
    *   `parseSports()`: Scrapes the list of available sports and their league codes from CISAA, determining if Appleby College participates.
    *   `parseStandings()`: Scrapes team standings from CISAA for non-GameSheet leagues.
    *   `parseGames()`: Scrapes game schedules and results from CISAA for non-GameSheet leagues.
    *   `inSport()`: Checks if Appleby College participates in a given league, handling both CISAA and GameSheet sources.
    *   Helper functions: `getSportID()`, `getSchoolIDAbbrev()`, `getSchoolIDName()`, `getMonthIndex()` for data processing.
    *   Uses Axios and Cheerio for scraping static HTML from the CISAA website.
    *   Coordinates with `gamesheet.js` for GameSheet-specific data when `usesGamesheet` is true.

*   **`gamesheet.js`**:
    *   Handles all scraping logic specific to `gamesheetstats.com`.
    *   `parseGameIDs()`: Retrieves unique game IDs for a given season, division, and team from GameSheet.
    *   `parseGameSheetGames()`: Fetches detailed game information (including scores, date, time, and goals) from GameSheet using game IDs.
    *   `parseGameSheetSoccerStandings()` & `parseGameSheetHockeyStandings()`: Scrapes detailed team standings for soccer and hockey respectively from GameSheet.
    *   `parseGameSheetSoccerRoster()` & `parseGameSheetHockeyRoster()`: Scrapes player rosters and individual player stats for soccer and hockey respectively from GameSheet.
    *   Uses Puppeteer to launch a headless browser for scraping dynamic content from GameSheet.

*   **`database.js`**:
    *   `initializeFirebase()`: Initializes the Firebase Admin SDK with service account credentials. **Ensure the service account path is correctly configured.**
    *   `setSports()`: Writes scraped sports data to the "Sports" collection in Firestore.
    *   `setStandings()`: Writes scraped standings data (from both CISAA and GameSheet) to a subcollection under the respective sport in Firestore.
    *   `setGames()`: Writes scraped game data (from both CISAA and GameSheet, including goals as a subcollection for GameSheet games) to the "Games" collection in Firestore.
    *   `setRoster()`: Writes scraped roster data (from GameSheet) to the "Team Rosters" collection, with players in a subcollection.
    *   `getSports()`, `getStandings()`, `getAllStandings()`, `getGames()`, `getAllGames()`, `getApplebyTeamCode()`, `getRoster()`: Various getter methods to retrieve data from Firestore.
    *   `setAll()`: A utility function to scrape and set all sports, standings, games, and rosters.
    *   `updateGamesStandings()`: Updates games and standings, potentially filtered by the current season. Manages a single Puppeteer browser instance for efficiency when calling GameSheet parsing functions.
    *   `getSeason()`: Helper function to determine the current sports season (Fall, Winter, Spring).

*   **`models/`**:
    *   Contains JavaScript classes for each data entity, each typically including a `constructor` and a `toMap()` method for Firestore compatibility.
    *   `Article.js`: Defines the `Article` class for news or blog content.
    *   `Event.js`: Defines the `Event` class for school or community events.
    *   `GameClasses.js`: Defines `BaseGame` (for CISAA games) and `gamesheetGame` (extends `BaseGame` for GameSheet games, including goals).
    *   `goal.js`: Defines the `Goal` class, used as a subcollection for `gamesheetGame`.
    *   `LunchMenu.js`: Defines `LunchMenuItem`, `LunchMenuStation`, and `LunchMenu` classes for cafeteria menus.
    *   `RosterClasses.js`: Defines `BaseRoster` and sport-specific player/goalie classes (`soccerPlayer`, `soccerGK`, `hockeyPlayer`, `hockeyGK`) with detailed stats.
    *   `schools.js`: Contains the `Schools` class with static data (ID, name, abbreviation, logo) and lookup methods.
    *   `sports.js`: Contains the `Sports` class with static data (name, term, league code, `usesGamesheet` flag) and lookup methods.
    *   `StandingsClasses.js`: Defines `BaseStandings` (for CISAA standings) and sport-specific standings classes (`SoccerStandings`, `HockeyStandings`) for GameSheet data.

*   **`services/firestoreService.js`**:
    *   Provides additional Firestore interaction logic. Example: `addGame()` for adding a single game document (though current implementation primarily uses batch writes in `database.js`).

## Deployment

To deploy the functions to Firebase:

```bash
cd functions  # Ensure you are in the 'functions' directory
firebase deploy --only functions
```

