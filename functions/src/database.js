const puppeteer = require("puppeteer");
const {initializeApp, cert} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {parseSports, parseStandings, parseGames, parseRoster} = require("./games.js");
const {Sports} = require("./models/sports.js");
const path = require("path");
const fs = require("fs");
const {Article} = require("./models/Article.js");
const {Event} = require("./models/Event.js");
const {LunchMenu} = require("./models/LunchMenu.js");

// Global variables
let firebaseInitialized = false;
let db;

/**
 * Initializes the Firebase Admin SDK.
 * If the env var LOCAL_SA_PATH is set, it will load that service-account JSON (for local dev / emulator).
 * @throws {Error} If the service account file is not found or if initialization fails.
 */
function initializeFirebase() {
  if (firebaseInitialized) return;

  if (process.env.LOCAL_SA_PATH) {
    // running locally or in your emulator
    const keyPath = path.resolve(process.cwd(), process.env.LOCAL_SA_PATH);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Local service account not found at ${keyPath}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
    initializeApp({credential: cert(serviceAccount)});
    console.log("🔑 Firebase Admin initialized with local key");
  } else {
    // running in Cloud Functions / Cloud Run
    initializeApp();
    console.log("✅ Firebase Admin initialized with default application credentials");
  }
  db = getFirestore();
  firebaseInitialized = true;
}

/**
 * setSports:
 * Scrapes sports data (using parseSports) and writes each record into the "Sports" collection.
 * @async
 * @function setSports
 * @throws {Error} If there's an error during parsing or committing to Firestore.
 */
async function setSports() {
  const sports = await parseSports();
  const batch = db.batch();
  sports.forEach((sportArr) => {
    const docRef = db.collection("Sports").doc(sportArr[2]); // Use league_code as document ID.
    batch.set(docRef, {
      name: sportArr[0],
      term: sportArr[1],
      league_code: sportArr[2],
      uses_gamesheet: sportArr[3],
    });
  });
  await batch.commit();
}

/**
 * setStandings:
 * Scrapes standings data and writes it as an array field in the "Sports" document.
 * @param {string} leagueCode - The league code for which to set standings.
 * @param {boolean} usesGamesheet - Indicates if the league uses GameSheet.
 * @param {object} browser - An optional Puppeteer browser instance.
 */
async function setStandings(leagueCode, usesGamesheet, browser) {
  const standingInstances = await parseStandings(leagueCode, usesGamesheet, browser);
  const standingsDataArray = standingInstances.map((s) =>
    s.toMap ? s.toMap() : Object.assign({}, s),
  );

  const sportDocRef = db.collection("Sports").doc(leagueCode);
  try {
    // This will add/overwrite the standings_data field.
    // It assumes the Sport document itself is created by setSports first.
    await sportDocRef.update({
      standings_data: standingsDataArray,
    });
    console.log(`Standings array updated for sport ${leagueCode}`);
  } catch (error) {
    console.error(`Error updating sport ${leagueCode} with standings array. Ensure sport document exists.`, error);
    // Re-throw the error if you want the caller to handle it
    throw error;
  }
}

/**
 * setGames:
 * Scrapes game data and writes/updates each document in the "Games" collection.
 * Goals are stored as an array of maps directly within the game document for Gamesheet games.
 * @param {string} leagueCode - The league code for which to set games.
 * @param {boolean} usesGamesheet - Indicates if the league uses GameSheet.
 * @param {object} browser - An optional Puppeteer browser instance.
 * @throws {Error} If an error occurs during the process.
 */
async function setGames(leagueCode, usesGamesheet, browser) {
  try {
    const applebyTeamCode = usesGamesheet ? await getApplebyTeamCode(leagueCode) : null;
    const games = await parseGames(leagueCode, usesGamesheet, browser, applebyTeamCode); // Pass applebyTeamCode
    const batch = db.batch();

    games.forEach((game) => {
      // Convert game instance to a plain object.
      // For GamesheetGame instances, game.toMap() will include a 'goals' field
      // which is an array of goal maps, as per GamesheetGame.toMap().
      const gameData = typeof game.toMap === "function" ? game.toMap() : {...game};

      // The subcollection logic for goals is removed.
      // gameData now directly contains the 'goals' array if it's a Gamesheet game and has goals.
      // If it's a non-Gamesheet game or has no goals, the 'goals' field might be absent or empty,
      // which is handled by game.toMap() and GamesheetGame.toMap().

      // Create a reference for the game document.
      const gameDocRef = db.collection("Games").doc(gameData.game_code);
      batch.set(gameDocRef, gameData, {merge: true}); // gameData is set with goals included as an array field
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
 * Player data is stored as an array of maps in the team roster document.
 * The team roster document ID is a sanitized version of the sport name.
 * @param {string} leagueCode - The league code for which to set the roster.
 * @param {boolean} usesGamesheet - Indicates if the league uses GameSheet.
 * @param {object} browser - An optional Puppeteer browser instance.
 * @throws {Error} If an error occurs during the process.
 */
async function setRoster(leagueCode, usesGamesheet, browser) {
  // Ensure Firebase is initialized
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  if (!db) {
    console.error("Firestore database (db) is not initialized in setRoster.");
    throw new Error("Firestore database (db) is not initialized.");
  }

  // If the league does not use Gamesheet, rosters are not applicable.
  if (!usesGamesheet) {
    console.log(`Rosters are only applicable for Gamesheet leagues. Skipping for non-Gamesheet league ${leagueCode}.`);
    return;
  }

  try {
    const applebyTeamCode = await getApplebyTeamCode(leagueCode); // applebyTeamCode will be null if not found, which is handled by parseRoster
    const rosterArr = await parseRoster(leagueCode, usesGamesheet, browser, applebyTeamCode); // Pass applebyTeamCode
    if (!rosterArr || rosterArr.length === 0) {
      console.log(`No roster data found for league ${leagueCode}. Skipping Firestore update.`);
      return;
    }

    // Determine the team name (primarily for logging and as an attribute)
    let originalTeamName = "Appleby College"; // Default
    if (rosterArr[0] && rosterArr[0].teamName && String(rosterArr[0].teamName).trim() !== "") {
      originalTeamName = String(rosterArr[0].teamName).trim();
    } else {
      console.warn(`Team name not found on first roster item for league ${leagueCode}. 
      Defaulting to '${originalTeamName}'. This will be stored as an attribute.`);
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
    const sportDocId = sportName.replace(/[.#$[\]/]/g, "_").replace(/\s+/g, "_");
    if (!sportDocId) {
      console.error(`Critical: Sport Document ID became empty after sanitizing sportName '${sportName}' for league ${leagueCode}. Aborting roster set.`);
      return;
    }

    const sportDocRef = db.collection("Team Rosters").doc(sportDocId);

    const playersDataArray = [];
    console.log("About to process these players for array storage:", rosterArr.map((p) => p.playerName || p.name));

    // Loop through players and prepare their data for the array
    for (const playerObj of rosterArr) {
      const nameToTest = playerObj.playerName || playerObj.name;

      if (!nameToTest || String(nameToTest).trim() === "") {
        console.warn("Player name is missing or empty. Skipping player:", playerObj);
        continue;
      }

      const playerData = typeof playerObj.toMap === "function" ? playerObj.toMap() : {...playerObj};
      playerData.playerName = String(nameToTest).trim();

      if (playerData.name && playerData.name !== playerData.playerName) {
        delete playerData.name;
      } else if (playerData.name && playerData.name === playerData.playerName) {
        delete playerData.name;
      }

      if ("teamName" in playerData) {
        delete playerData.teamName;
      }
      playersDataArray.push(playerData);
    }

    // Prepare sport/team document attributes, now including the players_data array
    const sportTeamAttributes = {
      sportName: sportName, // The actual sport name
      teamName: originalTeamName, // The specific team name, e.g., "Appleby College"
      leagueCode: leagueCode,
      usesGamesheet: usesGamesheet,
      season: sportInfo[1] || null, // Fall, Winter, Spring
      lastUpdated: new Date(),
      players_data: playersDataArray, // Store players as an array of maps
    };

    // Set the document with the roster array
    await sportDocRef.set(sportTeamAttributes, {merge: true});

    console.log(`Roster for sport '${sportName}' (team '${originalTeamName}', league ${leagueCode})
     and its players successfully set/updated in Firestore as an array.`);
  } catch (error) {
    console.error(`Error in setRoster for league ${leagueCode}: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * setAll:
 * Sets all sports, standings, and games data.
 * It first sets all sports, then retrieves them, and for each sport,
 * it sets the corresponding standings, games, and rosters using a shared Puppeteer browser instance if needed.
 */
async function setAll() {
  await setSports();
  const sports = await getSports();

  // Check if any sport uses GameSheet to determine if a browser is needed
  const needsBrowser = sports.some((sport) => sport.uses_gamesheet);
  let browser = null;

  try {
    if (needsBrowser) {
      browser = await puppeteer.launch({
        headless: true,
        timeout: 0,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const promises = sports.map(async (sport) => {
      // Pass the single browser instance if the sport uses Gamesheet
      const browserToUse = sport.uses_gamesheet ? browser : null;
      await setStandings(sport.league_code, sport.uses_gamesheet, browserToUse);
      await setGames(sport.league_code, sport.uses_gamesheet, browserToUse);
      await setRoster(sport.league_code, sport.uses_gamesheet, browserToUse);
    });
    await Promise.all(promises);
    console.log("All sports, standings, games, and rosters set successfully using a shared browser instance where applicable.");
  } catch (error) {
    console.error("Error in setAll with shared browser instance:", error);
    // Optionally re-throw or handle as needed
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Shared browser instance closed in setAll.");
    }
  }
}

/**
 * Retrieves all sports from the "Sports" collection in Firestore.
 * @return {Promise<Array<object>>} A promise that resolves to an array of sport objects.
 */
async function getSports() {
  const snapshot = await db.collection("Sports").get();
  const sports = [];
  snapshot.forEach((doc) => sports.push(doc.data())); // doc.data() will now include standings_data
  return sports;
}

/**
 * Retrieves standings array for a specific league from its Sport document.
 * @param {string} leagueNum - The league code (document ID of the sport).
 * @return {Promise<Array<object>>} A promise that resolves to an array of standing objects, or an empty array if not found.
 */
async function getStandings(leagueNum) {
  try {
    const sportDocRef = db.collection("Sports").doc(leagueNum);
    const docSnap = await sportDocRef.get();

    if (docSnap.exists) {
      const sportData = docSnap.data();
      return sportData.standings_data || []; // Return the array or an empty one if field is missing
    } else {
      console.log(`Sport document ${leagueNum} not found for getStandings.`);
      return [];
    }
  } catch (error) {
    console.error(`Error getting standings for league ${leagueNum}:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Retrieves all standings for all sports by extracting them from each Sport document.
 * @return {Promise<Array<object>>} A promise that resolves to a flattened array of all standing objects.
 */
async function getAllStandings() {
  const sportsSnapshot = await db.collection("Sports").get();
  const allStandingsData = [];

  sportsSnapshot.forEach((sportDoc) => {
    const sportData = sportDoc.data();
    if (sportData.standings_data && Array.isArray(sportData.standings_data)) {
      allStandingsData.push(...sportData.standings_data);
    }
  });
  return allStandingsData;
}

/**
 * Retrieves games for a specific league (sport ID) from the "Games" collection in Firestore.
 * @param {string} leagueNum - The league code (sport_id) for which to retrieve games.
 * @return {Promise<Array<object>>} A promise that resolves to an array of game objects.
 */
async function getGames(leagueNum) {
  const snapshot = await db.collection("Games").where("sport_id", "==", leagueNum).get();
  const games = [];
  snapshot.forEach((doc) => games.push(doc.data()));
  return games;
}

/**
 * Retrieves all games from the "Games" collection in Firestore.
 * @return {Promise<Array<object>>} A promise that resolves to an array of all game objects.
 */
async function getAllGames() {
  const snapshot = await db.collection("Games").get();
  const games = [];
  snapshot.forEach((doc) => games.push(doc.data()));
  return games;
}

/**
 * Retrieves the GameSheet team ID for Appleby College for a specific league.
 * It queries the standings array in the Sport document for a team named "Appleby College".
 * @param {string} leagueNum - The league code for which to find the Appleby team code.
 * @return {Promise<string|null>} A promise that resolves to the GameSheet team ID or null if not found or an error occurs.
 */
async function getApplebyTeamCode(leagueNum) {
  try {
    const sportDocRef = db.collection("Sports").doc(leagueNum);
    const docSnap = await sportDocRef.get();

    if (docSnap.exists) {
      const sportData = docSnap.data();
      const standingsArray = sportData.standings_data;

      if (Array.isArray(standingsArray)) {
        const applebyStanding = standingsArray.find((s) => s.teamName === "Appleby College");
        return applebyStanding && applebyStanding.gamesheetTeamId ? applebyStanding.gamesheetTeamId : null;
      }
    }
    console.log(`Sport document ${leagueNum} or its standings_data not found for getApplebyTeamCode.`);
    return null;
  } catch (error) {
    console.error(`Error getting Appleby team code for league ${leagueNum}:`, error);
    return null;
  }
}

/**
 * Retrieves the roster for a specific league (sport) from the "Team Rosters" collection.
 * The roster (players) is stored as an array of maps in the team roster document.
 * @param {string} leagueNum - The document ID of the sport in "Team Rosters" (typically the sanitized sport name).
 * @return {Promise<Array<object>>} A promise that resolves to an array of player objects, or an empty array if an error occurs or no roster is found.
 */
async function getRoster(leagueNum) {
  try {
    // The document ID for "Team Rosters" is typically the sanitized sport name.
    // This part depends on how leagueNum is being passed. If leagueNum is the sanitized sport name:
    const sportDocRef = db.collection("Team Rosters").doc(leagueNum);
    const docSnap = await sportDocRef.get();

    if (docSnap.exists) {
      const teamRosterData = docSnap.data();
      // Return the players_data array or an empty one if the field is missing
      return teamRosterData.players_data || [];
    } else {
      console.log(`Team Roster document ${leagueNum} not found for getRoster.`);
      return [];
    }
  } catch (error) {
    console.error(`Error getting roster for ${leagueNum}:`, error);
    return []; // Return empty array on error
  }
}

// --- LunchMenu Functions ---

/**
 * setLunchMenu:
 * Writes or updates a lunch menu document in the "LunchMenus" collection.
 * The document ID will be the formatted date (YYYY-MM-DD).
 * @param {LunchMenu | object} menuData - An instance of LunchMenu or a plain object representing the menu.
 */
async function setLunchMenu(menuData) {
  if (!firebaseInitialized) initializeFirebase();
  const menu = (menuData instanceof LunchMenu) ? menuData : new LunchMenu(menuData);
  const docId = menu.getFormattedDate();
  const docRef = db.collection("LunchMenus").doc(docId);
  await docRef.set(menu.toMap(), {merge: true});
  console.log(`Lunch menu for ${docId} successfully set/updated.`);
}

/**
 * getLunchMenuByDate:
 * Retrieves a specific lunch menu by its date.
 * @param {Date | string} date - A Date object or a date string in 'YYYY-MM-DD' format.
 * @return {Promise<object | null>} The lunch menu data as an object, or null if not found or if the date format is invalid.
 */
async function getLunchMenuByDate(date) {
  if (!firebaseInitialized) initializeFirebase();
  let docId;
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    docId = `${year}-${month}-${day}`;
  } else if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    docId = date;
  } else {
    console.error("Invalid date format for getLunchMenuByDate. Use Date object or 'YYYY-MM-DD' string.");
    return null;
  }
  const docRef = db.collection("LunchMenus").doc(docId);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return docSnap.data();
  } else {
    console.log(`No lunch menu found for date: ${docId}`);
    return null;
  }
}

/**
 * getAllLunchMenus:
 * Retrieves all lunch menus from the "LunchMenus" collection, ordered by date descending.
 * @return {Promise<Array<object>>} An array of lunch menu objects.
 */
async function getAllLunchMenus() {
  if (!firebaseInitialized) initializeFirebase();
  const snapshot = await db.collection("LunchMenus").orderBy("date", "desc").get();
  const menus = [];
  snapshot.forEach((doc) => menus.push(doc.data()));
  return menus;
}

// --- Article Functions ---

/**
 * setArticle:
 * Writes or updates an article document in the "Articles" collection.
 * Uses `article.articleId` as document ID if provided and valid; otherwise, Firestore auto-generates an ID.
 * @param {Article | object} articleData - An instance of Article or a plain object representing the article.
 * @return {Promise<string>} The document ID of the created or updated article.
 */
async function setArticle(articleData) {
  if (!firebaseInitialized) initializeFirebase();
  const article = (articleData instanceof Article) ? articleData : new Article(articleData);
  let docRef;
  if (article.articleId && typeof article.articleId === "string" && article.articleId.trim() !== "") {
    docRef = db.collection("Articles").doc(article.articleId.trim());
  } else {
    docRef = db.collection("Articles").doc(); // Firestore auto-generates ID
  }
  await docRef.set(article.toMap(), {merge: true});
  console.log(`Article with ID ${docRef.id} successfully set/updated.`);
  return docRef.id;
}

/**
 * getArticleById:
 * Retrieves a specific article by its document ID from the "Articles" collection.
 * @param {string} articleId - The document ID of the article to retrieve.
 * @return {Promise<object | null>} The article data (including its ID) as an object, or null if not found or if `articleId` is invalid.
 */
async function getArticleById(articleId) {
  if (!firebaseInitialized) initializeFirebase();
  if (!articleId || typeof articleId !== "string" || articleId.trim() === "") {
    console.error("Invalid articleId provided to getArticleById.");
    return null;
  }
  const docRef = db.collection("Articles").doc(articleId.trim());
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return {id: docSnap.id, ...docSnap.data()};
  } else {
    console.log(`No article found with ID: ${articleId}`);
    return null;
  }
}

/**
 * getAllArticles:
 * Retrieves all articles from the "Articles" collection, ordered by publication date descending.
 * @return {Promise<Array<object>>} An array of article objects, each including its ID.
 */
async function getAllArticles() {
  if (!firebaseInitialized) initializeFirebase();
  const snapshot = await db.collection("Articles").orderBy("publication_date", "desc").get();
  const articles = [];
  snapshot.forEach((doc) => articles.push({id: doc.id, ...doc.data()}));
  return articles;
}

// --- Event Functions ---

/**
 * setEvent:
 * Writes or updates an event document in the "Events" collection.
 * Uses `event.eventId` as document ID if provided and valid; otherwise, Firestore auto-generates an ID.
 * @param {Event | object} eventData - An instance of Event or a plain object representing the event.
 * @return {Promise<string>} The document ID of the created or updated event.
 */
async function setEvent(eventData) {
  if (!firebaseInitialized) initializeFirebase();
  const event = (eventData instanceof Event) ? eventData : new Event(eventData);
  let docRef;
  if (event.eventId && typeof event.eventId === "string" && event.eventId.trim() !== "") {
    docRef = db.collection("Events").doc(event.eventId.trim());
  } else {
    docRef = db.collection("Events").doc(); // Firestore auto-generates ID
  }
  await docRef.set(event.toMap(), {merge: true});
  console.log(`Event with ID ${docRef.id} successfully set/updated.`);
  return docRef.id;
}

/**
 * getEventById:
 * Retrieves a specific event by its document ID from the "Events" collection.
 * @param {string} eventId - The document ID of the event to retrieve.
 * @return {Promise<object | null>} The event data (including its ID) as an object, or null if not found or if `eventId` is invalid.
 */
async function getEventById(eventId) {
  if (!firebaseInitialized) initializeFirebase();
  if (!eventId || typeof eventId !== "string" || eventId.trim() === "") {
    console.error("Invalid eventId provided to getEventById.");
    return null;
  }
  const docRef = db.collection("Events").doc(eventId.trim());
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return {id: docSnap.id, ...docSnap.data()};
  } else {
    console.log(`No event found with ID: ${eventId}`);
    return null;
  }
}

/**
 * getAllEvents:
 * Retrieves all events from the "Events" collection, ordered by start date ascending.
 * @return {Promise<Array<object>>} An array of event objects, each including its ID.
 */
async function getAllEvents() {
  if (!firebaseInitialized) initializeFirebase();
  const snapshot = await db.collection("Events").orderBy("start_date", "asc").get();
  const events = [];
  snapshot.forEach((doc) => events.push({id: doc.id, ...doc.data()}));
  return events;
}

/**
 * updateGamesStandings:
 * Uses getSports() to retrieve sports from Firestore, then updates games and standings for each sport,
 * filtered by the current season. Manages a single Puppeteer browser instance for GameSheet sports.
 */
async function updateGamesStandings() {
  console.log("Updating games and standings in Firestore");
  const sports = await getSports();
  const today = new Date();
  const season = getSeason(today);
  const filteredSports = season !== "Unknown" ? sports.filter((sport) => sport.term === season) : sports;

  // 2. Check if any sport uses GameSheet
  const hasGameSheetSport = filteredSports.some((sport) => sport.usesGamesheet);

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
      await setGames(sport.league_code, sport.uses_gamesheet, browser); // Pass sport.uses_gamesheet
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

/**
 * Determines the current sports season based on the given date.
 * @param {Date} date - The date to determine the season for.
 * @return {string} The current season ("Fall", "Winter", "Spring", or "Unknown").
 */
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

module.exports = {
  db,
  initializeFirebase,
  setSports,
  setStandings,
  setGames,
  setRoster,
  setAll,
  getSports,
  getStandings,
  getAllStandings,
  getGames,
  getAllGames,
  getApplebyTeamCode,
  getRoster,
  setLunchMenu,
  getLunchMenuByDate,
  getAllLunchMenus,
  setArticle,
  getArticleById,
  getAllArticles,
  setEvent,
  getEventById,
  getAllEvents,
  updateGamesStandings,
};

