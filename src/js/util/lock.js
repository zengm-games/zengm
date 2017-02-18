// @flow

import g from '../globals';
import * as league from '../core/league';
import {getCopy} from '../db';

/**
 * Is game simulation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is a game simulation currently in progress.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function gamesInProgress(): Promise<boolean> {
    await league.loadGameAttribute("gamesInProgress");
    return g.gamesInProgress;
}

/**
 * Is a negotiation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is an ongoing negoation.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function negotiationInProgress(): Promise<boolean> {
    const negotiations = await g.cache.getAll('negotiations');
    return negotiations.length > 0;
}

/**
 * Is a phase change in progress?
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function phaseChangeInProgress(): Promise<boolean> {
    await league.loadGameAttribute("phaseChangeInProgress");
    return g.phaseChangeInProgress;
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
    const gamesInProgressBool = await gamesInProgress();
    if (gamesInProgressBool) {
        return false;
    }

    const negotiationInProgressBool = await negotiationInProgress();
    if (negotiationInProgressBool) {
        return false;
    }

    const phaseChangeInProgressBool = await phaseChangeInProgress();
    if (phaseChangeInProgressBool) {
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
    const gamesInProgressBool = await gamesInProgress();
    if (gamesInProgressBool) {
        return false;
    }

    // Allow multiple parallel negotiations only for re-signing players
    const negotiations = await g.cache.getAll('negotiations');
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

export {
    gamesInProgress,
    negotiationInProgress,
    phaseChangeInProgress,
    canStartGames,
    canStartNegotiation,
    unreadMessage,
};

