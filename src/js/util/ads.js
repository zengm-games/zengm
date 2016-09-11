/*eslint new-cap: 0*/
const g = require('../globals');
const postscribe = require('postscribe');

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
    showBanner,
    showModal,
    showSurvata,
    showGcs,
};
