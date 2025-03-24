export class Goal {
    constructor({ teamName, minuteScored, period, scorer, assister, preAssister }) {
        this.teamName = teamName;
        this.minuteScored = minuteScored;
        this.period = period;
        this.scorer = scorer;
        this.assister = assister;
        this.preAssister = preAssister; // note: used only for hockey
    }
}
