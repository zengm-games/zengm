// @flow

import { emitter } from "../util";

const PREBID_TIMEOUT = 700;

const adUnits = [
    {
        code: "div-gpt-ad-1516837104728-0",
        sizes: [[728, 90]],
        bids: [
            {
                bidder: "indexExchange",
                params: {
                    siteID: "248523",
                    id: "01",
                },
            },
            {
                bidder: "appnexus",
                params: {
                    placementId: "5823281",
                },
            },
            {
                bidder: "sovrn",
                params: { tagid: "547545" },
            },
            {
                bidder: "districtmDMX",
                params: {
                    id: 198708,
                },
            },
            {
                bidder: "conversant",
                params: {
                    site_id: "116969",
                    secure: 1,
                },
            },
        ],
    },
    {
        code: "div-gpt-ad-1516837104728-1",
        sizes: [[300, 250]],
        bids: [
            {
                bidder: "indexExchange",
                params: {
                    siteID: "248524",
                    id: "02",
                },
            },
            {
                bidder: "appnexus",
                params: {
                    placementId: "5823309",
                },
            },
            {
                bidder: "sovrn",
                params: { tagid: "547546" },
            },
            {
                bidder: "districtmDMX",
                params: {
                    id: 198706,
                },
            },
            {
                bidder: "conversant",
                params: {
                    site_id: "116969",
                    secure: 1,
                },
            },
        ],
    },
    {
        code: "div-gpt-ad-1516837104728-2",
        sizes: [[300, 250]],
        bids: [
            {
                bidder: "indexExchange",
                params: {
                    siteID: "248525",
                    id: "03",
                },
            },
            {
                bidder: "appnexus",
                params: {
                    placementId: "5823300",
                },
            },
            {
                bidder: "sovrn",
                params: { tagid: "547547" },
            },
            {
                bidder: "districtmDMX",
                params: {
                    id: 198707,
                },
            },
            {
                bidder: "conversant",
                params: {
                    site_id: "116969",
                    secure: 1,
                },
            },
        ],
    },
];

const adUnitPaths = [
    "/42283434/2018-BBGM-Billboard1",
    "/42283434/2018-BBGM-Rectangle1",
    "/42283434/2018-BBGM-Rectangle2",
];

const adUnitCodes = adUnits.map(adUnit => adUnit.code);

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

const sendAdserverRequest = () => {
    if (window.pbjs.adserverRequestSent) {
        return;
    }
    window.pbjs.adserverRequestSent = true;

    window.googletag.cmd.push(() => {
        window.pbjs.que.push(() => {
            window.pbjs.setTargetingForGPTAsync();
            window.googletag.pubads().refresh();
        });
    });
};

async function showBanner() {
    const initBanners = () => {
        return new Promise(resolve => {
            // eslint-disable-next-line
            require("../../vendor/prebid");

            window.pbjs.que.push(() => {
                window.pbjs.setConfig({ priceGranularity: "high" });
                window.pbjs.addAdUnits(adUnits);
                window.pbjs.requestBids({
                    bidsBackHandler: sendAdserverRequest,
                });
            });

            setTimeout(sendAdserverRequest, PREBID_TIMEOUT);

            window.googletag.cmd.push(() => {
                for (let i = 0; i < adUnits.length; i++) {
                    window.googletag
                        .defineSlot(
                            adUnitPaths[i],
                            adUnits[i].sizes,
                            adUnitCodes[i],
                        )
                        .addService(window.googletag.pubads());
                }
                window.googletag.pubads().enableSingleRequest();
                window.googletag.enableServices();

                let count = 0;
                for (const adUnitCode of adUnitCodes) {
                    // eslint-disable-next-line no-loop-func
                    window.googletag.cmd.push(() => {
                        window.googletag.display(adUnitCode);
                        count += 1;
                        if (count >= adUnitCodes.length) {
                            resolve();
                        }
                    });
                }
            });
        });
    };

    // After banners are initially loaded, use this to refresh
    const refreshBanners = () => {
        window.pbjs.que.push(() => {
            window.pbjs.requestBids({
                timeout: PREBID_TIMEOUT,
                adUnitCodes,
                bidsBackHandler: () => {
                    window.pbjs.setTargetingForGPTAsync(adUnitCodes);
                    window.googletag.pubads().refresh();
                },
            });
        });
    };

    let hideAds = false;

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
        const bannerAdTop = document.getElementById(adUnitCodes[0]);
        const bannerAdBottom1 = document.getElementById(adUnitCodes[1]);
        const bannerAdBottom2 = document.getElementById(adUnitCodes[2]);

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
    adUnitCodes,
    showBanner,
    showModal,
    showSurvata,
    showGcs,
};
