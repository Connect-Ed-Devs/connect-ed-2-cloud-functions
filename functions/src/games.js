import axios from "axios";
import * as cheerio from "cheerio";
import qs from "qs";
import {Schools} from "./models/schools.js";
import {Sports} from "./models/sports.js";
import {BaseGame} from "./models/GameClasses.js";
import puppeteer from "puppeteer";
import { BaseStandings } from "./models/StandingsClasses.js";
import {
    parseGameSheetHockeyStandings,
    parseGameSheetSoccerStandings,
    parseGameIDs,
    parseGameSheetGames
} from "./gamesheet.js";
import {getStandings, getApplebyTeamCode} from "./database.js";

/**
 * Helper functions to replace SQL lookups.
 */
async function getSportID(leagueNum) {
    // Look up the sport record by league code
    const sportRecord = Sports.getSportByLeagueCode(leagueNum);
    // For this example, we’ll use the league code as the unique id.
    return sportRecord ? sportRecord[2] : null;
}

async function getSchoolIDAbbrev(schoolAbbrev) {
    const school = Schools.getSchoolByAbbreviation(schoolAbbrev);
    return school ? school.id : null;
}

export async function getSchoolIDName(teamName) {
    // Retrieve an array of all school records
    const allSchools = Schools.getAllSchools();
    // Try to find a school whose full name is included in the teamName string
    const schoolRecord = allSchools.find(school => teamName.includes(school.school_name));
    return schoolRecord ? schoolRecord.id : null;
}

function getMonthIndex(monthName) {
    return new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
}


/**
 * inSport: Checks if the sport (using the league code) includes "Appleby College" in its standings.
 * Uses different scraping approaches based on whether the sport uses Gamesheet.
 */
export async function inSport(leagueNum, usesGamesheet, browser)    {
    try {
        if (usesGamesheet) {
            // For Gamesheet sports
            const response = await axios.request({
                baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
                method: "PUT",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                data: qs.stringify({ txtleague: leagueNum }),
            });

            const $ = cheerio.load(response.data);
            const iframeSrc = $('iframe[src*="gamesheetstats.com/seasons/"]').attr("src");

            if (!iframeSrc) return false;

            // Extract the season code and division ID from the iframe URL
            const seasonCodeMatch = iframeSrc.match(/seasons\/(\d{4})/);
            const divisionMatch = iframeSrc.match(/filter\[division\]=(\d{5})/);

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
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
                    );

                    const url = `https://gamesheetstats.com/seasons/${seasonCode}/standings?filter%5Bdivision%5D=${divisionId}`;
                    console.log("Visiting:", url);
                    await page.goto(url, { waitUntil: "networkidle2" });

                    // Wait for the element to appear (adjust timeout as needed)
                    await page.waitForSelector('.sc-dOUtaJ.iusowt.column.teamTitle', { timeout: 20000 })

                    // 3. Grab the team names from the relevant elements
                    const teamTitles = await page.evaluate(() => {
                        const elements = document.querySelectorAll(".sc-dOUtaJ.iusowt.column.teamTitle");
                        let titles = [];
                        elements.forEach(el => {
                            const lines = el.innerText
                                .split("\n")
                                .map(line => line.trim())
                                .filter(line => line && line !== "TEAM");
                            titles.push(...lines);
                        });
                        return titles;
                    });

                    await page.close(); // done with this page

                    // Check if "Appleby College" is present
                    const applebyExists = teamTitles.includes("Appleby College");

                    return applebyExists;
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
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }


        } else {
            // Original method for non-Gamesheet sports
            const response = await axios.request({
                baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
                method: "PUT",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                data: qs.stringify({ txtleague: leagueNum }),
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
                            let text = $(element).text();
                            let teamName = "";
                            let counter = 0;
                            while (counter < text.length && text.charAt(counter) !== "-") {
                                teamName += text.charAt(counter);
                                counter++;
                            }
                            // Remove trailing characters (e.g., spaces or punctuation)
                            teamName = teamName.substring(0, teamName.length - 2);
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
 */
export async function parseSports() {
    let sports = [];
    let browser; // we’ll keep one browser instance

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

        // Helper to process all <option> tags in a given season list
        async function processSeasonList(selector, seasonName) {
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
                    const usesGamesheet = sportRecord[3];

                    // 3. Check if Appleby is in this sport
                    const isApplebyInSport = await inSport(
                        leagueCode,
                        usesGamesheet,
                        browser // pass the existing browser
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

        // 3. Process Fall, Winter, Spring in parallel
        const [fallSports, winterSports, springSports] = await Promise.all([
            processSeasonList("#lstFall option", "Fall"),
            processSeasonList("#lstWinter option", "Winter"),
            processSeasonList("#lstSpring option", "Spring"),
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
 */
export async function parseStandings(leagueNum, usesGamesheet, browser) {
    async function parseCISAAStandings(leagueNum){
        try {
            const response = await axios.request({
                baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
                method: "PUT",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                data: qs.stringify({ txtleague: `${leagueNum}` }),
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const sportID = await leagueNum;

            const standingPromises1 = $("#standingsTable1")
                .find("tr")
                .map(async (index, element) => {
                    let rawName = $(element).find(".col1").text().trim();
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
                    let rawName = $(element).find(".col1").text().trim();
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
            standings = [...standings, ...standings2].filter(item => item !== undefined);
            return standings;
        } catch (err) {
            console.error("Error in parseStandings:", err);
            return [];
        }

    }

    if (!usesGamesheet){
        return parseCISAAStandings(leagueNum);
    }

    // 1) If it’s a GameSheet league, get the season code and division ID from the iframe URL
    const response = await axios.request({
        baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
        method: "PUT",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: qs.stringify({ txtleague: leagueNum }),
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const iframeSrc = $('iframe[src*="gamesheetstats.com/seasons/"]').attr("src");
    if (!iframeSrc) {
        console.error("No iframe found for league:", leagueNum);
        return [];
    }

    // Extract the season code and division ID from the iframe URL
    const seasonCodeMatch = iframeSrc.match(/seasons\/(\d{4})/);
    const divisionMatch = iframeSrc.match(/filter\[division\]=(\d{5})/);
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
        const processedStandings = await Promise.all(standings.map(async standing => {
            const schoolID = await getSchoolIDName(standing.teamName);
            standing.sportId = leagueNum;
            standing.schoolId = schoolID;
            standing.standingsCode = `S_${schoolID}_${leagueNum}`;
            return standing;
        }));
        return processedStandings.filter(item => item !== undefined);

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
 */
export async function parseGames(leagueNum, usesGamesheet, browser) {
    // Get sport from leagueNum
    const sport = Sports.getSportByLeagueCode(leagueNum);
    if (!sport) {
        console.error(`Sport not found for league number: ${leagueNum}`);
        return [];
    }

    async function parseCISAAGames(leagueNum){
        try {
            const response = await axios.request({
                baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
                method: "PUT",
                headers: { "content-type": "application/x-www-form-urlencoded" },
                data: qs.stringify({ txtleague: `${leagueNum}` }),
            });
            const html = response.data;
            const $ = cheerio.load(html);
            const sport_id = await getSportID(leagueNum);
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
                    if (month >= 9) { year++; }
                    if (targetMonthIndex >= 9) { year--; }
                    const stringTargetMonthIndex = targetMonthIndex > 9 ? targetMonthIndex.toString() : `0${targetMonthIndex}`;
                    date = `${year}-${stringTargetMonthIndex}-${targetDay}`;
                    let time = $tdElements.eq(1).text().trim();
                    time = time.substring(6, 7) === "a" ? time.substring(0, 6) + "AM" : time.substring(0, 6) + "PM";
                    time = time.charAt(0) === "0" ? time.substring(1, 8) : time.substring(0, 8);
                    let homeAbbr = $tdElements.eq(2).text().trim();
                    homeAbbr = homeAbbr.substring(0, homeAbbr.length - 1);
                    const homeScore = $tdElements.eq(3).text().trim();
                    let awayAbbr = $tdElements.eq(4).text().trim();
                    awayAbbr = awayAbbr.substring(0, awayAbbr.length - 1);
                    const awayScore = $tdElements.eq(5).text().trim();
                    if (homeAbbr === "AC" || awayAbbr === "AC") {
                        let home_id = await getSchoolIDAbbrev(homeAbbr);
                        let away_id = await getSchoolIDAbbrev(awayAbbr);

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
                            sportsId: sport_id,
                            sportsName: sport[0],
                            term: sport[1],
                            leagueCode: leagueNum,
                            gameCode: `G_${home_id}_${away_id}_${date.replace(/-/g, '_')}_${sport_id}`,
                        });
                        return game.toMap();
                    }
                })
                .get();
            const games = await Promise.all(gamePromises);
            return games.filter(item => item !== undefined);
        } catch (err) {
            console.error("Error in parseGames:", err);
            return [];
        }
    }

    if (!usesGamesheet){
        return parseCISAAGames(leagueNum);
    }

    // 1) If it’s a GameSheet league, get the season code and division ID from the iframe URL
    const response = await axios.request({
        baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
        method: "PUT",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        data: qs.stringify({ txtleague: leagueNum }),
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const iframeSrc = $('iframe[src*="gamesheetstats.com/seasons/"]').attr("src");
    if (!iframeSrc) {
        console.error("No iframe found for league:", leagueNum);
        return [];
    }

    // Extract the season code and division ID from the iframe URL
    const seasonCodeMatch = iframeSrc.match(/seasons\/(\d{4})/);
    const divisionMatch = iframeSrc.match(/filter\[division\]=(\d{5})/);
    if (!seasonCodeMatch || !divisionMatch) {
        console.error("Season code or division ID not found in the iframe URL");
        return [];
    }

    const seasonCode = seasonCodeMatch[1];
    const divisionId = divisionMatch[1];

    // If it's a gamesheet league, get the team code from firebase standings and determine by name "Appleby College"
    const applebyTeamCode = await getApplebyTeamCode(leagueNum);
    console.log(applebyTeamCode)

    //If it’s a GameSheet league, check if a browser was provided
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
        console.log("here")

        //get gameids from gamesheet
        const gameIds = await parseGameIDs(seasonCode, divisionId, applebyTeamCode, localBrowser);
        console.log('Unique Game IDs:', gameIds);

        if (gameIds && gameIds.length > 0) {
            const games = await parseGameSheetGames(seasonCode, gameIds, localBrowser);
            return games;
        }

        //for each game id, get the game data


        return []
    } finally {
        // 4) If we created the browser in this function, close it here
        if (createdBrowser && localBrowser) {
            await localBrowser.close();
        }
    }
}
