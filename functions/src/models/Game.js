// javascript
export class Game {
  constructor({
    homeTeam = '',
    homeAbbr = '',
    homeLogo = '',
    awayTeam = '',
    awayAbbr = '',
    awayLogo = '',
    gameDate = new Date(),
    gameTime = '',
    homeScore = '',
    awayScore = '',
    sportsId = 0,
    sportsName = '',
    term = '',
    leagueCode = ''
  }) {
    this.homeTeam = homeTeam;
    this.homeAbbr = homeAbbr;
    this.homeLogo = homeLogo;
    this.awayTeam = awayTeam;
    this.awayAbbr = awayAbbr;
    this.awayLogo = awayLogo;
    this.gameDate = gameDate;
    this.gameTime = gameTime;
    this.homeScore = homeScore;
    this.awayScore = awayScore;
    this.sportsId = sportsId;
    this.sportsName = sportsName;
    this.term = term;
    this.leagueCode = leagueCode;
  }

  toMap() {
    return {
      home_team: this.homeTeam,
      home_abbr: this.homeAbbr,
      home_logo: this.homeLogo,
      away_team: this.awayTeam,
      away_abbr: this.awayAbbr,
      away_logo: this.awayLogo,
      game_date: this.gameDate.toISOString(),
      game_time: this.gameTime,
      home_score: this.homeScore,
      away_score: this.awayScore,
      sports_id: this.sportsId,
      sports_name: this.sportsName,
      term: this.term,
      league_code: this.leagueCode
    };
  }
}