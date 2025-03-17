import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue, Filter } from 'firebase-admin/firestore';
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
        });
    });
    await batch.commit();
}

/**
 * setStandings:
 * Scrapes standings data and writes/updates each document in the "Standings" collection.
 */
export async function setStandings(leagueCode) {
    const standings = await parseStandings(leagueCode);
    const batch = db.batch();
    standings.forEach((standing) => {
        const docRef = db.collection("Standings").doc(standing.standings_code);
        batch.set(docRef, standing, { merge: true });
    });
    await batch.commit();
}

/**
 * setGames:
 * Scrapes game data and writes/updates each document in the "Games" collection.
 */
export async function setGames(leagueCode) {
    const games = await parseGames(leagueCode);
    const batch = db.batch();
    games.forEach((game) => {
        const docRef = db.collection("Games").doc(game.game_code);
        batch.set(docRef, game, { merge: true });
    });
    await batch.commit();
}


/**
 * Getter Methods:
 * Retrieve data from Firestore.
 */
export async function getSports() {
    const snapshot = await db.collection("Sports").get();
    const sports = [];
    snapshot.forEach(doc => sports.push(doc.data()));
    return sports;
}

export async function getStandings(leagueNum) {
    const snapshot = await db.collection("Standings").where("sport_id", "==", leagueNum).get();
    const standings = [];
    snapshot.forEach(doc => standings.push(doc.data()));
    return standings;
}

export async function getAllStandings() {
    const snapshot = await db.collection("Standings").get();
    const standings = [];
    snapshot.forEach(doc => standings.push(doc.data()));
    return standings;
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
    const promises = filteredSports.map(async (sport) => {
        await setGames(sport.league_code);
        await setStandings(sport.league_code);
    });
    await Promise.all(promises);
    console.log("Games and standings updated in Firestore");
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