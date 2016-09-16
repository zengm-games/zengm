import React from 'react';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import {Dropdown, JumpTo, NewWindowLink} from '../components';

const History = ({awards, champ, confs, invalidSeason, retiredPlayers, season, userTid}) => {
    bbgmViewReact.title(`Season Summary - ${season}`);

    if (invalidSeason) {
        return <div>
            <h1>Error</h1>
            <p>Invalid season.</p>
        </div>;
    }

    return <div>
        <Dropdown view="history" fields={["seasons"]} values={[season]} />
        <JumpTo season={season} />
        <h1>Season Summary <NewWindowLink /></h1>

        <p />
        <div className="row">
            <div className="col-md-3 col-sm-4 col-xs-12">
                <div className="row">
                    <div className="col-sm-12 col-xs-6">
                        <h4>League Champions</h4>
                        <p>
                            <span className={champ.tid === userTid ? 'bg-info' : null}><b><a href={helpers.leagueUrl(['roster', champ.abbrev, season])}>{champ.region} {champ.name}</a></b></span><br />
                            <a href={helpers.leagueUrl(['playoffs', season])}>Playoffs Bracket</a>
                        </p>
                        <p>Finals MVP: <b><a className={champ.tid === userTid ? 'bg-info' : null} href={helpers.leagueUrl(['player', awards.finalsMvp.pid])}>{awards.finalsMvp.name}</a></b><br />
                            {helpers.round(awards.finalsMvp.pts, 1)} pts, {helpers.round(awards.finalsMvp.trb, 1)} reb, {helpers.round(awards.finalsMvp.ast, 1)} ast</p>
                        <h4>Best Record</h4>
                        {awards.bestRecordConfs.map((t, i) => <p key={t.tid}>
                            {confs[i].name}:<br />
                            <span className={t.tid === userTid ? 'bg-info' : null}><a href={helpers.leagueUrl(['roster', t.abbrev, season])}>{t.region} {t.name}</a> ({t.won}-{t.lost})</span><br />
                        </p>)}
                        <h4>Most Valuable Player</h4>
                        <p><span className={awards.mvp.tid === userTid ? 'bg-info' : null}><b><a href={helpers.leagueUrl(['player', awards.mvp.pid])}>{awards.mvp.name}</a></b> (<a href={helpers.leagueUrl(['roster', awards.mvp.abbrev, season])}>{awards.mvp.abbrev}</a>)</span><br />
                        {helpers.round(awards.mvp.pts, 1)} pts, {helpers.round(awards.mvp.trb, 1)} reb, {helpers.round(awards.mvp.ast, 1)} ast</p>
                    </div>
                    <div className="col-sm-12 col-xs-6">
                        <h4>Defensive Player of the Year</h4>
                        <p><span className={awards.dpoy.tid === userTid ? 'bg-info' : null}><b><a href={helpers.leagueUrl(['player', awards.dpoy.pid])}>{awards.dpoy.name}</a></b> (<a href={helpers.leagueUrl(['roster', awards.dpoy.abbrev, season])}>{awards.dpoy.abbrev}</a>)</span><br />
                        {helpers.round(awards.dpoy.trb, 1)} reb, {helpers.round(awards.dpoy.blk, 1)} blk, {helpers.round(awards.dpoy.stl, 1)} stl</p>
                        <h4>Sixth Man of the Year</h4>
                        <p><span className={awards.smoy.tid === userTid ? 'bg-info' : null}><b><a href={helpers.leagueUrl(['player', awards.smoy.pid])}>{awards.smoy.name}</a></b> (<a href={helpers.leagueUrl(['roster', awards.smoy.abbrev, season])}>{awards.smoy.abbrev}</a>)</span><br />
                        {helpers.round(awards.smoy.pts, 1)} pts, {helpers.round(awards.smoy.trb, 1)} reb, {helpers.round(awards.smoy.ast, 1)} ast</p>
                        <h4>Rookie of the Year</h4>
                        <p><span className={awards.roy.tid === userTid ? 'bg-info' : null}><b><a href={helpers.leagueUrl(['player', awards.roy.pid])}>{awards.roy.name}</a></b> (<a href={helpers.leagueUrl(['roster', awards.roy.abbrev, season])}>{awards.roy.abbrev}</a>)</span><br />
                        {helpers.round(awards.roy.pts, 1)} pts, {helpers.round(awards.roy.trb, 1)} reb, {helpers.round(awards.roy.ast, 1)} ast</p>
                    </div>
                </div>
            </div>
            <div className="col-md-3 col-sm-4 col-xs-6">
                <h4>All-League Teams</h4>
                {awards.allLeague.map(t => <div key={t.title}>
                    <h5>{t.title}</h5>
                    {t.players.map(p => <div key={p.pid}>
                        <span className={p.tid === userTid ? 'bg-info' : null}><a href={helpers.leagueUrl(['player', p.pid])}>{p.name}</a> (<a href={helpers.leagueUrl(['roster', p.abbrev, season])}>{p.abbrev}</a>)</span><br />
                    </div>)}
                </div>)}
                <br />
                <h4>All-Rookie Team</h4>
                {awards.allRookie.map(p => <div key={p.pid}>
                    <span className={p.tid === userTid ? 'bg-info' : null}><a href={helpers.leagueUrl(['player', p.pid])}>{p.name}</a> (<a href={helpers.leagueUrl(['roster', p.abbrev, season])}>{p.abbrev}</a>)</span><br />
                </div>)}
                <br />
            </div>
            <div className="col-md-3 col-sm-4 col-xs-6">
                <h4>All-Defensive Teams</h4>
                {awards.allDefensive.map(t => <div key={t.title}>
                    <h5>{t.title}</h5>
                    {t.players.map(p => <div key={p.pid}>
                        <span className={p.tid === userTid ? 'bg-info' : null}><a href={helpers.leagueUrl(['player', p.pid])}>{p.name}</a> (<a href={helpers.leagueUrl(['roster', p.abbrev, season])}>{p.abbrev}</a>)</span><br />
                    </div>)}
                </div>)}
                <br />
            </div>
            <div className="clearfix visible-sm visible-xs" />
            <div className="col-md-3 col-sm-12">
                <h4>Retired Players</h4>
                <p style={{MozColumnWidth: '12em', MozColumns: '12em', WebkitColumns: '12em', columns: '12em'}}>
                    {retiredPlayers.map(p => <span key={p.pid} className={p.stats.tid === userTid ? 'bg-info' : null}>
                        <a href={helpers.leagueUrl(['player', p.pid])}>{p.name}</a> ({p.stats.abbrev !== 'FA' ? <span><a href={helpers.leagueUrl(['roster', p.stats.abbrev, season])}>{p.stats.abbrev}</a>, </span> : null}age: {p.age}{p.hof ? <span>; <a href={helpers.leagueUrl(['hall_of_fame'])}><b>HoF</b></a></span> : null})<br />
                    </span>)}
                </p>
            </div>
        </div>
    </div>;
};

History.propTypes = {
    awards: React.PropTypes.object,
    champ: React.PropTypes.object,
    confs: React.PropTypes.arrayOf(React.PropTypes.object),
    invalidSeason: React.PropTypes.bool.isRequired,
    retiredPlayers: React.PropTypes.arrayOf(React.PropTypes.object),
    season: React.PropTypes.number.isRequired,
    userTid: React.PropTypes.number,
};

export default History;
