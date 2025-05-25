/**
 * Represents a goal scored in a game.
 */
class Goal {
  /**
   * Creates an instance of Goal.
   * @param {object} params - The parameters for creating a goal.
   * @param {string} params.teamName - The name of the team that scored.
   * @param {string} params.minuteScored - The minute the goal was scored.
   * @param {string} params.period - The period in which the goal was scored.
   * @param {string} params.scorer - The name of the scorer.
   * @param {string} params.assister - The name of the assister.
   * @param {string} [params.preAssister] - The name of the pre-assister (used only for hockey).
   */
  constructor({teamName, minuteScored, period, scorer, assister, preAssister}) {
    this.teamName = teamName;
    this.minuteScored = minuteScored;
    this.period = period;
    this.scorer = scorer;
    this.assister = assister;
    this.preAssister = preAssister; // note: used only for hockey
  }

  /**
   * Converts the Goal instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the goal.
   */
  toMap() {
    return {
      teamName: this.teamName,
      minuteScored: this.minuteScored,
      period: this.period,
      scorer: this.scorer,
      assister: this.assister,
      preAssister: this.preAssister,
    };
  }
}

module.exports = {Goal};
