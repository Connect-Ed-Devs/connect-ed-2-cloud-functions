import puppeteer from "puppeteer";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseSports, parseStandings, parseGames, parseRoster } from "./games.js";
import { Sports } from './models/sports.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';


// Get directory name for ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global variables
let firebaseInitialized = false;
let db;

// Create a function to initialize Firebase only once
export function initializeFirebase() {
    if (!firebaseInitialized) {
        try {
            // Path to service account file (one level up from src)
            const serviceAccountPath = path.resolve(__dirname, 'C:/Users/2025124/OneDrive - Appleby College/Documents/connect-ed-dfbbd-firebase-adminsdk-fbsvc-4625a29707.json');

            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
                initializeApp({
                    credential: cert(serviceAccount)
                });
                console.log("Firebase initialized with service account");
            } else {
                console.error("Service account file not found at:", serviceAccountPath);
                throw new Error("Firebase service account file not found");
            }

            db = getFirestore();
            firebaseInitialized = true;
        } catch (error) {
            console.error("Error initializing Firebase:", error);
            throw error;
        }
    }
}

/**
 * setSports:
 * Scrapes sports data (using parseSports) and writes each record into the "Sports" collection.
 */
export async function setSports() {
    const sports = await parseSports();
    const batch = db.batch();
    sports.forEach((sportArr) => {
        const docRef = db.collection("Sports").doc(sportArr[2]); // Use league_code as document ID.
        batch.set(docRef, {
            name: sportArr[0],
            term: sportArr[1],
            league_code: sportArr[2],
            uses_gamesheet: sportArr[3]
        });
    });
    await batch.commit();
}

/**
 * setStandings:
 * Scrapes standings data and writes/updates each document in the "Standings" collection.
 */
export async function setStandings(leagueCode, usesGamesheet, browser) {
    const standings = await parseStandings(leagueCode, usesGamesheet, browser);
    const batch = db.batch();
    standings.forEach((standing) => {
        // Convert instance to plain object using toMap() if available
        const data = typeof standing.toMap === 'function'
            ? standing.toMap()
            : Object.assign({}, standing);
        const docRef = db.collection("Sports")
            .doc(leagueCode)
            .collection("Standings")
            .doc(standing.standingsCode);
        batch.set(docRef, data, { merge: true });
    });
    await batch.commit();
}

/**
 * setGames:
 * Scrapes game data and writes/updates each document in the "Games" collection.
 */
export async function setGames(leagueCode, usesGamesheet, browser) {
    try {
        const games = await parseGames(leagueCode, usesGamesheet, browser);
        const batch = db.batch();

        games.forEach(game => {
            // Convert game instance to a plain object.
            const gameData = typeof game.toMap === 'function' ? game.toMap() : { ...game };

            // Extract goals and remove them from the game data.
            const goals = Array.isArray(gameData.goals) ? gameData.goals : [];
            delete gameData.goals;

            // Create a reference for the game document.
            const gameDocRef = db.collection("Games").doc(gameData.game_code);
            batch.set(gameDocRef, gameData, { merge: true });

            // For each goal, convert it to an object and add it as a document in the 'goals' subcollection.
            goals.forEach((goal, index) => {
                const goalData = typeof goal.toMap === 'function' ? goal.toMap() : { ...goal };
                const goalDocRef = gameDocRef.collection("goals").doc(`goal_${index}`);
                batch.set(goalDocRef, goalData, { merge: true });
            });
        });
        await batch.commit();

    } catch (error) {
        console.error("Error in setGames:", error);
        throw error; // Propagate error to be caught in testGamesUpload
    }
}

/**
 * setRoster:
 * Scrapes roster data and writes/updates each document in the "Roster" collection.
 */
export async function setRoster(leagueCode, usesGamesheet, browser) {
    // Ensure Firebase is initialized
    if (!firebaseInitialized) {
        initializeFirebase();
    }
    if (!db) {
        console.error("Firestore database (db) is not initialized in setRoster.");
        throw new Error("Firestore database (db) is not initialized.");
    }

    try {
        const rosterArr = await parseRoster(leagueCode, usesGamesheet, browser);
        if (!rosterArr || rosterArr.length === 0) {
            console.log(`No roster data found for league ${leagueCode}. Skipping Firestore update.`);
            return;
        }

        // Determine the team name (primarily for logging and as an attribute)
        let originalTeamName = "Appleby College"; // Default
        if (rosterArr[0] && rosterArr[0].teamName && String(rosterArr[0].teamName).trim() !== "") {
            originalTeamName = String(rosterArr[0].teamName).trim();
        } else {
            console.warn(`Team name not found on first roster item for league ${leagueCode}. Defaulting to '${originalTeamName}'. This will be stored as an attribute.`);
        }

        // Get sport information
        const sportInfo = Sports.getSportByLeagueCode(leagueCode);
        if (!sportInfo || !sportInfo[0]) {
            console.error(`Critical: Sport name could not be determined for league ${leagueCode}. Aborting roster set.`);
            return;
        }
        const sportName = String(sportInfo[0]).trim();
        if (!sportName) {
            console.error(`Critical: Sport name is empty for league ${leagueCode}. Aborting roster set.`);
            return;
        }

        // Sanitize sportName for Firestore document ID
        const sportDocId = sportName.replace(/[\.\#\$\[\]\/]/g, '_').replace(/\s+/g, '_');
        if (!sportDocId) {
            console.error(`Critical: Sport Document ID became empty after sanitizing sportName '${sportName}' for league ${leagueCode}. Aborting roster set.`);
            return;
        }

        const sportDocRef = db.collection('Team Rosters').doc(sportDocId);
        const batch = db.batch();

        // Prepare sport/team document attributes
        const sportTeamAttributes = {
            sportName: sportName, // The actual sport name
            teamName: originalTeamName, // The specific team name, e.g., "Appleby College"
            leagueCode: leagueCode,
            usesGamesheet: usesGamesheet,
            season: sportInfo[1] || null, // Fall, Winter, Spring
            lastUpdated: new Date(),
        };
        batch.set(sportDocRef, sportTeamAttributes, { merge: true });

        console.log("About to write these players:", rosterArr.map(p => p.playerName || p.name));

        // Loop through players and add them to the 'Players' subcollection
        for (const playerObj of rosterArr) {
            // Attempt to get the player's name from available properties (playerName or name)
            let nameToTest = playerObj.playerName || playerObj.name;

            if (!nameToTest || String(nameToTest).trim() === "") {
                console.warn("Player name is missing or empty. Skipping player:", playerObj);
                continue;
            }

            const playerData = typeof playerObj.toMap === 'function' ? playerObj.toMap() : { ...playerObj };

            // Standardize to playerData.playerName, using the already validated and trimmed name
            playerData.playerName = String(nameToTest).trim();

            // Clean up: if original playerObj had 'name' and it's now represented by 'playerName',
            // remove 'name' from playerData to avoid redundancy, unless it was the source.
            if (playerData.name && playerData.name !== playerData.playerName) {
                // This case handles if playerObj.playerName was chosen and playerObj.name was different
                delete playerData.name;
            } else if (playerData.name && playerData.name === playerData.playerName) {
                // This case handles if playerObj.name was chosen (and is now playerData.playerName)
                delete playerData.name;
            }


            const playerNameForId = playerData.playerName; // This is now guaranteed to be a non-empty string.
            // Sanitize playerName for Firestore document ID
            let pId = playerNameForId.replace(/\s+/g, '_').replace(/[\.\#\$\[\]\/]/g, '');
            if (pId.length > 100) pId = pId.substring(0, 100); // Firestore ID length limit

            if (!pId) { // Fallback if sanitized name becomes empty (e.g., name was only symbols)
                pId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                console.warn(`Sanitized name for '${playerNameForId}' resulted in empty ID. Using generated ID: ${pId}`);
            }

            // Clean up playerData: remove teamName if present (it's on the parent sport document)
            if ('teamName' in playerData) {
                delete playerData.teamName;
            }
            // PlayerId from source can be removed if it's not needed in the document fields
            // if ('playerId' in playerData) {
            //     delete playerData.playerId;
            // }

            const playerRef = sportDocRef.collection('Players').doc(pId);
            batch.set(playerRef, playerData, { merge: true }); // Use merge: true for players too
        }

        await batch.commit();
        console.log(`Roster for sport '${sportName}' (team '${originalTeamName}', league ${leagueCode}) and its players successfully set/updated in Firestore.`);

    } catch (error) {
        console.error(`Error in setRoster for league ${leagueCode} (Sport: ${sportInfo ? sportInfo[0] : 'N/A'}): ${error.message}`, error.stack);
        throw error;
    }
}


/**
 * setAll:
 * Sets all sports, standings, and games data.
 */
export async function setAll() {
    await setSports();
    const sports = await getSports();
    const promises = sports.map(async (sport) => {
        await setStandings(sport.league_code, sport.uses_gamesheet);
        await setGames(sport.league_code, sport.uses_gamesheet);
        await setRoster(sport.league_code, sport.uses_gamesheet);

    });
    await Promise.all(promises);
}


/**
 * Getter Methods:
 * Retrieve data from Firestore.
 */
export async function getSports() {
    const snapshot = await db.collection('Sports').get();
    const sports = [];
    snapshot.forEach(doc => sports.push(doc.data()));
    return sports;
}

export async function getStandings(leagueNum) {
    const snapshot = await db.collection("Sports").doc(leagueNum).collection("Standings").get();
    const standings = [];
    snapshot.forEach(doc => standings.push(doc.data()));
    return standings;
}

export async function getAllStandings() {
    const sportsSnapshot = await db.collection("Sports").get();
    const allStandingsPromises = [];

    sportsSnapshot.forEach(sportDoc => {
        const standingsPromise = sportDoc.ref.collection("Standings").get()
            .then(standingsSnapshot => {
                const standings = [];
                standingsSnapshot.forEach(doc => standings.push(doc.data()));
                return standings;
            });
        allStandingsPromises.push(standingsPromise);
    });

    const allStandingsArrays = await Promise.all(allStandingsPromises);
    // Flatten the array of arrays
    return allStandingsArrays.flat();
}

export async function getGames(leagueNum) {
    const snapshot = await db.collection("Games").where("sport_id", "==", leagueNum).get();
    const games = [];
    snapshot.forEach(doc => games.push(doc.data()));
    return games;
}

export async function getAllGames() {
    const snapshot = await db.collection("Games").get();
    const games = [];
    snapshot.forEach(doc => games.push(doc.data()));
    return games;
}

export async function getApplebyTeamCode(leagueNum) {
    try {
        const applebySnapshot = await db.collection("Sports")
            .doc(leagueNum)
            .collection("Standings")
            .where("teamName", "==", "Appleby College")
            .limit(1)
            .get();

        if (applebySnapshot.empty) return null;
        return applebySnapshot.docs[0].data().gamesheetTeamId || null;
    } catch (error) {
        console.error("Error getting Appleby team code:", error);
        return null;
    }
}

export async function getRoster(leagueNum) {
    try {
        const snapshot = await db.collection("Team Rosters").doc(leagueNum).collection("Players").get();
        const roster = [];
        snapshot.forEach(doc => roster.push(doc.data()));
        return roster;
    } catch (error) {
        console.error("Error getting roster:", error);
        return [];
    }
}

/**
 * updateGamesStandings:
 * Uses getSports() to retrieve sports from Firestore, then updates games and standings for each.
 */
export async function updateGamesStandings() {
    console.log("Updating games and standings in Firestore");
    const sports = await getSports();
    const today = new Date();
    const season = getSeason(today);
    let filteredSports = season !== "Unknown" ? sports.filter(sport => sport.term === season) : sports;

    // 2. Check if any sport uses GameSheet
    const hasGameSheetSport = filteredSports.some(sport => sport.usesGamesheet);

    let browser;

    try {
        // 3. Launch ONE browser if needed
        if (hasGameSheetSport) {
            browser = await puppeteer.launch({
                headless: true,
                timeout: 0,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
        }

        // 4. For each sport, set games and standings using the same browser
        const promises = filteredSports.map(async (sport) => {
            await setGames(sport.league_code, sport );  // existing function
            await setStandings(sport.league_code, sport.usesGamesheet, browser);
        });

        await Promise.all(promises);

        console.log("Games and standings updated in Firestore");
    } catch (err) {
        console.error("Error in updateGamesStandings:", err);
    } finally {
        // 5. Close the browser once all sports are processed
        if (browser) {
            await browser.close();
        }
    }
}

function getSeason(date) {
    const month = date.getMonth();
    const day = date.getDate();
    let season;
    switch (month) {
        case 8:
        case 9:
            season = "Fall";
            break;
        case 10:
            season = day >= 10 ? "Winter" : "Fall";
            break;
        case 11:
        case 0:
        case 1:
            season = "Winter";
            break;
        case 2:
            season = day >= 10 ? "Spring" : "Winter";
            break;
        case 3:
        case 4:
            season = "Spring";
            break;
        default:
            season = "Unknown";
    }
    return season;
}