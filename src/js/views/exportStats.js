import g from '../globals';
import bbgmViewReact from '../util/bbgmViewReact';
import ExportStats from './views/ExportStats';

function updateExportStats(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("newPhase") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
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

export default bbgmViewReact.init({
    id: "exportStats",
    runBefore: [updateExportStats],
    Component: ExportStats,
});
