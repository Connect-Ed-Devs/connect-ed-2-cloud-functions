// A class that holds static data for schools and provides lookup methods.
export class Schools {
    // Static array holding all school records.
    static data = [
        { id: 66, school_name: "Appleby College", abbreviation: "AC", logo_dir: "assets/AC Logo.png" },
        { id: 67, school_name: "Upper Canada College", abbreviation: "UCC", logo_dir: "assets/UCC Logo.png" },
        { id: 68, school_name: "St. Andrew's College", abbreviation: "SAC", logo_dir: "assets/SAC Logo.png" },
        { id: 69, school_name: "St. Michael's College", abbreviation: "SMC", logo_dir: "assets/SMC Logo.png" },
        { id: 70, school_name: "Crescent School", abbreviation: "CS", logo_dir: "assets/CS Logo.png" },
        { id: 71, school_name: "Royal St. George's College", abbreviation: "RSGC", logo_dir: "assets/RSGC Logo.png" },
        { id: 72, school_name: "Trinity College School", abbreviation: "TCS", logo_dir: "assets/TCS Logo.png" },
        { id: 73, school_name: "Crestwood Preparatory College", abbreviation: "CPC", logo_dir: "assets/CPC Logo.png" },
        { id: 74, school_name: "Hillfield Strathallan College", abbreviation: "HSC", logo_dir: "assets/HSC Logo.png" },
        { id: 75, school_name: "St. John's Kilmarnock School", abbreviation: "SJK", logo_dir: "assets/SJK Logo.png" },
        { id: 76, school_name: "Lakefield College School", abbreviation: "LCS", logo_dir: "assets/LCS Logo.png" },
        { id: 77, school_name: "Pickering College", abbreviation: "PC", logo_dir: "assets/PC Logo.png" },
        { id: 78, school_name: "Ridley College", abbreviation: "RC", logo_dir: "assets/RC Logo.png" },
        { id: 79, school_name: "De La Salle", abbreviation: "DLS", logo_dir: "assets/DLS Logo.png" },
        { id: 80, school_name: "Villanova College", abbreviation: "VC", logo_dir: "assets/VC Logo.png" },
        { id: 81, school_name: "Holy Trinity School", abbreviation: "HTS", logo_dir: "assets/HTS Logo.png" },
        { id: 82, school_name: "The York School", abbreviation: "YS", logo_dir: "assets/YS Logo.png" },
        { id: 83, school_name: "Sterling Hall School", abbreviation: "SHS", logo_dir: "assets/SHS Logo.png" },
        { id: 84, school_name: "Trafalgar Castle School", abbreviation: "TRAF", logo_dir: "assets/TRAF Logo.png" },
        { id: 85, school_name: "Country Day School", abbreviation: "CDS", logo_dir: "assets/CDS Logo.png" },
        { id: 86, school_name: "Bishop Strachan School", abbreviation: "BSS", logo_dir: "assets/BSS Logo.png" },
        { id: 87, school_name: "Havergal College", abbreviation: "HC", logo_dir: "assets/HC Logo.png" },
        { id: 88, school_name: "Hawthorn School", abbreviation: "HS", logo_dir: "assets/HS Logo.png" },
        { id: 89, school_name: "Branksome Hall", abbreviation: "BH", logo_dir: "assets/BH Logo.png" },
        { id: 90, school_name: "St. Mildred's Lightbourn School", abbreviation: "SMLS", logo_dir: "assets/SMLS Logo.png" },
        { id: 91, school_name: "Albert College", abbreviation: "ALB", logo_dir: "assets/ALB Logo.png" },
        { id: 92, school_name: "Bayview Glen", abbreviation: "BG", logo_dir: "assets/BG Logo.png" },
        { id: 93, school_name: "Greenwod School", abbreviation: "GS", logo_dir: "assets/GS Logo.png" },
        { id: 94, school_name: "Rosedale Day School", abbreviation: "RDS", logo_dir: "assets/RDS Logo.png" },
        { id: 95, school_name: "Toronto Montessori School", abbreviation: "TMS", logo_dir: "assets/TMS Logo.png" },
        { id: 96, school_name: "Toronto French School", abbreviation: "TFS", logo_dir: "assets/TFS Logo.png" },
        { id: 97, school_name: "Nichols School", abbreviation: "NS", logo_dir: "assets/NS Logo.png" },
        { id: 98, school_name: "Upper Canada College Prep", abbreviation: "UCCP", logo_dir: "assets/UCC Logo.png" },
        { id: 99, school_name: "St. Anne's School", abbreviation: "SAS", logo_dir: "assets/SAS Logo.png" },
        { id: 100, school_name: "Holy Name of Mary CS", abbreviation: "HNMCS", logo_dir: "assets/HNMCS Logo.png" },
        { id: 102, school_name: "Sterling Hall School (b)", abbreviation: "SHS (b)", logo_dir: "assets/SHS Logo.png" },
        { id: 103, school_name: "Greenwood College School", abbreviation: "GCS", logo_dir: "assets/GCS Logo.png" },
        { id: 104, school_name: "The York School", abbreviation: "TYS", logo_dir: "assets/GCS Logo.png" },
        { id: 105, school_name: "Branksome RSGC", abbreviation: "BHRSG", logo_dir: "assets/BH Logo.png" }
    ];

    // Get school data by abbreviation.
    static getSchoolByAbbreviation(abbr) {
        return this.data.find(school => school.abbreviation === abbr);
    }

    // Get school data by full school name.
    static getSchoolByName(name) {
        return this.data.find(school => school.school_name === name);
    }

    // Optionally, get all school records.
    static getAllSchools() {
        return this.data;
    }
}
