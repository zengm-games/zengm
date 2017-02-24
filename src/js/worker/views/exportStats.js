// @flow

import g from '../../globals';

async function updateExportStats(inputs, updateEvents) {
    if (updateEvents.includes('firstRun') || updateEvents.includes('newPhase') || updateEvents.includes('dbChange')) {
        const options = [{
            key: "all",
            val: "All Seasons",
        }];
        for (let season = g.startingSeason; season <= g.season; season++) {
            options.push({
                key: String(season),
                val: `${season} season`,
            });
        }
        return {
            seasons: options,
        };
    }
}

export default {
    runBefore: [updateExportStats],
};
