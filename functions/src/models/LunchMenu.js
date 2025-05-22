export class LunchMenuItem {
    constructor({ itemName, description = '', allergens = [] }) {
        if (!itemName || typeof itemName !== 'string' || itemName.trim() === '') {
            throw new Error("LunchMenuItem: itemName is required and must be a non-empty string.");
        }
        this.itemName = itemName.trim();
        this.description = description;
        this.allergens = Array.isArray(allergens) ? allergens : [];
    }

    toMap() {
        return {
            item_name: this.itemName,
            description: this.description,
            allergens: this.allergens,
        };
    }
}

export class LunchMenuStation {
    constructor({ stationName, items = [] }) {
        if (!stationName || typeof stationName !== 'string' || stationName.trim() === '') {
            throw new Error("LunchMenuStation: stationName is required and must be a non-empty string.");
        }
        this.stationName = stationName.trim();
        this.items = items.map(item => item instanceof LunchMenuItem ? item : new LunchMenuItem(item));
    }

    toMap() {
        return {
            station_name: this.stationName,
            items: this.items.map(item => item.toMap()),
        };
    }
}

export class LunchMenu {
    constructor({ date, stations = [], notes = '' }) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error("LunchMenu: Invalid or missing date. Date must be a valid Date object.");
        }
        this.date = date; // Expecting a JavaScript Date object
        this.stations = stations.map(station => station instanceof LunchMenuStation ? station : new LunchMenuStation(station));
        this.notes = notes;
    }

    getFormattedDate() {
        const year = this.date.getFullYear();
        const month = String(this.date.getMonth() + 1).padStart(2, '0');
        const day = String(this.date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    toMap() {
        return {
            date: this.date, // Will be stored as Firestore Timestamp
            stations: this.stations.map(station => station.toMap()),
            notes: this.notes,
        };
    }
}

