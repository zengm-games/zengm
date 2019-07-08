// @flow

import * as React from "react";
import { takeScreenshot, toWorker } from ".";

type MenuItemLink = {|
    type: "link",
    active?: (string | void) => boolean,
    league?: true,
    godMode?: true,
    nonLeague?: true,
    onClick?: (SyntheticEvent<>) => void | false | Promise<void | false>, // Return false to leave sidebar open
    path?: string | (number | string)[],
    text:
        | string
        | React.Element<any>
        | {
              side: string | React.Element<any>,
              top: string | React.Element<any>,
          },
|};
type MenuItemHeader = {|
    type: "header",
    long: string,
    short: string,
    league?: true,
    nonLeague?: true,
    children: MenuItemLink[],
|};

const menuItems: (MenuItemLink | MenuItemHeader)[] = [
    {
        type: "link",
        active: pageID => pageID === "dashboard",
        nonLeague: true,
        path: "/",
        text: "Leagues",
    },
    {
        type: "link",
        active: pageID => pageID === "dashboard",
        league: true,
        path: "/",
        text: "Switch League",
    },
    {
        type: "link",
        active: pageID => pageID === "leagueDashboard",
        league: true,
        path: [],
        text: {
            side: "Dashboard",
            top: (
                <>
                    <span className="glyphicon glyphicon-home" />
                    <span className="d-inline d-sm-none ml-2">
                        League Dashboard
                    </span>
                </>
            ),
        },
    },
    {
        type: "header",
        long: "League",
        short: "L",
        league: true,
        children: [
            {
                type: "link",
                active: pageID => pageID === "standings",
                league: true,
                path: ["standings"],
                text: "Standings",
            },
            {
                type: "link",
                active: pageID => pageID === "playoffs",
                league: true,
                path: ["playoffs"],
                text: "Playoffs",
            },
            {
                type: "link",
                active: pageID => pageID === "leagueFinances",
                league: true,
                path: ["league_finances"],
                text: "Finances",
            },
            {
                type: "link",
                active: pageID =>
                    pageID === "history" || pageID === "historyAll",
                league: true,
                path: ["history_all"],
                text: "History",
            },
            {
                type: "link",
                active: pageID => pageID === "powerRankings",
                league: true,
                path: ["power_rankings"],
                text: "Power Rankings",
            },
            {
                type: "link",
                active: pageID => pageID === "transactions",
                league: true,
                path: ["transactions", "all"],
                text: "Transactions",
            },
        ],
    },
    {
        type: "header",
        long: "Team",
        short: "T",
        league: true,
        children: [
            {
                type: "link",
                active: pageID => pageID === "roster",
                league: true,
                path: ["roster"],
                text: "Roster",
            },
            ...(process.env.SPORT === "football"
                ? [
                      {
                          type: "link",
                          active: pageID => pageID === "depth",
                          league: true,
                          path: ["depth"],
                          text: "Depth Chart",
                      },
                  ]
                : []),
            {
                type: "link",
                active: pageID => pageID === "schedule",
                league: true,
                path: ["schedule"],
                text: "Schedule",
            },
            {
                type: "link",
                active: pageID => pageID === "teamFinances",
                league: true,
                path: ["team_finances"],
                text: "Finances",
            },
            {
                type: "link",
                active: pageID => pageID === "teamHistory",
                league: true,
                path: ["team_history"],
                text: "History",
            },
        ],
    },
    {
        type: "header",
        long: "Players",
        short: "P",
        league: true,
        children: [
            {
                type: "link",
                active: pageID => pageID === "freeAgents",
                league: true,
                path: ["free_agents"],
                text: "Free Agents",
            },
            {
                type: "link",
                active: pageID => pageID === "trade",
                league: true,
                path: ["trade"],
                text: "Trade",
            },
            {
                type: "link",
                active: pageID => pageID === "tradingBlock",
                league: true,
                path: ["trading_block"],
                text: "Trading Block",
            },
            {
                type: "link",
                active: pageID =>
                    typeof pageID === "string" && pageID.startsWith("draft"),
                league: true,
                path: ["draft"],
                text: "Draft",
            },
            {
                type: "link",
                active: pageID => pageID === "watchList",
                league: true,
                path: ["watch_list"],
                text: "Watch List",
            },
            {
                type: "link",
                active: pageID => pageID === "hallOfFame",
                league: true,
                path: ["hall_of_fame"],
                text: "Hall of Fame",
            },
        ],
    },
    {
        type: "header",
        long: "Stats",
        short: "S",
        league: true,
        children: [
            {
                type: "link",
                active: pageID => pageID === "gameLog",
                league: true,
                path: ["game_log"],
                text: "Game Log",
            },
            {
                type: "link",
                active: pageID => pageID === "leaders",
                league: true,
                path: ["leaders"],
                text: "League Leaders",
            },
            {
                type: "link",
                active: pageID => pageID === "playerRatings",
                league: true,
                path: ["player_ratings"],
                text: "Player Ratings",
            },
            {
                type: "link",
                active: pageID => pageID === "playerStats",
                league: true,
                path: ["player_stats"],
                text: "Player Stats",
            },
            {
                type: "link",
                active: pageID => pageID === "teamStats",
                league: true,
                path: ["team_stats"],
                text: "Team Stats",
            },
            {
                type: "link",
                active: pageID => pageID === "playerFeats",
                league: true,
                path: ["player_feats"],
                text: "Statistical Feats",
            },
        ],
    },
    {
        type: "header",
        long: "Tools",
        short: "X",
        league: true,
        nonLeague: true,
        children: [
            {
                type: "link",
                active: pageID => pageID === "account",
                league: true,
                nonLeague: true,
                path: "/account",
                text: "Achievements",
            },
            {
                type: "link",
                league: true,
                onClick() {
                    return toWorker("actions.toolsMenu.autoPlaySeasons");
                },
                text: "Auto Play",
            },
            {
                type: "link",
                active: pageID => pageID === "customizePlayer",
                godMode: true,
                league: true,
                path: ["customize_player"],
                text: "Create A Player",
            },
            {
                type: "link",
                active: pageID => pageID === "deleteOldData",
                league: true,
                path: ["delete_old_data"],
                text: "Delete Old Data",
            },
            {
                type: "link",
                active: pageID => pageID === "eventLog",
                league: true,
                path: ["event_log"],
                text: "Event Log",
            },
            {
                type: "link",
                active: pageID => pageID === "exportLeague",
                league: true,
                path: ["export_league"],
                text: "Export League",
            },
            {
                type: "link",
                active: pageID => pageID === "exportStats",
                league: true,
                path: ["export_stats"],
                text: "Export Stats",
            },
            {
                type: "link",
                active: pageID => pageID === "fantasyDraft",
                league: true,
                path: ["fantasy_draft"],
                text: "Fantasy Draft",
            },
            {
                type: "link",
                active: pageID => pageID === "frivolities",
                league: true,
                path: ["frivolities"],
                text: "Frivolities",
            },
            {
                type: "link",
                active: pageID => pageID === "godMode",
                league: true,
                path: ["god_mode"],
                text: "God Mode",
            },
            {
                type: "link",
                active: pageID => pageID === "manageTeams",
                league: true,
                godMode: true,
                path: ["manage_teams"],
                text: "Manage Teams",
            },
            {
                type: "link",
                active: pageID => pageID === "multiTeamMode",
                league: true,
                godMode: true,
                path: ["multi_team_mode"],
                text: "Multi Team Mode",
            },
            {
                type: "link",
                active: pageID => pageID === "newTeam",
                league: true,
                godMode: true,
                path: ["new_team"],
                text: "Switch Team",
            },
            {
                type: "link",
                active: pageID => pageID === "options",
                nonLeague: true,
                path: "/options",
                text: "Options",
            },
            {
                type: "link",
                active: pageID => pageID === "leagueOptions",
                league: true,
                path: ["options"],
                text: "Options",
            },
            {
                type: "link",
                league: true,
                nonLeague: true,
                onClick() {
                    takeScreenshot();
                },
                text: (
                    <span>
                        <span className="glyphicon glyphicon-camera" />{" "}
                        Screenshot
                    </span>
                ),
            },
            {
                type: "link",
                nonLeague: true,
                async onClick() {
                    const response = await toWorker(
                        "actions.toolsMenu.resetDb",
                    );
                    if (response) {
                        window.location.reload();
                    }
                    return false;
                },
                text: "Delete All Leagues",
            },
            {
                type: "link",
                active: pageID => pageID === "dangerZone",
                league: true,
                path: ["danger_zone"],
                text: "Danger Zone",
            },
        ],
    },
    {
        type: "header",
        long: "Help",
        short: "?",
        league: true,
        nonLeague: true,
        children: [
            {
                type: "link",
                league: true,
                nonLeague: true,
                path: `https://${process.env.SPORT}-gm.com/manual/`,
                text: "Overview",
            },
            {
                type: "link",
                active: pageID => pageID === "changes",
                league: true,
                nonLeague: true,
                path: "/changes",
                text: "Changes",
            },
            {
                type: "link",
                league: true,
                nonLeague: true,
                path: `https://${process.env.SPORT}-gm.com/manual/customization/`,
                text: "Custom Rosters",
            },
            {
                type: "link",
                league: true,
                nonLeague: true,
                path: `https://${process.env.SPORT}-gm.com/manual/debugging/`,
                text: "Debugging",
            },
        ],
    },
];

export default menuItems;
