// @flow

import {SPORT, fetchWrapper} from '../../common';
import {account, env} from '../util';
import type {Conditions, GetOutput, UpdateEvents} from '../../common/types';

async function updateAccountUpdateCard(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    topMenu: any,
    conditions: Conditions,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun') || updateEvents.includes('account')) {
        await account.check(conditions);

        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${env.tld}/gold_card_info.php`,
                method: 'GET',
                data: {sport: SPORT},
                credentials: 'include',
            });
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
