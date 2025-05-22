// This file contains the Roster class which encapsulates roster data as an object.

export class BaseRoster {
    constructor({
        teamName = '',
        playerId = '',
        seasonCode = '',
        jerseyNumber = '',
        playerName = '',
        playerPosition = '',
        gamesPlayed = '',
        goals = '',
        assists = ''
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
            assists: this.assists
        };
    }
}

export class soccerPlayer extends BaseRoster {
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

        // Additional fields specific to soccerPlayer
        yellowCards = '',
        redCards = '',
        link = '',

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
            assists });

        // Additional fields specific to soccerPlayer are added
        this.yellowCards = yellowCards;
        this.redCards = redCards;
        this.link = link;

    }

    toMap() {
        const baseMap = super.toMap();
        return {
            ...baseMap,
            yellow_cards: this.yellowCards,
            red_cards: this.redCards,
            link: this.link
        };
    }
}

export class soccerGK extends BaseRoster {
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
        yellowCards = '',
        redCards = '',
        shotsAgainst = '',
        goalsAgainst = '',
        goalsAgainstAverage = '',
        shutouts = '',
        minutesPlayed = ''
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
            yellowCards,
            redCards,
            link});

        // Additional fields specific to soccerGK are added
        this.shotsAgainst = shotsAgainst;
        this.goalsAgainst = goalsAgainst;
        this.goalsAgainstAverage = goalsAgainstAverage;
        this.shutouts = shutouts;
        this.minutesPlayed = minutesPlayed;

    }

    toMap() {
        const baseMap = super.toMap();
        return {
            ...baseMap,
            shots_against: this.shotsAgainst,
            goals_against: this.goalsAgainst,
            goals_against_average: this.goalsAgainstAverage,
            shutouts: this.shutouts,
            minutes_played: this.minutesPlayed
        };
    }
}

export class hockeyPlayer extends BaseRoster {
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
                    points = '',
                    penaltyMinutes = '',
                    link = ''

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
            assists
        });

        // Additional fields specific to hockeyPlayer are added
        this.points = points;
        this.penaltyMinutes = penaltyMinutes;
        this.link = link;

    }

    toMap() {
        const baseMap = super.toMap();
        return {
            ...baseMap,
            points: this.points,
            penalty_minutes: this.penaltyMinutes,
            link: this.link
        };
    }
}

export class hockeyGK extends BaseRoster {
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

                    // Additional fields specific to hockeyGoalie
                    shotsAgainst = '',
                    goalsAgainst = '',
                    goalsAgainstAverage = '',
                    shutouts = '',
                    minutesPlayed = ''

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
        });

        // Additional fields specific to hockeyGoalie are added
        this.shotsAgainst = shotsAgainst;
        this.goalsAgainst = goalsAgainst;
        this.goalsAgainstAverage = goalsAgainstAverage;
        this.shutouts = shutouts;
        this.minutesPlayed = minutesPlayed;
        this.link = link;

    }

    toMap() {
        const baseMap = super.toMap();
        return {
            ...baseMap,
            shots_against: this.shotsAgainst,
            goals_against: this.goalsAgainst,
            goals_against_average: this.goalsAgainstAverage,
            shutouts: this.shutouts,
            minutes_played: this.minutesPlayed,
            link: this.link
        };
    }
}