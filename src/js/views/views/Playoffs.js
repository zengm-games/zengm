const React = require('react');
const bbgmViewReact = require('../../util/bbgmViewReact');
const {Dropdown, JumpTo, NewWindowLink, PlayoffMatchup} = require('../components');

const Playoffs = ({confNames, finalMatchups, matchups, numPlayoffRounds, season, series}) => {
    bbgmViewReact.title(`Playoffs - ${season}`);

    return <div>
        <Dropdown view="playoffs" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>Playoffs <NewWindowLink /></h1>

        {!finalMatchups ? <p>This is what the playoff matchups would be if the season ended right now.</p> : null}

        {confNames.length === 2 ? <h3 className="hidden-xs">{confNames[1]} <span className="pull-right">{confNames[0]}</span></h3> : null}

        <div className="table-responsive">
            <table className="table-condensed" width="100%">
                <tbody>
                    {matchups.map((row, i) => <tr key={i}>
                        {row.map((m, j) => {
                            return <td key={j} rowSpan={m.rowspan} width={`${100 / (numPlayoffRounds * 2 - 1)}%`}>
                                <PlayoffMatchup season={season} series={series[m.matchup[0]][m.matchup[1]]} />
                            </td>;
                        })}
                    </tr>)}
                </tbody>
            </table>
        </div>
    </div>;
};

module.exports = Playoffs;
