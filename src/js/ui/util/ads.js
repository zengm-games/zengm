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
console.log('initBanners')
        return new Promise(resolve => {
            window.googletag.cmd.push(() => {
                gptAdSlots[0] = window.googletag
                    .defineSlot(
                        "/19968336/header-bid-tag1",
                        [[728, 90], [970, 90]],
                        "div-gpt-ad-1460505661639-0",
                    )
                    .addService(window.googletag.pubads());
                gptAdSlots[1] = window.googletag
                    .defineSlot(
                        "/19968336/header-bid-tag-0",
                        [[300, 250], [300, 600]],
                        "div-gpt-ad-1438287399331-0",
                    )
                    .addService(window.googletag.pubads());
                gptAdSlots[2] = window.googletag
                    .defineSlot(
                        "/19968336/header-bid-tag-0",
                        [[300, 250], [300, 600]],
                        "div-gpt-ad-1460505748561-0",
                    )
                    .addService(window.googletag.pubads());
                window.googletag.pubads().enableSingleRequest();
                window.googletag.enableServices();
                let count = 0;
                window.googletag.cmd.push(() => {
console.log('initbanners display1')
                    window.googletag.display("div-gpt-ad-1460505661639-0");
                    count += 1;
                    if (count >= 3) {
                        resolve();
                    }
                });
                window.googletag.cmd.push(() => {
console.log('initbanners display2')
                    window.googletag.display("div-gpt-ad-1438287399331-0");
                    count += 1;
                    if (count >= 3) {
                        resolve();
                    }
                });
                window.googletag.cmd.push(() => {
console.log('initbanners display3')
                    window.googletag.display("div-gpt-ad-1460505748561-0");
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
console.log('refreshBanners')
        window.pbjs.que.push(function () {
            window.pbjs.requestBids({
                timeout: window.PREBID_TIMEOUT,
                adUnitCodes: ['div-gpt-ad-1460505661639-0', 'div-gpt-ad-1438287399331-0', 'div-gpt-ad-1460505748561-0'],
                bidsBackHandler: function() {
console.log('bidsbackhandler', this)
                    window.pbjs.setTargetingForGPTAsync(['div-gpt-ad-1460505661639-0', 'div-gpt-ad-1438287399331-0', 'div-gpt-ad-1460505748561-0']);
                    window.googletag.pubads().refresh(gptAdSlots);
                }
            });
        });
    };

    if ((window.screen && window.screen.width < 768) || window.inIframe) {
        // Hide ads on mobile, mobile is shitty enough already. Embedded iframes too, like on Sports.ws
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
        const bannerAdTop = document.getElementById("div-gpt-ad-1460505661639-0");
        const bannerAdBottom1 = document.getElementById("div-gpt-ad-1438287399331-0");
        const bannerAdBottom2 = document.getElementById("div-gpt-ad-1460505748561-0");

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
