/**
 * Sports class representing a collection of sports records.
 */
class Sports {
  // Static array holding all sport records.
  static data = [
    ["Flag Football Sr Boys DI", "Fall", "6TU0L9CN4", false],
    ["Flag Football U14 Boys", "Fall", "69J1F14P0", false],
    ["Football Sr Boys", "Fall", "2860Y8MWX", false],
    ["Soccer Sr Boys DI", "Fall", "2860Y8N5D", true],
    ["Soccer Sr Boys DIB", "Fall", "6TU16OCAM", true],
    ["Soccer Sr Boys DII", "Fall", "2860Y8SQZ", true],
    ["Soccer Sr Boys DIII", "Fall", "2860Y8NIZ", true],
    ["Soccer Jr Boys DI", "Fall", "2860Y8N9V", true],
    ["Soccer Jr Boys DIB", "Fall", "5GK0HUT9S", true],
    ["Soccer Jr Boys DII", "Fall", "2860Y8UL1", true],
    ["Soccer Jr Boys DIII", "Fall", "2860Y8QSJ", true],
    ["Soccer U14 Boys DI", "Fall", "2860Y8N7H", false],
    ["Soccer U14 Boys DII", "Fall", "2860Y8Q3F", false],
    ["Soccer U14 Boys DIIB", "Fall", "6W61BEE6T", false],
    ["Soccer U13 Boys DI", "Fall", "2860Y8N6T", false],
    ["Soccer U13 Boys DII", "Fall", "2860Y8N57", false],
    ["Soccer U12 Boys", "Fall", "2AC0DY8K3", false],
    ["Soccer U11 Boys", "Fall", "2A70G6P3Q", false],
    ["Soccer U10 Boys", "Fall", "2A70G8ET3", false],
    ["Volleyball Sr Boys DI", "Fall", "2860Y8NAP", false],
    ["Volleyball Sr Boys DII", "Fall", "2860Y8OX1", false],
    ["Volleyball Sr Boys DIII", "Fall", "31312JJRO", false],
    ["Volleyball Jr Boys DI", "Fall", "2860Y8OON", false],
    ["Volleyball Jr Boys DII", "Fall", "2WO1A9SHY", false],
    ["Volleyball U14 Boys DI", "Fall", "2860Y8N8R", false],
    ["Volleyball U14 Boys DII", "Fall", "2B519NKRQ", false],
    ["Volleyball U14 Boys DIII", "Fall", "69X0TA88U", false],
    ["Volleyball U12 Boys", "Fall", "3HS0FGO1E", false],
    ["Basketball Sr Girls DI", "Fall", "2860Y8ND5", false],
    ["Basketball Sr Girls DIB", "Fall", "5550ML66K", false],
    ["Basketball Sr Girls DII", "Fall", "2860Y8SQ1", false],
    ["Basketball Sr Girls DIII", "Fall", "2860Y8NC7", false],
    ["Basketball Jr Girls DI", "Fall", "2860Y8NFT", false],
    ["Basketball Jr Girls DII", "Fall", "2860Y8RL9", false],
    ["Basketball Jr Girls DIIB", "Fall", "6W51D3JTI", false],
    ["Basketball U14 Girls DI", "Fall", "2860Y8NEH", false],
    ["Basketball U14 Girls DIB", "Fall", "6W51BX5L7", false],
    ["Basketball U14 Girls DII", "Fall", "2B51AIN8X", false],
    ["Basketball U14 Girls DIII", "Fall", "2860Y8NGV", false],
    ["Basketball U13 Girls DI", "Fall", "2860Y8NHP", false],
    ["Basketball U13 Girls DII", "Fall", "6JJ1946S7", false],
    ["Basketball U12 Girls", "Fall", "2860Y8SZ9", false],
    ["Basketball U11 Girls", "Fall", "2WO1A3OKF", false],
    ["Basketball U10 Girls", "Fall", "4D90EZHCI", false],
    ["Field Hockey Sr Girls DI", "Fall", "2860Y8N2D", false],
    ["Field Hockey Sr Girls DIB", "Fall", "56C0NDMME", false],
    ["Field Hockey Sr Girls DII", "Fall", "2860Y8ULR", false],
    ["Field Hockey Sr Girls DIII", "Fall", "2860Y8N0X", false],
    ["Field Hockey Jr Girls", "Fall", "2860Y8QH1", false],
    ["Field Hockey U14 Girls", "Fall", "2860Y8N3J", false],
    ["Flag Football Sr Girls DI", "Fall", "67G0YK5EQ", false],
    ["Flag Football Sr Girls DII", "Fall", "6W70MH4MT", false],
    ["Flag Football Jr Girls DI", "Fall", "6W70N72DI", false],
    ["Flag Football U14 Girls", "Fall", "67G0YQS36", false],
    ["Soccer Sr Girls Fall DI", "Fall", "2860Y8MYT", true],
    ["Soccer Sr Girls Fall DII", "Fall", "2860Y8UMH", true],
    ["Soccer Jr Girls Fall", "Fall", "6JH1BRXA6", true],
    ["Soccer U14 Girls Fall DI", "Fall", "54Q1C6WLI", false],
    ["Soccer U14 Girls Fall DIB", "Fall", "6LZ0E9324", false],
    ["Soccer U12 Girls Fall", "Fall", "2860Y8T03", false],
    ["Soccer U10 Girls Fall", "Fall", "4SV0P6FX5", false],
    ["Swimming Fall", "Fall", "2AD0JA1GX", false],
    ["Cross Country HS", "Fall", "2AD0GX5Z3", false],
    ["Cross Country Elementary", "Fall", "2AD0H3ETP", false],
    ["Basketball Sr Boys DI", "Winter", "2860Y8OYB", false],
    ["Basketball Sr Boys DIB", "Winter", "3Z91AJ4A3", false],
    ["Basketball Sr Boys DII", "Winter", "2860Y8REJ", false],
    ["Basketball Sr Boys DIII", "Winter", "2860Y8MU3", false],
    ["Basketball Jr Boys DI", "Winter", "2860Y8NKF", false],
    ["Basketball Jr Boys DIB", "Winter", "5GK0JNPYQ", false],
    ["Basketball Jr Boys DII", "Winter", "2860Y8UIL", false],
    ["Basketball Jr Boys DIII", "Winter", "2860Y8NLH", false],
    ["Basketball U14 Boys DI", "Winter", "2860Y8NPD", false],
    ["Basketball U14 Boys DIB", "Winter", "5FI12S6NY", false],
    ["Basketball U14 Boys DII", "Winter", "2860Y8UK7", false],
    ["Basketball U14 Boys DIII", "Winter", "2860Y8NRF", false],
    ["Basketball U13 Boys DI", "Winter", "2860Y8NMB", false],
    ["Basketball U13 Boys DIB", "Winter", "6W60H5EED", false],
    ["Basketball U13 Boys DII", "Winter", "2860Y8NML", false],
    ["Basketball U12 Boys", "Winter", "28O0IJYEP", false],
    ["Basketball U11 Boys", "Winter", "2A70G9TQF", false],
    ["Basketball U10 Boys", "Winter", "2A70GEIW9", false],
    ["Hockey Sr Boys DI", "Winter", "2860Y8NS5", true],
    ["Hockey Sr Boys NC DI", "Winter", "37M0IXAEZ", true],
    ["Hockey Sr Boys NC DIB", "Winter", "4WQ1A8HQI", true],
    ["Hockey Sr Boys NC DII", "Winter", "2860Y8STB", true],
    ["Hockey Jr Boys DI", "Winter", "67A134XG6", true],
    ["Hockey U14 Boys DI", "Winter", "2860Y8NNP", false],
    ["Hockey U14 Boys DII", "Winter", "2860Y8Q45", false],
    ["Hockey U12 Boys", "Winter", "2A70INJS2", false],
    ["Squash Sr Boys", "Winter", "2860Y8P31", false],
    ["Squash Jr Boys", "Winter", "2860Y8P3R", false],
    ["Squash U14 Boys", "Winter", "2860Y8PSV", false],
    ["Badminton Sr Girls", "Winter", "2860Y8P4P", false],
    ["Badminton Jr Girls", "Winter", "2860Y8P5F", false],
    ["Badminton U14 Girls", "Winter", "2860Y8P61", false],
    ["Badminton U13 Girls", "Winter", "2860Y8MWF", false],
    ["Hockey Sr Girls DI", "Winter", "2860Y8NMV", true],
    ["Hockey Sr Girls DIB", "Winter", "2860Y8NQX", true],
    ["Hockey Sr Girls DII", "Winter", "2860Y8UJH", true],
    ["Squash Sr Girls", "Winter", "5460GTE91", false],
    ["Volleyball Sr Girls DI", "Winter", "2860Y8NVH", false],
    ["Volleyball Sr Girls DIB", "Winter", "4S70A7NK3", false],
    ["Volleyball Sr Girls DII", "Winter", "2BO1AXBXR", false],
    ["Volleyball Sr Girls DIII", "Winter", "2860Y8NSR", false],
    ["Volleyball Jr Girls DI", "Winter", "2860Y8NWF", false],
    ["Volleyball Jr Girls DII", "Winter", "2BO1A0M4A", false],
    ["Volleyball Jr Girls DIII", "Winter", "2860Y8PC5", false],
    ["Volleyball U14 Girls DI", "Winter", "2860Y8P97", false],
    ["Volleyball U14 Girls DII", "Winter", "2BO1C5CTB", false],
    ["Volleyball U14 Girls DIIB", "Winter", "6W70QOZIF", false],
    ["Volleyball U14 Girls DIII", "Winter", "2860Y8NT9", false],
    ["Volleyball U13 Girls DI", "Winter", "2860Y8NXX", false],
    ["Volleyball U13 Girls DII", "Winter", "47I0DJ4P6", false],
    ["Volleyball U12 Girls", "Winter", "2860Y8T1X", false],
    ["Volleyball U11 Girls", "Winter", "2WO1A1OUT", false],
    ["Volleyball U10 Girls", "Winter", "4D90F23EC", false],
    ["Alpine Skiing", "Winter", "2AD0JZI99", false],
    ["Alpine Skiing U14", "Winter", "4JH0VI7TF", false],
    ["Curling Div I", "Winter", "2AD0KCRKF", false],
    ["Curling Div II", "Winter", "2IN0LB0PI", false],
    ["Curling U14 Coed", "Winter", "4RW0RVLZG", false],
    ["Futsal U14 Coed", "Winter", "6TU0LO9ZS", false],
    ["Nordic Ski", "Winter", "2AD0KB2H7", false],
    ["Snowboarding", "Winter", "2AF0JA088", false],
    ["Swimming HS Coed", "Winter", "2AD0JI15P", false],
    ["Swimming ELE Coed", "Winter", "2AD0JV1G7", false],
    ["Baseball Sr Boys DI", "Spring", "2860Y8Q1V", false],
    ["Baseball Sr Boys DIB", "Spring", "5FI11KHT3", false],
    ["Golf Sr Boys", "Spring", "6JG19ROTT", false],
    ["Golf Jr Boys", "Spring", "6JG18GGK7", false],
    ["Lacrosse Sr Boys", "Spring", "2860Y8OBX", false],
    ["Lacrosse U14 Boys", "Spring", "2860Y8Q4R", false],
    ["Rugby Sr Boys 15's", "Spring", "2860Y8OA1", false],
    ["Rugby Sr Boys 7's", "Spring", "41F1BW798", false],
    ["Rugby Jr Boys 15's", "Spring", "2860Y8O2N", false],
    ["Rugby Jr Boys 7's", "Spring", "3RB0NWL58", false],
    ["Rugby U14 Boys DI Touch", "Spring", "2860Y8O07", false],
    ["Rugby U14 Boys DII Touch", "Spring", "3PJ0FSNX6", false],
    ["Slow Pitch Sr Boys", "Spring", "2860Y8OD1", false],
    ["Slow Pitch U14 Boys DI", "Spring", "2860Y8SCT", false],
    ["Slow Pitch U14 Boys DII", "Spring", "2860Y8O7J", false],
    ["Slow Pitch U12 Boys", "Spring", "2A70GHFBT", false],
    ["Slow Pitch U11 Boys", "Spring", "2L8199CL7", false],
    ["Tennis Sr Boys", "Spring", "2860Y8PUL", false],
    ["Tennis Jr Boys", "Spring", "2860Y8ODJ", false],
    ["Tennis U14 Boys", "Spring", "2860Y8PTJ", false],
    ["Golf Sr Girls", "Spring", "6JG18JH77", false],
    ["Rugby Sr Girls 7's DI", "Spring", "37N0DVVAB", false],
    ["Rugby Sr Girls 7's DIB", "Spring", "5CP0RKUV9", false],
    ["Rugby Sr Girls 7's DII", "Spring", "6LK19FC1T", false],
    ["Rugby Jr Girls 7's", "Spring", "5CP0RQYAV", false],
    ["Rugby U14 Girls Touch", "Spring", "422148P60", false],
    ["Soccer Sr Girls Spring DI", "Spring", "2860Y8O0H", true],
    ["Soccer Sr Girls Spring DII", "Spring", "2860Y8Q2L", true],
    ["Soccer Jr Girls Spring", "Spring", "2860Y8O3V", true],
    ["Soccer U14 Girls Spring DI", "Spring", "2860Y8O57", false],
    ["Soccer U12 Girls Spring", "Spring", "3FN0YCA5F", false],
    ["Softball Sr Girls DI", "Spring", "2860Y8O83", false],
    ["Softball Sr Girls DII", "Spring", "2860Y8OJF", false],
    ["Softball Jr Girls", "Spring", "2860Y8O9B", false],
    ["Softball U14 Girls", "Spring", "2860Y8OAP", false],
    ["Softball U13 Girls", "Spring", "2860Y8OCF", false],
    ["Softball U12 Girls", "Spring", "2860YFJVS", false],
    ["Tennis Sr Girls", "Spring", "2860Y8PJD", false],
    ["Tennis Jr Girls", "Spring", "2860Y8PKR", false],
    ["Tennis U14 Girls Doubles", "Spring", "2860Y8PLT", false],
    ["Tennis U13 Girls", "Spring", "2860Y8PMN", false],
    ["Badminton Sr Coed", "Spring", "2860Y8PYD", false],
    ["Badminton Jr Coed", "Spring", "2860Y8PZR", false],
    ["Badminton U14 Coed", "Spring", "2860Y8Q0X", false],
    ["Track & Field HS Coed", "Spring", "2AD0KGHQA", false],
    ["Track & Field ELE Coed", "Spring", "2AD0KIP95", false],
    ["Ultimate Frisbee SR DI", "Spring", "2DR0EO85A", false],
    ["Ultimate Frisbee SR DII", "Spring", "2WO19VYCD", false],
    ["Ultimate Frisbee SR DIII", "Spring", "6JH1DBQR7", false],
    ["Ultimate Frisbee Jr DI", "Spring", "4JI0LHHYU", false],
    ["Ultimate Frisbee Jr DII", "Spring", "6VG13HJP3", false],
    ["Ultimate Frisbee U14 Coed DI", "Spring", "6JH1C3LFN", false],
    ["Ultimate Frisbee U14 Coed DII", "Spring", "6JH1C8K13", false],
    ["Ultimate Frisbee U12 Coed", "Spring", "69K0HJNPP", false],
  ];
  /**
   * Returns the sport record matching the given league code.
   * @param {string} leagueCode - The league code to search for.
   * @return {Array<string|boolean>|undefined} The sport record [name, term, leagueCode, usesGamesheet] or undefined if not found.
   */
  static getSportByLeagueCode(leagueCode) {
    return this.data.find((sport) => sport[2] === leagueCode);
  }

  /**
     * Returns the sport record matching the given sport name.
     * @param {string} name - The sport name to search for.
     * @return {Array|undefined} The sport record [name, term, leagueCode] or undefined if not found.
     */
  static getSportByName(name) {
    return this.data.find((sport) => sport[0] === name);
  }

  /**
     * Returns all sports that match the given term (e.g., "Fall", "Winter", "Spring").
     * @param {string} term - The term/season to filter by.
     * @return {Array} An array of sports records.
     */
  static getSportsByTerm(term) {
    return this.data.filter((sport) => sport[1] === term);
  }

  /**
     * Returns all sport records.
     * @return {Array} An array of all sports records.
     */
  static getAllSports() {
    return this.data;
  }
}

module.exports = {
  Sports,

};

