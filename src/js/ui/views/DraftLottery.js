// @flow

import PropTypes from 'prop-types';
import React from 'react';
import _ from 'underscore';
import {g, helpers} from '../../common';
import {getCols, setTitle} from '../util';
import {DataTable, DraftAbbrev, Dropdown, JumpTo, NewWindowLink} from '../components';
import type {DraftLotteryResult} from '../../common/types';

const DraftLottery = ({result, season}: {result: DraftLotteryResult | void, season: number}) => {
    setTitle(`${season} Draft Lottery`);

console.log('b', result);

    let table;
    if (result) {
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
                    {result.map(({tid, originalTid, chances, pick, won, lost}) => {
                        const pickCols = _.range(14).map((i) => {
                            return <td className={pick - 1 === i ? 'info' : undefined}>{i}</td>;
                        });

                        const row = <tr>
                            <td><DraftAbbrev tid={tid} originalTid={originalTid} season={season} /></td>
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

        <p>More: <a href={helpers.leagueUrl(['draft_scouting'])}>Future Draft Scouting</a></p>

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
};

export default DraftLottery;
