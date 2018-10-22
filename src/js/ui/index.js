// @flow

/* eslint-disable import/first */
import "../common/polyfills";
import router from "bbgm-router";
import createBugsnagErrorBoundary from "bugsnag-react";
import * as React from "react";
import ReactDOM from "react-dom";
import api from "./api";
import Controller from "./components/Controller";
import {
    compareVersions,
    genStaticPage,
    initView,
    leagueNotFoundMessage,
    logEvent,
    promiseWorker,
    toWorker,
} from "./util";
import * as views from "./views";
import type { Env } from "../common/types";

window.fixDatabase = async () => {
    console.log("Fixing stuff, hopefully...");
    await toWorker("fixDatabase");
    console.log("Done!");
};

promiseWorker.register(([name, ...params]) => {
    if (!api.hasOwnProperty(name)) {
        throw new Error(
            `API call to nonexistant UI function "${name}" with params ${JSON.stringify(
                params,
            )}`,
        );
    }

    return api[name](...params);
});

window.addEventListener("storage", e => {
    if (e.key === "bbgmVersionConflict") {
        const bbgmVersionStored = localStorage.getItem("bbgmVersion");
        if (
            bbgmVersionStored &&
            compareVersions(bbgmVersionStored, window.bbgmVersion) === 1
        ) {
            logEvent({
                type: "error",
                text:
                    "A newer version of Basketball GM was just opened in another tab. Please reload this tab to load the same version here.",
                saveToDb: false,
                persistent: true,
            });
        }
    } else if (e.key === "theme") {
        const theme = e.newValue === "dark" ? "dark" : "light";
        if (window.themeCSSLink) {
            window.themeCSSLink.href = `/gen/${theme}.css`;
        }
    }
});

api.bbgmPing("version");

const Manual = (
    <>
        <h1>Manual</h1>
        <p>
            <a
                href="https://basketball-gm.com/manual/"
                rel="noopener noreferrer"
                target="_blank"
            >
                Click here for an overview of Basketball GM.
            </a>
        </p>
    </>
);

const genPage = (id, inLeague = true) => {
    const componentName = id.charAt(0).toUpperCase() + id.slice(1);

    return initView({
        id,
        inLeague,
        Component: views[componentName],
    });
};

(async () => {
    // Put in DOM element and global variable because the former is used before React takes over and the latter is used after
    const bbgmVersionUI = "REV_GOES_HERE";
    window.bbgmVersionUI = bbgmVersionUI;
    if (window.withGoodUI) {
        window.withGoodUI();
    }
    toWorker("getVersionWorker").then(bbgmVersionWorker => {
        window.bbgmVersionWorker = bbgmVersionWorker;
        if (window.withGoodWorker) {
            window.withGoodWorker();
        }
    });

    // Check if there are other tabs open with a different version
    const bbgmVersionStored = localStorage.getItem("bbgmVersion");
    if (bbgmVersionStored) {
        const cmpResult = compareVersions(
            window.bbgmVersion,
            bbgmVersionStored,
        );
        if (cmpResult === 1) {
            // This version is newer than another tab's - send a signal to the other tabs
            let conflictNum = parseInt(
                localStorage.getItem("bbgmVersionConflict"),
                10,
            );
            if (Number.isNaN(conflictNum)) {
                conflictNum = 1;
            } else {
                conflictNum += 1;
            }

            localStorage.setItem("bbgmVersion", window.bbgmVersion);
            localStorage.setItem("bbgmVersionConflict", String(conflictNum));
        } else if (cmpResult === -1) {
            // This version is older than another tab's
            console.log(window.bbgmVersion, bbgmVersionStored);
            console.log(
                `This version of Basketball GM (${
                    window.bbgmVersion
                }) is older than one you already played (${bbgmVersionStored}). This should never happen, so please email commissioner@basketball-gm.com with any info about how this error occurred.`,
            );
            let registrations = [];
            if (window.navigator.serviceWorker) {
                registrations = await window.navigator.serviceWorker.getRegistrations();
            }
            if (window.bugsnagClient) {
                window.bugsnagClient.notify(
                    new Error("BBGM version mismatch"),
                    {
                        metaData: {
                            bbgmVersion: window.bbgmVersion,
                            bbgmVersionStored,
                            hasNavigatorServiceWorker:
                                window.navigator.serviceWorker !== undefined,
                            registrationsLength: registrations.length,
                            registrations: registrations.map(r => {
                                return {
                                    scope: r.scope,
                                    active: r.active
                                        ? {
                                              scriptURL: r.active.scriptURL,
                                              state: r.active.state,
                                          }
                                        : null,
                                    installing: r.installing
                                        ? {
                                              scriptURL: r.installing.scriptURL,
                                              state: r.installing.state,
                                          }
                                        : null,
                                    waiting: r.waiting
                                        ? {
                                              scriptURL: r.waiting.scriptURL,
                                              state: r.waiting.state,
                                          }
                                        : null,
                                };
                            }),
                        },
                    },
                );
            }
        }
    } else {
        // Initial load, store version for future comparisons
        localStorage.setItem("bbgmVersion", window.bbgmVersion);
    }

    // Heartbeat, used to keep only one tab open at a time for browsers where we have to use a Web
    // Worker due to lack of Shared Worker support (currently just Safari)
    let heartbeatID = sessionStorage.getItem("heartbeatID");
    if (heartbeatID === null || heartbeatID === undefined) {
        heartbeatID = Math.random()
            .toString(16)
            .slice(2);
        sessionStorage.setItem("heartbeatID", heartbeatID);
    }

    // https://stackoverflow.com/a/326076/78664
    window.inIframe = (() => {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    })();

    const env: Env = {
        enableLogging: window.enableLogging,
        inCordova: window.inCordova,
        heartbeatID,
        tld: window.tld,
        useSharedWorker: window.useSharedWorker,

        // These are just legacy variables sent to the worker to be stored in idb.meta.attributes
        fromLocalStorage: {
            changesRead: localStorage.getItem("changesRead"),
            lastSelectedTid: localStorage.getItem("lastSelectedTid"),
            nagged: localStorage.getItem("nagged"),
        },
    };

    await toWorker("init", env);

    const contentEl = document.getElementById("content");
    if (!contentEl) {
        throw new Error('Could not find element with id "content"');
    }

    if (window.bugsnagClient) {
        const ErrorBoundary = window.bugsnagClient.use(
            createBugsnagErrorBoundary(React),
        );
        ReactDOM.render(
            <ErrorBoundary>
                <Controller />
            </ErrorBoundary>,
            contentEl,
        );
    } else {
        ReactDOM.render(<Controller />, contentEl);
    }

    /*this.before((ctx) => {
            // Normal Cordova pages
            if (ctx.path.substr(0, 7) === 'file://') {
                ctx.path = ctx.path.substr(7);
            }

            // First load Cordova page
            if (ctx.path.includes('/index.html')) {
                ctx.path = '/';
            }
        }
    });*/

    const routes = {
        // Non-league views
        "/": genPage("dashboard", false),
        "/new_league": genPage("newLeague", false),
        "/delete_league/:lid": genPage("deleteLeague", false),
        "/manual": genStaticPage("manual", "Manual", Manual, false),
        "/manual/:page": genStaticPage("manual", "Manual", Manual, false),
        "/changes": genPage("changes", false),
        "/account": genPage("account", false),
        "/account/login_or_register": genPage("loginOrRegister", false),
        "/account/lost_password": genPage("lostPassword", false),
        "/account/reset_password/:token": genPage("resetPassword", false),
        "/account/update_card": genPage("accountUpdateCard", false),
        "/options": genPage("options", false),

        // League views
        "/l/:lid": genPage("leagueDashboard"),
        "/l/:lid/new_team": genPage("newTeam"),
        "/l/:lid/inbox": genPage("inbox"),
        "/l/:lid/message": genPage("message"),
        "/l/:lid/message/:mid": genPage("message"),
        "/l/:lid/standings": genPage("standings"),
        "/l/:lid/standings/:season": genPage("standings"),
        "/l/:lid/playoffs": genPage("playoffs"),
        "/l/:lid/playoffs/:season": genPage("playoffs"),
        "/l/:lid/league_finances": genPage("leagueFinances"),
        "/l/:lid/league_finances/:season": genPage("leagueFinances"),
        "/l/:lid/history": genPage("history"),
        "/l/:lid/history/:season": genPage("history"),
        "/l/:lid/hall_of_fame": genPage("hallOfFame"),
        "/l/:lid/edit_team_info": genPage("editTeamInfo"),
        "/l/:lid/roster": genPage("roster"),
        "/l/:lid/roster/:abbrev": genPage("roster"),
        "/l/:lid/roster/:abbrev/:season": genPage("roster"),
        "/l/:lid/schedule": genPage("schedule"),
        "/l/:lid/schedule/:abbrev": genPage("schedule"),
        "/l/:lid/team_finances": genPage("teamFinances"),
        "/l/:lid/team_finances/:abbrev": genPage("teamFinances"),
        "/l/:lid/team_finances/:abbrev/:show": genPage("teamFinances"),
        "/l/:lid/team_history": genPage("teamHistory"),
        "/l/:lid/team_history/:abbrev": genPage("teamHistory"),
        "/l/:lid/free_agents": genPage("freeAgents"),
        "/l/:lid/trade": genPage("trade"),
        "/l/:lid/trading_block": genPage("tradingBlock"),
        "/l/:lid/draft": genPage("draft"),
        "/l/:lid/draft_summary": genPage("draftSummary"),
        "/l/:lid/draft_summary/:season": genPage("draftSummary"),
        "/l/:lid/draft_team_history": genPage("draftTeamHistory"),
        "/l/:lid/draft_team_history/:abbrev": genPage("draftTeamHistory"),
        "/l/:lid/game_log": genPage("gameLog"),
        "/l/:lid/game_log/:abbrev": genPage("gameLog"),
        "/l/:lid/game_log/:abbrev/:season": genPage("gameLog"),
        "/l/:lid/game_log/:abbrev/:season/:gid": genPage("gameLog"),
        "/l/:lid/game_log/:abbrev/:season/:gid/:view": genPage("gameLog"),
        "/l/:lid/leaders": genPage("leaders"),
        "/l/:lid/leaders/:season": genPage("leaders"),
        "/l/:lid/leaders/:season/:playoffs": genPage("leaders"),
        "/l/:lid/player_ratings": genPage("playerRatings"),
        "/l/:lid/player_ratings/:abbrev": genPage("playerRatings"),
        "/l/:lid/player_ratings/:abbrev/:season": genPage("playerRatings"),
        "/l/:lid/player_stats": genPage("playerStats"),
        "/l/:lid/player_stats/:abbrev": genPage("playerStats"),
        "/l/:lid/player_stats/:abbrev/:season": genPage("playerStats"),
        "/l/:lid/player_stats/:abbrev/:season/:statType": genPage(
            "playerStats",
        ),
        "/l/:lid/player_stats/:abbrev/:season/:statType/:playoffs": genPage(
            "playerStats",
        ),
        "/l/:lid/team_stats": genPage("teamStats"),
        "/l/:lid/team_stats/:season": genPage("teamStats"),
        "/l/:lid/team_stats/:season/:teamOpponent": genPage("teamStats"),
        "/l/:lid/team_stats/:season/:teamOpponent/:playoffs": genPage(
            "teamStats",
        ),
        "/l/:lid/player/:pid": genPage("player"),
        "/l/:lid/negotiation": genPage("negotiationList"),
        "/l/:lid/negotiation/:pid": genPage("negotiation"),
        "/l/:lid/player_rating_dists": genPage("playerRatingDists"),
        "/l/:lid/player_rating_dists/:season": genPage("playerRatingDists"),
        "/l/:lid/player_stat_dists": genPage("playerStatDists"),
        "/l/:lid/player_stat_dists/:season": genPage("playerStatDists"),
        "/l/:lid/team_stat_dists": genPage("teamStatDists"),
        "/l/:lid/team_stat_dists/:season": genPage("teamStatDists"),
        "/l/:lid/player_shot_locations": genPage("playerShotLocations"),
        "/l/:lid/player_shot_locations/:season": genPage("playerShotLocations"),
        "/l/:lid/team_shot_locations": genPage("teamShotLocations"),
        "/l/:lid/team_shot_locations/:season": genPage("teamShotLocations"),
        "/l/:lid/team_shot_locations/:season/:teamOpponent": genPage(
            "teamShotLocations",
        ),
        "/l/:lid/team_shot_locations/:season/:teamOpponent/:playoffs": genPage(
            "teamShotLocations",
        ),
        "/l/:lid/export_league": genPage("exportLeague"),
        "/l/:lid/fantasy_draft": genPage("fantasyDraft"),
        "/l/:lid/live": genPage("live"),
        "/l/:lid/live_game": genPage("liveGame"),
        "/l/:lid/event_log": genPage("eventLog"),
        "/l/:lid/event_log/:abbrev": genPage("eventLog"),
        "/l/:lid/event_log/:abbrev/:season": genPage("eventLog"),
        "/l/:lid/delete_old_data": genPage("deleteOldData"),
        "/l/:lid/draft_lottery": genPage("draftLottery"),
        "/l/:lid/draft_lottery/:season": genPage("draftLottery"),
        "/l/:lid/draft_scouting": genPage("draftScouting"),
        "/l/:lid/draft_scouting/:season": genPage("draftScouting"),
        "/l/:lid/watch_list": genPage("watchList"),
        "/l/:lid/watch_list/:statType": genPage("watchList"),
        "/l/:lid/watch_list/:statType/:playoffs": genPage("watchList"),
        "/l/:lid/customize_player": genPage("customizePlayer"),
        "/l/:lid/customize_player/:pid": genPage("customizePlayer"),
        "/l/:lid/history_all": genPage("historyAll"),
        "/l/:lid/upcoming_free_agents": genPage("upcomingFreeAgents"),
        "/l/:lid/upcoming_free_agents/:season": genPage("upcomingFreeAgents"),
        "/l/:lid/god_mode": genPage("godMode"),
        "/l/:lid/power_rankings": genPage("powerRankings"),
        "/l/:lid/export_stats": genPage("exportStats"),
        "/l/:lid/player_feats": genPage("playerFeats"),
        "/l/:lid/player_feats/:abbrev": genPage("playerFeats"),
        "/l/:lid/player_feats/:abbrev/:season": genPage("playerFeats"),
        "/l/:lid/player_feats/:abbrev/:season/:playoffs": genPage(
            "playerFeats",
        ),
        "/l/:lid/multi_team_mode": genPage("multiTeamMode"),
        "/l/:lid/team_records": genPage("teamRecords"),
        "/l/:lid/team_records/:byType": genPage("teamRecords"),
        "/l/:lid/awards_records": genPage("awardsRecords"),
        "/l/:lid/awards_records/:awardType": genPage("awardsRecords"),
        "/l/:lid/transactions": genPage("transactions"),
        "/l/:lid/transactions/:abbrev": genPage("transactions"),
        "/l/:lid/transactions/:abbrev/:season": genPage("transactions"),
        "/l/:lid/transactions/:abbrev/:season/:eventType": genPage(
            "transactions",
        ),
        "/l/:lid/options": genPage("leagueOptions"),
        "/l/:lid/danger_zone": genPage("dangerZone"),
    };

    let initialLoad = true;
    router.addEventListener("routematched", (event: any) => {
        if (!event.detail.context.state.noTrack) {
            if (window.enableLogging && window.gtag) {
                if (!initialLoad) {
                    window.gtag("config", "UA-38759330-1", {
                        // Normalize league URLs to all look the same
                        page_path: event.detail.context.path.replace(
                            /^\/l\/[0-9]+?\//,
                            "/l/0/",
                        ),
                    });
                }
            }

            if (!initialLoad) {
                window.bbgmAds.cmd.push(() => {
                    window.bbgmAds.refresh();
                });
            } else {
                initialLoad = false;
            }
        }
    });

    router.addEventListener("navigationend", (event: any) => {
        if (event.detail.error) {
            let errMsg = event.detail.error.message;
            if (errMsg === "Matching route not found") {
                errMsg = "Page not found.";
            } else if (errMsg === "League not found.") {
                errMsg = leagueNotFoundMessage;
            } else if (
                typeof errMsg !== "string" ||
                !errMsg.includes(
                    "A league can only be open in one tab at a time",
                )
            ) {
                if (window.bugsnagClient) {
                    window.bugsnagClient.notify(event.detail.error);
                }
                console.error("Error from view:");
                console.error(event.detail.error);
            }

            const ErrorPage = (
                <div>
                    <h1>Error</h1>
                    {typeof errMsg === "string" ? <h3>{errMsg}</h3> : errMsg}
                </div>
            );
            const errorPage = genStaticPage("error", "Error", ErrorPage, false);
            errorPage(event.detail.context);
        }
    });

    router.start(routes);
})();
