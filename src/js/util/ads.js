/*eslint new-cap: 0*/
const g = require('../globals');
const postscribe = require('postscribe');

function showGCS() {
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
                showGCS();
            }
        });
    });

    // If Survata is down, try other ad
    /*eslint no-use-before-define: 0*/
    window.Survata.fail(show);
}

function showModal() {
    g.emitter.emit('updateState', {showNagModal: true});
}

function show() {
    // No ads during multi season auto sim
    if (g.autoPlaySeasons > 0) {
        return;
    }

    // No ads for Gold members
    const currentTimestamp = Math.floor(Date.now() / 1000);
// FIX THIS
return;
    if (!g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil()) {
        return;
    }

    const r = Math.random();
    if (r < 0.68) {
        showGCS();
    } else if (r < 0.75) {
        showModal();
    } else {
        // This is all in milliseconds!
        const adTimer = localStorage.adTimer !== undefined ? parseInt(localStorage.adTimer, 10) : 0;
        const now = Date.now();

        // Only show ad once per 60 minutes, at most
        if (now - adTimer > 1000 * 60 * 60) {
            showSurvata();
            localStorage.adTimer = now;
        }
    }
}

function showBanner() {
    if (window.screen && window.screen.width < 768) {
        // Hide ads on mobile, mobile is shitty enough already
        document.getElementById('banner-ad-top-wrapper').innerHTML = "";
        document.getElementById('banner-ad-bottom-wrapper').innerHTML = "";
    } else {
        const bannerAdTop = document.getElementById('banner-ad-top');
        const bannerAdBottom = document.getElementById('banner-ad-bottom');
        if (bannerAdTop) {
            bannerAdTop.innerHTML = '';
            window.CasaleArgs = {};
            window.CasaleArgs.version = 4;
            window.CasaleArgs.adUnits = "2";
            window.CasaleArgs.positionID = 1;
            window.CasaleArgs.casaleID = 179365;
            window.CasaleArgs.pubDefault = "<script src=\"https://tag.contextweb.com/TagPublish/getjs.aspx?action=VIEWAD&cwrun=200&cwadformat=728X90&cwpid=558539&cwwidth=728&cwheight=90&cwpnet=1&cwtagid=448749\"></script>";
            postscribe(bannerAdTop, '<script type="text/javascript" src="https://js-sec.casalemedia.com/casaleJTag.js"></script>');
        }
        if (bannerAdBottom) {
            bannerAdBottom.innerHTML = '';
            window.CasaleArgs = {};
            window.CasaleArgs.version = 4;
            window.CasaleArgs.adUnits = "2";
            window.CasaleArgs.positionID = 1;
            window.CasaleArgs.casaleID = 179394;
            window.CasaleArgs.pubDefault = "<script src=\"https://tag.contextweb.com/TagPublish/getjs.aspx?action=VIEWAD&cwrun=200&cwadformat=728X90&cwpid=558539&cwwidth=728&cwheight=90&cwpnet=1&cwtagid=448752\"></script>";
            postscribe(bannerAdBottom, '<script type="text/javascript" src="https://js-sec.casalemedia.com/casaleJTag.js"></script>');
        }
    }
}

module.exports = {
    show,
    showBanner,
    showModal,
};
