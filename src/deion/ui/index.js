/* eslint-disable import/first */
import "../common/polyfills";
import router from "bbgm-router";
import React from "react";
import ReactDOM from "react-dom";
import api from "./api";
import { Controller, ErrorBoundary } from "./components";
import {
    compareVersions,
    genStaticPage,
    helpers,
    leagueNotFoundMessage,
    logEvent,
    overrides,
    promiseWorker,
    routes,
    toWorker,
} from "./util";
import type { Env, WorkerOverridesConstants } from "../common/types";

const handleVersion = async () => {
    window.addEventListener("storage", e => {
        if (e.key === "bbgmVersionConflict") {
            const bbgmVersionStored = localStorage.getItem("bbgmVersion");
            if (
                bbgmVersionStored &&
                compareVersions(bbgmVersionStored, window.bbgmVersion) === 1
            ) {
                logEvent({
                    type: "error",
                    text: `A newer version of ${helpers.upperCaseFirstLetter(
                        process.env.SPORT,
                    )} GM was just opened in another tab. Please reload this tab to load the same version here.`,
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
                `This version of ${helpers.upperCaseFirstLetter(
                    process.env.SPORT,
                )} GM (${
                    window.bbgmVersion
                }) is older than one you already played (${bbgmVersionStored}). This should never happen, so please email commissioner@basketball-gm.com with any info about how this error occurred.`,
            );
            let registrations = [];
            if (window.navigator.serviceWorker) {
                registrations = await window.navigator.serviceWorker.getRegistrations();
            }
            if (window.bugsnagClient) {
                window.bugsnagClient.notify(
                    new Error("Game version mismatch"),
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
};

const setupEnv = async () => {
    // Heartbeat, used to keep only one tab open at a time for browsers where we have to use a Web
    // Worker due to lack of Shared Worker support (currently just Safari). Uses sessionStorage
    // rather than a global variable to persist over page reloads, otherwise it'd be a race
    // condition to distinguish between reloading the page and opening it in two tabs.
    let heartbeatID = sessionStorage.getItem("heartbeatID");
    if (heartbeatID === null || heartbeatID === undefined) {
        heartbeatID = Math.random()
            .toString(16)
            .slice(2);
        sessionStorage.setItem("heartbeatID", heartbeatID);
    }

    const env: Env = {
        enableLogging: window.enableLogging,
        heartbeatID,
        useSharedWorker: window.useSharedWorker,

        // These are just legacy variables sent to the worker to be stored in idb.meta.attributes
        fromLocalStorage: {
            changesRead: localStorage.getItem("changesRead"),
            lastSelectedTid: localStorage.getItem("lastSelectedTid"),
            nagged: localStorage.getItem("nagged"),
        },
    };

    await toWorker("init", env);
};

const render = () => {
    const contentEl = document.getElementById("content");
    if (!contentEl) {
        throw new Error('Could not find element with id "content"');
    }

    ReactDOM.render(
        <ErrorBoundary>
            <Controller />
        </ErrorBoundary>,
        contentEl,
    );
};

const setupRoutes = () => {
    let initialLoad = true;
    router.addEventListener("routematched", (event: any) => {
        if (!event.detail.context.state.noTrack) {
            if (window.enableLogging && window.gtag) {
                if (!initialLoad) {
                    window.gtag("config", window.googleAnalyticsID, {
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

                // As of 2019-07-20, these cover all IndexedDB version error messages in Chrome, Firefox, and Safari
                if (
                    errMsg.includes("requested version") ||
                    errMsg.includes("existing version") ||
                    errMsg.includes("higher version") ||
                    errMsg.includes("version requested") ||
                    errMsg.includes("lower version")
                ) {
                    errMsg = (
                        <>
                            <h4>{errMsg}</h4>
                            <h4>
                                Please{" "}
                                <a
                                    href="https://basketball-gm.com/manual/faq/#latest-version"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    make sure you have the latest version of the
                                    game loaded
                                </a>
                                .
                            </h4>
                        </>
                    );
                }
            }

            const ErrorPage = (
                <>
                    <h1>Error</h1>
                    {typeof errMsg === "string" ? <h3>{errMsg}</h3> : errMsg}
                </>
            );
            const errorPage = genStaticPage("error", "Error", ErrorPage, false);
            errorPage(event.detail.context);
        }
    });

    router.start(routes());
};

const deionUI = async (options: {
    overrides: {
        common: {
            constants: WorkerOverridesConstants,
            [key: string]: any,
        },
        components: {
            [key: string]: any,
        },
        util: {
            [key: string]: any,
        },
        views: {
            [key: string]: any,
        },
    },
}) => {
    Object.assign(overrides, options.overrides);

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

    await handleVersion();

    await setupEnv();

    render();

    await setupRoutes();
};

export default deionUI;
