// @flow

import { g, helpers } from "../../common";
import { ads, emitter, realtimeUpdate } from "../util";
import { showEvent } from "../util/logEvent";
import type {
    GameAttributes,
    LogEventShowOptions,
    UpdateEvents,
} from "../../common/types";

/**
 * Ping a counter at basketball-gm.com.
 *
 * This should only do something if it isn't being run from a unit test and it's actually on basketball-gm.com.
 *
 * @memberOf util.helpers
 * @param {string} type Either "league" for a new league, or "season" for a completed season
 */
const bbgmPing = (type: "league" | "season" | "version") => {
    if (window.enableLogging && window.ga) {
        if (type === "league") {
            window.ga("send", "event", "BBGM", "New league", String(g.lid));
        } else if (type === "season") {
            window.ga(
                "send",
                "event",
                "BBGM",
                "Completed season",
                String(g.season),
            );
        } else if (type === "version") {
            window.ga("send", "event", "BBGM", "Version", window.bbgmVersion);
        }
    }
};

const confirm = (message: string) => {
    return window.confirm(message);
};

const emit = (name: string, content: any) => {
    emitter.emit(name, content);
};

const initAds = (goldUntil: number | void) => {
    let hideAds = false;

    // No ads for Gold members
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (goldUntil === undefined || currentTimestamp < goldUntil) {
        hideAds = true;
    }

    // Hide ads on mobile, mobile is shitty enough already
    if (window.screen && window.screen.width < 768) {
        hideAds = true;
    }

    // Embedded iframes too, like on Sports.ws
    if (window.inIframe) {
        hideAds = true;
    }

    // Hide ads on iOS, at least until https://www.wired.com/story/pop-up-mobile-ads-surge-as-sites-scramble-to-stop-them/ is resolved
    // https://stackoverflow.com/a/9039885/786644
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        hideAds = true;
    }

    if (!hideAds) {
        window.bbgmAds.cmd.push(() => {
            // This initializes the ads and displays the initial banners. It returns a promise
            // which resolves when it's done.
            window.bbgmAds
                .init(["bbgm-ads-top", "bbgm-ads-bottom1", "bbgm-ads-bottom2"])
                .then(() => {
                    // Show the logo too (it's not an ad so it's not managed by bbgmAds)
                    const logo = document.getElementById("bbgm-ads-logo");
                    if (logo) {
                        logo.style.display = "flex";
                    }
                });
        });
    }
};

// Should only be called from Shared Worker, to move other tabs to new league because only one can be open at a time
const newLid = async (lid: number) => {
    const parts = window.location.pathname.split("/");
    if (parseInt(parts[2], 10) !== lid) {
        parts[2] = String(lid);
        const newPathname = parts.join("/");
        await realtimeUpdate(["firstRun"], newPathname);
        emitter.emit("updateTopMenu", { lid });
    }
};

const prompt = (message: string, defaultVal?: string) => {
    return window.prompt(message, defaultVal);
};

async function realtimeUpdate2(
    updateEvents: UpdateEvents = [],
    url?: string,
    raw?: Object,
) {
    await realtimeUpdate(updateEvents, url, raw);
}

const resetG = () => {
    helpers.resetG();

    // Additionally, here we want to ignore the old lid just to be sure, since the real one will be sent to the UI
    // later. But in the worker, g.lid is already correctly set, so this can't be in helpers.resetG.
    g.lid = undefined;
};

const setGameAttributes = (gameAttributes: GameAttributes) => {
    Object.assign(g, gameAttributes);
};

const showEvent2 = (options: LogEventShowOptions) => {
    showEvent(options);
};

export default {
    bbgmPing,
    confirm,
    emit,
    initAds,
    newLid,
    prompt,
    realtimeUpdate: realtimeUpdate2,
    resetG,
    setGameAttributes,
    showEvent: showEvent2,
};
