// @flow

import { fetchWrapper } from "../../../deion/common";
import { SPORT } from "../../common";
import { account, env } from "../util";
import type {
    Conditions,
    GetOutput,
    UpdateEvents,
} from "../../../deion/common/types";

async function updateAccountUpdateCard(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    conditions: Conditions,
): void | { [key: string]: any } {
    if (updateEvents.includes("firstRun") || updateEvents.includes("account")) {
        const partialTopMenu = await account.check(conditions);

        try {
            const data = await fetchWrapper({
                url: `//account.basketball-gm.${env.tld}/gold_card_info.php`,
                method: "GET",
                data: { sport: SPORT },
                credentials: "include",
            });
            return {
                goldCancelled: partialTopMenu.goldCancelled,
                last4: data.last4,
                expMonth: data.expMonth,
                expYear: data.expYear,
                username: partialTopMenu.username,
            };
        } catch (err) {
            return {
                goldCancelled: partialTopMenu.goldCancelled,
                last4: "????",
                expMonth: "??",
                expYear: "????",
                username: partialTopMenu.username,
            };
        }
    }
}

export default {
    runBefore: [updateAccountUpdateCard],
};
