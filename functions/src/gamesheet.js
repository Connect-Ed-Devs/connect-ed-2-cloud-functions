import puppeteer from "puppeteer";
import { SoccerStandings, HockeyStandings } from "./models/StandingsClasses.js";
import {gamesheetGame} from "./models/GameClasses.js";
import {Goal} from "./models/goal.js";

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

export async function parseGameIDs(seasonCode, divisionId, applebyTeamCode, browser) {
    let page;
    try {
        page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        );

        const url = `https://gamesheetstats.com/seasons/${seasonCode}/teams/${applebyTeamCode}/schedule?filter%5Bdivision%5D=${divisionId}`;
        console.log("Visiting:", url);
        await page.goto(url, {waitUntil: "networkidle2"});

        // Wait for the standings table element to appear
        await page.waitForSelector('.sc-dOUtaJ.iusowt.column.visitor', {timeout: 20000});

        // Extract game IDs from the page
        const gameIds = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="/games/"]');
            // Convert NodeList to array and extract the numeric gameId via regex
            return Array.from(links).map(link => {
                const match = link.href.match(/\/games\/(\d+)/);
                return match ? match[1] : null;
            }).filter(Boolean);  // remove nulls
        });

        // Deduplicate game IDs and return
        return [...new Set(gameIds)];

    } catch (error) {
        console.error("Error in parseGameSheetHockeyStandings:", error);
        return [];
    } finally {
        if (page) {
            await page.close();
        }
    }
}

export async function parseGameSheetGames(seasonCode, gameIds, browser) {
    let page;
    try {
        page = await browser.newPage();
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
        );

        // Loop through each gameId and visit the corresponding page
        let games = [];
        /*
        for (const gameId of gameIds) {
            const url = `https://gamesheetstats.com/seasons/${seasonCode}/games/${gameId}`;
            console.log("Visiting:", url);
            await page.goto(url, {waitUntil: "networkidle2"});

            // Wait for the scores element to appear
            await page.waitForSelector('.sc-eDHQDy.jYdCkq.boxscore-game-score.w-full.items-center.flex.flex-row.justify-center.gap-4', {timeout: 20000});

            const content = await page.evaluate(() => document.body.innerHTML);
            console.log(content);

        }*/

        const url = `https://gamesheetstats.com/seasons/${seasonCode}/games/${gameIds[0]}`;
        console.log("Visiting:", url);
        await page.goto(url, {waitUntil: "networkidle2"});

        // Wait for the scores element to appear
        await page.waitForSelector('.sc-eDHQDy.jYdCkq.boxscore-game-score.w-full.items-center.flex.flex-row.justify-center.gap-4', {timeout: 20000});

        let gameData = await page.evaluate(() => {
            // Get the game status, lowercase it
            const gameStatus = document.querySelector('[data-testid="boxscore-game-status-bar"]')   ?.textContent.toLowerCase() || '';

            // Extract the game data from the page
            const gameEl = document.querySelector('[data-testid="boxscore-container"]');

            //For teams:
            const homeTeam = gameEl.querySelector('[data-testid="home-title"]')?.textContent || '';
            const awayTeam = gameEl.querySelector('[data-testid="visitor-title"]')?.textContent || '';

            // For scores:
            const homeScore = gameEl.querySelector('[data-testid="home-score"]')?.textContent.split('SOG:')[0].trim()  || '';
            const awayScore = gameEl.querySelector('[data-testid="visitor-score"]')?.textContent.split('SOG:')[0].trim() || '';

            // For game type:
            const gameType = gameEl.querySelector('[data-testid="game-type"]')?.textContent || '';
            //For date and time:
            const gameDateTime = gameEl.querySelector('[data-testid="game-date-time"]')?.textContent || '';

            // Split the string on ', ' to separate the parts
            const parts = gameDateTime.split(', '); // ["Sep 25", "2024", "4:02 PM"]

            // Combine the first two parts to form the date portion
            const datePortion = `${parts[0]}, ${parts[1]}`; // "Sep 25, 2024"

            // The time remains as a string
            const timePortion = parts[2]; // "4:02 PM"

            // Create a Date object from the date portion (time will default to midnight)
            const gameDate = new Date(datePortion);

            console.log(gameDate.toDateString());    // For example: Wed Sep 25 2024 00:00:00 ...
            console.log(timePortion); // "4:02 PM"


            return {
                homeScore,
                awayScore,
                homeTeam,
                awayTeam,
                gameDateTime,
                gameDate,
                gameType,
                datePortion,
                timePortion,

            };

        });
        console.log(gameData);
        // Create the Date object in the Node.js context
        const gameDate = new Date(gameData.datePortion + ' ' + gameData.timePortion);
        console.log("Date created in Node context:", gameDate.toString());

        //Extract goals
        const goalsData = await page.evaluate(() => {
            const gameStatus = document.querySelector('[data-testid="boxscore-game-status-bar"]')?.textContent.toLowerCase() || '';
            // If the game is scheduled, return an empty array for goals.
            if (gameStatus.includes('scheduled')) {
                return [];
            }

            // Function to extract the name from the full text
            function extractName(fullText) {
                // Remove the leading '#' and number, then remove trailing ' (1)' or similar.
                return fullText
                    .replace(/^#\d+\s+/, '')  // remove leading number with '#' and spaces
                    .replace(/\s+\(\d+\)$/, '') // remove trailing space, parenthesis, and number
                    .trim();
            }

            // Array to hold raw goal objects.
            const goals = [];

            // Select each period container (e.g. "goal-by-period-1ST Half" or "goal-by-period-1ST Period")
            const periodContainers = Array.from(
                document.querySelectorAll('[data-testid^="goal-by-period-"]')
            );

            periodContainers.forEach(container => {
                // Extract period label. It might be found inside an element with data-testid like:
                // "goal-period-header-1ST Half" or "goal-period-header-1ST Period"
                const periodHeaderEl = container.querySelector('[data-testid^="goal-period-header-"]');
                // If not found, you might also consider using the container's own data-testid.
                let period = periodHeaderEl ? periodHeaderEl.innerText.trim() : '';

                // Select each goal event inside this container.
                const goalNodes = Array.from(
                    container.querySelectorAll('[data-testid^="goal-event-"]')
                );

                goalNodes.forEach(goalNode => {
                    // Extract the minute scored from the time element.
                    const timeEl = goalNode.querySelector('[data-testid^="goal-event-time-"] span');
                    const minuteScored = timeEl ? timeEl.innerText.trim() : '';

                    // Extract the team name from the goal data team element.
                    const teamEl = goalNode.querySelector('[data-testid^="goal-data-team-"] span');
                    const teamName = teamEl ? teamEl.innerText.trim() : '';

                    // Extract the scorer from the goal data title element.
                    const scorerEl = goalNode.querySelector('[data-testid^="goal-data-title-"] span');
                    const scorer = scorerEl ? scorerEl.innerText.trim() : '';
                    const scorerName = extractName(scorer);

                    // Extract the assist information (if any).
                    const assistEl = goalNode.querySelector('[data-testid^="goal-data-assists-"]');
                    let assister = assistEl ? assistEl.innerText.trim() : '';

                    // For hockey, you might have a second assist (preAssister) – if not present, leave it blank.
                    // You could try to see if assistEl contains multiple pieces of text and split them.
                    let preAssister = '';
                    if (assister.includes(',')) {
                        // For example, if two assists are separated by a comma.
                        const assistsArray = assister.split(',').map(item => item.trim());
                        // Assign first as "assister" and second as "preAssister"
                        assister = assistsArray[0];
                        preAssister = assistsArray[1] || '';
                    }

                    // Only push if we have meaningful data in at least one of the fields
                    if (teamName && scorerName) {
                        goals.push({
                            teamName,
                            minuteScored,
                            period,  // Make sure 'period' is defined elsewhere in your code
                            scorer: scorerName,
                            assister,
                            preAssister
                        });
                    }
                });
            });

            return goals;
        });

        const goalObjects = goalsData.map(goalData => new Goal(goalData));

        // Create game object with available data, null for fields to be filled later
        const game = new gamesheetGame({
            // Data available now
            homeTeam: gameData.homeTeam,
            awayTeam: gameData.awayTeam,
            homeScore: gameData.homeScore,
            awayScore: gameData.awayScore,
            gameDate: gameDate,
            gameTime: gameData.timePortion,
            gameId: gameIds[0], // Assuming gameIds[0] is the game code

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
            link: `https://gamesheetstats.com/seasons/${seasonCode}/games/${gameIds[0]}?configuration%5Bprimary-colour%5D=FCFFF9&configuration%5Bsecondary-colour%5D=034265`
        });

        games.push(game);
        console.log("Game object created:", game);

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
