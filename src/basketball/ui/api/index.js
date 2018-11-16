// @flow

import { emitter, local } from "../../../deion/ui/util";
import { realtimeUpdate } from "../util";
import { showEvent } from "../util/logEvent";
import type {
    GameAttributes,
    LocalStateUI,
    LogEventShowOptions,
    UpdateEvents,
} from "../../../deion/common/types";

/**
 * Ping a counter at basketball-gm.com.
 *
 * This should only do something if it isn't being run from a unit test and it's actually on basketball-gm.com.
 */
const bbgmPing = (
    type: "league" | "season" | "version",
    arg: number | void,
) => {
    if (window.enableLogging && window.gtag) {
        if (type === "league") {
            window.gtag("event", "New league", {
                event_category: "BBGM",
                event_label: String(arg),
            });
        } else if (type === "season") {
            window.gtag("event", "Completed season", {
                event_category: "BBGM",
                event_label: String(arg),
            });
        } else if (type === "version") {
            window.gtag("event", "Version", {
                event_category: "BBGM",
                event_label: window.bbgmVersion,
            });
        }
    }
};

const confirm = (message: string) => {
    return window.confirm(message);
};

const emit = (name: string, content: any) => {
    emitter.emit(name, content);
};

// Read from goldUntil rather than local because this is called before local is updated
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

    if (hideAds) {
        // Get rid of margin saved for skyscraper on right
        const container = document.getElementsByClassName("bbgm-container")[0];
        if (container) {
            container.style.paddingRight = "15px";
            container.style.maxWidth = "100%";
        }
    } else {
        window.bbgmAds.cmd.push(() => {
            // Show hidden divs. skyscraper has its own code elsewhere to manage display.
            const showDivs = [
                "bbgm-ads-top",
                "bbgm-ads-bottom1",
                "bbgm-ads-bottom2",
                "skyscraper-wrapper",
            ];
            for (const id of showDivs) {
                const div = document.getElementById(id);
                if (div) {
                    div.style.removeProperty("display");
                }
            }

            window.bbgmAds
                .init([
                    "bbgm-ads-top",
                    "bbgm-ads-bottom1",
                    "bbgm-ads-bottom2",
                    "bbgm-ads-skyscraper",
                ])
                .then(() => {
                    // Show the logo too
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
    if (parts[1] === "l" && parseInt(parts[2], 10) !== lid) {
        parts[2] = String(lid);
        const newPathname = parts.join("/");
        await realtimeUpdate(["firstRun"], newPathname);
        local.update({ lid });
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

const resetLeague = () => {
    local.resetLeague();
};

const setGameAttributes = (gameAttributes: GameAttributes) => {
    local.updateGameAttributes(gameAttributes);
};

const showEvent2 = (options: LogEventShowOptions) => {
    showEvent(options);
};

const updateLocal = (obj: $Shape<LocalStateUI>) => {
    local.update(obj);
};

export default {
    bbgmPing,
    confirm,
    emit,
    initAds,
    newLid,
    prompt,
    realtimeUpdate: realtimeUpdate2,
    resetLeague,
    setGameAttributes,
    showEvent: showEvent2,
    updateLocal,
};
