const {HockeyStandings, SoccerStandings} = require("./models/StandingsClasses.js");
const {GamesheetGame} = require("./models/GameClasses.js");
const {Goal} = require("./models/goal.js");
const {HockeyGK, HockeyPlayer, SoccerGK, SoccerPlayer} = require("./models/RosterClasses.js");

/**
 * Parses soccer standings from Gamesheet.
 * @param {string} seasonCode - The season code.
 * @param {string} divisionId - The division ID.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<SoccerStandings>>} A promise that resolves to an array of SoccerStandings objects.
 * @async
 */
async function parseGameSheetSoccerStandings(seasonCode, divisionId, browser) {
  let page;
  try {
    // Open a new page using the provided browser
    page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );

    const url = `https://gamesheetstats.com/seasons/${seasonCode}/standings?filter%5Bdivision%5D=${divisionId}`;
    console.log("Visiting:", url);
    await page.goto(url, {waitUntil: "networkidle2"});

    // Wait for the standings table element to appear
    await page.waitForSelector(".sc-VILhF.jDQCGM.gs-table", {timeout: 20000});

    // Extract raw standings data from the page
    const rawStandings = await page.evaluate(() => {
      const standings = [];

      // Determine the number of rows based on team entries in the fixed "teamTitle" column
      // eslint-disable-next-line no-undef
      const teamTitleColumn = document.querySelector(".sc-ciFqri.iwAFeO.fixed-cols .sc-epGxBs.huPBpa.column.teamTitle");
      if (!teamTitleColumn) return []; // Should not happen if waitForSelector passed
      // eslint-disable-next-line no-undef
      const teamRows = teamTitleColumn.querySelectorAll(".sc-jSJJpv.jEiWSF.row-header");
      const numRows = teamRows.length;

      // Helper: Given a column class and row index, return the trimmed innerText from flexible columns
      const getValue = (colClass, rowIndex) => {
        // eslint-disable-next-line no-undef
        const cell = document.querySelector(
            // eslint-disable-next-line no-undef
            `.sc-jtazNH.iZOrPG.flexible-cols .sc-epGxBs.huPBpa.column.${colClass} .sc-edaYAx.hxntdf.cell.row-${rowIndex} .data`,
        );
        return cell ? cell.innerText.trim() : null;
      };

      for (let i = 0; i < numRows; i++) {
        // Extract team name and link from the fixed "teamTitle" column
        let teamName = null;
        let gamesheetTeamId = null;
        // eslint-disable-next-line no-undef
        const teamCellFixed = document.querySelector(
            // eslint-disable-next-line no-undef
            `.sc-ciFqri.iwAFeO.fixed-cols .sc-epGxBs.huPBpa.column.teamTitle .sc-jSJJpv.jEiWSF.row-header.row-${i} .data`,
        );
        if (teamCellFixed) {
          // eslint-disable-next-line no-undef
          const linkEl = teamCellFixed.querySelector(".team-title a");
          if (linkEl) {
            teamName = linkEl.innerText.trim();
            // Extract the team id from the URL (e.g., "/seasons/7055/teams/275883?filter%5Bdivision%5D=41187")
            const match = linkEl.href.match(/\/teams\/(\d+)/);
            if (match) {
              gamesheetTeamId = match[1];
            }
          }
        }

        // Extract flexible columns data
        const parseNum = (val) => (val ? parseFloat(val) : null);
        const gamesPlayed = parseNum(getValue("gp", i));
        const wins = parseNum(getValue("w", i));
        const ties = parseNum(getValue("t", i));
        const losses = parseNum(getValue("l", i));
        const points = parseNum(getValue("pts", i));
        const pointsPercentage = parseNum(getValue("ppct", i)); // P% column
        const yellowCards = parseNum(getValue("yc", i));
        const redCards = parseNum(getValue("rc", i));
        const goalsFor = parseNum(getValue("gf", i));
        const goalsAgainst = parseNum(getValue("ga", i));
        const goalDifference = parseNum(getValue("diff", i));

        if (teamName) { // Only add if a team name was found
          standings.push({
            teamName,
            gamesPlayed,
            wins,
            losses,
            ties,
            points,
            goalsFor,
            goalsAgainst,
            goalDifference,
            pointsPercentage,
            yellowCards,
            redCards,
            gamesheetTeamId,
          });
        }
      }
      return standings;
    });

    // Map raw data into SoccerStandings objects.
    // (Update sportId, schoolId, and standingsCode as needed.)
    return rawStandings.map((obj) => new SoccerStandings({
      teamName: obj.teamName,
      gamesPlayed: obj.gamesPlayed,
      wins: obj.wins,
      losses: obj.losses,
      ties: obj.ties,
      points: obj.points,
      tableNum: 3, // default for soccer standings
      sportId: null,
      schoolId: null,
      standingsCode: null,
      goalsFor: obj.goalsFor,
      goalsAgainst: obj.goalsAgainst,
      goalDifference: obj.goalDifference,
      pointsPercentage: obj.pointsPercentage,
      yellowCards: obj.yellowCards,
      redCards: obj.redCards,
      gamesheetTeamId: obj.gamesheetTeamId,
    }));
  } catch (error) {
    console.error("Error in parseGameSheetSoccerStandings:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Parses hockey standings from Gamesheet.
 * @param {string} seasonCode - The season code.
 * @param {string} divisionId - The division ID.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<HockeyStandings>>} A promise that resolves to an array of HockeyStandings objects.
 * @async
 */
async function parseGameSheetHockeyStandings(seasonCode, divisionId, browser) {
  let page;
  try {
    // Open a new page using the provided browser
    page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );

    const url = `https://gamesheetstats.com/seasons/${seasonCode}/standings?filter%5Bdivision%5D=${divisionId}`;
    console.log("Visiting:", url);
    await page.goto(url, {waitUntil: "networkidle2"});

    // Wait for the standings table element to appear
    await page.waitForSelector(".sc-VILhF.jDQCGM.gs-table", {timeout: 20000}); // Updated main table selector

    // Extract raw standings data from the page
    const rawStandings = await page.evaluate(() => {
      const standings = [];
      // Determine the number of rows based on team entries in the fixed "teamTitle" column
      // eslint-disable-next-line no-undef
      const teamTitleColumn = document.querySelector(".sc-ciFqri.iwAFeO.fixed-cols .sc-epGxBs.huPBpa.column.teamTitle");
      if (!teamTitleColumn) return [];
      // eslint-disable-next-line no-undef
      const teamRows = teamTitleColumn.querySelectorAll(".sc-jSJJpv.jEiWSF.row-header");
      const numRows = teamRows.length;

      // Helper: Given a column class and a row index, return the trimmed innerText from flexible columns
      const getValue = (colClass, rowIndex) => {
        // eslint-disable-next-line no-undef
        const cell = document.querySelector(
            // eslint-disable-next-line no-undef
            `.sc-jtazNH.iZOrPG.flexible-cols .sc-epGxBs.huPBpa.column.${colClass} .sc-edaYAx.hxntdf.cell.row-${rowIndex} .data`,
        );
        return cell ? cell.innerText.trim() : null;
      };

      for (let i = 0; i < numRows; i++) {
        let teamName = null;
        let gamesheetTeamId = null;
        // Extract team name and team URL from the fixed "teamTitle" column
        // eslint-disable-next-line no-undef
        const teamCellFixed = document.querySelector(
            // eslint-disable-next-line no-undef
            `.sc-ciFqri.iwAFeO.fixed-cols .sc-epGxBs.huPBpa.column.teamTitle .sc-jSJJpv.jEiWSF.row-header.row-${i} .data`,
        );
        if (teamCellFixed) {
          // eslint-disable-next-line no-undef
          const linkEl = teamCellFixed.querySelector(".team-title a");
          if (linkEl) {
            teamName = linkEl.innerText.trim();
            // Extract the team ID from the URL, e.g. "/seasons/7974/teams/305372?filter%5Bdivision%5D=45988"
            const match = linkEl.href.match(/\/teams\/(\d+)/);
            if (match) {
              gamesheetTeamId = match[1];
            }
          }
        }

        // Base fields (assumed numeric, converted via parseFloat)
        const gamesPlayed = getValue("gp", i) ? parseFloat(getValue("gp", i)) : null;
        const wins = getValue("w", i) ? parseFloat(getValue("w", i)) : null;
        const losses = getValue("l", i) ? parseFloat(getValue("l", i)) : null;
        const ties = getValue("t", i) ? parseFloat(getValue("t", i)) : null;
        const points = getValue("pts", i) ? parseFloat(getValue("pts", i)) : null;

        // Hockey-specific fields:
        const overtimeWins = getValue("otw", i) ? parseFloat(getValue("otw", i)) : null;
        const overtimeLosses = getValue("otl", i) ? parseFloat(getValue("otl", i)) : null;
        const pointsPercentage = getValue("ppct", i) ? parseFloat(getValue("ppct", i)) : null;
        const goalsFor = getValue("gf", i) ? parseFloat(getValue("gf", i)) : null;
        const goalsAgainst = getValue("ga", i) ? parseFloat(getValue("ga", i)) : null;
        const goalDifference = getValue("diff", i) ? parseFloat(getValue("diff", i)) : null;
        // Use the columns "ppg" and "ppga" for power play goals data
        const powerPlayGoals = getValue("ppg", i) ? parseFloat(getValue("ppg", i)) : null;
        const powerPlayGoalsAgainst = getValue("ppga", i) ? parseFloat(getValue("ppga", i)) : null;
        const shortHandedGoals = getValue("shg", i) ? parseFloat(getValue("shg", i)) : null;
        const penaltyMinutes = getValue("pim", i) ? parseFloat(getValue("pim", i)) : null;

        standings.push({
          teamName,
          gamesPlayed,
          wins,
          losses,
          ties,
          points,
          overtimeWins,
          overtimeLosses,
          pointsPercentage,
          goalsFor,
          goalsAgainst,
          goalDifference,
          powerPlayGoals,
          powerPlayGoalsAgainst,
          shortHandedGoals,
          penaltyMinutes,
          gamesheetTeamId,
        });
      }
      return standings;
    });

    // Map the raw data into HockeyStandings objects.
    // (Here sportId, schoolId, and standingsCode are left as null for now—you can set them as needed.)
    return rawStandings.map((obj) => new HockeyStandings({
      teamName: obj.teamName,
      gamesPlayed: obj.gamesPlayed,
      wins: obj.wins,
      losses: obj.losses,
      ties: obj.ties,
      points: obj.points,
      tableNum: 4, // Default for hockey standings
      sportId: null,
      schoolId: null,
      standingsCode: null,
      overtimeWins: obj.overtimeWins,
      overtimeLosses: obj.overtimeLosses,
      goalsFor: obj.goalsFor,
      goalsAgainst: obj.goalsAgainst,
      goalDifference: obj.goalDifference,
      pointsPercentage: obj.pointsPercentage,
      penaltyMinutes: obj.penaltyMinutes,
      powerPlayGoals: obj.powerPlayGoals,
      powerPlayGoalsAgainst: obj.powerPlayGoalsAgainst,
      shortHandedGoals: obj.shortHandedGoals,
      gamesheetTeamId: obj.gamesheetTeamId,
    }));
  } catch (error) {
    console.error("Error in parseGameSheetHockeyStandings:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Parses game IDs for a specific team and division from Gamesheet.
 * @param {string} seasonCode - The season code.
 * @param {string} divisionId - The division ID.
 * @param {string} applebyTeamCode - The Gamesheet team code for Appleby College.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<string>>} A promise that resolves to an array of unique game IDs.
 * @async
 */
async function parseGameIDs(seasonCode, divisionId, applebyTeamCode, browser) {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );

    const url = `https://gamesheetstats.com/seasons/${seasonCode}/teams/${applebyTeamCode}/schedule?filter%5Bdivision%5D=${divisionId}`;
    console.log("Visiting:", url);
    await page.goto(url, {waitUntil: "networkidle2"});

    // Wait for the standings table element to appear
    await page.waitForSelector(".sc-epGxBs.huPBpa.column.visitor", {timeout: 20000});

    // Extract game IDs from the page
    const gameIds = await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const links = document.querySelectorAll("a[href*=\"/games/\"]");
      // Convert NodeList to array and extract the numeric gameId via regex
      return Array.from(links).map((link) => {
        const match = link.href.match(/\/games\/(\d+)/);
        return match ? match[1] : null;
      }).filter(Boolean); // remove nulls
    });

    // Deduplicate game IDs and return
    return [...new Set(gameIds)];
  } catch (error) {
    console.error("Error in parseGameIDs:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Parses game data from Gamesheet for a list of game IDs.
 * @param {string} seasonCode - The season code.
 * @param {Array<string>} gameIds - An array of game IDs.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<GamesheetGame>>} A promise that resolves to an array of GamesheetGame objects.
 * @async
 */
async function parseGameSheetGames(seasonCode, gameIds, browser) {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );

    // Loop through each gameId and visit the corresponding page
    const games = [];
    const MAX_RETRIES = 3;

    for (const gameId of gameIds) {
      let retries = 0;
      let gameData;
      let goalObjects = [];

      while (retries < MAX_RETRIES) {
        try {
          const url = `https://gamesheetstats.com/seasons/${seasonCode}/games/${gameId}`;
          console.log(`[parseGameSheetGames] Visiting: ${url} (Attempt ${retries + 1})`);
          await page.goto(url, {waitUntil: "networkidle2"});

          // Wait for the scores element to appear
          await page.waitForSelector("[data-testid=\"boxscore-game-score\"]", {timeout: 30000});

          gameData = await page.evaluate(() => {
            // Extract the game data from the page
            // eslint-disable-next-line no-undef
            const gameEl = document.querySelector("[data-testid=\"boxscore-container\"]");

            // Check if the game is scheduled
            const gameStatus = gameEl.querySelector("[data-testid=\"game-status-text\"]")?.textContent.toLowerCase() || "";

            // For teams:
            const homeTeam = gameEl.querySelector("[data-testid=\"home-title\"]")?.textContent || "";
            const awayTeam = gameEl.querySelector("[data-testid=\"visitor-title\"]")?.textContent || "";

            // For scores:
            let homeScore = gameEl.querySelector("[data-testid=\"home-score\"]")?.textContent.split("SOG:")[0].trim() || "";
            let awayScore = gameEl.querySelector("[data-testid=\"visitor-score\"]")?.textContent.split("SOG:")[0].trim() || "";

            // If the game is scheduled, leave scores as null.
            if (gameStatus.includes("scheduled")) {
              homeScore = "";
              awayScore = "";
            }

            // For game type:
            const gameType = gameEl.querySelector("[data-testid=\"game-type\"]")?.textContent || "";
            // For date and time:
            const gameDateTime = gameEl.querySelector("[data-testid=\"game-date-time\"]")?.textContent || "";

            // Split the string on ', ' to separate the parts
            const parts = gameDateTime.split(", "); // ["Sep 25", "2024", "4:02 PM"]

            // Combine the first two parts to form the date portion
            const datePortion = `${parts[0]}, ${parts[1]}`; // "Sep 25, 2024"

            // The time remains as a string
            const timePortion = parts[2]; // "4:02 PM"

            // Create a Date object from the date portion (time will default to midnight)
            const gameDate = new Date(datePortion);

            return {
              homeScore,
              awayScore,
              homeTeam,
              awayTeam,
              gameStatus,
              gameDateTime,
              gameDate,
              gameType,
              datePortion,
              timePortion,
            };
          });

          // Goal extraction logic
          if (gameData.gameStatus.includes("scheduled")) {
            console.log(`[parseGameSheetGames] Game ${gameId} is scheduled, skipping goal extraction.`);
          } else {
            if (gameData.homeScore === "0" && gameData.awayScore === "0") {
              console.log(`[parseGameSheetGames] Game ${gameId} is goalless, skipping goal extraction.`);
            } else {
              try {
                await page.waitForSelector("[data-testid^=\"goal-event-\"]", {timeout: 30000});
                const goalsData = await page.evaluate(() => {
                  // eslint-disable-next-line no-undef
                  const gameStatus = document.querySelector("[data-testid=\"boxscore-game-status-bar\"]")?.textContent.toLowerCase() || "";

                  // If the game is scheduled, return an empty array for goals.
                  if (gameStatus.includes("scheduled")) {
                    console.log("Game is scheduled, no goals to extract.");
                    return [];
                  }

                  /**
                   * Extracts the player name from a string containing jersey number and name.
                   * @param {string} fullText - The full text (e.g., "#10 John Doe (1)").
                   * @return {string} The extracted player name.
                   */
                  function extractName(fullText) {
                    // Remove the leading '#' and number, then remove trailing ' (1)' or similar.
                    return fullText
                        .replace(/^#\d+\s+/, "") // remove leading number with '#' and spaces
                        .replace(/\s+\(\d+\)$/, "") // remove trailing space, parenthesis, and number
                        .trim();
                  }

                  // Array to hold raw goal objects.
                  const goals = [];

                  // Select each period container (e.g. "goal-by-period-1ST Half" or "goal-by-period-1ST Period")
                  // eslint-disable-next-line no-undef
                  const periodContainers = Array.from(
                      // eslint-disable-next-line no-undef
                      document.querySelectorAll("[data-testid^=\"goal-by-period-\"]"),
                  );
                  if (!periodContainers.length) {
                    console.log("No goal containers found. Goals extraction skipped.");
                    return [];
                  }

                  periodContainers.forEach((container) => {
                    // Extract period label. It might be found inside an element with data-testid like:
                    // "goal-period-header-1ST Half" or "goal-period-header-1ST Period"
                    // eslint-disable-next-line no-undef
                    const periodHeaderEl = container.querySelector("[data-testid^=\"goal-period-header-\"]");
                    // If not found, you might also consider using the container's own data-testid.
                    const period = periodHeaderEl ? periodHeaderEl.innerText.trim() : "";

                    // Select each goal event inside this container.
                    // eslint-disable-next-line no-undef
                    const goalNodes = Array.from(
                        container.querySelectorAll("[data-testid^=\"goal-event-\"]"),
                    );

                    goalNodes.forEach((goalNode) => {
                      // Extract the minute scored from the time element.
                      // eslint-disable-next-line no-undef
                      const timeEl = goalNode.querySelector("[data-testid^=\"goal-event-time-\"] span");
                      const minuteScored = timeEl ? timeEl.innerText.trim() : "";
                      console.log(minuteScored);

                      // Extract the team name from the goal data team element.
                      // eslint-disable-next-line no-undef
                      const teamEl = goalNode.querySelector("[data-testid^=\"goal-data-team-\"] span");
                      const teamName = teamEl ? teamEl.innerText.trim() : "";
                      console.log(teamName);

                      // Extract the scorer from the goal data title element.
                      // eslint-disable-next-line no-undef
                      const scorerEl = goalNode.querySelector("[data-testid^=\"goal-data-title-\"] span");
                      const scorer = scorerEl ? scorerEl.innerText.trim() : "";
                      const scorerName = extractName(scorer);
                      console.log(scorerName);

                      // Extract the assist information (if any).
                      // eslint-disable-next-line no-undef
                      const assistEl = goalNode.querySelector("[data-testid^=\"goal-data-assists-\"]");
                      const assistText = assistEl ? assistEl.innerText.trim() : "";
                      let assister;
                      let preAssister = "";

                      // If there is more than one "#" in the assistText then split assists
                      if ((assistText.match(/#/g) || []).length > 1) {
                        // Split the string by the "#digits" pattern
                        const assistParts = assistText.split(/#\d+\s+/).filter((item) => item.trim() !== "");
                        assister = extractName(assistParts[0]);
                        preAssister = assistParts.length > 1 ? extractName(assistParts[1]) : "";
                      } else {
                        // Only a single assist is present
                        assister = extractName(assistText);
                      }

                      // Only push if we have meaningful data in at least one of the fields
                      if (teamName && scorerName) {
                        goals.push({
                          teamName,
                          minuteScored,
                          period, // Make sure 'period' is defined elsewhere in your code
                          scorer: scorerName,
                          assister,
                          preAssister,
                        });
                      }
                    });
                  });

                  return goals;
                });
                goalObjects = goalsData.map((goalData) => new Goal(goalData));
              } catch (goalError) {
                console.warn(`[parseGameSheetGames] Game ${gameId}: Error waiting for or parsing goals (Attempt ${retries + 1}):`, goalError.message);
              }
            }
          }
          break; // Success, exit retry loop
        } catch (error) {
          console.error(`[parseGameSheetGames] Error processing game ${gameId} (Attempt ${retries + 1}):`, error.message);
          retries++;
          if (retries >= MAX_RETRIES) {
            console.error(`[parseGameSheetGames] Failed to process game ${gameId} after ${MAX_RETRIES} attempts.`);
            gameData = null; // Ensure gameData is null if all retries fail
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
        }
      }

      if (!gameData) {
        continue; // Skip to the next gameId if this one failed
      }

      // Create the Date object in the Node.js context
      const gameDate = new Date(gameData.datePortion + " " + gameData.timePortion);

      // Create game object with available data, null for fields to be filled later
      const game = new GamesheetGame({
        homeTeam: gameData.homeTeam,
        awayTeam: gameData.awayTeam,
        homeScore: gameData.homeScore,
        awayScore: gameData.awayScore,
        gameDate: gameDate,
        gameTime: gameData.timePortion,
        gameId: gameId,

        // Fields to be filled later - set to null/empty
        homeAbbr: null,
        homeLogo: null,
        awayAbbr: null,
        awayLogo: null,
        sportsName: null,
        term: null,
        leagueCode: null,
        gsSeasonCode: null,
        gsDivisionCode: null,
        gameCode: null,

        // GameSheet-specific fields
        gameType: gameData.gameType,
        goals: goalObjects,
        link:
        `https://gamesheetstats.com/seasons/${seasonCode}/games/${gameId}?configuration%5Bprimary-colour%5D=FCFFF9&configuration%5Bsecondary-colour%5D=034265`,
      });

      games.push(game);
    }

    return games;
  } catch (error) {
    console.error("Error in parseGameSheetGames:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Parses soccer roster data from Gamesheet.
 * @param {string} seasonCode - The season code.
 * @param {string} gameIds - The game IDs
 * (note: this parameter seems to be misnamed, it's likely divisionId or similar based on usage elsewhere, but keeping as is based on provided code).
 * @param {string} teamCode - The Gamesheet team code.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<SoccerPlayer|SoccerGK>>} A promise that resolves to an array of soccer player/goalkeeper objects.
 * @async
 */
async function parseGameSheetSoccerRoster(seasonCode, gameIds, teamCode, browser) {
  let page;
  try {
    // Open a new page using the provided browser
    page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );

    const url = `https://gamesheetstats.com/seasons/${seasonCode}/teams/${teamCode}/roster`;
    console.log(`[parseGameSheetSoccerRoster] Visiting: ${url}`);

    const MAX_RETRIES = 3;
    let retries = 0;
    let roster;

    while (retries < MAX_RETRIES) {
      try {
        await page.goto(url, {waitUntil: "networkidle2"});
        // Wait for the table element to appear
        await page.waitForSelector(".sc-VILhF.jDQCGM.gs-table", {timeout: 30000});

        roster = await page.evaluate(() => {
          const out = [];
          // eslint-disable-next-line no-undef
          const tables = document.querySelectorAll(".sc-VILhF.jDQCGM.gs-table");
          tables.forEach((table, tableIndex) => {
            // eslint-disable-next-line no-undef
            const rows = table.querySelectorAll(".column.number .row-header");
            rows.forEach((_, idx) => {
              const getValue = (cls) =>
                // eslint-disable-next-line no-undef
                table.querySelector(`.column.${cls} .row-${idx} .data`)?.innerText.trim() ?? null;

              // eslint-disable-next-line no-undef
              const a = table.querySelector(`.column.name .row-${idx} .data a`);
              out.push({
                number: getValue("number"),
                position: tableIndex === 1 ? "GK" : getValue("position"),
                name: a?.innerText.trim() ?? null,
                link: a ? a.href : null,
              });
            });
          });
          return out.filter((r) => r.name);
        });
        break; // Success
      } catch (error) {
        console.error(`[parseGameSheetSoccerRoster] Error fetching roster page (Attempt ${retries + 1}):`, error.message);
        retries++;
        if (retries >= MAX_RETRIES) {
          console.error(`[parseGameSheetSoccerRoster] Failed to fetch roster page after ${MAX_RETRIES} attempts.`);
          if (page) await page.close();
          return []; // Return empty if all retries fail
        }
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
      }
    }

    if (!roster) { // Should not happen if break was hit, but as a safeguard
      if (page) await page.close();
      return [];
    }

    // 2) now visit each player page and pull the TOTAL row
    const players = [];
    for (const row of roster) {
      const playerPage = await browser.newPage();
      await playerPage.goto(row.link, {waitUntil: "networkidle2"});

      const stats = await playerPage.evaluate(() => {
        // find the index of the “Total” row
        // eslint-disable-next-line no-undef
        const seasons = Array.from(
            // eslint-disable-next-line no-undef
            document.querySelectorAll(".column.season .row-header .data span"),
        );
        const ti = seasons.findIndex((s) => s.textContent.trim() === "Total");
        if (ti < 0) return null;

        // helper to pull any column
        const getVal = (cls) =>
          // eslint-disable-next-line no-undef
          document
              .querySelector(`.column.${cls} .row-${ti} .data span`)
              ?.textContent.trim() ?? null;

        return {
          gp: getVal("gp"),
          g: getVal("g"),
          a: getVal("a"),
          pts: getVal("pts"),
          yc: getVal("yc"), // yellow cards
          rc: getVal("rc"), // red cards

          // goalie‐only stats (we’ll ignore them on skaters)
          gs: getVal("gs"),
          sa: getVal("sa"),
          ga: getVal("ga"),
          gaa: getVal("gaa"), // already on page
          svpct: getVal("svpct"),
          so: getVal("so"),
          min: getVal("min"),
        };
      });

      await playerPage.close();
      if (!stats) continue;

      // pull numeric ID out of the URL
      const m = row.link.match(/\/(?:players|goalies)\/(\d+)/);
      const playerId = m ? m[1] : "";

      // common base fields
      const base = {
        teamName: "Appleby College", // or pass in dynamically
        playerId,
        seasonCode,
        jerseyNumber: row.number,
        playerName: row.name,
        playerPosition: row.position,
        gamesPlayed: parseInt(stats.gp, 10) || 0,
        goals: parseInt(stats.g, 10) || 0,
        assists: parseInt(stats.a, 10) || 0,
        link: row.link,
      };

      if (row.position === "GK") {
        // goalie
        players.push(new SoccerGK({
          ...base,
          shotsAgainst: parseInt(stats.sa, 10) || 0,
          goalsAgainst: parseInt(stats.ga, 10) || 0,
          goalsAgainstAverage: parseFloat(stats.gaa) || 0,
          shutouts: parseInt(stats.so, 10) || 0,
          minutesPlayed: parseInt(stats.min, 10) || 0,
          // you can also carry forwards YC/RC if desired:
          yellowCards: parseInt(stats.yc, 10) || 0,
          redCards: parseInt(stats.rc, 10) || 0,
        }));
      } else {
        // skater
        players.push(new SoccerPlayer({
          ...base,
          yellowCards: parseInt(stats.yc, 10) || 0,
          redCards: parseInt(stats.rc, 10) || 0,
          // if you like, you can also carry total pts in a custom field:
          // points:      parseInt(stats.pts, 10) || 0,
        }));
      }
    }

    return players;
  } catch (err) {
    console.error(`Error in parseGameSheetRoster (${seasonCode}):`, err);
    return [];
  } finally {
    if (page) await page.close();
  }
}

/**
 * Parses hockey roster data from Gamesheet.
 * @param {string} seasonCode - The season code.
 * @param {string} gameIds - The game IDs
 * (note: this parameter seems to be misnamed, it's likely divisionId or similar based on usage elsewhere, but keeping as is based on provided code).
 * @param {string} teamCode - The Gamesheet team code.
 * @param {object} browser - A Puppeteer browser instance.
 * @return {Promise<Array<HockeyPlayer|HockeyGK>>} A promise that resolves to an array of hockey player/goalkeeper objects.
 * @async
 */
async function parseGameSheetHockeyRoster(seasonCode, gameIds, teamCode, browser) {
  let page;
  try {
    // Open a new page using the provided browser
    page = await browser.newPage();
    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );

    const url = `https://gamesheetstats.com/seasons/${seasonCode}/teams/${teamCode}/roster`;
    console.log(`[parseGameSheetHockeyRoster] Visiting: ${url}`);

    const MAX_RETRIES = 3;
    let retries = 0;
    let roster;

    while (retries < MAX_RETRIES) {
      try {
        await page.goto(url, {waitUntil: "networkidle2"});
        // Wait for the table element to appear
        await page.waitForSelector(".sc-VILhF.jDQCGM.gs-table", {timeout: 30000});

        roster = await page.evaluate(() => {
          const out = [];
          // eslint-disable-next-line no-undef
          const tables = document.querySelectorAll(".sc-VILhF.jDQCGM.gs-table");
          tables.forEach((table, tableIndex) => {
            // eslint-disable-next-line no-undef
            const rows = table.querySelectorAll(".column.number .row-header");
            rows.forEach((_, idx) => {
              const getValue = (cls) =>
                // eslint-disable-next-line no-undef
                table.querySelector(`.column.${cls} .row-${idx} .data`)?.innerText.trim() ?? null;

              // eslint-disable-next-line no-undef
              const a = table.querySelector(`.column.name .row-${idx} .data a`);
              out.push({
                number: getValue("number"),
                position: tableIndex === 1 ? "GK" : getValue("position"),
                name: a?.innerText.trim() ?? null,
                link: a ? a.href : null,
              });
            });
          });
          return out.filter((r) => r.name);
        });
        break; // Success
      } catch (error) {
        console.error(`[parseGameSheetHockeyRoster] Error fetching roster page (Attempt ${retries + 1}):`, error.message);
        retries++;
        if (retries >= MAX_RETRIES) {
          console.error(`[parseGameSheetHockeyRoster] Failed to fetch roster page after ${MAX_RETRIES} attempts.`);
          if (page) await page.close();
          return []; // Return empty if all retries fail
        }
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
      }
    }

    if (!roster) { // Should not happen if break was hit, but as a safeguard
      if (page) await page.close();
      return [];
    }

    // 2) now visit each player page and pull the TOTAL row
    const players = [];
    for (const row of roster) {
      const playerPage = await browser.newPage();
      await playerPage.goto(row.link, {waitUntil: "networkidle2"});

      const stats = await playerPage.evaluate(() => {
        // find which row is the “Total” row
        // eslint-disable-next-line no-undef
        const seasons = Array.from(
            // eslint-disable-next-line no-undef
            document.querySelectorAll(".column.season .row-header .data span"),
        );
        const ti = seasons.findIndex((s) => s.textContent.trim() === "Total");
        if (ti < 0) return null;

        const getVal = (cls) =>
          // eslint-disable-next-line no-undef
          document.querySelector(`.column.${cls} .row-${ti} .data span`)?.textContent.trim() ?? null;

        // compute our GAA:
        const gaNum = parseFloat(getVal("ga")) || 0;
        const minNum = parseFloat(getVal("min")) || 0;
        const gaaCalc = minNum > 0 ?
                    ((gaNum / minNum) * 60).toFixed(2) :
                    null;

        return {
          gp: getVal("gp"),
          g: getVal("g"),
          a: getVal("a"),
          pts: getVal("pts"),
          pim: getVal("pim"),
          sa: getVal("sa"),
          ga: getVal("ga"),
          gaa: gaaCalc,
          so: getVal("so"),
          min: getVal("min"),
        };
      });

      await playerPage.close();
      if (!stats) continue;

      // extract numeric ID from the URL (players vs goalies)
      const m = row.link.match(/\/(?:players|goalies)\/(\d+)/);
      const playerId = m ? m[1] : "";

      // common BaseRoster fields
      const base = {
        teamName: "Appleby College", // you can fill this from your context
        playerId,
        seasonCode,
        jerseyNumber: row.number,
        playerName: row.name,
        playerPosition: row.position,
        gamesPlayed: parseInt(stats.gp, 10) || 0,
        goals: parseInt(stats.g, 10) || 0,
        assists: parseInt(stats.a, 10) || 0,
        link: row.link,
      };

      if (row.position === "GK") {
        // goalie
        players.push(new HockeyGK({
          ...base,
          shotsAgainst: parseInt(stats.sa, 10) || 0,
          goalsAgainst: parseInt(stats.ga, 10) || 0,
          goalsAgainstAverage: parseFloat(stats.gaa) || 0,
          shutouts: parseInt(stats.so, 10) || 0,
          minutesPlayed: parseInt(stats.min, 10) || 0,
        }));
      } else {
        // skater
        players.push(new HockeyPlayer({
          ...base,
          points: parseInt(stats.pts, 10) || 0,
          penaltyMinutes: parseInt(stats.pim, 10) || 0,
        }));
      }
    }

    return players;
  } catch (err) {
    console.error("Error in parseGameSheetRoster:", err);
    return [];
  } finally {
    if (page) await page.close();
  }
}

module.exports = {
  parseGameSheetSoccerStandings,
  parseGameSheetHockeyStandings,
  parseGameIDs,
  parseGameSheetGames,
  parseGameSheetSoccerRoster,
  parseGameSheetHockeyRoster,
};

