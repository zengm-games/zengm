import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import ExportStats from './views/ExportStats';

function updateExportStats(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("newPhase") >= 0 || updateEvents.indexOf("dbChange") >= 0) {
        const seasons = helpers.getSeasons();
        const options = [{
            key: "all",
            val: "All Seasons",
        }];
        for (let j = 0; j < seasons.length; j++) {
            options.push({
                key: String(seasons[j].season),
                val: `${seasons[j].season} season`,
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
