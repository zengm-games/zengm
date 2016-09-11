/*eslint new-cap: 0*/
const Promise = require('bluebird');
const g = require('../globals');

function showGcs() {
    window.TriggerPrompt("http://www.basketball-gm.com/", (new Date()).getTime());
}

function showSurvata() {
    window.Survata.ready(() => {
        const s = window.Survata.createSurveywall({
            brand: "Basketball GM",
            explainer: "Please take this short survey to support Basketball GM!",
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
        g.emitter.emit('showAd', 'modal');
    });
}

function showModal() {
    g.emitter.emit('updateState', {showNagModal: true});
}

let gptLoading = false;
let gptLoaded = false;
const gptAdSlots = [];

async function showBanner() {
    const initBanners = () => {
        return new Promise(resolve => {
            window.googletag.cmd.push(() => {
                gptAdSlots[0] = window.googletag
                    .defineSlot('/42283434/BBGM_Top', [[970, 90], [728, 90], [970, 250]], 'div-gpt-ad-1473268147477-1')
                    .addService(window.googletag.pubads());
                gptAdSlots[1] = window.googletag
                    .defineSlot('/42283434/BBGM_Bottom', [[970, 90], [728, 90], [970, 250]], 'div-gpt-ad-1473268147477-0')
                    .addService(window.googletag.pubads());

                window.googletag.pubads().enableSingleRequest();

                window.googletag.enableServices();

                let count = 0;
                window.googletag.cmd.push(() => {
                    window.googletag.display('div-gpt-ad-1473268147477-1');
                    count += 1;
                    if (count >= 2) {
                        resolve();
                    }
                });
                window.googletag.cmd.push(() => {
                    window.googletag.display('div-gpt-ad-1473268147477-0');
                    count += 1;
                    if (count >= 2) {
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
    };

    if (window.screen && window.screen.width < 768) {
        // Hide ads on mobile, mobile is shitty enough already
        document.getElementById('banner-ad-top-wrapper').innerHTML = "";
        document.getElementById('banner-ad-bottom-wrapper').innerHTML = "";
    } else {
        const bannerAdTop = document.getElementById('div-gpt-ad-1473268147477-0');
        const bannerAdBottom = document.getElementById('div-gpt-ad-1473268147477-1');

        if (bannerAdTop && bannerAdBottom) {
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

module.exports = {
    showBanner,
    showModal,
    showSurvata,
    showGcs,
};
