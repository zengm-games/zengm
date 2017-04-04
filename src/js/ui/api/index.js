// @flow

import {g, helpers} from '../../common';
import {ads, emitter, realtimeUpdate} from '../util';
import {showEvent} from '../util/logEvent';
import type {GameAttributes, LogEventShowOptions, UpdateEvents} from '../../common/types';

/**
 * Ping a counter at basketball-gm.com.
 *
 * This should only do something if it isn't being run from a unit test and it's actually on basketball-gm.com.
 *
 * @memberOf util.helpers
 * @param {string} type Either "league" for a new league, or "season" for a completed season
 */
const bbgmPing = (type: 'league' | 'season') => {
    if (window.enableLogging && window.ga) {
        if (type === 'league') {
            window.ga('send', 'event', 'BBGM', 'New league', String(g.lid));
        } else if (type === 'season') {
            window.ga('send', 'event', 'BBGM', 'Completed season', String(g.season));
        }
    }
};

const confirm = (message: string) => {
    return window.confirm(message);
};

const emit = (name: string, content: any) => {
    emitter.emit(name, content);
};

const initAds = (goldUntil: number | void) => {
    // No ads for Gold members
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (goldUntil === undefined || currentTimestamp > goldUntil) {
        let el;
        el = document.getElementById('banner-ad-top-wrapper');
        if (el) {
            el.innerHTML = '<div id="div-gpt-ad-1491246142345-0" style="text-align: center; min-height: 95px; margin-top: 1em"></div>';
        }
        el = document.getElementById('banner-ad-bottom-wrapper-1');
        if (el) {
            el.innerHTML = '<div id="div-gpt-ad-1491246142345-2" style="text-align: center; height: 250px; position: absolute; top: 5px; left: 0"></div>';
        }
        el = document.getElementById('banner-ad-bottom-wrapper-2');
        if (el) {
            el.innerHTML = '<div id="div-gpt-ad-1491246142345-1" style="text-align: center; height: 250px; position: absolute; top: 5px; right: 0"></div>';
        }
        el = document.getElementById('banner-ad-bottom-wrapper-logo');
        if (el) {
            el.innerHTML = '<div style="height: 250px; margin: 5px 310px 0 310px; display:flex; align-items: center; justify-content: center;"><img src="https://basketball-gm.com/files/logo.png" style="max-height: 100%; max-width: 100%"></div>';
        }
        ads.showBanner();
    } else {
        const wrappers = ['banner-ad-top-wrapper', 'banner-ad-bottom-wrapper-1', 'banner-ad-bottom-wrapper-logo', 'banner-ad-bottom-wrapper-2'];
        for (const wrapper of wrappers) {
            const el = document.getElementById(wrapper);
            if (el) {
                el.innerHTML = '';
            }
        }
    }
};

// Should only be called from Shared Worker, to move other tabs to new league because only one can be open at a time
const newLid = async (lid: number) => {
    const parts = location.pathname.split('/');
    if (parseInt(parts[2], 10) !== lid) {
        parts[2] = String(lid);
        const newPathname = parts.join('/');
        await realtimeUpdate(['firstRun'], newPathname);
        emitter.emit('updateTopMenu', {lid});
    }
};

/*const notifyException = (err: Error, name: string, metadata: any) => {
    if (window.Bugsnag) {
        window.Bugsnag.notifyException(err, name, metadata);
    }
};*/

const prompt = (message: string, defaultVal?: string) => {
    return window.prompt(message, defaultVal);
};

async function realtimeUpdate2(updateEvents: UpdateEvents = [], url?: string, raw?: Object) {
    await realtimeUpdate(updateEvents, url, raw);
}

const resetG = () => {
    helpers.resetG();

    // Additionally, here we want to ignore the old lid just to be sure, since the real one will be sent to the UI
    // later. But in the worker, g.lid is already correctly set, so this can't be in helpers.resetG.
    g.lid = undefined;
};

const setGameAttributes = (gameAttributes: GameAttributes) => {
    Object.assign(g, gameAttributes);
};

const showEvent2 = (options: LogEventShowOptions) => {
    showEvent(options);
};

export default {
    bbgmPing,
    confirm,
    emit,
    initAds,
    newLid,
    prompt,
    realtimeUpdate: realtimeUpdate2,
    resetG,
    setGameAttributes,
    showEvent: showEvent2,
};
