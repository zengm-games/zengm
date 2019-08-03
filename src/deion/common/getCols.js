// @flow

import { helpers } from ".";
import type { SortOrder, SortType } from "./types";

type Col = {
    desc?: string,
    sortSequence?: SortOrder[],
    sortType?: SortType,
    title?: string, // Should actually be required, but is only added later
};

const sportSpecificCols: {
    [key: string]: Col,
} =
    process.env.SPORT === "basketball"
        ? {
              "rating:fg": {
                  desc: "Two Pointers",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:tp": {
                  desc: "Three Pointers",
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
                  desc: "Free Throws",
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
              "rating:diq": {
                  desc: "Defensive IQ",
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
              "stat:gmsc": {
                  desc: "Game Score",
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
                  desc:
                      "Offensive Rating (points produced/scored per 100 possessions)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ows": {
                  desc: "Offensive Win Shares",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pace": {
                  desc: "Possessions Per Game",
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
              "stat:pl": {
                  desc:
                      "Pythagorean Losses (expected losses based on points scored and allowed)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pts": {
                  desc: "Points",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pw": {
                  desc:
                      "Pythagorean Wins (expected wins based on points scored and allowed)",
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
              "stat:fgAtRim": {
                  desc: "At Rim Made",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgaAtRim": {
                  desc: "At Rim Attempted",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgpAtRim": {
                  desc: "At Rim Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgLowPost": {
                  desc: "Low Post Made",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgaLowPost": {
                  desc: "Low Post Attempted",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgpLowPost": {
                  desc: "Low Post Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgMidRange": {
                  desc: "Mid Range Made",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgaMidRange": {
                  desc: "Mid Range Attempted",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgpMidRange": {
                  desc: "Mid Range Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
          }
        : {
              "rating:thv": {
                  desc: "Throwing Vision",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:thp": {
                  desc: "Throwing Power",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:tha": {
                  desc: "Throwing Accuracy",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:bsc": {
                  desc: "Ball Security",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:elu": {
                  desc: "Elusiveness",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:rtr": {
                  desc: "Route Running",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:hnd": {
                  desc: "Hands",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:rbk": {
                  desc: "Run Blocking",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:pbk": {
                  desc: "Pass Blocking",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:pcv": {
                  desc: "Pass Coverage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:tck": {
                  desc: "Tackling",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:prs": {
                  desc: "Pass Rushing",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:rns": {
                  desc: "Run Stopping",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:kpw": {
                  desc: "Kicking Power",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:kac": {
                  desc: "Kicking Accuracy",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ppw": {
                  desc: "Punting Power",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:pac": {
                  desc: "Punting Accuracy",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrQB": {
                  desc: "Overall Rating (QB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrRB": {
                  desc: "Overall Rating (RB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrWR": {
                  desc: "Overall Rating (WR)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrTE": {
                  desc: "Overall Rating (TE)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrOL": {
                  desc: "Overall Rating (OL)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrDL": {
                  desc: "Overall Rating (DL)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrLB": {
                  desc: "Overall Rating (LB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrCB": {
                  desc: "Overall Rating (CB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrS": {
                  desc: "Overall Rating (S)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrK": {
                  desc: "Overall Rating (K)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrP": {
                  desc: "Overall Rating (P)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrKR": {
                  desc: "Overall Rating (KR)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:ovrPR": {
                  desc: "Overall Rating (PR)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "rating:potQB": {
                  desc: "Potential Rating (QB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potRB": {
                  desc: "Potential Rating (RB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potWR": {
                  desc: "Potential Rating (WR)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potTE": {
                  desc: "Potential Rating (TE)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potOL": {
                  desc: "Potential Rating (OL)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potDL": {
                  desc: "Potential Rating (DL)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potLB": {
                  desc: "Potential Rating (LB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potCB": {
                  desc: "Potential Rating (CB)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potS": {
                  desc: "Potential Rating (S)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potK": {
                  desc: "Potential Rating (K)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potP": {
                  desc: "Potential Rating (P)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potKR": {
                  desc: "Potential Rating (KR)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },

              "rating:potPR": {
                  desc: "Potential Rating (PR)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fmb": {
                  desc: "Fumbles",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fmbLost": {
                  desc: "Fumbles Lost",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssCmp": {
                  desc: "Completions",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pss": {
                  desc: "Passing Attempts",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssYds": {
                  desc: "Passing Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssTD": {
                  desc: "Passing Touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssInt": {
                  desc: "Interceptions",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssLng": {
                  desc: "Longest Pass",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssSk": {
                  desc: "Times Sacked",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssSkYds": {
                  desc: "Yards lost due to sacks",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rus": {
                  desc: "Rushing Attempts",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusYds": {
                  desc: "Rushing Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusTD": {
                  desc: "Rushing Touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusLng": {
                  desc: "Longest Run",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:tgt": {
                  desc: "Targets",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rec": {
                  desc: "Receptions",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recYds": {
                  desc: "Receiving Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recTD": {
                  desc: "Receiving Touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recLng": {
                  desc: "Longest Reception",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pr": {
                  desc: "Punt Returns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:prYds": {
                  desc: "Punt Return Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:prTD": {
                  desc: "Punts returned for touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:prLng": {
                  desc: "Longest Punt Return",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:kr": {
                  desc: "Kickoff Returns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:krYds": {
                  desc: "Kickoff Return Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:krTD": {
                  desc: "Kickoffs returned for touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:krLng": {
                  desc: "Longest Kickoff Return",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defInt": {
                  desc: "Interceptions",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defIntYds": {
                  desc: "Yards interceptions were returned for",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defIntTD": {
                  desc: "Interceptions returned for touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defIntLng": {
                  desc: "Longest Interception Return",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defPssDef": {
                  desc: "Passes Defended",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defFmbFrc": {
                  desc: "Forced Fumbles",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defFmbRec": {
                  desc: "Fumbles Recovered",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defFmbYds": {
                  desc: "Yards fumbles were returned for",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defFmbTD": {
                  desc: "Fumbles returned for touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defFmbLng": {
                  desc: "Longest Fumble Return",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defSk": {
                  desc: "Sacks",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defTckSolo": {
                  desc: "Solo Tackles",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defTckAst": {
                  desc: "Assists On Tackles",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defTckLoss": {
                  desc: "Tackes For Loss",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defSft": {
                  desc: "Safeties Scored",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fg0": {
                  desc: "Field Goals Made, 19 yards and under",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fga0": {
                  desc: "Field Goals Attempted, 19 yards and under",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fg20": {
                  desc: "Field Goals Made, 20-29 yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fga20": {
                  desc: "Field Goals Attempted, 20-29 yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fg30": {
                  desc: "Field Goals Made, 30-39 yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fga30": {
                  desc: "Field Goals Attempted, 30-39 yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fg40": {
                  desc: "Field Goals Made, 40-49 yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fga40": {
                  desc: "Field Goals Attempted, 40-49 yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fg50": {
                  desc: "Field Goals Made, 50+ yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fga50": {
                  desc: "Field Goals Attempted, 50+ yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:fgLng": {
                  desc: "Longest Field Goal",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:xp": {
                  desc: "Extra Points Made",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:xpa": {
                  desc: "Extra Points Attempted",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pnt": {
                  desc: "Times Punted",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pntYds": {
                  desc: "Total Punt Yardage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pntLng": {
                  desc: "Longest Punt",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pntBlk": {
                  desc: "Times Punts Blocked",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pen": {
                  desc: "Penalties",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:penYds": {
                  desc: "Penalty Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:cmpPct": {
                  desc: "Completion Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:qbRat": {
                  desc: "Quarterback Rating",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recYdsPerAtt": {
                  desc: "Yards Per Catch",
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
              "stat:fgPct": {
                  desc: "Field Goal Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:xpPct": {
                  desc: "Extra Point Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:kickingPts": {
                  desc: "Kicking Points",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pntYdsPerAtt": {
                  desc: "Yards Per Punt",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pntTB": {
                  desc: "Punt Touchbacks",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pntIn20": {
                  desc: "Punts Inside 20",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:krYdsPerAtt": {
                  desc: "Yards Per Kick Return",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:prYdsPerAtt": {
                  desc: "Yards Per Punt Return",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:defTck": {
                  desc: "Total Tackles",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:keyStats": {
                  desc: "Key Stats",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pts": {
                  desc: "",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:yds": {
                  desc: "Offensive Yards",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ply": {
                  desc: "Plays",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ydsPerPlay": {
                  desc: "Yards Per Play",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:tov": {
                  desc: "Turnovers",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:drives": {
                  desc: "Number of Drives",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:drivesScoringPct": {
                  desc: "Percentage of drives ending in a score",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:drivesTurnoverPct": {
                  desc: "Percentage of drives ending in a turnover",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:avgFieldPosition": {
                  desc: "Average Starting Field Position",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:timePerDrive": {
                  desc: "Time Per Drive (minutes)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:playsPerDrive": {
                  desc: "Number of Plays Per Drive",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ydsPerDrive": {
                  desc: "Yards Per Drive",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ptsPerDrive": {
                  desc: "Points Per Drive",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:qbRec": {
                  desc: "Team record as primary QB",
                  sortSequence: ["desc", "asc"],
                  sortType: "record",
              },
              "stat:pssTDPct": {
                  desc: "Percentage of passes that result in touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssIntPct": {
                  desc: "Percentage of passes that result in interceptions",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssYdsPerAtt": {
                  desc: "Pass Yards Per Attempt",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssAdjYdsPerAtt": {
                  desc:
                      "Adjusted Pass Yards Per Attempt ((yds + 20 * TD - 45 * int) / att)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssYdsPerCmp": {
                  desc: "Pass Yards Per Completion",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssYdsPerGame": {
                  desc: "Pass Yards Per Game",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssNetYdsPerAtt": {
                  desc: "Net Pass Yards Per Attempt (passes and sacks)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssAdjNetYdsPerAtt": {
                  desc:
                      "Adjusted Net Pass Yards Per Attempt ((yds + 20 * TD - 45 * int - skYds) / (att + sk))",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:pssSkPct": {
                  desc: "Percentage of times sacked when attempting a pass",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusYdsPerAtt": {
                  desc: "Rushing Yards Per Attempt",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusYdsPerGame": {
                  desc: "Rushing Yards Per Game",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusPerGame": {
                  desc: "Rushing Attempts Per Game",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recYdsPerRec": {
                  desc: "Yards Per Reception",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recPerGame": {
                  desc: "Receptions Per Game",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recYdsPerGame": {
                  desc: "Receiving Yards Per Game",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:recCatchPct": {
                  desc: "Catch Percentage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:touches": {
                  desc: "Tocuhes (Rushing Attempts And Receptions)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ydsPerTouch": {
                  desc: "Yards Per Touch",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:ydsFromScrimmage": {
                  desc: "Total Rushing and Receiving Yards From Scrimmage",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:rusRecTD": {
                  desc: "Total Rushing and Receiving Touchdowns",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:allPurposeYds": {
                  desc:
                      "All Purpose Yards (Rushing, Receiving, and Kick/Punt/Fumble/Interception Returns)",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
              "stat:av": {
                  desc: "Approximate Value",
                  sortSequence: ["desc", "asc"],
                  sortType: "number",
              },
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
    "# Fathers": {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "# Brothers": {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "# Sons": {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    A: {
        desc: "Attempted",
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
    "Cap Space": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
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
    "Desired Contract": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    Details: {},
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
    Mood: {},
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
    Relation: {},
    Result: {},
    Retired: {
        sortSequence: ["desc", "asc"],
    },
    "Revenue (YTD)": {
        sortSequence: ["desc", "asc"],
        sortType: "currency",
    },
    "Runner Up": {},
    Season: {
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    Skills: {},
    Talent: {
        desc: "Talent",
        sortType: "number",
    },
    T: {
        desc: "Ties",
        sortSequence: ["desc", "asc"],
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
    "rating:spd": {
        desc: "Speed",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "rating:stre": {
        desc: "Strength",
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
    "stat:mov": {
        desc: "Margin of Victory",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "stat:yearsWithTeam": {
        desc: "Years With Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:allDefense": {
        desc: "All Defensive Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:allLeague": {
        desc: "All League Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:allRookie": {
        desc: "All Rookie Team",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:bestRecord": {
        desc: "Best Record",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:bestRecordConf": {
        desc: "Best Conference Record",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:dpoy": {
        desc: "Defensive Player of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:mip": {
        desc: "Most Improved Player",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:mvp": {
        desc: "Most Valuable Player",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:roy": {
        desc: "Rookie of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:smoy": {
        desc: "Sixth Man of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:oroy": {
        desc: "Offensive Rookie of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "count:droy": {
        desc: "Defensive Rookie of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "award:dpoy": {
        desc: "Defensive Player of the Year",
        sortType: "name",
    },
    "award:finalsMvp": {
        desc: "Finals Most Valuable Player",
        sortType: "name",
    },
    "award:mip": {
        desc: "Most Improved Player",
        sortType: "name",
    },
    "award:mvp": {
        desc: "Most Valuable Player",
        sortType: "name",
    },
    "award:roy": {
        desc: "Rookie of the Year",
        sortType: "name",
    },
    "award:smoy": {
        desc: "Sixth Man of the Year",
        sortType: "name",
    },
    "award:oroy": {
        desc: "Offensive Rookie of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    "award:droy": {
        desc: "Defensive Rookie of the Year",
        sortSequence: ["desc", "asc"],
        sortType: "number",
    },
    ...sportSpecificCols,
};

const sportSpecificTitleOverrides =
    process.env.SPORT === "basketball"
        ? {
              "rating:fg": "2Pt",
              "rating:tp": "3Pt",
              "rating:oiq": "oIQ",
              "rating:dnk": "Dnk",
              "rating:drb": "Drb",
              "rating:ins": "Ins",
              "rating:jmp": "Jmp",
              "rating:ft": "FT",
              "rating:pss": "Pss",
              "rating:reb": "Reb",
              "rating:diq": "dIQ",
              "stat:pm": "+/-",
              "stat:tpp": "3P%",
              "stat:tp": "3P",
              "stat:tpa": "3PA",
              "stat:tpar": "3PAr",
              "stat:astp": "AST%",
              "stat:ast": "AST",
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
              "stat:gmsc": "GmSc",
              "stat:nrtg": "NRtg",
              "stat:orb": "ORB",
              "stat:orbp": "ORB%",
              "stat:ortg": "ORtg",
              "stat:ows": "OWS",
              "stat:pace": "Pace",
              "stat:per": "PER",
              "stat:pf": "PF",
              "stat:pl": "PL",
              "stat:pts": "PTS",
              "stat:pw": "PW",
              "stat:stl": "STL",
              "stat:stlp": "STL%",
              "stat:tovp": "TOV%",
              "stat:trb": "TRB",
              "stat:trbp": "TRB%",
              "stat:tsp": "TS%",
              "stat:tov": "TOV",
              "stat:usgp": "USG%",
              "stat:ws": "WS",
              "stat:ws48": "WS/48",
              "stat:fgAtRim": "AtRimFG",
              "stat:fgaAtRim": "AtRimFGA",
              "stat:fgpAtRim": "AtRimFGP",
              "stat:fgLowPost": "LowPostFG",
              "stat:fgaLowPost": "LowPostFGA",
              "stat:fgpLowPost": "LowPostFGP",
              "stat:fgMidRange": "MidRangeFG",
              "stat:fgaMidRange": "MidRangeFGA",
              "stat:fgpMidRange": "MidRangeFGP",
          }
        : {
              "rating:thv": "ThV",
              "rating:thp": "ThP",
              "rating:tha": "ThA",
              "rating:bsc": "BSc",
              "rating:elu": "Elu",
              "rating:rtr": "RtR",
              "rating:hnd": "Hnd",
              "rating:rbk": "RBk",
              "rating:pbk": "PBk",
              "rating:pcv": "PCv",
              "rating:tck": "Tck",
              "rating:prs": "PRs",
              "rating:rns": "RnS",
              "rating:kpw": "KPw",
              "rating:kac": "KAc",
              "rating:ppw": "PPw",
              "rating:pac": "PAc",
              "rating:ovrQB": "OvrQB",
              "rating:ovrRB": "OvrRB",
              "rating:ovrWR": "OvrWR",
              "rating:ovrTE": "OvrTE",
              "rating:ovrOL": "OvrOL",
              "rating:ovrDL": "OvrDL",
              "rating:ovrLB": "OvrLB",
              "rating:ovrCB": "OvrCB",
              "rating:ovrS": "OvrS",
              "rating:ovrK": "OvrK",
              "rating:ovrP": "OvrP",
              "rating:ovrKR": "OvrKR",
              "rating:ovrPR": "OvrPR",
              "rating:potQB": "PotQB",
              "rating:potRB": "PotRB",
              "rating:potWR": "PotWR",
              "rating:potTE": "PotTE",
              "rating:potOL": "PotOL",
              "rating:potDL": "PotDL",
              "rating:potLB": "PotLB",
              "rating:potCB": "PotCB",
              "rating:potS": "PotS",
              "rating:potK": "PotK",
              "rating:potP": "PotP",
              "rating:potKR": "PotKR",
              "rating:potPR": "PotPR",
              "stat:fmb": "Fmb",
              "stat:fmbLost": "FL",
              "stat:pssCmp": "Cmp",
              "stat:pss": "Att",
              "stat:pssYds": "Yds",
              "stat:pssTD": "TD",
              "stat:pssInt": "Int",
              "stat:pssLng": "Lng",
              "stat:pssSk": "Sk",
              "stat:pssSkYds": "Yds",
              "stat:rus": "Rush",
              "stat:rusYds": "Yds",
              "stat:rusTD": "TD",
              "stat:rusLng": "Lng",
              "stat:tgt": "Tgt",
              "stat:rec": "Rec",
              "stat:recYds": "Yds",
              "stat:recTD": "TD",
              "stat:recLng": "Lng",
              "stat:pr": "PR",
              "stat:prYds": "Yds",
              "stat:prTD": "TD",
              "stat:prLng": "Lng",
              "stat:kr": "KR",
              "stat:krYds": "Yds",
              "stat:krTD": "TD",
              "stat:krLng": "Lng",
              "stat:defInt": "Int",
              "stat:defIntYds": "Yds",
              "stat:defIntTD": "TD",
              "stat:defIntLng": "Lng",
              "stat:defPssDef": "PD",
              "stat:defFmbFrc": "FF",
              "stat:defFmbRec": "FR",
              "stat:defFmbYds": "Yds",
              "stat:defFmbLng": "Lng",
              "stat:defFmbTD": "TD",
              "stat:defSk": "Sk",
              "stat:defTckSolo": "Solo",
              "stat:defTckAst": "Ast",
              "stat:defTckLoss": "TFL",
              "stat:defSft": "Sfty",
              "stat:fg0": "FG10",
              "stat:fga0": "FGA10",
              "stat:fg20": "FG20",
              "stat:fga20": "FGA20",
              "stat:fg30": "FG30",
              "stat:fga30": "FGA30",
              "stat:fg40": "FG40",
              "stat:fga40": "FGA40",
              "stat:fg50": "FG50",
              "stat:fga50": "FGA50",
              "stat:fgLng": "Lng",
              "stat:xp": "XPM",
              "stat:xpa": "XPA",
              "stat:pnt": "Pnt",
              "stat:pntYds": "Yds",
              "stat:pntLng": "Lng",
              "stat:pntBlk": "Blk",
              "stat:pen": "Pen",
              "stat:penYds": "Yds",
              "stat:cmpPct": "Pct",
              "stat:qbRat": "QBRat",
              "stat:rusYdsPerAtt": "Y/A",
              "stat:recYdsPerAtt": "Y/A",
              "stat:fg": "FGM",
              "stat:fga": "FGA",
              "stat:fgPct": "Pct",
              "stat:xpPct": "Pct",
              "stat:kickingPts": "Pts",
              "stat:pntYdsPerAtt": "Y/A",
              "stat:pntTB": "TB",
              "stat:pntIn20": "In20",
              "stat:krYdsPerAtt": "Y/A",
              "stat:prYdsPerAtt": "Y/A",
              "stat:defTck": "Tck",
              "stat:keyStats": "Stats",
              "stat:pts": "Pts",
              "stat:yds": "Yds",
              "stat:ply": "Ply",
              "stat:ydsPerPlay": "Y/P",
              "stat:tov": "TO",
              "stat:drives": "#Dr",
              "stat:drivesScoringPct": "Sc%",
              "stat:drivesTurnoverPct": "TO%",
              "stat:avgFieldPosition": "Start",
              "stat:timePerDrive": "Tm/D",
              "stat:playsPerDrive": "Ply/D",
              "stat:ydsPerDrive": "Y/D",
              "stat:ptsPerDrive": "Pts/D",
              "stat:qbRec": "QBRec",
              "stat:pssTDPct": "TD%",
              "stat:pssIntPct": "Int%",
              "stat:pssYdsPerAtt": "Y/A",
              "stat:pssAdjYdsPerAtt": "AY/A",
              "stat:pssYdsPerCmp": "Y/C",
              "stat:pssYdsPerGame": "Y/G",
              "stat:pssNetYdsPerAtt": "NY/A",
              "stat:pssAdjNetYdsPerAtt": "ANY/A",
              "stat:pssSkPct": "Sk%",
              "stat:rusYdsPerGame": "Y/G",
              "stat:rusPerGame": "A/G",
              "stat:recYdsPerRec": "Y/R",
              "stat:recPerGame": "R/G",
              "stat:recYdsPerGame": "Y/G",
              "stat:recCatchPct": "Ctch%",
              "stat:touches": "Tch",
              "stat:ydsPerTouch": "Y/Tch",
              "stat:ydsFromScrimmage": "YScm",
              "stat:rusRecTD": "RRTD",
              "stat:allPurposeYds": "APY",
              "stat:av": "AV",
          };

const titleOverrides = {
    Talent: "T",
    "rating:endu": "End",
    "rating:hgt": "Hgt",
    "rating:spd": "Spd",
    "rating:stre": "Str",
    "stat:gp": "G",
    "stat:gs": "GS",
    "stat:min": "MP",
    "stat:mov": "MOV",
    "stat:yearsWithTeam": "YWT",
    "count:allDefense": "ADT",
    "count:allLeague": "ALT",
    "count:allRookie": "ART",
    "count:bestRecord": "BR",
    "count:bestRecordConf": "BRC",
    "count:dpoy": "DPOY",
    "count:mip": "MIP",
    "count:mvp": "MVP",
    "count:roy": "ROY",
    "count:smoy": "SMOY",
    "count:oroy": "OROY",
    "count:droy": "DROY",
    "award:dpoy": "DPOY",
    "award:finalsMvp": "Finals MVP",
    "award:mip": "MIP",
    "award:mvp": "MVP",
    "award:roy": "ROY",
    "award:smoy": "SMOY",
    "award:oroy": "OROY",
    "award:droy": "DROY",
    ...sportSpecificTitleOverrides,
};

for (const key of Object.keys(cols)) {
    if (
        key.startsWith("rating:") ||
        key.startsWith("stat:") ||
        key.startsWith("count:") ||
        key.startsWith("award:")
    ) {
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
