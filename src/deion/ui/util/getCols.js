// @flow

import { helpers } from ".";
import type { SortOrder, SortType } from "../../common/types";

type Col = {
    desc?: string,
    sortSequence?: SortOrder[],
    sortType?: SortType,
    title?: string, // Should actually be required, but is only added later
};

const cols: {
    [key: string]: Col,
} = {
    "": {
        sortSequence: ["desc", "asc"],
    },
    "#": {},
    "%": {
        desc: "Percentage",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    A: {
        desc: "Attempted",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    ADT: {
        desc: "All Defensive Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    ALT: {
        desc: "All League Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    ART: {
        desc: "All Rookie Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Age: {
        sortType: "number",
    },
    Amount: {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    "Asking For": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    "Avg Attendance": {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    BR: {
        desc: "Best Record",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    BRC: {
        desc: "Best Conference Record",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Cash: {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    Championships: {
        desc: "Championships Won",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Conference: {},
    Contract: {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    Count: {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Country: {},
    "Current Contract": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    DPOY: {
        desc: "Defensive Player of the Year",
        sortType: "name",
    },
    "Desired Contract": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    Division: {},
    Draft: {
        sortSequence: [],
    },
    "Draft Picks": {
        sortSequence: [],
    },
    Drafted: {},
    Finals: {
        desc: "Finals Appearances",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "Finals MVP": {
        desc: "Finals Most Valuable Player",
        sortType: "name",
    },
    GmSc: {
        desc: "Game Score",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    HOF: {
        sortSequence: ["desc", "asc"],
    },
    L: {
        desc: "Losses",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    L10: {
        desc: "Last Ten Games",
        sortSequence: ["desc", "asc"],
        sortType: "lastTen",
    },
    Last: {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "Last Playoffs": {
        sortType: "number",
    },
    "Last Season": {
        desc: "Last Season with Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "Last Title": {
        sortType: "number",
    },
    "League Champion": {},
    M: {
        desc: "Made",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    MIP: {
        desc: "Most Improved Player",
        sortType: "name",
    },
    MVP: {
        desc: "Most Valuable Player",
        sortType: "name",
    },
    Mood: {},
    MOV: {
        desc: "Margin of Victory",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Name: {
        sortType: "name",
    },
    Negotiate: {},
    O: {
        desc: "Overall",
        sortType: "number",
    },
    Opp: {
        desc: "Opponent",
    },
    Ovr: {
        desc: "Overall Rating",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    P: {
        desc: "Performance",
        sortType: "number",
    },
    PL: {
        desc:
            "Pythagorean Losses (expected losses based on points scored and allowed)",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    PW: {
        desc:
            "Pythagorean Wins (expected wins based on points scored and allowed)",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Pace: {
        desc: "Possessions Per Game",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Payroll: {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    "Peak Ovr": {
        desc: "Peak Overall Rating",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Pick: {
        desc: "Draft Pick",
        sortType: "draftPick",
    },
    Playoffs: {
        desc: "Playoff Appearances",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Pos: {
        desc: "Position",
    },
    Pot: {
        desc: "Potential Rating",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "Profit (YTD)": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    ROY: {
        desc: "Rookie of the Year",
        sortType: "name",
    },
    Reb: {
        desc: "Rebounds Per Game",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Result: {},
    Retired: {
        sortSequence: ["desc", "asc"],
    },
    "Revenue (YTD)": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    "Runner Up": {},
    SMOY: {
        desc: "Sixth Man of the Year",
        sortType: "name",
    },
    Season: {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Skills: {},
    T: {
        desc: "Talent",
        sortType: "number",
    },
    Team: {},
    W: {
        desc: "Wins",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    X: {
        desc: "Exclude from counter offers",
        sortSequence: [],
    },
    Year: {},

    "rating:fg": {
        desc: "Two-Point Shooting",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:tp": {
        desc: "Three-Point Shooting",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:oiq": {
        desc: "Offensive IQ",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:dnk": {
        desc: "Dunks/Layups",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:drb": {
        desc: "Dribbling",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:endu": {
        desc: "Endurance",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:hgt": {
        desc: "Height",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:ins": {
        desc: "Inside Scoring",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:jmp": {
        desc: "Jumping",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:ft": {
        desc: "Free Throw Shooting",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:pss": {
        desc: "Passing",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:reb": {
        desc: "Rebounding",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:spd": {
        desc: "Speed",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:diq": {
        desc: "Defensive IQ",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:stre": {
        desc: "Strength",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:pm": {
        desc: "Plus/Minus",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tpp": {
        desc: "Three Point Percentage",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tp": {
        desc: "Three Pointers Made",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tpa": {
        desc: "Three Pointers Attempted",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tpar": {
        desc: "Three Point Attempt Rate (3PA / FGA)",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:astp": {
        desc:
            "Percentage of teammate field goals a player assisted while on the floor",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ast": {
        desc: "Assists Per Game",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ba": {
        desc: "Blocks Against",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:blk": {
        desc: "Blocks",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:blkp": {
        desc: "Percentage of opponent two-pointers blocked",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:drb": {
        desc: "Defensive Rebounds",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:drbp": {
        desc: "Percentage of available defensive rebounds grabbed",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:drtg": {
        desc: "Defensive Rating (points allowed per 100 possessions)",
        sortSequence: ["asc", "desc"],
        sortType: "number",
    },
    "stat:dws": {
        desc: "Defensive Win Shares",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ewa": {
        desc: "Estimated Wins Added",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:fgp": {
        desc: "Field Goal Percentage",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:fg": {
        desc: "Field Goals Made",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:fga": {
        desc: "Field Goals Attempted",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ftp": {
        desc: "Free Throw Percentage",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ft": {
        desc: "Free Throws Made",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:fta": {
        desc: "Free Throws Attempted",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ftr": {
        desc: "Free Throw Attempt Rate (FTA / FGA)",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:gp": {
        desc: "Games Played",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:gs": {
        desc: "Games Started",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:min": {
        desc: "Minutes Per Game",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:nrtg": {
        desc: "Net Rating (point differential per 100 possessions)",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:orb": {
        desc: "Offensive Rebounds",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:orbp": {
        desc: "Percentage of available offensive rebounds grabbed",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ortg": {
        desc: "Offensive Rating (points produced/scored per 100 possessions)",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ows": {
        desc: "Offensive Win Shares",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:per": {
        desc: "Player Efficiency Rating",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:pf": {
        desc: "Personal Fouls",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:pts": {
        desc: "Points",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:stl": {
        desc: "Steals",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:stlp": {
        desc: "Percentage of opponent possessions ending in steals",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tovp": {
        desc: "Turnovers per 100 plays",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:trb": {
        desc: "Total Rebounds",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:trbp": {
        desc: "Percentage of available rebounds grabbed",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tsp": {
        desc: "True Shooting Percentage",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:tov": {
        desc: "Turnovers",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:usgp": {
        desc: "Percentage of team plays used",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ws": {
        desc: "Win Shares",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:ws48": {
        desc: "Win Shares Per 48 Minutes",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
};

const titleOverrides = {
    "rating:fg": "2Pt",
    "rating:tp": "3Pt",
    "rating:oiq": "oIQ",
    "rating:dnk": "Dnk",
    "rating:drb": "Drb",
    "rating:endu": "End",
    "rating:hgt": "Hgt",
    "rating:ins": "Ins",
    "rating:jmp": "Jmp",
    "rating:ft": "FT",
    "rating:pss": "Pss",
    "rating:reb": "Reb",
    "rating:spd": "Spd",
    "rating:diq": "dIQ",
    "rating:stre": "Str",
    "stat:pm": "+/-",
    "stat:tpp": "3P%",
    "stat:tp": "3P",
    "stat:tpa": "3PA",
    "stat:tpar": "3PAr",
    "stat:astp": "AST%",
    "stat:ast": "Ast",
    "stat:ba": "BA",
    "stat:blk": "Blk",
    "stat:blkp": "BLK%",
    "stat:drb": "DRB",
    "stat:drbp": "DRB%",
    "stat:drtg": "DRtg",
    "stat:dws": "DWS",
    "stat:ewa": "EWA",
    "stat:fgp": "FG%",
    "stat:fg": "FG",
    "stat:fga": "FGA",
    "stat:ftp": "FT%",
    "stat:ft": "FT",
    "stat:fta": "FTA",
    "stat:ftr": "FTr",
    "stat:gp": "G",
    "stat:gs": "GS",
    "stat:min": "Min",
    "stat:nrtg": "NRtg",
    "stat:orb": "ORB",
    "stat:orbp": "ORB%",
    "stat:ortg": "ORtg",
    "stat:ows": "OWS",
    "stat:per": "PER",
    "stat:pf": "PF",
    "stat:pts": "Pts",
    "stat:stl": "Stl",
    "stat:stlp": "STL%",
    "stat:tovp": "TOV%",
    "stat:trb": "TRB",
    "stat:trbp": "TRB%",
    "stat:tsp": "TS%",
    "stat:tov": "Tov",
    "stat:usgp": "USG%",
    "stat:ws": "WS",
    "stat:ws48": "WS/48",
};

for (const key of Object.keys(cols)) {
    if (key.startsWith("rating:") || key.startsWith("stat:")) {
        cols[key].title = titleOverrides[key];
    } else {
        cols[key].title = key;
    }
}

export default (...titles: string[]): Col[] => {
    return titles.map(title => {
        if (!cols.hasOwnProperty(title)) {
            throw new Error(`Unknown column: "${title}"`);
        }

        // Deep copy so other properties can be set on col, like width
        return helpers.deepCopy(cols[title]);
    });
};
