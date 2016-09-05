const g = require('../globals');
const Promise = require('bluebird');
const $ = require('jquery');
const account = require('../util/account');
const bbgmViewReact = require('../util/bbgmViewReact');
const AccountUpdateCard = require('./views/AccountUpdateCard');

async function updateAccountUpdateCard(inputs, updateEvents, state, setState, topMenu) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
        await account.check();
        const username = topMenu.username;

        if (username === null || username === "") {
            return {
                errorMessage: "Log in to view this page.",
            };
        }

        if (topMenu.goldCancelled) {
            return {
                errorMessage: "Cannot update card because your Basketball GM Gold account is cancelled.",
            };
        }

        try {
            const data = await Promise.resolve($.ajax({
                type: "GET",
                url: `//account.basketball-gm.${g.tld}/gold_card_info.php`,
                data: {
                    sport: "basketball",
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
            }));
            return {
                last4: data.last4,
                expMonth: data.expMonth,
                expYear: data.expYear,
            };
        } catch (err) {
            return {
                last4: "????",
                expMonth: "??",
                expYear: "????",
            };
        }
    }
}

module.exports = bbgmViewReact.init({
    id: "accountUpdateCard",
    inLeague: false,
    runBefore: [updateAccountUpdateCard],
    Component: AccountUpdateCard,
});
