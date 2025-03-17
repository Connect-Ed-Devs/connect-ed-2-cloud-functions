// temporary file to hold sports data
// Will use cloud firestore in the future and query data from there
export class Sports {
    // Static data holds each sport as an array: [sport name, term, league_code]
    static data = [
        ["Flag Football Sr Boys DI", "Fall", "6TU0L9CN4"],
        ["Flag Football U14 Boys", "Fall", "69J1F14P0"],
        ["Soccer U14 Boys DII", "Fall", "2860Y8Q3F"],
        ["Volleyball Sr Boys DI", "Fall", "2860Y8NAP"],
        ["Volleyball Jr Boys DI", "Fall", "2860Y8OON"],
        ["Volleyball U14 Boys DII", "Fall", "2B519NKRQ"],
        ["Basketball Sr Girls DI", "Fall", "2860Y8ND5"],
        ["Basketball Jr Girls DI", "Fall", "2860Y8NFT"],
        ["Basketball U14 Girls DII", "Fall", "2B51AIN8X"],
        ["Field Hockey Sr Girls DI", "Fall", "2860Y8N2D"],
        ["Field Hockey Sr Girls DII", "Fall", "2860Y8ULR"],
        ["Field Hockey U14 Girls", "Fall", "2860Y8N3J"],
        ["Basketball Sr Boys DIB", "Winter", "3Z91AJ4A3"],
        ["Basketball Jr Boys DIB", "Winter", "5GK0JNPYQ"],
        ["Basketball Jr Boys DII", "Winter", "2860Y8UIL"],
        ["Basketball U14 Boys DII", "Winter", "2860Y8UK7"],
        ["Squash Sr Boys", "Winter", "2860Y8P31"],
        ["Squash Jr Boys", "Winter", "2860Y8P3R"],
        ["Squash U14 Boys", "Winter", "2860Y8PSV"],
        ["Volleyball Sr Girls DI", "Winter", "2860Y8NVH"],
        ["Volleyball Jr Girls DI", "Winter", "2860Y8NWF"],
        ["Volleyball Jr Girls DII", "Winter", "2BO1A0M4A"],
        ["Volleyball U14 Girls DII", "Winter", "2BO1C5CTB"],
        ["Futsal U14 Coed", "Winter", "6TU0LO9ZS"],
        ["Rugby Sr Boys 15's", "Spring", "2860Y8OA1"],
        ["Rugby Jr Boys 15's", "Spring", "2860Y8O2N"],
        ["Slow Pitch U14 Boys DII", "Spring", "2860Y8O7J"],
        ["Tennis Sr Boys", "Spring", "2860Y8PUL"],
        ["Tennis U14 Boys", "Spring", "2860Y8PTJ"],
        ["Soccer U14 Girls Spring DI", "Spring", "2860Y8O57"],
        ["Tennis Sr Girls", "Spring", "2860Y8PJD"],
        ["Tennis U14 Girls Doubles", "Spring", "2860Y8PLT"],
        ["Badminton Sr Coed", "Spring", "2860Y8PYD"],
        ["Ultimate Frisbee SR DI", "Spring", "2DR0EO85A"]
    ];

    /**
     * Returns the sport record matching the given league code.
     * @param {string} leagueCode - The league code to search for.
     * @returns {Array|undefined} The sport record [name, term, leagueCode] or undefined if not found.
     */
    static getSportByLeagueCode(leagueCode) {
        return this.data.find(sport => sport[2] === leagueCode);
    }

    /**
     * Returns the sport record matching the given sport name.
     * @param {string} name - The sport name to search for.
     * @returns {Array|undefined} The sport record [name, term, leagueCode] or undefined if not found.
     */
    static getSportByName(name) {
        return this.data.find(sport => sport[0] === name);
    }

    /**
     * Returns all sports that match the given term (e.g., "Fall", "Winter", "Spring").
     * @param {string} term - The term/season to filter by.
     * @returns {Array} An array of sports records.
     */
    static getSportsByTerm(term) {
        return this.data.filter(sport => sport[1] === term);
    }

    /**
     * Returns all sport records.
     * @returns {Array} An array of all sports records.
     */
    static getAllSports() {
        return this.data;
    }
}
