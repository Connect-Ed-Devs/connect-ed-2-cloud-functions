import axios from "axios";
import cheerio from "cheerio";
import qs from "qs";

// Stub functions replacing your original database lookups
async function getSportID(leagueNum) {
  return leagueNum; // Replace with real logic if needed.
}

async function getSchoolIDAbbrev(schoolAbbrev) {
  return schoolAbbrev; // Replace with real lookup if needed.
}

function getMonthIndex(monthName) {
  return new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
}

export async function parseGames(leagueNum) {
  const response = await axios.request({
    baseURL:
      "http://www.cisaa.ca/cisaa/ShowPage.dcisaa?CISAA_Results",
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
      const [targetMonth, targetDay] = date.split(" ");
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
      const stringTargetMonthIndex =
        targetMonthIndex > 9
          ? targetMonthIndex.toString()
          : `0${targetMonthIndex}`;
      date = `${year}-${stringTargetMonthIndex}-${targetDay}`;

      let time = $tdElements.eq(1).text().trim();
      time =
        time.substring(6, 7) === "a"
          ? time.substring(0, 6) + "AM"
          : time.substring(0, 6) + "PM";
      time =
        time.charAt(0) === "0"
          ? time.substring(1, 8)
          : time.substring(0, 8);

      let home = $tdElements.eq(2).text().trim();
      home = home.substring(0, home.length - 1);
      const homeScore = $tdElements.eq(3).text().trim();
      let away = $tdElements.eq(4).text().trim();
      away = away.substring(0, away.length - 1);
      const awayScore = $tdElements.eq(5).text().trim();

      if (home === "AC" || away === "AC") {
        const home_id = await getSchoolIDAbbrev(home);
        const away_id = await getSchoolIDAbbrev(away);
        const game_code = `G_${sport_id}_${home_id}_${away_id}_${date}`;
        return {
          home_id,
          away_id,
          sport_id,
          home_score: homeScore,
          away_score: awayScore,
          date,
          time,
          game_code,
        };
      }
    })
    .get();

  const games = await Promise.all(gamePromises);
  return games.filter((game) => game !== undefined);
}