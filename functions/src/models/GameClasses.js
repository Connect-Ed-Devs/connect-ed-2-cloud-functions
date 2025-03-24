// This file contains the Game class which encapsulates game data as an object.
export class BaseGame {
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
    leagueCode = '',
    gameCode = ''
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
    this.gameCode = gameCode;
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
      league_code: this.leagueCode,
      game_code: this.gameCode
    };
  }
}

// Derived class for Soccer
export class SoccerGame extends BaseGame {
  constructor({
                // Base fields
                homeTeam,
                homeAbbr,
                homeLogo,
                awayTeam,
                awayAbbr,
                awayLogo,
                gameDate,
                gameTime,
                homeScore,
                awayScore,
                sportsId,
                sportsName,
                term,
                leagueCode,
                gameCode,

                // Soccer-specific fields
                gameType,
                goals,
                isHomeGame,
                link,


              }) {
    // Pass base fields to parent constructor
    super({
      homeTeam,
      homeAbbr,
      homeLogo,
      awayTeam,
      awayAbbr,
      awayLogo,
      gameDate,
      gameTime,
      homeScore,
      awayScore,
      sportsId,
      sportsName,
      term,
      leagueCode,
      gameCode
    });

    // Set extra soccer fields
    this.gameType = gameType;
    this.goals = goals;
    this.isHomeGame = isHomeGame;
    this.link = link;
  }
}

export class gamesheetGame extends BaseGame {
  constructor({
                // Base fields
                homeTeam,
                homeAbbr,
                homeLogo,
                awayTeam,
                awayAbbr,
                awayLogo,
                gameDate,
                gameTime,
                homeScore,
                awayScore,
                sportsId,
                sportsName,
                term,
                leagueCode,
                gameCode,

                // Soccer-specific fields
                gameType,
                goals,
                link,


              }) {
    // Pass base fields to parent constructor
    super({
      homeTeam,
      homeAbbr,
      homeLogo,
      awayTeam,
      awayAbbr,
      awayLogo,
      gameDate,
      gameTime,
      homeScore,
      awayScore,
      sportsId,
      sportsName,
      term,
      leagueCode,
      gameCode
    });

    // Set extra soccer fields
    this.gameType = gameType;
    this.goals = goals;
    this.link = link;
  }
}