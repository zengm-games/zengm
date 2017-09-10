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
const gptAdSlots = [];

async function showBanner() {
    const initBanners = () => {
        return new Promise(resolve => {
            window.googletag.cmd.push(() => {
                gptAdSlots[0] = window.googletag
                    .defineSlot(
                        "/42283434/BBGM_Top",
                        [[970, 90], [728, 90], [970, 250]],
                        "div-gpt-ad-1491369323599-3",
                    )
                    .addService(window.googletag.pubads());
                gptAdSlots[1] = window.googletag
                    .defineSlot(
                        "/42283434/BBGM_Square_Left",
                        [[300, 250], [336, 280]],
                        "div-gpt-ad-1491369323599-1",
                    )
                    .addService(window.googletag.pubads());
                gptAdSlots[2] = window.googletag
                    .defineSlot(
                        "/42283434/BBGM_Square_Right",
                        [[300, 250], [336, 280]],
                        "div-gpt-ad-1491369323599-2",
                    )
                    .addService(window.googletag.pubads());

                window.googletag.pubads().enableSingleRequest();

                window.googletag.enableServices();

                let count = 0;
                window.googletag.cmd.push(() => {
                    window.googletag.display("div-gpt-ad-1491369323599-3");
                    count += 1;
                    if (count >= 3) {
                        resolve();
                    }
                });
                window.googletag.cmd.push(() => {
                    window.googletag.display("div-gpt-ad-1491369323599-1");
                    count += 1;
                    if (count >= 3) {
                        resolve();
                    }
                });
                window.googletag.cmd.push(() => {
                    window.googletag.display("div-gpt-ad-1491369323599-2");
                    count += 1;
                    if (count >= 3) {
                        resolve();
                    }
                });
            });
        });
    };

    // After banners are initially loaded, use this to refresh
    const refreshBanners = () => {
        window.googletag.cmd.push(() => {
            window.googletag.pubads().refresh([gptAdSlots[0]]);
        });
        window.googletag.cmd.push(() => {
            window.googletag.pubads().refresh([gptAdSlots[1]]);
        });
        window.googletag.cmd.push(() => {
            window.googletag.pubads().refresh([gptAdSlots[2]]);
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
        const bannerAdTop = document.getElementById(
            "div-gpt-ad-1491369323599-3",
        );
        const bannerAdBottom1 = document.getElementById(
            "div-gpt-ad-1491369323599-1",
        );
        const bannerAdBottom2 = document.getElementById(
            "div-gpt-ad-1491369323599-2",
        );

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
