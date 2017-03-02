// @flow

import queryString from 'query-string';
import {SPORT} from '../../common';
import {account, env} from '../util';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateAccountUpdateCard(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    topMenu: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun') || updateEvents.includes('account')) {
        await account.check();

        try {
            const response = await fetch(`//account.basketball-gm.${env.tld}/gold_card_info.php?${queryString.stringify({sport: SPORT})}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await response.json();
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

export default {
    inLeague: false,
    runBefore: [updateAccountUpdateCard],
};
