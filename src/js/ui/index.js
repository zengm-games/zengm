// @flow

/* eslint-disable import/first */
import "../vendor/babel-external-helpers";
import "../common/polyfills";
import page from "page";
import * as React from "react";
import ReactDOM from "react-dom";
import api from "./api";
import Controller from "./components/Controller";
import processInputs from "./processInputs";
import { ads, genStaticPage, initView, promiseWorker, toWorker } from "./util";
import * as views from "./views";
import type { Env } from "../common/types";

// source-map-support is no longer needed here because no Promise polyfill in the UI, only sometimes in the worker.

promiseWorker.register(([name, ...params]) => {
    if (!api.hasOwnProperty(name)) {
        throw new Error(
            `API call to nonexistant UI function "${
                name
            }" with params ${JSON.stringify(params)}`,
        );
    }

    return api[name](...params);
});

const Manual = (
    <div>
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
    </div>
);

const genPage = (id, inLeague = true) => {
    const componentName = id.charAt(0).toUpperCase() + id.slice(1);

    return initView({
        id,
        inLeague,
        get: processInputs.hasOwnProperty(id) ? processInputs[id] : undefined,
        Component: views[componentName],
    });
};

(async () => {
    // Put in DOM element and global variable because the former is used before React takes over and the latter is used after
    const bbgmVersionUI = "REV_GOES_HERE";
    window.bbgmVersionUI = bbgmVersionUI;
    const elVersionUI = document.getElementById("version-ui");
    if (elVersionUI) {
        elVersionUI.innerHTML = bbgmVersionUI;
    }
    toWorker("getVersionWorker").then(bbgmVersionWorker => {
        window.bbgmVersionWorker = bbgmVersionWorker;
        const elVersionWorker = document.getElementById("version-worker");
        if (elVersionWorker) {
            elVersionWorker.innerHTML = bbgmVersionWorker;
        }
    });

    let heartbeatID = sessionStorage.getItem("heartbeatID");
    if (heartbeatID === null || heartbeatID === undefined) {
        heartbeatID = Math.random()
            .toString(16)
            .slice(2);
        sessionStorage.setItem("heartbeatID", heartbeatID);
    }

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
    ReactDOM.render(<Controller />, contentEl);

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

    // Non-league views
    page("/", genPage("dashboard", false));
    page("/new_league", genPage("newLeague", false));
    page("/delete_league/:lid", genPage("deleteLeague", false));
    page("/manual", genStaticPage("manual", "Manual", Manual, false));
    page("/manual/:page", genStaticPage("manual", "Manual", Manual, false));
    page("/changes", genPage("changes", false));
    page("/account", genPage("account", false));
    page("/account/login_or_register", genPage("loginOrRegister", false));
    page("/account/lost_password", genPage("lostPassword", false));
    page("/account/reset_password/:token", genPage("resetPassword", false));
    page("/account/update_card", genPage("accountUpdateCard", false));

    // League views
    page("/l/:lid", genPage("leagueDashboard"));
    page("/l/:lid/new_team", genPage("newTeam"));
    page("/l/:lid/inbox", genPage("inbox"));
    page("/l/:lid/message", genPage("message"));
    page("/l/:lid/message/:mid", genPage("message"));
    page("/l/:lid/standings", genPage("standings"));
    page("/l/:lid/standings/:season", genPage("standings"));
    page("/l/:lid/playoffs", genPage("playoffs"));
    page("/l/:lid/playoffs/:season", genPage("playoffs"));
    page("/l/:lid/league_finances", genPage("leagueFinances"));
    page("/l/:lid/league_finances/:season", genPage("leagueFinances"));
    page("/l/:lid/history", genPage("history"));
    page("/l/:lid/history/:season", genPage("history"));
    page("/l/:lid/hall_of_fame", genPage("hallOfFame"));
    page("/l/:lid/edit_team_info", genPage("editTeamInfo"));
    page("/l/:lid/roster", genPage("roster"));
    page("/l/:lid/roster/:abbrev", genPage("roster"));
    page("/l/:lid/roster/:abbrev/:season", genPage("roster"));
    page("/l/:lid/schedule", genPage("schedule"));
    page("/l/:lid/schedule/:abbrev", genPage("schedule"));
    page("/l/:lid/team_finances", genPage("teamFinances"));
    page("/l/:lid/team_finances/:abbrev", genPage("teamFinances"));
    page("/l/:lid/team_finances/:abbrev/:show", genPage("teamFinances"));
    page("/l/:lid/team_history", genPage("teamHistory"));
    page("/l/:lid/team_history/:abbrev", genPage("teamHistory"));
    page("/l/:lid/free_agents", genPage("freeAgents"));
    page("/l/:lid/trade", genPage("trade"));
    page("/l/:lid/trading_block", genPage("tradingBlock"));
    page("/l/:lid/draft", genPage("draft"));
    page("/l/:lid/draft_summary", genPage("draftSummary"));
    page("/l/:lid/draft_summary/:season", genPage("draftSummary"));
    page("/l/:lid/game_log", genPage("gameLog"));
    page("/l/:lid/game_log/:abbrev", genPage("gameLog"));
    page("/l/:lid/game_log/:abbrev/:season", genPage("gameLog"));
    page("/l/:lid/game_log/:abbrev/:season/:gid", genPage("gameLog"));
    page("/l/:lid/game_log/:abbrev/:season/:gid/:view", genPage("gameLog"));
    page("/l/:lid/leaders", genPage("leaders"));
    page("/l/:lid/leaders/:season", genPage("leaders"));
    page("/l/:lid/player_ratings", genPage("playerRatings"));
    page("/l/:lid/player_ratings/:abbrev", genPage("playerRatings"));
    page("/l/:lid/player_ratings/:abbrev/:season", genPage("playerRatings"));
    page("/l/:lid/player_stats", genPage("playerStats"));
    page("/l/:lid/player_stats/:abbrev", genPage("playerStats"));
    page("/l/:lid/player_stats/:abbrev/:season", genPage("playerStats"));
    page(
        "/l/:lid/player_stats/:abbrev/:season/:statType",
        genPage("playerStats"),
    );
    page(
        "/l/:lid/player_stats/:abbrev/:season/:statType/:playoffs",
        genPage("playerStats"),
    );
    page("/l/:lid/team_stats", genPage("teamStats"));
    page("/l/:lid/team_stats/:season", genPage("teamStats"));
    page("/l/:lid/team_stats/:season/:teamOpponents", genPage("teamStats"));
    page(
        "/l/:lid/team_stats/:season/:teamOpponent/:playoffs",
        genPage("teamStats"),
    );
    page("/l/:lid/player/:pid", genPage("player"));
    page("/l/:lid/negotiation", genPage("negotiationList"));
    page("/l/:lid/negotiation/:pid", genPage("negotiation"));
    page("/l/:lid/player_rating_dists", genPage("playerRatingDists"));
    page("/l/:lid/player_rating_dists/:season", genPage("playerRatingDists"));
    page("/l/:lid/player_stat_dists", genPage("playerStatDists"));
    page("/l/:lid/player_stat_dists/:season", genPage("playerStatDists"));
    page("/l/:lid/team_stat_dists", genPage("teamStatDists"));
    page("/l/:lid/team_stat_dists/:season", genPage("teamStatDists"));
    page("/l/:lid/player_shot_locations", genPage("playerShotLocations"));
    page(
        "/l/:lid/player_shot_locations/:season",
        genPage("playerShotLocations"),
    );
    page("/l/:lid/team_shot_locations", genPage("teamShotLocations"));
    page("/l/:lid/team_shot_locations/:season", genPage("teamShotLocations"));
    page("/l/:lid/export_league", genPage("exportLeague"));
    page("/l/:lid/fantasy_draft", genPage("fantasyDraft"));
    page("/l/:lid/live", genPage("live"));
    page("/l/:lid/live_game", genPage("liveGame"));
    page("/l/:lid/event_log", genPage("eventLog"));
    page("/l/:lid/event_log/:abbrev", genPage("eventLog"));
    page("/l/:lid/event_log/:abbrev/:season", genPage("eventLog"));
    page("/l/:lid/delete_old_data", genPage("deleteOldData"));
    page("/l/:lid/draft_lottery", genPage("draftLottery"));
    page("/l/:lid/draft_lottery/:season", genPage("draftLottery"));
    page("/l/:lid/draft_scouting", genPage("draftScouting"));
    page("/l/:lid/draft_scouting/:season", genPage("draftScouting"));
    page("/l/:lid/watch_list", genPage("watchList"));
    page("/l/:lid/watch_list/:statType", genPage("watchList"));
    page("/l/:lid/watch_list/:statType/:playoffs", genPage("watchList"));
    page("/l/:lid/customize_player", genPage("customizePlayer"));
    page("/l/:lid/customize_player/:pid", genPage("customizePlayer"));
    page("/l/:lid/history_all", genPage("historyAll"));
    page("/l/:lid/upcoming_free_agents", genPage("upcomingFreeAgents"));
    page("/l/:lid/upcoming_free_agents/:season", genPage("upcomingFreeAgents"));
    page("/l/:lid/god_mode", genPage("godMode"));
    page("/l/:lid/power_rankings", genPage("powerRankings"));
    page("/l/:lid/export_stats", genPage("exportStats"));
    page("/l/:lid/player_feats", genPage("playerFeats"));
    page("/l/:lid/player_feats/:abbrev", genPage("playerFeats"));
    page("/l/:lid/player_feats/:abbrev/:season", genPage("playerFeats"));
    page(
        "/l/:lid/player_feats/:abbrev/:season/:playoffs",
        genPage("playerFeats"),
    );
    page("/l/:lid/multi_team_mode", genPage("multiTeamMode"));
    page("/l/:lid/team_records", genPage("teamRecords"));
    page("/l/:lid/team_records/:byType", genPage("teamRecords"));
    page("/l/:lid/awards_records", genPage("awardsRecords"));
    page("/l/:lid/awards_records/:awardType", genPage("awardsRecords"));
    page("/l/:lid/transactions", genPage("transactions"));
    page("/l/:lid/transactions/:abbrev", genPage("transactions"));
    page("/l/:lid/transactions/:abbrev/:season", genPage("transactions"));
    page(
        "/l/:lid/transactions/:abbrev/:season/:eventType",
        genPage("transactions"),
    );
    page("/l/:lid/options", genPage("options"));

    page("*", (ctx, next) => {
        if (!ctx.bbgm) {
            ctx.bbgm = {};
        }

        if (!ctx.bbgm.handled || ctx.bbgm.err) {
            let errMsg = "Page not found.";
            if (ctx.bbgm.err) {
                errMsg = ctx.bbgm.err.message;
                if (errMsg === "League not found.") {
                    errMsg = (
                        <span>
                            League not found.{" "}
                            <a href="/new_league">Create a new league</a> or{" "}
                            <a href="/">load an existing league</a> to play!
                        </span>
                    );
                }
            }

            const ErrorPage = (
                <div>
                    <h1>Error</h1>
                    <h2>{errMsg}</h2>
                </div>
            );
            const errorPage = genStaticPage("error", "Error", ErrorPage, false);
            errorPage(ctx, next);
        } else {
            next();
        }
    });

    // This will run after all the routes defined above, because they all call next()
    let initialLoad = true;
    page("*", ctx => {
        if (ctx.bbgm && !ctx.bbgm.noTrack) {
            if (window.enableLogging && window.ga) {
                if (!initialLoad) {
                    window.ga("set", "page", ctx.path);
                    window.ga("send", "pageview");
                }
            }

            if (!initialLoad) {
                ads.showBanner();
            } else {
                initialLoad = false;
            }
        }
    });

    page();
})();
