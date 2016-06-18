const ui = require('../ui');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

function templateString(page) {
    let output = "manual";
    let upperNext = true;

    for (let i = 0; i < page.length; i++) {
        if (upperNext) {
            output += page.charAt(i).toUpperCase();
            upperNext = false;
        } else if (page.charAt(i) === "_") {
            upperNext = true;
        } else {
            output += page.charAt(i);
        }
    }

    return output;
}

function get(req) {
    return {
        page: req.params.page !== undefined ? req.params.page : "overview",
    };
}

function updateManual(inputs) {
    return {
        page: inputs.page,
    };
}

function uiFirst() {
    ui.title("Manual");
}

function uiEvery(updateEvents, vm) {
    ui.update({
        container: "manual-content",
        template: templateString(vm.page()),
    });
}

module.exports = bbgmView.init({
    id: "manual",
    beforeReq: viewHelpers.beforeNonLeague,
    get,
    runBefore: [updateManual],
    uiFirst,
    uiEvery,
});
