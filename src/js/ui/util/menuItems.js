// @flow

import * as React from "react";

type MenuItemLink = {|
    type: "link",
    active: string => boolean,
    path: (number | string)[],
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
    children: MenuItemLink[],
|};

const menuItems: (MenuItemLink | MenuItemHeader)[] = [
    {
        type: "link",
        active: pageID => pageID === "leagueDashboard",
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
        children: [
            {
                type: "link",
                active: pageID => pageID === "standings",
                path: ["standings"],
                text: "Standings",
            },
            {
                type: "link",
                active: pageID => pageID === "playoffs",
                path: ["playoffs"],
                text: "Playoffs",
            },
            {
                type: "link",
                active: pageID => pageID === "leagueFinances",
                path: ["league_finances"],
                text: "Finances",
            },
            {
                type: "link",
                active: pageID =>
                    pageID === "history" || pageID === "historyAll",
                path: ["history_all"],
                text: "History",
            },
            {
                type: "link",
                active: pageID => pageID === "powerRankings",
                path: ["power_rankings"],
                text: "Power Rankings",
            },
            {
                type: "link",
                active: pageID => pageID === "transactions",
                path: ["transactions", "all"],
                text: "Transactions",
            },
        ],
    },
    {
        type: "header",
        long: "Team",
        short: "T",
        children: [
            {
                type: "link",
                active: pageID => pageID === "roster",
                path: ["roster"],
                text: "Roster",
            },
            {
                type: "link",
                active: pageID => pageID === "schedule",
                path: ["schedule"],
                text: "Schedule",
            },
            {
                type: "link",
                active: pageID => pageID === "teamFinances",
                path: ["team_finances"],
                text: "Finances",
            },
            {
                type: "link",
                active: pageID => pageID === "teamHistory",
                path: ["team_history"],
                text: "History",
            },
        ],
    },
    {
        type: "header",
        long: "Players",
        short: "P",
        children: [
            {
                type: "link",
                active: pageID => pageID === "freeAgents",
                path: ["free_agents"],
                text: "Free Agents",
            },
            {
                type: "link",
                active: pageID => pageID === "trade",
                path: ["trade"],
                text: "Trade",
            },
            {
                type: "link",
                active: pageID => pageID === "tradingBlock",
                path: ["trading_block"],
                text: "Trading Block",
            },
            {
                type: "link",
                active: pageID => pageID === "draft",
                path: ["draft"],
                text: "Draft",
            },
            {
                type: "link",
                active: pageID => pageID === "watchList",
                path: ["watch_list"],
                text: "Watch List",
            },
            {
                type: "link",
                active: pageID => pageID === "hallOfFame",
                path: ["hall_of_fame"],
                text: "Hall of Fame",
            },
        ],
    },
    {
        type: "header",
        long: "Stats",
        short: "S",
        children: [
            {
                type: "link",
                active: pageID => pageID === "gameLog",
                path: ["game_log"],
                text: "Game Log",
            },
            {
                type: "link",
                active: pageID => pageID === "leaders",
                path: ["leaders"],
                text: "League Leaders",
            },
            {
                type: "link",
                active: pageID => pageID === "playerRatings",
                path: ["player_ratings"],
                text: "Player Ratings",
            },
            {
                type: "link",
                active: pageID => pageID === "playerStats",
                path: ["player_stats"],
                text: "Player Stats",
            },
            {
                type: "link",
                active: pageID => pageID === "teamStats",
                path: ["team_stats"],
                text: "Team Stats",
            },
            {
                type: "link",
                active: pageID => pageID === "playerFeats",
                path: ["player_feats"],
                text: "Statistical Feats",
            },
        ],
    },
];

export default menuItems;
