// 1) Base class with common fields
export class BaseStandings {
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
}

// 2) Derived class for Soccer
export class SoccerStandings extends BaseStandings {
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
        super({ teamName, gamesPlayed, wins, losses, ties, points, tableNum, sportId, schoolId, standingsCode });

        // Set extra soccer fields
        this.goalsFor = goalsFor;
        this.goalsAgainst = goalsAgainst;
        this.goalDifference = goalDifference;
        this.pointsPercentage = pointsPercentage;
        this.yellowCards = yellowCards;
        this.redCards = redCards;
        this.gamesheetTeamId = gamesheetTeamId;
    }
}

// 3) Derived class for Hockey
export class HockeyStandings extends BaseStandings {
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
        super({ teamName, gamesPlayed, wins, losses, ties, points, tableNum, sportId, schoolId, standingsCode });

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
}

