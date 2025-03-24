export class Goal {
    constructor({ teamName, minuteScored, scorer, assister, preAssister }) {
        this.teamName = teamName;
        this.minuteScored = minuteScored;
        this.scorer = scorer;
        this.assister = assister;
        this.preAssister = preAssister; // note: used only for hockey
    }
}
