const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const bbgmViewReact = require('../util/bbgmViewReact');
const Message = require('./views/Message');

function get(req) {
    return {
        mid: req.params.mid ? parseInt(req.params.mid, 10) : null,
    };
}

async function updateMessage(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || state.message.mid !== inputs.mid) {
        let message;
        let readThisPageview;
        await g.dbl.tx("messages", "readwrite", async tx => {
            readThisPageview = false;

            // If mid is null, this will open the *unread* message with the highest mid
            await tx.messages.iterate(inputs.mid, 'prev', (messageLocal, shortCircuit) => {
                message = messageLocal;

                if (!message.read) {
                    shortCircuit(); // Keep looking until we find an unread one!

                    message.read = true;
                    readThisPageview = true;

                    return message;
                }
            });
        });

        if (readThisPageview) {
            if (g.gameOver) {
                ui.updateStatus("You're fired!");
            }

            await ui.updatePlayMenu(null);

            league.updateLastDbChange();
        }

        return {
            message,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "message",
    get,
    runBefore: [updateMessage],
    Component: Message,
});
