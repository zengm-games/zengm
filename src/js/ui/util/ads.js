// @flow

import { emitter } from "../util";

function showGcs() {
    window.TriggerPrompt("http://www.basketball-gm.com/", new Date().getTime());
}

function showSurvata() {
    window.Survata.ready(() => {
        const s = window.Survata.createSurveywall({
            brand: "Basketball GM",
            explainer:
                "Please take this short survey to support Basketball GM!",
            disallowClose: true,
            allowSkip: false,
            contentName: new Date().toISOString(),
        });

        s.on("load", data => {
            if (data.status === "monetizable") {
                s.startInterview();
            } else {
                // If Survata doesn't have a survey to show, try GCS
                showGcs();
            }
        });
    });

    // If Survata is down, try other ad
    // eslint-disable-next-line no-use-before-define
    window.Survata.fail(() => {
        // Pass autoPlaySeasons as 0 because this code would never be reached otherwise (showAd would early exit)
        emitter.emit("showAd", "modal", 0);
    });
}

function showModal() {
    emitter.emit("updateState", { showNagModal: true });
}

let gptLoading = false;
let gptLoaded = false;
const optimalMediaDivs = [
    "div-gpt-ad-1491369323599-3",
    "div-gpt-ad-1491369323599-1",
    "div-gpt-ad-1491369323599-2",
];

async function showBanner() {
    const initBanners = () => {
        return new Promise(resolve => {
            let count = 0;
            window.googletag.cmd.push(() => {
                window.googletag.display(optimalMediaDivs[0]);
                count += 1;
                if (count >= 3) {
                    resolve();
                }
            });
            window.googletag.cmd.push(() => {
                window.googletag.display(optimalMediaDivs[1]);
                count += 1;
                if (count >= 3) {
                    resolve();
                }
            });
            window.googletag.cmd.push(() => {
                window.googletag.display(optimalMediaDivs[2]);
                count += 1;
                if (count >= 3) {
                    resolve();
                }
            });
        });
    };

    // After banners are initially loaded, use this to refresh
    const refreshBanners = () => {
        if (
            window.optimalmedia === undefined ||
            window.OptimalMediaAPI === undefined
        ) {
            // This could happen if it's still loading the async ad script
            return;
        }

        window.optimalmedia.que.push(() => {
            window.OptimalMediaAPI.refreshDivs(optimalMediaDivs);
        });
    };

    if (window.screen && window.screen.width < 768) {
        // Hide ads on mobile, mobile is shitty enough already
        const wrappers = [
            "banner-ad-top-wrapper",
            "banner-ad-bottom-wrapper-1",
            "banner-ad-bottom-wrapper-logo",
            "banner-ad-bottom-wrapper-2",
        ];
        for (const wrapper of wrappers) {
            const el = document.getElementById(wrapper);
            if (el) {
                el.innerHTML = "";
            }
        }
    } else {
        const bannerAdTop = document.getElementById(optimalMediaDivs[0]);
        const bannerAdBottom1 = document.getElementById(optimalMediaDivs[1]);
        const bannerAdBottom2 = document.getElementById(optimalMediaDivs[2]);

        // For people using BBGM Gold, these would have been deleted in initAds
        if (bannerAdTop && bannerAdBottom1 && bannerAdBottom2) {
            if (!gptLoading && !gptLoaded) {
                gptLoading = true;
                await initBanners();
                gptLoading = false;
                gptLoaded = true;
            } else if (gptLoaded) {
                refreshBanners();
            }
        }
    }
}

export default {
    showBanner,
    showModal,
    showSurvata,
    showGcs,
};
