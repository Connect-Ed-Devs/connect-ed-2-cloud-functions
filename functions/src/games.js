const axios = require("axios");
const cheerio = require("cheerio");
const qs = require("qs");
const {Schools} = require("./models/schools.js");
const {Sports} = require("./models/sports.js");
const {BaseGame} = require("./models/GameClasses.js");
const puppeteer = require("puppeteer");
const {BaseStandings} = require("./models/StandingsClasses.js");
const {
  parseGameIDs,
  parseGameSheetGames,
  parseGameSheetHockeyRoster,
  parseGameSheetHockeyStandings,
  parseGameSheetSoccerRoster,
  parseGameSheetSoccerStandings,
} = require("./gamesheet.js");

/**
 * Helper functions to replace SQL lookups.
 */

/**
 * Retrieves the sport ID (league code) for a given league number.
 * @param {string} leagueNum - The league number.
 * @return {Promise<string|null>} The league code if found, otherwise null.
 * @async
 */
async function getSportID(leagueNum) {
  // Look up the sport record by league code
  const sportRecord = Sports.getSportByLeagueCode(leagueNum);
  // For this example, we’ll use the league code as the unique id.
  return sportRecord ? sportRecord[2] : null;
}

/**
 * Retrieves the school ID for a given school abbreviation.
 * @param {string} schoolAbbrev - The school abbreviation.
 * @return {Promise<number|null>} The school ID if found, otherwise null.
 * @async
 */
async function getSchoolIDAbbrev(schoolAbbrev) {
  const school = Schools.getSchoolByAbbreviation(schoolAbbrev);
  return school ? school.id : null;
}

/**
 * Retrieves the school ID for a given team name by checking if any known school name is part of the team name.
 * @param {string} teamName - The team name.
 * @return {Promise<number|null>} The school ID if found, otherwise null.
 * @async
 */
async function getSchoolIDName(teamName) {
  // Retrieve an array of all school records
  const allSchools = Schools.getAllSchools();
  // Try to find a school whose full name is included in the teamName string
  const schoolRecord = allSchools.find((school) => teamName.includes(school.school_name));
  return schoolRecord ? schoolRecord.id : null;
}

/**
 * Converts a month name to its numerical index (1-12).
 * @param {string} monthName - The name of the month (e.g., "Jan", "Feb").
 * @return {number} The numerical index of the month.
 */
function getMonthIndex(monthName) {
  return new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
}

/**
 * inSport: Checks if the sport (using the league code) includes "Appleby College" in its standings.
 * Uses different scraping approaches based on whether the sport uses Gamesheet.
 * @param {string} leagueNum - The league code.
 * @param {boolean} usesGamesheet - Whether the sport uses Gamesheet.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<boolean>} True if Appleby College is in the sport's standings, false otherwise.
 * @async
 */
async function inSport(leagueNum, usesGamesheet, browser) {
  try {
    if (usesGamesheet) {
      // For Gamesheet sports
      const response = await axios.request({
        baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
        method: "PUT",
        headers: {"content-type": "application/x-www-form-urlencoded"},
        data: qs.stringify({txtleague: leagueNum}),
      });

      const $ = cheerio.load(response.data);
      const iframeSrc = $("iframe[src*=\"gamesheetstats.com/seasons/\"]").attr("src");

      if (!iframeSrc) return false;

      // Extract the season code and division ID from the iframe URL
      const seasonCodeMatch = iframeSrc.match(/seasons\/(\d+)/);
      const divisionMatch = iframeSrc.match(/filter\[division]=(\d+)/);

      if (!seasonCodeMatch || !divisionMatch) return false;

      const seasonCode = seasonCodeMatch[1];
      const divisionId = divisionMatch[1];

      // Add retry logic
      const MAX_RETRIES = 3;
      let retries = 0;

      while (retries < MAX_RETRIES) {
        let page;
        try {
          // Open a new *page*, not a new browser
          page = await browser.newPage();
          await page.setUserAgent(
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
          );

          const url = `https://gamesheetstats.com/seasons/${seasonCode}/standings?filter%5Bdivision%5D=${divisionId}`;
          console.log("Visiting:", url);

          await page.goto(url, {waitUntil: "networkidle2"});

          // Wait for the element to appear (adjust timeout as needed)
          await page.waitForSelector(".sc-epGxBs.huPBpa.column.teamTitle", {timeout: 30000});

          // 3. Grab the team names from the relevant elements
          /**
           * @type {string[]} teamTitles - Array of team titles from the page.
           * This is executed in the browser context where 'document' is defined.
           */
          const teamTitles = await page.evaluate(() => {
            // eslint-disable-next-line no-undef
            const elements = document.querySelectorAll(".sc-epGxBs.huPBpa.column.teamTitle");
            const titles = [];
            elements.forEach((el) => {
              const lines = el.innerText
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line && line !== "TEAM");
              titles.push(...lines);
            });
            return titles;
          });

          await page.close(); // done with this page

          // Check if "Appleby College" is present
          return teamTitles.includes("Appleby College");
        } catch (error) {
          console.error(`Attempt ${retries + 1} failed for league ${leagueNum}:`, error);
          retries++;

          // Clean up the page if it exists
          if (page) {
            await page.close().catch(() => {});
          }

          if (retries >= MAX_RETRIES) {
            console.error(`Failed after ${MAX_RETRIES} attempts for league ${leagueNum}`);
            return false;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } else {
      // Original method for non-Gamesheet sports
      const response = await axios.request({
        baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
        method: "PUT",
        headers: {"content-type": "application/x-www-form-urlencoded"},
        data: qs.stringify({txtleague: leagueNum}),
      });

      const html = response.data;
      const $ = cheerio.load(html);
      let insport = false;

      $("#standings").each((index, element) => {
        $(element)
            .find("div>table>tbody>tr")
            .each((index, element) => {
              // Skip the header row
              if ($(element).text() !== "TeamsGamesWinLossTiePoints") {
                const text = $(element).text();
                let teamName = "";
                let counter = 0;
                while (counter < text.length && text.charAt(counter) !== "-") {
                  teamName += text.charAt(counter);
                  counter++;
                }
                // Remove trailing characters (e.g., spaces or punctuation)
                teamName = teamName.substring(0, teamName.length - 2);

                // Check if the team name contains "Appleby College"
                if (teamName === "Appleby College") {
                  insport = true;
                }
              }
            });
      });
      return insport;
    }
  } catch (err) {
    console.error("Error in inSport:", err);
    return false;
  }
}

/**
 * parseSports: Scrapes data on each sports league from the website.
 * Returns an array where each element is [sport name, term, league code, isGamesheet].
 * @return {Promise<Array<Array<string|boolean>>>} A promise that resolves to an array of sport data.
 * @async
 */
async function parseSports() {
  let sports = [];
  let browser; // we’ll keep one browser instance

  /**
   * Processes a list of sports for a given season.
   * @param {string} selector - The CSS selector for the option elements.
   * @param {string} seasonName - The name of the season (e.g., "Fall", "Winter", "Spring").
   * @param {object} $ - Cheerio instance for parsing HTML.
   * @param {object} pageBrowser - Puppeteer browser instance.
   * @return {Promise<Array<Array<string|boolean>|null>>} A promise that resolves to an array of sport data for the season.
   * @async
   */
  async function processSeasonList(selector, seasonName, $, pageBrowser) {
    const promises = $(selector)
        .map(async (index, element) => {
          const leagueCode = $(element).val();
          const sportName = $(element).text().trim();

          // Skip the "FALL"/"WINTER"/"SPRING" label
          if (
            sportName.toUpperCase() === "FALL" ||
            sportName.toUpperCase() === "WINTER" ||
            sportName.toUpperCase() === "SPRING"
          ) {
            return null;
          }

          // Check if this league uses Gamesheet
          const sportRecord = Sports.getSportByLeagueCode(leagueCode);
          if (!sportRecord) { // Add a check for sportRecord existence
            console.warn(`Sport record not found for league code: ${leagueCode} in ${seasonName}`);
            return null;
          }
          const usesGamesheet = sportRecord[3];

          // 3. Check if Appleby is in this sport
          const isApplebyInSport = await inSport(
              leagueCode,
              usesGamesheet,
              pageBrowser, // pass the existing browser
          );

          if (isApplebyInSport) {
            return [sportName, seasonName, leagueCode, usesGamesheet];
          }

          return null;
        })
        .get(); // convert Cheerio array to a normal array of Promises

    // Wait for all in this season
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }

  try {
    const response = await axios.request({
      baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
      method: "PUT",
      headers: {"content-type": "application/x-www-form-urlencoded"},
      data: {txtleague: "2860Y8N5D"},
    });
    const html = response.data;
    const $ = cheerio.load(html);

    // Initialize Puppeteer browser instance
    browser = await puppeteer.launch({
      headless: true,
      timeout: 0,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // 3. Process Fall, Winter, Spring in parallel
    const [fallSports, winterSports, springSports] = await Promise.all([
      processSeasonList("#lstFall option", "Fall", $, browser),
      processSeasonList("#lstWinter option", "Winter", $, browser),
      processSeasonList("#lstSpring option", "Spring", $, browser),
    ]);

    // Combine results
    sports = [...fallSports, ...winterSports, ...springSports];
    return sports;
  } catch (err) {
    console.error("Error in parseSports:", err);
    return sports;
  } finally {
    // 4. Close the browser once all leagues are processed
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * parseStandings: Scrapes standings data and returns an array of standings objects.
 * Returns an array of objects, each containing team name, games played, wins, ties, losses, points,
 * table number, sport ID, school ID, and standings code.
 * @param {string} leagueNum - The league number.
 * @param {boolean} usesGamesheet - Whether the sport uses Gamesheet.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<object>>} A promise that resolves to an array of standings objects.
 * @async
 */
async function parseStandings(leagueNum, usesGamesheet, browser) {
  /**
   * Parses standings from the CISAA website (non-Gamesheet).
   * @param {string} leagueNum - The league number.
   * @return {Promise<Array<object>>} A promise that resolves to an array of standings objects.
   * @async
   */
  async function parseCISAAStandings(leagueNum) {
    try {
      const response = await axios.request({
        baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
        method: "PUT",
        headers: {"content-type": "application/x-www-form-urlencoded"},
        data: qs.stringify({txtleague: `${leagueNum}`}),
      });
      const html = response.data;
      const $ = cheerio.load(html);
      const sportID = await leagueNum;

      const standingPromises1 = $("#standingsTable1")
          .find("tr")
          .map(async (index, element) => {
            const rawName = $(element).find(".col1").text().trim();
            let teamName = "";
            let counter = 0;
            while (counter < rawName.length && rawName.charAt(counter) !== "-") {
              teamName += rawName.charAt(counter);
              counter++;
            }
            teamName = teamName.substring(0, teamName.length - 2);
            const gamesPlayed = parseInt($(element).find(".col2").text().trim());
            const wins = parseInt($(element).find(".col3").text().trim());
            const losses = parseInt($(element).find(".col4").text().trim());
            const ties = parseInt($(element).find(".col5").text().trim());
            const points = parseInt($(element).find(".col6").text().trim());
            const schoolID = await getSchoolIDName(teamName);
            const standingsCode = `S_${schoolID}_${sportID}`;

            return new BaseStandings({
              teamName,
              gamesPlayed,
              wins,
              losses,
              ties,
              points,
              tableNum: 1,
              sportId: leagueNum,
              schoolId: schoolID,
              standingsCode,
            });
          })
          .get();

      const standingPromises2 = $("#standingsTable2")
          .find("tr")
          .map(async (index, element) => {
            const rawName = $(element).find(".col1").text().trim();
            let teamName = "";
            let counter = 0;
            while (counter < rawName.length && rawName.charAt(counter) !== "-") {
              teamName += rawName.charAt(counter);
              counter++;
            }
            teamName = teamName.substring(0, teamName.length - 2);
            const gamesPlayed = parseInt($(element).find(".col2").text().trim());
            const wins = parseInt($(element).find(".col3").text().trim());
            const losses = parseInt($(element).find(".col4").text().trim());
            const ties = parseInt($(element).find(".col5").text().trim());
            const points = parseInt($(element).find(".col6").text().trim());
            const schoolID = await getSchoolIDName(teamName);
            const standingsCode = `S_${schoolID}_${sportID}`;

            return new BaseStandings({
              teamName,
              gamesPlayed,
              wins,
              losses,
              ties,
              points,
              tableNum: 2,
              sportId: leagueNum,
              schoolId: schoolID,
              standingsCode,
            });
          })
          .get();

      let standings = await Promise.all(standingPromises1);
      const standings2 = await Promise.all(standingPromises2);
      standings = [...standings, ...standings2].filter((item) => item !== undefined);
      return standings;
    } catch (err) {
      console.error("Error in parseStandings:", err);
      return [];
    }
  }

  if (!usesGamesheet) {
    return parseCISAAStandings(leagueNum);
  }

  // 1) If it’s a GameSheet league, get the season code and division ID from the iframe URL
  const response = await axios.request({
    baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
    method: "PUT",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    data: qs.stringify({txtleague: leagueNum}),
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const iframeSrc = $("iframe[src*=\"gamesheetstats.com/seasons/\"]").attr("src");
  if (!iframeSrc) {
    console.error("No iframe found for league:", leagueNum);
    return [];
  }

  // Extract the season code and division ID from the iframe URL
  const seasonCodeMatch = iframeSrc.match(/seasons\/(\d+)/);
  const divisionMatch = iframeSrc.match(/filter\[division]=(\d+)/);
  if (!seasonCodeMatch || !divisionMatch) {
    console.error("Season code or division ID not found in the iframe URL");
    return [];
  }

  const seasonCode = seasonCodeMatch[1];
  const divisionId = divisionMatch[1];

  // 2) If it’s a GameSheet league, check if a browser was provided
  let localBrowser = browser;
  let createdBrowser = false;

  if (!localBrowser) {
    // No browser was passed => open a new one
    localBrowser = await puppeteer.launch({
      headless: true,
      timeout: 0,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    createdBrowser = true;
  }

  try {
    // Check whether the sport is soccer or hockey
    const sportRecord = Sports.getSportByLeagueCode(leagueNum);
    const sportName = sportRecord[0];
    const isSoccer = sportName.toLowerCase().includes("soccer");
    const isHockey = sportName.toLowerCase().includes("hockey");
    if (!isSoccer && !isHockey) {
      console.error(`Unsupported sport for GameSheet: ${sportName}`);
      return [];
    }

    let standings = [];

    // If it’s soccer, use the soccer-specific scraping function
    if (isSoccer) {
      standings = await parseGameSheetSoccerStandings(seasonCode, divisionId, localBrowser);
    }

    // If it’s hockey, use the hockey-specific scraping function
    if (isHockey) {
      standings = await parseGameSheetHockeyStandings(seasonCode, divisionId, localBrowser);
    }

    // 4) Add missing properties to each standings object
    const processedStandings = await Promise.all(standings.map(async (standing) => {
      const schoolID = await getSchoolIDName(standing.teamName);
      standing.sportId = leagueNum;
      standing.schoolId = schoolID;
      standing.standingsCode = `S_${schoolID}_${leagueNum}`;
      return standing;
    }));
    return processedStandings.filter((item) => item !== undefined);
  } finally {
    // 4) If we created the browser in this function, close it here
    if (createdBrowser && localBrowser) {
      await localBrowser.close();
    }
  }
}

/**
 * parseGames: Scrapes game data for a specific sport and returns an array of Game objects.
 * Returns an array of Game objects.
 * @param {string} leagueNum - The league number.
 * @param {boolean} usesGamesheet - Whether the sport uses Gamesheet.
 * @param {object} browser - A Puppeteer browser instance.
 * @param {string} applebyTeamCode - The team code for Appleby College.
 * @return {Promise<Array<object>>} A promise that resolves to an array of game objects.
 * @async
 */
async function parseGames(leagueNum, usesGamesheet, browser, applebyTeamCode) {
  // Get sport from leagueNum
  const sport = Sports.getSportByLeagueCode(leagueNum);
  if (!sport) {
    console.error(`Sport not found for league number: ${leagueNum}`);
    return [];
  }

  /**
   * Parses games from the CISAA website (non-Gamesheet).
   * @param {string} leagueNum - The league number.
   * @return {Promise<Array<object>>} A promise that resolves to an array of game objects.
   * @async
   */
  async function parseCISAAGames(leagueNum) {
    try {
      const response = await axios.request({
        baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
        method: "PUT",
        headers: {"content-type": "application/x-www-form-urlencoded"},
        data: qs.stringify({txtleague: `${leagueNum}`}),
      });

      const html = response.data;
      const $ = cheerio.load(html);
      const sportId = await getSportID(leagueNum);
      const gamePromises = $("#scheduleTable tr")
          .map(async (index, element) => {
            const $tdElements = $(element).find("td");
            let date = $tdElements.eq(0).text().trim().substring(4, 10);
            const targetMonth = date.split(" ")[0];
            const targetDay = date.split(" ")[1];
            const targetMonthIndex = getMonthIndex(targetMonth);
            const today = new Date();
            const month = today.getMonth() + 1;
            let year = today.getFullYear();
            if (month >= 9) {
              year++;
            }
            if (targetMonthIndex >= 9) {
              year--;
            }
            const stringTargetMonthIndex = targetMonthIndex > 9 ? targetMonthIndex.toString() : `0${targetMonthIndex}`;
            date = `${year}-${stringTargetMonthIndex}-${targetDay}`;
            let time = $tdElements.eq(1).text().trim();
            time = time.substring(6, 7) === "a" ? time.substring(0, 6) + "AM" : time.substring(0, 6) + "PM";
            time = time.charAt(0) === "0" ? time.substring(1, 8) : time.substring(0, 8);

            const rawHomeAbbr = $tdElements.eq(2).text().trim();
            const homeAbbrMatch = rawHomeAbbr.match(/^([A-Z]+)/);
            // Use matched uppercase prefix or the original raw text if no match (e.g. for non-standard abbreviations)
            const homeAbbr = homeAbbrMatch ? homeAbbrMatch[1] : rawHomeAbbr.split("-")[0].trim();

            const homeScore = $tdElements.eq(3).text().trim();

            const rawAwayAbbr = $tdElements.eq(4).text().trim();
            const awayAbbrMatch = rawAwayAbbr.match(/^([A-Z]+)/);
            // Use matched uppercase prefix or the original raw text if no match
            const awayAbbr = awayAbbrMatch ? awayAbbrMatch[1] : rawAwayAbbr.split("-")[0].trim();

            const awayScore = $tdElements.eq(5).text().trim();
            if (homeAbbr === "AC" || awayAbbr === "AC") {
              const homeId = await getSchoolIDAbbrev(homeAbbr);
              const awayId = await getSchoolIDAbbrev(awayAbbr);

              // Get full team names from Schools model using abbreviations
              const homeSchool = Schools.getSchoolByAbbreviation(homeAbbr);
              const awaySchool = Schools.getSchoolByAbbreviation(awayAbbr);

              // Check if homeSchool and awaySchool are not null
              if (!homeSchool || !awaySchool) {
                console.error(`School not found for abbreviation: ${homeAbbr} or ${awayAbbr} in ${leagueNum}`);
                return undefined;
              }

              const homeTeam = homeSchool.school_name;
              const awayTeam = awaySchool.school_name;

              // Create a Game instance.
              const game = new BaseGame({
                homeTeam: homeTeam,
                homeAbbr: homeAbbr,
                homeLogo: homeSchool.logo_dir,
                awayTeam: awayTeam,
                awayAbbr: awayAbbr,
                awayLogo: awaySchool.logo_dir,
                homeScore: homeScore,
                awayScore: awayScore,
                gameDate: new Date(date),
                gameTime: time,
                sportsName: sport[0],
                term: sport[1],
                leagueCode: leagueNum,
                gameCode: `G_${homeId}_${awayId}_${date.replace(/-/g, "_")}_${sportId}`,
              });
              return game.toMap();
            }
          })
          .get();
      const games = await Promise.all(gamePromises);
      return games.filter((item) => item !== undefined);
    } catch (err) {
      console.error("Error in parseGames:", err);
      return [];
    }
  }

  if (!usesGamesheet) {
    return parseCISAAGames(leagueNum);
  }

  // 1) If it’s a GameSheet league, get the season code and division ID from the iframe URL
  const response = await axios.request({
    baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
    method: "PUT",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    data: qs.stringify({txtleague: leagueNum}),
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const iframeSrc = $("iframe[src*=\"gamesheetstats.com/seasons/\"]").attr("src");
  if (!iframeSrc) {
    console.error("No iframe found for league:", leagueNum);
    return [];
  }

  // Extract the season code and division ID from the iframe URL
  const seasonCodeMatch = iframeSrc.match(/seasons\/(\d+)/);
  const divisionMatch = iframeSrc.match(/filter\[division]=(\d+)/);
  if (!seasonCodeMatch || !divisionMatch) {
    console.error("Season code or division ID not found in the iframe URL");
    return [];
  }

  const seasonCode = seasonCodeMatch[1];
  const divisionId = divisionMatch[1];

  // If it’s a GameSheet league, check if a browser was provided
  let localBrowser = browser;
  let createdBrowser = false;

  if (!localBrowser) {
    // No browser was passed => open a new one
    localBrowser = await puppeteer.launch({
      headless: true,
      timeout: 0,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    createdBrowser = true;
  }

  try {
    // get gameids from gamesheet
    const gameIds = await parseGameIDs(seasonCode, divisionId, applebyTeamCode, localBrowser);
    console.log("Unique Game IDs:", gameIds);

    if (gameIds && gameIds.length > 0) {
      // Get games from GameSheet
      const games = await parseGameSheetGames(seasonCode, gameIds, localBrowser);

      if (games && games.length > 0) {
        // Get sport information from current context
        const sportId = await getSportID(leagueNum);

        // Enhance each game with the missing data
        const enhancedGames = await Promise.all(games.map(async (game) => {
          // Find schools by matching names
          const homeSchoolId = await getSchoolIDName(game.homeTeam);
          const awaySchoolId = await getSchoolIDName(game.awayTeam);

          // Get school objects
          const homeSchool = Schools.getSchoolById(homeSchoolId);
          const awaySchool = Schools.getSchoolById(awaySchoolId);

          // Update game with additional information
          game.sportsId = sportId;
          game.sportsName = sport[0]; // Sport name
          game.term = sport[1]; // Term (Fall/Winter/Spring)
          game.leagueCode = leagueNum; // League code
          game.gsSeasonCode = seasonCode;
          game.gsDivisionCode = divisionId;

          // Convert Date to YYYY_MM_DD format & Generate a unique game code
          const dateStr = game.gameDate.toISOString().split("T")[0].replace(/-/g, "_");
          game.gameCode = `G_${homeSchoolId}_${awaySchoolId}_${dateStr}_${sportId}`;

          // Add school information if found
          if (homeSchool) {
            game.homeAbbr = homeSchool.abbreviation;
            game.homeLogo = homeSchool.logo_dir;
          }

          if (awaySchool) {
            game.awayAbbr = awaySchool.abbreviation;
            game.awayLogo = awaySchool.logo_dir;
          }

          return game.toMap(); // Convert to map format for consistency
        }));

        console.log(enhancedGames);

        return enhancedGames.filter((item) => item !== undefined);
      }
    }

    return [];
  } finally {
    // 4) If we created the browser in this function, close it here
    if (createdBrowser && localBrowser) {
      await localBrowser.close();
    }
  }
}

/**
 * parseRoster: Scrapes roster data for a specific sport and returns an array of Roster objects.
 * @param {string} leagueNum - The league number.
 * @param {boolean} usesGamesheet - Whether the sport uses Gamesheet.
 * @param {object} browser - A Puppeteer browser instance.
 * @param {string} applebyTeamCode - The team code for Appleby College.
 * @return {Promise<Array<object>>} A promise that resolves to an array of roster objects.
 * @async
 */
async function parseRoster(leagueNum, usesGamesheet, browser, applebyTeamCode) {
  // Get sport from leagueNum
  const sport = Sports.getSportByLeagueCode(leagueNum);
  if (!sport) {
    console.error(`Sport not found for league number: ${leagueNum}`);
    return [];
  }

  // 1) If it’s a GameSheet league, get the season code and division ID from the iframe URL
  const response = await axios.request({
    baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
    method: "PUT",
    headers: {"content-type": "application/x-www-form-urlencoded"},
    data: qs.stringify({txtleague: leagueNum}),
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const iframeSrc = $("iframe[src*=\"gamesheetstats.com/seasons/\"]").attr("src");
  if (!iframeSrc) {
    console.error("No iframe found for league:", leagueNum);
    return [];
  }

  // Extract the season code and division ID from the iframe URL
  const seasonCodeMatch = iframeSrc.match(/seasons\/(\d+)/);
  const divisionMatch = iframeSrc.match(/filter\[division]=(\d+)/);
  if (!seasonCodeMatch || !divisionMatch) {
    console.error("Season code or division ID not found in the iframe URL");
    return [];
  }

  const seasonCode = seasonCodeMatch[1];
  const divisionId = divisionMatch[1];

  // 2) If it’s a GameSheet league, check if a browser was provided
  let localBrowser = browser;
  let createdBrowser = false;

  if (!localBrowser) {
    // No browser was passed => open a new one
    localBrowser = await puppeteer.launch({
      headless: true,
      timeout: 0,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    createdBrowser = true;
  }

  try {
    // Check whether the sport is soccer or hockey
    const sportRecord = Sports.getSportByLeagueCode(leagueNum);
    const sportName = sportRecord[0];
    const isSoccer = sportName.toLowerCase().includes("soccer");
    const isHockey = sportName.toLowerCase().includes("hockey");
    if (!isSoccer && !isHockey) {
      console.error(`Unsupported sport for GameSheet: ${sportName}`);
      return [];
    }

    let standings = [];

    // If it’s soccer, use the soccer-specific scraping function
    if (isSoccer) {
      standings = await parseGameSheetSoccerRoster(seasonCode, divisionId, applebyTeamCode, localBrowser);
    }

    // If it’s hockey, use the hockey-specific scraping function
    if (isHockey) {
      standings = await parseGameSheetHockeyRoster(seasonCode, divisionId, applebyTeamCode, localBrowser);
    }

    return standings;
  } finally {
    // 4) If we created the browser in this function, close it here
    if (createdBrowser && localBrowser) {
      await localBrowser.close();
    }
  }
}

module.exports = {
  getSchoolIDName,
  inSport,
  parseSports,
  parseStandings,
  parseGames,
  parseRoster,
};

