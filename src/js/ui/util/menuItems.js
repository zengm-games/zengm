// @flow

import * as React from "react";
import { toWorker } from ".";

const handleScreenshotClick = async e => {
    e.preventDefault();

    let contentElTemp = document.getElementById("screenshot-league");
    if (!contentElTemp) {
        contentElTemp = document.getElementById("screenshot-nonleague");
    }
    if (!contentElTemp) {
        throw new Error(
            "Missing DOM element #screenshot-league or #screenshot-nonleague",
        );
    }
    const contentEl = contentElTemp;

    // Add watermark
    const watermark = document.createElement("div");
    const navbarBrands = document.getElementsByClassName("navbar-brand");
    if (navbarBrands.length === 0) {
        return;
    }
    const navbarBrandParent = navbarBrands[0].parentElement;
    if (!navbarBrandParent) {
        return;
    }
    watermark.innerHTML = `<nav class="navbar navbar-default"><div class="container-fluid"><div class="navbar-header">${String(
        navbarBrandParent.innerHTML,
    )}</div><p class="navbar-text navbar-right" style="color: #000; font-weight: bold">Play your own league free at basketball-gm.com</p></div></nav>`;
    contentEl.insertBefore(watermark, contentEl.firstChild);
    contentEl.style.padding = "8px";

    // Add notifications
    const notifications = document
        .getElementsByClassName("notification-container")[0]
        .cloneNode(true);
    notifications.classList.remove("notification-container");
    for (let i = 0; i < notifications.childNodes.length; i++) {
        // Otherwise screeenshot is taken before fade in is complete
        const el = notifications.children[0];
        if (el.classList && typeof el.classList.remove === "function") {
            el.classList.remove("notification-fadein");
        }
    }
    contentEl.appendChild(notifications);

    const canvas = await html2canvas(contentEl, {
        background: "#fff",
    });

    // Remove watermark
    contentEl.removeChild(watermark);
    contentEl.style.padding = "";

    // Remove notifications
    contentEl.removeChild(notifications);

    logEvent({
        type: "screenshot",
        text: `Uploading your screenshot to Imgur...`,
        saveToDb: false,
        showNotification: true,
        persistent: false,
        extraClass: "notification-primary",
    });

    try {
        const data = await fetchWrapper({
            url: "https://imgur-apiv3.p.mashape.com/3/image",
            method: "POST",
            headers: {
                Authorization: "Client-ID c2593243d3ea679",
                "X-Mashape-Key":
                    "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
            },
            data: {
                image: canvas.toDataURL().split(",")[1],
            },
        });

        if (data.data.error) {
            console.log(data.data.error);
            throw new Error(data.data.error.message);
        }

        const url = `http://imgur.com/${data.data.id}`;
        const encodedURL = window.encodeURIComponent(url);

        logEvent({
            type: "screenshot",
            text: `<p><a href="${url}" target="_blank">Click here to view your screenshot.</a></p>
<a href="https://www.reddit.com/r/BasketballGM/submit?url=${encodedURL}">Share on Reddit</a><br>
<a href="https://twitter.com/intent/tweet?url=${encodedURL}&via=basketball_gm">Share on Twitter</a>`,
            saveToDb: false,
            showNotification: true,
            persistent: true,
            extraClass: "notification-primary",
        });
    } catch (err) {
        console.log(err);
        let errorMsg;
        if (
            err &&
            err.responseJSON &&
            err.responseJSON.error &&
            err.responseJSON.error.message
        ) {
            errorMsg = `Error saving screenshot. Error message from Imgur: "${
                err.responseJSON.error.message
            }"`;
        } else if (err.message) {
            errorMsg = `Error saving screenshot. Error message from Imgur: "${
                err.message
            }"`;
        } else {
            errorMsg = "Error saving screenshot.";
        }
        logEvent({
            type: "error",
            text: errorMsg,
            saveToDb: false,
        });
    }
};

const handleToolsClick = async (id, e) => {
    e.preventDefault();
    const response = await toWorker(`actions.toolsMenu.${id}`);
    if (id === "resetDb" && response) {
        window.location.reload();
    }
};

type MenuItemLink = {|
    type: "link",
    active?: string => boolean,
    godMode?: true,
    onClick?: (SyntheticEvent<>) => void,
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
    {
        type: "header",
        long: "Tools",
        short: "X",
        children: [
            {
                type: "link",
                path: "/account",
                text: "Achievements",
            },
            {
                type: "link",
                onClick(e) {
                    handleToolsClick("autoPlaySeasons", e);
                },
                text: "Auto Play Seasons",
            },
            {
                type: "link",
                active: pageID => pageID === "customizePlayer",
                godMode: true,
                path: ["customize_player"],
                text: "Create A Player",
            },
            {
                type: "link",
                active: pageID => pageID === "deleteOldData",
                path: ["delete_old_data"],
                text: "Delete Old Data",
            },
            {
                type: "link",
                active: pageID => pageID === "editTeamInfo",
                godMode: true,
                path: ["edit_team_info"],
                text: "Edit Team Info",
            },
            {
                type: "link",
                active: pageID => pageID === "eventLog",
                path: ["event_log"],
                text: "Event Log",
            },
            {
                type: "link",
                active: pageID => pageID === "exportLeague",
                path: ["export_league"],
                text: "Export League",
            },
            {
                type: "link",
                active: pageID => pageID === "exportStats",
                path: ["export_stats"],
                text: "Export Stats",
            },
            {
                type: "link",
                active: pageID => pageID === "fantasyDraft",
                path: ["fantasy_draft"],
                text: "Fantasy Draft",
            },
            {
                type: "link",
                active: pageID => pageID === "godMode",
                path: ["god_mode"],
                text: "God Mode",
            },
            {
                type: "link",
                active: pageID => pageID === "multiTeamMode",
                godMode: true,
                path: ["multi_team_mode"],
                text: "Multi Team Mode",
            },
            {
                type: "link",
                active: pageID => pageID === "newTeam",
                godMode: true,
                path: ["new_team"],
                text: "Switch Team",
            },
            {
                type: "link",
                active: pageID => pageID === "options",
                path: ["options"],
                text: "Options",
            },
            {
                type: "link",
                onClick: handleScreenshotClick,
                text: (
                    <span>
                        <span className="glyphicon glyphicon-camera" />{" "}
                        Screenshot
                    </span>
                ),
            },
            {
                type: "link",
                active: pageID => pageID === "dangerZone",
                path: ["danger_zone"],
                text: "Danger Zone",
            },
        ],
    },
    {
        type: "header",
        long: "Help",
        short: "?",
        children: [
            {
                type: "link",
                path: "https://basketball-gm.com/manual/",
                text: "Overview",
            },
            {
                type: "link",
                path: "/changes",
                text: "Changes",
            },
            {
                type: "link",
                path: "https://basketball-gm.com/manual/customization/",
                text: "Custom Rosters",
            },
            {
                type: "link",
                path: "https://basketball-gm.com/manual/debugging/",
                text: "Debugging",
            },
        ],
    },
];

export default menuItems;
