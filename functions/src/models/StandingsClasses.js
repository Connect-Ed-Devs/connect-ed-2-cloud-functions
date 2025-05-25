// This file contains the Standings class which encapsulates standings data as an object.
/**
 * Represents base standings for a team.
 */
class BaseStandings {
  /**
   * @param {Object} params - The parameters for the base standings.
   * @param {string} params.teamName - The name of the team.
   * @param {number} params.gamesPlayed - The number of games played.
   * @param {number} params.wins - The number of wins.
   * @param {number} params.losses - The number of losses.
   * @param {number} params.ties - The number of ties.
   * @param {number} params.points - The number of points.
   * @param {number} params.tableNum - The table number.
   * @param {number} params.sportId - The sport ID.
   * @param {number} params.schoolId - The school ID.
   * @param {string} params.standingsCode - The standings code.
   */
  constructor({
    teamName,
    gamesPlayed,
    wins,
    losses,
    ties,
    points,
    tableNum,
    sportId,
    schoolId,
    standingsCode,
    // tableNum or other fields you always have...
  }) {
    this.teamName = teamName;
    this.gamesPlayed = gamesPlayed;
    this.wins = wins;
    this.losses = losses;
    this.ties = ties;
    this.points = points;
    this.tableNum = tableNum;
    this.sportId = sportId;
    this.schoolId = schoolId;
    this.standingsCode = standingsCode;
  }

  /**
   * Converts the BaseStandings instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the base standings.
   */
  toMap() {
    return {
      teamName: this.teamName,
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      losses: this.losses,
      ties: this.ties,
      points: this.points,
      tableNum: this.tableNum,
      sportId: this.sportId,
      schoolId: this.schoolId,
      standingsCode: this.standingsCode,
    };
  }
}

/**
 * Represents soccer standings, extending BaseStandings.
 */
class SoccerStandings extends BaseStandings {
  /**
   * @param {Object} params - The parameters for the soccer standings.
   * @param {string} params.teamName - The name of the team.
   * @param {number} params.gamesPlayed - The number of games played.
   * @param {number} params.wins - The number of wins.
   * @param {number} params.losses - The number of losses.
   * @param {number} params.ties - The number of ties.
   * @param {number} params.points - The number of points.
   * @param {number} [params.tableNum=3] - The table number (default is 3).
   * @param {number} params.sportId - The sport ID.
   * @param {number} params.schoolId - The school ID.
   * @param {string} params.standingsCode - The standings code.
   * @param {number} params.goalsFor - The number of goals scored by the team.
   * @param {number} params.goalsAgainst - The number of goals scored against the team.
   * @param {number} params.goalDifference - The goal difference.
   * @param {number} params.pointsPercentage - The points percentage.
   * @param {number} params.yellowCards - The number of yellow cards.
   * @param {number} params.redCards - The number of red cards.
   * @param {string} params.gamesheetTeamId - The GameSheet Team ID.
   */
  constructor({
    // Base fields
    teamName,
    gamesPlayed,
    wins,
    losses,
    ties,
    points,
    tableNum = 3,
    sportId,
    schoolId,
    standingsCode,

    // Soccer-specific fields
    goalsFor,
    goalsAgainst,
    goalDifference,
    pointsPercentage,
    yellowCards,
    redCards,

    // GameSheet Team ID if available
    gamesheetTeamId,
  }) {
    // Pass base fields to parent constructor
    super({teamName, gamesPlayed, wins, losses, ties, points, tableNum, sportId, schoolId, standingsCode});

    // Set extra soccer fields
    this.goalsFor = goalsFor;
    this.goalsAgainst = goalsAgainst;
    this.goalDifference = goalDifference;
    this.pointsPercentage = pointsPercentage;
    this.yellowCards = yellowCards;
    this.redCards = redCards;
    this.gamesheetTeamId = gamesheetTeamId;
  }

  /**
   * Converts the SoccerStandings instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the soccer standings.
   */
  toMap() {
    return {
      ...super.toMap(),
      goalsFor: this.goalsFor,
      goalsAgainst: this.goalsAgainst,
      goalDifference: this.goalDifference,
      pointsPercentage: this.pointsPercentage,
      yellowCards: this.yellowCards,
      redCards: this.redCards,
      gamesheetTeamId: this.gamesheetTeamId,
    };
  }
}

/**
 * Represents hockey standings, extending BaseStandings.
 */
class HockeyStandings extends BaseStandings {
  /**
   * @param {Object} params - The parameters for the hockey standings.
   * @param {string} params.teamName - The name of the team.
   * @param {number} params.gamesPlayed - The number of games played.
   * @param {number} params.wins - The number of wins.
   * @param {number} params.losses - The number of losses.
   * @param {number} params.ties - The number of ties.
   * @param {number} params.points - The number of points.
   * @param {number} [params.tableNum=4] - The table number (default is 4).
   * @param {number} params.sportId - The sport ID.
   * @param {number} params.schoolId - The school ID.
   * @param {string} params.standingsCode - The standings code.
   * @param {number} params.overtimeWins - The number of overtime wins.
   * @param {number} params.overtimeLosses - The number of overtime losses.
   * @param {number} params.goalsFor - The number of goals scored by the team.
   * @param {number} params.goalsAgainst - The number of goals scored against the team.
   * @param {number} params.goalDifference - The goal difference.
   * @param {number} params.pointsPercentage - The points percentage.
   * @param {number} params.penaltyMinutes - The number of penalty minutes.
   * @param {number} params.powerPlayGoals - The number of power play goals.
   * @param {number} params.powerPlayGoalsAgainst - The number of power play goals against.
   * @param {number} params.shortHandedGoals - The number of short-handed goals.
   * @param {string} params.gamesheetTeamId - The GameSheet Team ID.
   */
  constructor({
    // Base fields
    teamName,
    gamesPlayed,
    wins,
    losses,
    ties,
    points,
    tableNum = 4,
    sportId,
    schoolId,
    standingsCode,

    // Hockey-specific fields
    overtimeWins,
    overtimeLosses,
    goalsFor,
    goalsAgainst,
    goalDifference,
    pointsPercentage,
    penaltyMinutes,
    powerPlayGoals,
    powerPlayGoalsAgainst,
    shortHandedGoals,

    // GameSheet Team ID if available
    gamesheetTeamId,
  }) {
    // Pass base fields to parent constructor
    super({teamName, gamesPlayed, wins, losses, ties, points, tableNum, sportId, schoolId, standingsCode});

    // Set extra hockey fields
    this.overtimeWins = overtimeWins;
    this.overtimeLosses = overtimeLosses;
    this.goalsFor = goalsFor;
    this.goalsAgainst = goalsAgainst;
    this.goalDifference = goalDifference;
    this.pointsPercentage = pointsPercentage;
    this.penaltyMinutes = penaltyMinutes;
    this.powerPlayGoals = powerPlayGoals;
    this.powerPlayGoalsAgainst = powerPlayGoalsAgainst;
    this.shortHandedGoals = shortHandedGoals;
    this.gamesheetTeamId = gamesheetTeamId;
  }

  /**
   * Converts the HockeyStandings instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the hockey standings.
   */
  toMap() {
    return {
      ...super.toMap(),
      overtimeWins: this.overtimeWins,
      overtimeLosses: this.overtimeLosses,
      goalsFor: this.goalsFor,
      goalsAgainst: this.goalsAgainst,
      goalDifference: this.goalDifference,
      pointsPercentage: this.pointsPercentage,
      penaltyMinutes: this.penaltyMinutes,
      powerPlayGoals: this.powerPlayGoals,
      powerPlayGoalsAgainst: this.powerPlayGoalsAgainst,
      shortHandedGoals: this.shortHandedGoals,
      gamesheetTeamId: this.gamesheetTeamId,
    };
  }
}

module.exports = {
  BaseStandings,
  SoccerStandings,
  HockeyStandings,
};
