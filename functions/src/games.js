import axios from "axios";
import * as cheerio from "cheerio";
import qs from "qs";
import {Schools} from "./models/schools.js";
import {Sports} from "./models/sports.js";

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
async function inSport(leagueNum, name) {
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