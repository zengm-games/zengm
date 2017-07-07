// @flow

import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import _ from 'underscore';
import {g, helpers} from '../../common';
import {setTitle} from '../util';
import {DraftAbbrev, Dropdown, JumpTo, NewWindowLink} from '../components';
import type {DraftLotteryResultArray} from '../../common/types';

const getProbs = (result: DraftLotteryResultArray): (number | void)[][] => {
    const probs = [];

    const topThreeCombos = new Map();

    // Top three picks
    for (let i = 0; i < result.length; i++) {
        probs[i] = [];
        probs[i][0] = result[i].chances / 1000; // First pick
        probs[i][1] = 0; // Second pick
        probs[i][2] = 0; // Third pick
        for (let k = 0; k < result.length; k++) {
            if (k !== i) {
                probs[i][1] += (result[k].chances / 1000) * result[i].chances / (1000 - result[k].chances);

                for (let l = 0; l < result.length; l++) {
                    if (l !== i && l !== k) {
                        const combosTemp = (result[k].chances / 1000) * (result[l].chances / (1000 - result[k].chances)) * result[i].chances / (1000 - result[k].chances - result[l].chances);
                        const topThreeKey = JSON.stringify([i, k, l].sort());
                        if (!topThreeCombos.has(topThreeKey)) {
                            topThreeCombos.set(topThreeKey, combosTemp);
                        } else {
                            topThreeCombos.set(topThreeKey, topThreeCombos.get(topThreeKey) + combosTemp);
                        }

                        probs[i][2] += combosTemp;
                    }
                }
            }
        }
    }

    // Fill in picks 4+
    for (let i = 0; i < result.length; i++) {
        const skipped = [0, 0, 0, 0]; // Probabilities of being "skipped" (lower prob team in top 3) 0/1/2/3 times

        for (const [key, prob] of topThreeCombos.entries()) {
            const inds = JSON.parse(key);
            let skipCount = 0;
            for (const ind of inds) {
                if (ind > i) {
                    skipCount += 1;
                }
            }
            if (!inds.includes(i)) {
                skipped[skipCount] += prob;
            }
        }

        // Fill in table after first 3 picks
        for (let j = 0; j < 4; j++) {
            if (i + j > 2 && i + j < result.length) {
                probs[i][i + j] = skipped[j];
            }
        }
    }

    return probs;
};

const DraftLottery = ({result, season, type}: {
    result: DraftLotteryResultArray | void,
    season: number,
    type: 'completed' | 'projected',
}) => {
    setTitle(`${season} Draft Lottery`);

    const probs = result !== undefined ? getProbs(result) : undefined;

    let table;
    if (result && probs) { // Checking both is redundant, but flow wants it
        table = <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed table-hover">
                <thead>
                    <tr>
                        <th colSpan="3" />
                        <th colSpan="14" className="text-center">Pick Probabilities</th>
                    </tr>
                    <tr>
                        <th>Team</th>
                        <th>Record</th>
                        <th>Chances</th>
                        <th>1st</th>
                        <th>2nd</th>
                        <th>3rd</th>
                        <th>4th</th>
                        <th>5th</th>
                        <th>6th</th>
                        <th>7th</th>
                        <th>7th</th>
                        <th>9th</th>
                        <th>10th</th>
                        <th>11th</th>
                        <th>12th</th>
                        <th>13th</th>
                        <th>14th</th>
                    </tr>
                </thead>
                <tbody>
                    {result.map(({tid, originalTid, chances, pick, won, lost}, i) => {
                        const pickCols = _.range(14).map((j) => {
                            const prob = probs[i][j];
                            const pct = prob !== undefined ? `${(prob * 100).toFixed(1)}%` : undefined;
                            return <td className={classNames({success: pick === j + 1})} key={j}>{pct}</td>;
                        });

                        const row = <tr key={originalTid}>
                            <td className={classNames({info: tid === g.userTid})}><DraftAbbrev tid={tid} originalTid={originalTid} season={season} /></td>
                            <td><a href={helpers.leagueUrl(['standings', season])}>{won}-{lost}</a></td>
                            <td>{chances}</td>
                            {pickCols}
                        </tr>;
                        return row;
                    })}
                </tbody>
            </table>
        </div>;
    } else {
        table = <p>Can't find draft lottery results for {season}.</p>;
    }

    return <div>
        <Dropdown view="draft_lottery" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>{season} Draft Lottery <NewWindowLink /></h1>

        <p>More: <a href={helpers.leagueUrl(['draft_scouting'])}>Future Draft Scouting</a> | <a href={helpers.leagueUrl(['draft_summary', season])}>Draft Summary</a></p>

        {type === 'projected' ? <p>This is what the draft lottery probabilities would be if the lottery was held right now.</p> : null}

        {table}
    </div>;
};

DraftLottery.propTypes = {
    result: PropTypes.arrayOf(PropTypes.shape({
        tid: PropTypes.number.isRequired,
        originalTid: PropTypes.number.isRequired,
        chances: PropTypes.number.isRequired,
        pick: PropTypes.number,
        won: PropTypes.number.isRequired,
        lost: PropTypes.number.isRequired,
    })),
    season: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
};

export default DraftLottery;
