// @flow

import {g, helpers} from '../../common';
import {idb} from '../db';
import {updatePlayMenu, updateStatus} from '../util';
import type {GetOutput, Message as Message_, UpdateEvents} from '../../common/types';

async function updateMessage(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): Promise<void | {message?: Message_}> {
    // Complexity of updating is to handle auto-read message, so inputs.mid is blank
    if (updateEvents.includes('firstRun') || !state.message || state.message.mid !== inputs.mid) {
        let message;
        let readThisPageview = false;

        if (inputs.mid === undefined) {
            const messages = await idb.getCopies.messages({limit: 10});
            if (messages.length > 0) {
                for (let i = messages.length - 1; i >= 0; i--) {
                    if (!messages[i].read) {
                        return {
                            redirectUrl: helpers.leagueUrl(['message', messages[i].mid]),
                        };
                    }
                }
            }
        } else {
            message = await idb.getCopies.messages({mid: inputs.mid});
        }

        if (message && !message.read) {
            message.read = true;
            readThisPageview = true;
            await idb.cache.messages.put(message);
        }

        if (readThisPageview) {
            if (g.gameOver) {
                await updateStatus("You're fired!");
            }

            await updatePlayMenu();
        }

        return {
            message,
        };
    }
}

export default {
    runBefore: [updateMessage],
};
