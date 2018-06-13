// @flow

import range from "lodash/range";
import { g } from "../../util";
import type { TeamFiltered } from "../../../common/types";

const genPlayoffSeries = (teams: TeamFiltered[]) => {
    // Playoffs are split into two branches by conference only if there are exactly 2 conferences and the special secret option top16playoffs is not set
    const playoffsByConference = g.confs.length === 2; // && !localStorage.getItem('top16playoffs');

    const tidPlayoffs = [];
    const numPlayoffTeams = 2 ** g.numPlayoffRounds;
    const series = range(g.numPlayoffRounds).map(() => []);
    if (playoffsByConference) {
        // Default: top 50% of teams in each of the two conferences
        const numSeriesPerConference = numPlayoffTeams / 4;
        for (let cid = 0; cid < g.confs.length; cid++) {
            const teamsConf = [];
            for (let i = 0; i < teams.length; i++) {
                if (teams[i].cid === cid) {
                    teamsConf.push(teams[i]);
                    tidPlayoffs.push(teams[i].tid);
                    if (teamsConf.length >= numPlayoffTeams / 2) {
                        break;
                    }
                }
            }
            for (let i = 0; i < numSeriesPerConference; i++) {
                const j = i % 2 === 0 ? i : numSeriesPerConference - i;
                series[0][j + cid * numSeriesPerConference] = {
                    home: teamsConf[i],
                    away: teamsConf[numPlayoffTeams / 2 - 1 - i],
                };
                series[0][j + cid * numSeriesPerConference].home.seed = i + 1;
                series[0][j + cid * numSeriesPerConference].away.seed =
                    numPlayoffTeams / 2 - i;
            }
        }
    } else {
        // Alternative: top 50% of teams overall
        const teamsConf = [];
        for (let i = 0; i < teams.length; i++) {
            teamsConf.push(teams[i]);
            tidPlayoffs.push(teams[i].tid);
            if (teamsConf.length >= numPlayoffTeams) {
                break;
            }
        }
        for (let i = 0; i < numPlayoffTeams / 2; i++) {
            const j = i % 2 === 0 ? i : numPlayoffTeams / 2 - i;
            series[0][j] = {
                home: teamsConf[i],
                away: teamsConf[numPlayoffTeams - 1 - i],
            };
            series[0][j].home.seed = i + 1;
            series[0][j].away.seed = numPlayoffTeams - i;
        }
    }

    return { series, tidPlayoffs };
};

export default genPlayoffSeries;
