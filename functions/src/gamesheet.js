import puppeteer from "puppeteer";
import { SoccerStandings, HockeyStandings } from "./models/StandingsClasses.js";

export async function parseGameSheetSoccerStandings(seasonCode, divisionId, browser) {
    let page;
    try {
        // Open a new page using the provided browser
        page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        );

        const url = `https://gamesheetstats.com/seasons/${seasonCode}/standings?filter%5Bdivision%5D=${divisionId}`;
        console.log("Visiting:", url);
        await page.goto(url, { waitUntil: "networkidle2" });

        // Wait for the standings table element to appear
        await page.waitForSelector('.sc-lertIE.cvPbEn.gs-table', { timeout: 20000 });

        // Extract raw standings data from the page
        const rawStandings = await page.evaluate(() => {
            const standings = [];

            // Use the team title column to determine the number of rows.
            const teamRows = document.querySelectorAll('.sc-dOUtaJ.iusowt.column.teamTitle .sc-ktvNQe.hvAVwg.row-header');
            const numRows = teamRows.length;

            // Helper: Given a column class and row index, return the trimmed innerText
            const getValue = (colClass, rowIndex) => {
                const cell = document.querySelector(
                    `.sc-dOUtaJ.iusowt.column.${colClass} .sc-dslWvo.bDFuOP.cell.row-${rowIndex} .data`
                );
                return cell ? cell.innerText.trim() : null;
            };

            for (let i = 0; i < numRows; i++) {
                // Extract team name and link from the teamTitle column
                let teamName = null;
                let gamesheetTeamId = null;
                const teamCell = document.querySelector(
                    `.sc-dOUtaJ.iusowt.column.teamTitle .sc-ktvNQe.hvAVwg.row-header.row-${i} .data`
                );
                if (teamCell) {
                    const linkEl = teamCell.querySelector('.team-title a');
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
                const gamesPlayed = parseNum(getValue('gp', i));
                const wins = parseNum(getValue('w', i));
                const ties = parseNum(getValue('t', i));
                const losses = parseNum(getValue('l', i));
                const points = parseNum(getValue('pts', i));
                const pointsPercentage = parseNum(getValue('ppct', i));
                const yellowCards = parseNum(getValue('yc', i));
                const redCards = parseNum(getValue('rc', i));
                const goalsFor = parseNum(getValue('gf', i));
                const goalsAgainst = parseNum(getValue('ga', i));
                const goalDifference = parseNum(getValue('diff', i));

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
            return standings;
        });

        // Map raw data into SoccerStandings objects.
        // (Update sportId, schoolId, and standingsCode as needed.)
        const soccerStandings = rawStandings.map(obj => new SoccerStandings({
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

        return soccerStandings;
    } catch (error) {
        console.error("Error in parseGameSheetSoccerStandings:", error);
        return [];
    } finally {
        if (page) {
            await page.close();
        }
    }
}

export async function parseGameSheetHockeyStandings(seasonCode, divisionId, browser) {
    let page;
    try {
        // Open a new page using the provided browser
        page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        );

        const url = `https://gamesheetstats.com/seasons/${seasonCode}/standings?filter%5Bdivision%5D=${divisionId}`;
        console.log("Visiting:", url);
        await page.goto(url, {waitUntil: "networkidle2"});

        // Wait for the standings table element to appear
        await page.waitForSelector('.sc-lertIE.cvPbEn.gs-table', {timeout: 20000});

        // Extract raw standings data from the page
        const rawStandings = await page.evaluate(() => {
            const standings = [];
            // Use the teamTitle column rows to determine the number of teams
            const teamRows = document.querySelectorAll(
                '.sc-dOUtaJ.iusowt.column.teamTitle .sc-ktvNQe.hvAVwg.row-header'
            );
            const numRows = teamRows.length;

            // Helper: Given a column class and a row index, return the trimmed innerText
            const getValue = (colClass, rowIndex) => {
                const cell = document.querySelector(
                    `.sc-dOUtaJ.iusowt.column.${colClass} .sc-dslWvo.bDFuOP.cell.row-${rowIndex} .data`
                );
                return cell ? cell.innerText.trim() : null;
            };

            for (let i = 0; i < numRows; i++) {
                let teamName = null;
                let gamesheetTeamId = null;
                // Extract team name and team URL from the teamTitle column
                const teamCell = document.querySelector(
                    `.sc-dOUtaJ.iusowt.column.teamTitle .sc-ktvNQe.hvAVwg.row-header.row-${i} .data`
                );
                if (teamCell) {
                    const linkEl = teamCell.querySelector('.team-title a');
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
                const gamesPlayed = getValue('gp', i) ? parseFloat(getValue('gp', i)) : null;
                const wins = getValue('w', i) ? parseFloat(getValue('w', i)) : null;
                const losses = getValue('l', i) ? parseFloat(getValue('l', i)) : null;
                const ties = getValue('t', i) ? parseFloat(getValue('t', i)) : null;
                const points = getValue('pts', i) ? parseFloat(getValue('pts', i)) : null;

                // Hockey-specific fields:
                const overtimeWins = getValue('otw', i) ? parseFloat(getValue('otw', i)) : null;
                const overtimeLosses = getValue('otl', i) ? parseFloat(getValue('otl', i)) : null;
                const pointsPercentage = getValue('ppct', i) ? parseFloat(getValue('ppct', i)) : null;
                const goalsFor = getValue('gf', i) ? parseFloat(getValue('gf', i)) : null;
                const goalsAgainst = getValue('ga', i) ? parseFloat(getValue('ga', i)) : null;
                const goalDifference = getValue('diff', i) ? parseFloat(getValue('diff', i)) : null;
                // Use the columns "ppg" and "ppga" for power play goals data
                const powerPlayGoals = getValue('ppg', i) ? parseFloat(getValue('ppg', i)) : null;
                const powerPlayGoalsAgainst = getValue('ppga', i) ? parseFloat(getValue('ppga', i)) : null;
                const shortHandedGoals = getValue('shg', i) ? parseFloat(getValue('shg', i)) : null;
                const penaltyMinutes = getValue('pim', i) ? parseFloat(getValue('pim', i)) : null;

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
        const hockeyStandings = rawStandings.map(obj => new HockeyStandings({
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

        return hockeyStandings;
    } catch (error) {
        console.error("Error in parseGameSheetHockeyStandings:", error);
        return [];
    } finally {
        if (page) {
            await page.close();
        }
    }
}