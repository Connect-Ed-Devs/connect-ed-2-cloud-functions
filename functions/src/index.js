// javascript
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import admin from "firebase-admin";
import { parseGames } from "./games.js";
import { Game } from "./models/Game.js";
import { addGame } from "./services/firestoreService.js";

admin.initializeApp();

export const scrapeAndUploadGames = onRequest(async (req, res) => {
  try {
    // Use a query parameter or fall back to a default league code.
    const leagueNum = req.query.league || "2860Y8N5D";
    logger.info(`Scraping games for league: ${leagueNum}`);

    // Parse raw game data from the website.
    const rawGames = await parseGames(leagueNum);
    logger.info(`Scraped ${rawGames.length} games.`);

    // If you need to massage data into your Game model format,
    // create Game instances from raw data.
    const games = rawGames.map(raw => {
      // Convert raw game to a Game instance
      return new Game({
        homeTeam: raw.home_id, // use your mapping logic as needed
        homeAbbr: raw.home_id,
        homeLogo: '',
        awayTeam: raw.away_id,
        awayAbbr: raw.away_id,
        awayLogo: '',
        gameDate: new Date(raw.date),
        gameTime: raw.time,
        homeScore: raw.home_score,
        awayScore: raw.away_score,
        sportsId: raw.sport_id,
        sportsName: '',
        term: '',
        leagueCode: leagueNum
      });
    });

    // Use Firestore batch upload.
    const db = admin.firestore();
    const batch = db.batch();
    games.forEach(game => {
      const docRef = db.collection('games').doc();
      batch.set(docRef, game.toMap());
    });
    await batch.commit();

    res.status(200).send(`Successfully uploaded ${games.length} games to Firestore.`);
  } catch (error) {
    logger.error("Error in scrapeAndUploadGames:", error);
    res.status(500).send("Error scraping and uploading games.");
  }
});