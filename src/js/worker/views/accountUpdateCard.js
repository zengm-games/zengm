// @flow

import Promise from 'bluebird';
import $ from 'jquery';
import g from '../../globals';
import * as account from '../../util/account';
import bbgmViewReact from '../../util/bbgmViewReact';
import AccountUpdateCard from '../../ui/views/AccountUpdateCard';

async function updateAccountUpdateCard(inputs, updateEvents, state, setState, topMenu) {
    if (updateEvents.includes('firstRun') || updateEvents.includes('account')) {
        await account.check();

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
                goldCancelled: topMenu.goldCancelled,
                last4: data.last4,
                expMonth: data.expMonth,
                expYear: data.expYear,
                username: topMenu.username,
            };
        } catch (err) {
            return {
                goldCancelled: topMenu.goldCancelled,
                last4: "????",
                expMonth: "??",
                expYear: "????",
                username: topMenu.username,
            };
        }
    }
}

export default bbgmViewReact.init({
    id: "accountUpdateCard",
    inLeague: false,
    runBefore: [updateAccountUpdateCard],
    Component: AccountUpdateCard,
});
