var g = require('../globals');
var ui = require('../ui');
var league = require('../core/league');
var ko = require('knockout');
var bbgmView = require('../util/bbgmView');

function get(req) {
    return {
        mid: req.params.mid ? parseInt(req.params.mid, 10) : null
    };
}

function updateMessage(inputs, updateEvents, vm) {
    var message, readThisPageview;

    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || vm.message.mid() !== inputs.mid) {
        return g.dbl.tx("messages", "readwrite", function (tx) {
            readThisPageview = false;

            // If mid is null, this will open the *unread* message with the highest mid
            return tx.messages.iterate(inputs.mid, 'prev', function (messageLocal, shortCircuit) {
                message = messageLocal;

                if (!message.read) {
                    shortCircuit(); // Keep looking until we find an unread one!

                    message.read = true;
                    readThisPageview = true;

                    return message;
                }
            });
        }).then(function () {
            league.updateLastDbChange();

            if (readThisPageview) {
                if (g.gameOver) {
                    ui.updateStatus("You're fired!");
                }

                return ui.updatePlayMenu(null);
            }
        }).then(function () {
            return {
                message: message
            };
        });
    }
}

function uiFirst(vm) {
    ko.computed(function () {
        ui.title("Message From " + vm.message.from());
    }).extend({throttle: 1});
}

module.exports = bbgmView.init({
    id: "message",
    get,
    runBefore: [updateMessage],
    uiFirst
});
