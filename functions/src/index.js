import {
  setSports,
  setStandings,
  setGames,
    setRoster,
  setAll,
  getSports,
  updateGamesStandings,
  initializeFirebase, getStandings
} from './database.js';
import { Sports } from './models/sports.js';

// Initialize Firebase (this should happen only once)
initializeFirebase();

/**
 * Test functions to manually verify Firebase functionality
 */
async function testSportsUpload() {
  console.log("Testing sports upload to Firebase...");
  try {
    await setSports();
    console.log("Sports data uploaded successfully");

    // Verify data was uploaded by retrieving it
    const sports = await getSports();
    console.log(`Retrieved ${sports.length} sports from Firestore`);
    console.log(sports.slice(0, 3)); // Show first 3 sports for verification
  } catch (error) {
    console.error("Error uploading sports data:", error);
  }
}

async function testStandingsUpload() {
  console.log("Testing standings upload for a sample league...");
  try {
    // Get a sample league code from Sports model
    const allSports = Sports.getAllSports();
    if (allSports.length === 0) {
      console.log("No sports data available for testing");
      return;
    }

    const sampleLeagueCode = "2860Y8N2D"; // Get league code from first sport
    const usesGamesheet = false; // Get gamesheet status from first sport
    console.log(`Using league code: ${sampleLeagueCode}`);

    await setStandings(sampleLeagueCode, usesGamesheet);
    console.log(`Standings for league ${sampleLeagueCode} uploaded successfully`);
  } catch (error) {
    console.error("Error uploading standings data:", error);
  }
}

async function testGamesUpload() {
  console.log("Testing games upload for a sample league...");
  try {
    // Get a sample league code from Sports model
    const allSports = Sports.getAllSports();
    if (allSports.length === 0) {
      console.log("No sports data available for testing");
      return;
    }

    const sampleLeagueCode = "2860Y8OA1"; // Get league code from first sport
    const usesGamesheet = Sports.getSportByLeagueCode(sampleLeagueCode)[3]; // Get gamesheet status from first sport

    console.log(`Using league code: ${sampleLeagueCode}`);

    await setGames(sampleLeagueCode, usesGamesheet);
    console.log(`Games for league ${sampleLeagueCode} uploaded successfully`);
  } catch (error) {
    console.error("Error uploading games data:", error);
  }
}

async function testRosterUpload() {
    console.log("Testing roster upload for a sample league...");
    try {
        // Get a sample league code from Sports model
        const allSports = Sports.getAllSports();
        if (allSports.length === 0) {
        console.log("No sports data available for testing");
        return;
        }

        const sampleLeagueCode = "2860Y8N5D"; // Get league code from first sport
        const usesGamesheet = Sports.getSportByLeagueCode(sampleLeagueCode)[3]; // Get gamesheet status from first sport

        if (!usesGamesheet) {
            console.log("Gamesheet is not used for this league, skipping roster upload.");
            return;
        }

        console.log(`Using league code: ${sampleLeagueCode}`);

        await setRoster(sampleLeagueCode, usesGamesheet);
        console.log(`Roster for league ${sampleLeagueCode} uploaded successfully`);
    } catch (error) {
        console.error("Error uploading roster data:", error);
    }
}

async function testFullUpdate() {
  console.log("Testing full update of games and standings...");
  try {
    await updateGamesStandings();
    console.log("Full update completed successfully");
  } catch (error) {
    console.error("Error during full update:", error);
  }
}

async function testSetAll() {
    console.log("Testing setAll function...");
    try {
        await setAll();
        console.log("All data uploaded successfully");
    } catch (error) {
        console.error("Error in setAll function:", error);
    }
}

// Run all tests in sequence
async function runAllTests() {
  console.log("Starting Firebase functionality tests...");


  //await testSportsUpload();
  //console.log("\n-----------------------------------\n");

  //await testStandingsUpload();
  //console.log("\n-----------------------------------\n");

    await testRosterUpload()
    console.log("\n-----------------------------------\n");
    /*
     await testGamesUpload();
     console.log("\n-----------------------------------\n");

     await testFullUpdate();
     console.log("\n-----------------------------------\n");


     await testSetAll();
     console.log("\n-----------------------------------\n");
     */

  console.log("All Firebase tests completed");
}

// Execute the tests
runAllTests().catch(error => {
  console.error("Test execution failed:", error);
});