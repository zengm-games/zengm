// @flow

import {g} from '../../common';
import {idb} from '../db';
import {updatePlayMenu, updateStatus} from '../util';
import type {GetOutput, Message as Message_, UpdateEvents} from '../../common/types';

async function updateMessage(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): Promise<void | {message?: Message_}> {
    if (updateEvents.includes('firstRun') || state.message.mid !== inputs.mid) {
        let message;
        let readThisPageview = false;

        const messagesCache = await idb.cache.getAll('messages');

        // Below code is ugly... checking both cache and database for the same thing
        if (messagesCache.length) {
            for (let i = messagesCache.length - 1; i >= 0; i--) {
                message = messagesCache[i];

                if (!message.read) {
                    message.read = true;
                    readThisPageview = true;
                    break; // Keep looking until we find an unread one!
                }
            }
        } else {
            await idb.league.tx("messages", "readwrite", async tx => {
                // If mid is null, this will open the *unread* message with the highest mid
                await tx.messages.iterate(inputs.mid, 'prev', (messageLocal: Message_, shortCircuit) => {
                    message = messageLocal;

                    if (!message.read) {
                        shortCircuit(); // Keep looking until we find an unread one!

                        message.read = true;
                        readThisPageview = true;

                        return message;
                    }
                });
            });
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
