// @flow

import emitter from "./emitter";

const refreshBanners = () => {
    window.top.__vm_add = window.top.__vm_add || [];
    const venatusAds = [
        {
            divID: "bbgm-ads-top",
            adID: "5bebecac46e0fb0001ad2a75",
        },
        {
            divID: "bbgm-ads-bottom1",
            adID: "5bebecc546e0fb000177eb10",
        },
        {
            divID: "bbgm-ads-bottom2",
            adID: "5bebecc546e0fb000177eb10",
        },
        {
            divID: "bbgm-ads-skyscraper",
            adID: "5bebecd346e0fb0001c54769",
        },
    ];
    for (const { divID, adID } of venatusAds) {
        const div = document.getElementById(divID);
        if (div && div.style.display !== "none") {
            const elm = document.createElement("div");
            elm.classList.add("vm-placement");
            elm.dataset.id = adID;
            while (div.firstChild) {
                div.removeChild(div.firstChild);
            }
            div.appendChild(elm);
            window.top.__vm_add.push(elm);
        }
    }
};

function showGcs() {
    if (process.env.SPORT === "basketball") {
        window.TriggerPrompt(
            "http://www.basketball-gm.com/",
            new Date().getTime(),
        );
    } else {
        console.log("Not sure what to do for non-basketball GCS");
    }
}

function showModal() {
    emitter.emit("updateState", { showNagModal: true });
}

export default {
    refreshBanners,
    showModal,
    showGcs,
};
