import puppeteer from "puppeteer";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { parseSports, parseStandings, parseGames } from "./games.js";
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
    const games = await parseGames(leagueCode, usesGamesheet, browser);
    const batch = db.batch();
    games.forEach((game) => {
        const docRef = db.collection("Games").doc(game.game_code);
        batch.set(docRef, game, { merge: true });
    });
    await batch.commit();
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