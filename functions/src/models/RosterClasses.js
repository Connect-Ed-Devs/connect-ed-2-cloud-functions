// This file contains the Roster class which encapsulates roster data as an object.

/**
 * Represents a base roster.
 */
class BaseRoster {
  /**
   * Creates an instance of BaseRoster.
   * @param {object} params - The parameters for creating a base roster.
   * @param {string} [params.teamName=""] - The name of the team.
   * @param {string} [params.playerId=""] - The ID of the player.
   * @param {string} [params.seasonCode=""] - The season code.
   * @param {string} [params.jerseyNumber=""] - The jersey number of the player.
   * @param {string} [params.playerName=""] - The name of the player.
   * @param {string} [params.playerPosition=""] - The position of the player.
   * @param {string} [params.gamesPlayed=""] - The number of games played by the player.
   * @param {string} [params.goals=""] - The number of goals scored by the player.
   * @param {string} [params.assists=""] - The number of assists made by the player.
   */
  constructor({
    teamName = "",
    playerId = "",
    seasonCode = "",
    jerseyNumber = "",
    playerName = "",
    playerPosition = "",
    gamesPlayed = "",
    goals = "",
    assists = "",
  }) {
    this.teamName = teamName;
    this.playerId = playerId;
    this.seasonCode = seasonCode;
    this.jerseyNumber = jerseyNumber;
    this.playerName = playerName;
    this.playerPosition = playerPosition;
    this.gamesPlayed = gamesPlayed;
    this.goals = goals;
    this.assists = assists;
  }

  /**
   * Converts the BaseRoster instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the base roster.
   */
  toMap() {
    return {
      team_name: this.teamName,
      player_id: this.playerId,
      season_code: this.seasonCode,
      jersey_number: this.jerseyNumber,
      player_name: this.playerName,
      player_position: this.playerPosition,
      games_played: this.gamesPlayed,
      goals: this.goals,
      assists: this.assists,
    };
  }
}

/**
 * Represents a soccer player, extending BaseRoster.
 */
class SoccerPlayer extends BaseRoster {
  /**
   * Creates an instance of SoccerPlayer.
   * @param {object} params - The parameters for creating a soccer player.
   * @param {string} params.teamName - The name of the team.
   * @param {string} params.playerId - The ID of the player.
   * @param {string} params.seasonCode - The season code.
   * @param {string} params.jerseyNumber - The jersey number of the player.
   * @param {string} params.playerName - The name of the player.
   * @param {string} params.playerPosition - The position of the player.
   * @param {string} params.gamesPlayed - The number of games played by the player.
   * @param {string} params.goals - The number of goals scored by the player.
   * @param {string} params.assists - The number of assists made by the player.
   * @param {string} [params.yellowCards=""] - The number of yellow cards received by the player.
   * @param {string} [params.redCards=""] - The number of red cards received by the player.
   * @param {string} [params.link=""] - A link to the player's profile or stats.
   */
  constructor({
    teamName,
    playerId,
    seasonCode,
    jerseyNumber,
    playerName,
    playerPosition,
    gamesPlayed,
    goals,
    assists,

    // Additional fields specific to SoccerPlayer
    yellowCards = "",
    redCards = "",
    link = "",

  }) {
    // Pass base fields to parent constructor
    super({
      teamName,
      playerId,
      seasonCode,
      jerseyNumber,
      playerName,
      playerPosition,
      gamesPlayed,
      goals,
      assists});

    // Additional fields specific to soccerPlayer are added
    this.yellowCards = yellowCards;
    this.redCards = redCards;
    this.link = link;
  }

  /**
   * Converts the soccerPlayer instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the soccer player.
   */
  toMap() {
    const baseMap = super.toMap();
    return {
      ...baseMap,
      yellow_cards: this.yellowCards,
      red_cards: this.redCards,
      link: this.link,
    };
  }
}

/**
 * Represents a soccer goalkeeper, extending BaseRoster.
 */
class SoccerGK extends BaseRoster {
  /**
   * Creates an instance of SoccerGK.
   * @param {object} params - The parameters for creating a soccer goalkeeper.
   * @param {string} params.teamName - The name of the team.
   * @param {string} params.playerId - The ID of the player.
   * @param {string} params.seasonCode - The season code.
   * @param {string} params.jerseyNumber - The jersey number of the player.
   * @param {string} params.playerName - The name of the player.
   * @param {string} params.playerPosition - The position of the player.
   * @param {string} params.gamesPlayed - The number of games played by the player.
   * @param {string} params.goals - The number of goals scored by the player.
   * @param {string} params.assists - The number of assists made by the player.
   * @param {string} params.link - A link to the player's profile or stats.
   * @param {string} [params.yellowCards=""] - The number of yellow cards received by the player.
   * @param {string} [params.redCards=""] - The number of red cards received by the player.
   * @param {string} [params.shotsAgainst=""] - The number of shots against the goalkeeper.
   * @param {string} [params.goalsAgainst=""] - The number of goals against the goalkeeper.
   * @param {string} [params.goalsAgainstAverage=""] - The goals against average of the goalkeeper.
   * @param {string} [params.shutouts=""] - The number of shutouts by the goalkeeper.
   * @param {string} [params.minutesPlayed=""] - The number of minutes played by the goalkeeper.
   */
  constructor({
    teamName,
    playerId,
    seasonCode,
    jerseyNumber,
    playerName,
    playerPosition,
    gamesPlayed,
    goals,
    assists,
    link,

    // Additional fields specific to soccerGK
    yellowCards = "",
    redCards = "",
    shotsAgainst = "",
    goalsAgainst = "",
    goalsAgainstAverage = "",
    shutouts = "",
    minutesPlayed = "",
  }) {
    // Pass base fields to parent constructor
    super({
      teamName,
      playerId,
      seasonCode,
      jerseyNumber,
      playerName,
      playerPosition,
      gamesPlayed,
      goals,
      assists,
      yellowCards, // These were missing in the super call for SoccerGK
      redCards, // These were missing in the super call for SoccerGK
      link,
    });

    // Additional fields specific to soccerGK are added
    this.shotsAgainst = shotsAgainst;
    this.goalsAgainst = goalsAgainst;
    this.goalsAgainstAverage = goalsAgainstAverage;
    this.shutouts = shutouts;
    this.minutesPlayed = minutesPlayed;
  }

  /**
   * Converts the soccerGK instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the soccer goalkeeper.
   */
  toMap() {
    const baseMap = super.toMap();
    return {
      ...baseMap,
      shots_against: this.shotsAgainst,
      goals_against: this.goalsAgainst,
      goals_against_average: this.goalsAgainstAverage,
      shutouts: this.shutouts,
      minutes_played: this.minutesPlayed,
    };
  }
}

/**
 * Represents a hockey player, extending BaseRoster.
 */
class HockeyPlayer extends BaseRoster {
  /**
   * Creates an instance of HockeyPlayer.
   * @param {object} params - The parameters for creating a hockey player.
   * @param {string} params.teamName - The name of the team.
   * @param {string} params.playerId - The ID of the player.
   * @param {string} params.seasonCode - The season code.
   * @param {string} params.jerseyNumber - The jersey number of the player.
   * @param {string} params.playerName - The name of the player.
   * @param {string} params.playerPosition - The position of the player.
   * @param {string} params.gamesPlayed - The number of games played by the player.
   * @param {string} params.goals - The number of goals scored by the player.
   * @param {string} params.assists - The number of assists made by the player.
   * @param {string} [params.points=""] - The number of points scored by the player.
   * @param {string} [params.penaltyMinutes=""] - The number of penalty minutes of the player.
   * @param {string} [params.link=""] - A link to the player's profile or stats.
   */
  constructor({
    teamName,
    playerId,
    seasonCode,
    jerseyNumber,
    playerName,
    playerPosition,
    gamesPlayed,
    goals,
    assists,

    // Additional fields specific to hockeyPlayer
    points = "",
    penaltyMinutes = "",
    link = "",

  }) {
    // Pass base fields
    super({
      teamName,
      playerId,
      seasonCode,
      jerseyNumber,
      playerName,
      playerPosition,
      gamesPlayed,
      goals,
      assists,
    });

    this.points = points;
    this.penaltyMinutes = penaltyMinutes;
    this.link = link;
  }

  /**
   * Converts the hockeyPlayer instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the hockey player.
   */
  toMap() {
    const baseMap = super.toMap();
    return {
      ...baseMap,
      points: this.points,
      penalty_minutes: this.penaltyMinutes,
      link: this.link,
    };
  }
}

/**
 * Represents a hockey goalkeeper, extending BaseRoster.
 */
class HockeyGK extends BaseRoster {
  /**
   * Creates an instance of HockeyGK.
   * @param {object} params - The parameters for creating a hockey goalkeeper.
   * @param {string} params.teamName - The name of the team.
   * @param {string} params.playerId - The ID of the player.
   * @param {string} params.seasonCode - The season code.
   * @param {string} params.jerseyNumber - The jersey number of the player.
   * @param {string} params.playerName - The name of the player.
   * @param {string} params.playerPosition - The position of the player.
   * @param {string} params.gamesPlayed - The number of games played by the player.
   * @param {string} params.goals - The number of goals scored by the player.
   * @param {string} params.assists - The number of assists made by the player.
   * @param {string} params.shotsAgainst - The number of shots against the goalkeeper.
   * @param {string} params.goalsAgainst - The number of goals against the goalkeeper.
   * @param {string} params.goalsAgainstAverage - The goals against average of the goalkeeper.
   * @param {string} params.shutouts - The number of shutouts by the goalkeeper.
   * @param {string} params.minutesPlayed - The number of minutes played by the goalkeeper.
   */
  constructor({
    teamName,
    playerId,
    seasonCode,
    jerseyNumber,
    playerName,
    playerPosition,
    gamesPlayed,
    goals,
    assists,

    // Additional fields specific to hockeyGK
    shotsAgainst,
    goalsAgainst,
    goalsAgainstAverage,
    shutouts,
    minutesPlayed,
  }) {
    // Pass base fields
    super({
      teamName,
      playerId,
      seasonCode,
      jerseyNumber,
      playerName,
      playerPosition,
      gamesPlayed,
      goals,
      assists,
    });

    // Additional fields specific to hockeyGK are added
    this.shotsAgainst = shotsAgainst;
    this.goalsAgainst = goalsAgainst;
    this.goalsAgainstAverage = goalsAgainstAverage;
    this.shutouts = shutouts;
    this.minutesPlayed = minutesPlayed;
  }

  /**
     * Converts the hockeyGK instance to a plain JavaScript object.
     * @return {object} A plain JavaScript object representing the hockey goalkeeper.
     */
  toMap() {
    const baseMap = super.toMap();
    return {
      ...baseMap,
      shots_against: this.shotsAgainst,
      goals_against: this.goalsAgainst,
      goals_against_average: this.goalsAgainstAverage,
      shutouts: this.shutouts,
      minutes_played: this.minutesPlayed,
    };
  }
}

module.exports = {
  BaseRoster,
  SoccerPlayer,
  SoccerGK,
  HockeyPlayer,
  HockeyGK,
};
