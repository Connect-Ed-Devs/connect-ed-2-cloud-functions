import axios from "axios";
import * as cheerio from "cheerio";
import qs from "qs";
import {Schools} from "./models/schools.js";
import {Sports} from "./models/sports.js";
import {Game} from "./models/game.js";

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

export async function getSchoolIDName(schoolName) {
    const school = Schools.getSchoolByName(schoolName);
    return school ? school.id : null;
}

function getMonthIndex(monthName) {
    return new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
}

/**
 * inSport: Checks if the sport (using the league code) includes "Appleby College" in its standings.
 */
export async function inSport(leagueNum, name) {
    try {
        const response = await axios.request({
            baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
            method: "PUT",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            data: qs.stringify({ txtleague: `${leagueNum}` }),
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
    } catch (err) {
        return false;
    }
}

/**
 * parseSports: Scrapes data on each sports league from the website.
 * Returns an array where each element is [sport name, term, league code].
 */
export async function parseSports() {
    let sports = [];
    try {
        const response = await axios.request({
            baseURL: "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
            method: "PUT",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            data: { txtleague: "2860Y8N5D" },
        });
        const html = response.data;
        const $ = cheerio.load(html);

        // inSport function is called for each sport to check if "Appleby College" is in the standings
        const fallPromises = $("#lstFall option").map(async (index, element) => {
            try {

                if (
                    (await inSport($(element).val(), $(element).text())) &&
                    $(element).text() !== "FALL"
                ) {
                    return [$(element).text(), "Fall", $(element).val()];
                }
            } catch (err) {}
        });
        const winterPromises = $("#lstWinter option").map(async (index, element) => {
            try {
                if (
                    (await inSport($(element).val(), $(element).text())) &&
                    $(element).text() !== "WINTER"
                ) {
                    return [$(element).text(), "Winter", $(element).val()];
                }
            } catch (err) {}
        });
        const springPromises = $("#lstSpring option").map(async (index, element) => {
            try {
                if (
                    (await inSport($(element).val(), $(element).text())) &&
                    $(element).text() !== "SPRING"
                ) {
                    return [$(element).text(), "Spring", $(element).val()];
                }
            } catch (err) {}
        });
        const fallSports = await Promise.all(fallPromises);
        const winterSports = await Promise.all(winterPromises);
        const springSports = await Promise.all(springPromises);
        sports = [...fallSports, ...winterSports, ...springSports].filter(Boolean);
        return sports;
    } catch (err) {
        console.error("Error in parseSports:", err);
        return sports;
    }
}

/**
 * parseStandings: Scrapes standings data and returns an array of standings objects.
 * Returns an array of objects, each containing team name, games played, wins, ties, losses, points,
 * table number, sport ID, school ID, and standings code.
 */
export async function parseStandings(leagueNum){
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
                const games_played = parseInt($(element).find(".col2").text().trim());
                const wins = parseInt($(element).find(".col3").text().trim());
                const losses = parseInt($(element).find(".col4").text().trim());
                const ties = parseInt($(element).find(".col5").text().trim());
                const points = parseInt($(element).find(".col6").text().trim());
                const schoolID = await getSchoolIDName(teamName);
                const standings_code = `S_${schoolID}_${sportID}`;
                return {
                    team_name: teamName,
                    games_played,
                    wins,
                    ties,
                    losses,
                    points,
                    table_num: 1,
                    sport_id: sportID,
                    school_id: schoolID,
                    standings_code,
                };
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
                const games_played = parseInt($(element).find(".col2").text().trim());
                const wins = parseInt($(element).find(".col3").text().trim());
                const losses = parseInt($(element).find(".col4").text().trim());
                const ties = parseInt($(element).find(".col5").text().trim());
                const points = parseInt($(element).find(".col6").text().trim());
                const schoolID = await getSchoolIDName(teamName);
                const standings_code = `S_${schoolID}_${sportID}`;
                return {
                    team_name: teamName,
                    games_played,
                    wins,
                    ties,
                    losses,
                    points,
                    table_num: 2,
                    sport_id: sportID,
                    school_id: schoolID,
                    standings_code,
                };
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

/**
 * parseGames: Scrapes game data for a specific sport and returns an array of Game objects.
 * Returns an array of Game objects.
 */
export async function parseGames(leagueNum) {
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
                let home = $tdElements.eq(2).text().trim();
                home = home.substring(0, home.length - 1);
                const homeScore = $tdElements.eq(3).text().trim();
                let away = $tdElements.eq(4).text().trim();
                away = away.substring(0, away.length - 1);
                const awayScore = $tdElements.eq(5).text().trim();
                if (home === "AC" || away === "AC") {
                    let home_id = await getSchoolIDAbbrev(home);
                    let away_id = await getSchoolIDAbbrev(away);
                    // Create a Game instance.
                    const game = new Game({
                        homeTeam: home,  // In a real scenario, you might retrieve the full team name
                        homeAbbr: home,
                        awayTeam: away,
                        awayAbbr: away,
                        homeScore: homeScore,
                        awayScore: awayScore,
                        gameDate: new Date(date),
                        gameTime: time,
                        sportsId: sport_id,
                        leagueCode: leagueNum
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
