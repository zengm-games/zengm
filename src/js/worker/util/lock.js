// @flow

import g from '../../globals';
import {getCopy, idb} from '../db';

/**
 * Is a negotiation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is an ongoing negoation.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function negotiationInProgress(): Promise<boolean> {
    const negotiations = await idb.cache.getAll('negotiations');
    return negotiations.length > 0;
}

/**
 * Can new game simulations be started?
 *
 * Calls the callback function with either true or false. If games are in progress or any contract negotiation is in progress, false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function canStartGames(): Promise<boolean> {
    if (g.gamesInProgress) {
        return false;
    }

    const negotiationInProgressBool = await negotiationInProgress();
    if (negotiationInProgressBool) {
        return false;
    }

    if (g.phaseChangeInProgress) {
        return false;
    }

    return true;
}

/**
 * Can a new contract negotiation be started?
 *
 * Calls the callback function with either true or false. If games are in progress or a free agent (not re-signing!) is being negotiated with, false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function canStartNegotiation(): Promise<boolean> {
    if (g.gamesInProgress) {
        return false;
    }

    // Allow multiple parallel negotiations only for re-signing players
    const negotiations = await idb.cache.getAll('negotiations');
    for (const negotiation of negotiations) {
        if (!negotiation.resigning) {
            return false;
        }
    }

    return true;

    // Don't also check phase change because negotiations are auto-started in phase change
}

/**
 * Is there an undread message from the owner?
 *
 * Calls the callback function with either true or false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function unreadMessage(): Promise<boolean> {
    const messages = await getCopy.messages();
    for (let i = 0; i < messages.length; i++) {
        if (!messages[i].read) {
            return true;
        }
    }
    return false;
}

export default {
    negotiationInProgress,
    canStartGames,
    canStartNegotiation,
    unreadMessage,
};
