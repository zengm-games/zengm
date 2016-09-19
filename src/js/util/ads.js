/*eslint new-cap: 0*/
import Promise from 'bluebird';
import postscribe from 'postscribe';
import g from '../globals';

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
    const showBottomCasale = (bannerAdBottom) => {
        bannerAdBottom.innerHTML = '';
        window.CasaleArgs = {};
        window.CasaleArgs.version = 4;
        window.CasaleArgs.adUnits = "2";
        window.CasaleArgs.positionID = 1;
        window.CasaleArgs.casaleID = 179365;
        window.CasaleArgs.pubDefault = "<script src=\"https://tag.contextweb.com/TagPublish/getjs.aspx?action=VIEWAD&cwrun=200&cwadformat=728X90&cwpid=558539&cwwidth=728&cwheight=90&cwpnet=1&cwtagid=448749\"></script>";
        postscribe(bannerAdBottom, '<script type="text/javascript" src="https://js-sec.casalemedia.com/casaleJTag.js"></script>');
    };

    const initBanners = () => {
        return new Promise(resolve => {
            window.googletag.cmd.push(() => {
                gptAdSlots[0] = window.googletag
                    .defineSlot('/42283434/BBGM_Top', [[970, 90], [728, 90], [970, 250]], 'div-gpt-ad-1473268147477-1')
                    .addService(window.googletag.pubads());
                /*gptAdSlots[1] = window.googletag
                    .defineSlot('/42283434/BBGM_Bottom', [[970, 90], [728, 90], [970, 250]], 'div-gpt-ad-1473268147477-0')
                    .addService(window.googletag.pubads());*/

                window.googletag.pubads().enableSingleRequest();

                window.googletag.enableServices();

                //let count = 0;
                window.googletag.cmd.push(() => {
                    window.googletag.display('div-gpt-ad-1473268147477-1');
                    /*count += 1;
                    if (count >= 2) {
                        resolve();
                    }*/
                    resolve();
                });
                /*window.googletag.cmd.push(() => {
                    window.googletag.display('div-gpt-ad-1473268147477-0');
                    count += 1;
                    if (count >= 2) {
                        resolve();
                    }
                });*/
            });
        });
    };

    // After banners are initially loaded, use this to refresh
    const refreshBanners = () => {
        window.googletag.cmd.push(() => {
            window.googletag.pubads().refresh([gptAdSlots[0]]);
        });
        /*window.googletag.cmd.push(() => {
            window.googletag.pubads().refresh([gptAdSlots[1]]);
        });*/
    };

    if (window.screen && window.screen.width < 768) {
        // Hide ads on mobile, mobile is shitty enough already
        document.getElementById('banner-ad-top-wrapper').innerHTML = "";
        document.getElementById('banner-ad-bottom-wrapper').innerHTML = "";
    } else {
        const bannerAdTop = document.getElementById('div-gpt-ad-1473268147477-1');
        const bannerAdBottom = document.getElementById('div-gpt-ad-1473268147477-0');

        if (bannerAdTop && bannerAdBottom) {
            if (!gptLoading && !gptLoaded) {
                gptLoading = true;
                await initBanners();
                gptLoading = false;
                gptLoaded = true;
            } else if (gptLoaded) {
                refreshBanners();
            }
            showBottomCasale(bannerAdBottom);
        }
    }
}

export {
    showBanner,
    showModal,
    showSurvata,
    showGcs,
};
