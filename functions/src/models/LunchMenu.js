/**
 * Represents an item in a lunch menu.
 */
class LunchMenuItem {
  /**
   * Creates an instance of LunchMenuItem.
   * @param {object} params - The parameters for creating a lunch menu item.
   * @param {string} params.itemName - The name of the item.
   * @param {string} [params.description=""] - The description of the item.
   * @param {Array<string>} [params.allergens=[]] - A list of allergens for the item.
   */
  constructor({itemName, description = "", allergens = []}) {
    if (!itemName || typeof itemName !== "string" || itemName.trim() === "") {
      throw new Error("LunchMenuItem: itemName is required and must be a non-empty string.");
    }
    this.itemName = itemName.trim();
    this.description = description;
    this.allergens = Array.isArray(allergens) ? allergens : [];
  }

  /**
   * Converts the LunchMenuItem instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the lunch menu item.
   */
  toMap() {
    return {
      item_name: this.itemName,
      description: this.description,
      allergens: this.allergens,
    };
  }
}

/**
 * Represents a lunch menu station.
 */
class LunchMenuStation {
  /**
   * Creates an instance of LunchMenuStation.
   * @param {object} params - The parameters for creating a lunch menu station.
   * @param {string} params.stationName - The name of the station.
   * @param {Array<LunchMenuItem|object>} [params.items=[]] - A list of items at the station.
   */
  constructor({stationName, items = []}) {
    if (!stationName || typeof stationName !== "string" || stationName.trim() === "") {
      throw new Error("LunchMenuStation: stationName is required and must be a non-empty string.");
    }
    this.stationName = stationName.trim();
    this.items = items.map((item) => item instanceof LunchMenuItem ? item : new LunchMenuItem(item));
  }

  /**
   * Converts the LunchMenuStation instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the lunch menu station.
   */
  toMap() {
    return {
      station_name: this.stationName,
      items: this.items.map((item) => item.toMap()),
    };
  }
}

/**
 * Represents a lunch menu for a specific date.
 */
class LunchMenu {
  /**
   * Creates an instance of LunchMenu.
   * @param {object} params - The parameters for creating a lunch menu.
   * @param {Date} params.date - The date of the lunch menu. Expecting a JavaScript Date object.
   * @param {Array<LunchMenuStation|object>} [params.stations=[]] - A list of stations in the menu.
   * @param {string} [params.notes=""] - Any notes for the lunch menu.
   */
  constructor({date, stations = [], notes = ""}) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("LunchMenu: Invalid or missing date. Date must be a valid Date object.");
    }
    this.date = date; // Expecting a JavaScript Date object
    this.stations = stations.map((station) => station instanceof LunchMenuStation ? station : new LunchMenuStation(station));
    this.notes = notes;
  }

  /**
   * Gets the formatted date string (YYYY-MM-DD) for the lunch menu.
   * @return {string} The formatted date string.
   */
  getFormattedDate() {
    const year = this.date.getFullYear();
    const month = String(this.date.getMonth() + 1).padStart(2, "0");
    const day = String(this.date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Converts the LunchMenu instance to a plain JavaScript object.
   * @return {object} A plain JavaScript object representing the lunch menu.
   */
  toMap() {
    return {
      date: this.date, // Will be stored as Firestore Timestamp
      stations: this.stations.map((station) => station.toMap()),
      notes: this.notes,
    };
  }
}

module.exports = {
  LunchMenuItem,
  LunchMenuStation,
  LunchMenu,
};
